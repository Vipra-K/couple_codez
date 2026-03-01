import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track online users: coupleId -> Set of userIds
  private onlineUsers = new Map<string, Set<string>>();
  // Track socket to user/couple mapping: socketId -> { userId, coupleId }
  private socketMap = new Map<string, { userId: string; coupleId: string }>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  notifyNewMessage(coupleId: string, message: any) {
    this.server.to(coupleId).emit('newMessage', message);
  }

  notifyThemeChanged(coupleId: string, theme: any) {
    this.server.to(coupleId).emit('themeChanged', theme);
  }

  handleConnection(client: Socket) {

  }

  handleDisconnect(client: Socket) {
    const session = this.socketMap.get(client.id);
    if (session) {
      const { userId, coupleId } = session;
      const users = this.onlineUsers.get(coupleId);
      if (users) {
        users.delete(userId);
        if (users.size === 0) {
          this.onlineUsers.delete(coupleId);
        }
      }
      this.socketMap.delete(client.id);
      
      // Notify remaining partner
      this.server.to(coupleId).emit('partnerStatus', { userId, status: 'OFFLINE' });
    }

  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { coupleId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { coupleId, userId } = data;
    client.data.userId = userId;
    client.join(coupleId);
    
    // Update presence
    if (!this.onlineUsers.has(coupleId)) {
      this.onlineUsers.set(coupleId, new Set());
    }
    const users = this.onlineUsers.get(coupleId);
    if (users) {
      users.add(userId);
    }
    this.socketMap.set(client.id, { userId, coupleId });

    // Notify partner that I'm online
    this.server.to(coupleId).emit('partnerStatus', { userId, status: 'ONLINE' });
    
    // Also respond to the client with current room status if needed, 
    // or the client can fetch it via another event.

  }

  @SubscribeMessage('getPartnerStatus')
  async handleGetPartnerStatus(
    @MessageBody() data: { coupleId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { coupleId, userId } = data;

    // Find the other user in the room
    const roomSockets = await this.server
      .in(coupleId)
      .fetchSockets();

    const partnerSocket = roomSockets.find(
      (s) => s.data?.userId && s.data.userId !== userId,
    );

    if (partnerSocket) {
      // Partner is online — emit back to requester
      client.emit('partnerStatus', {
        userId: partnerSocket.data.userId,
        status: 'ONLINE',
      });
    } else {
      // Partner is offline
      client.emit('partnerStatus', {
        userId: 'partner',
        status: 'OFFLINE',
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagesService.create(createMessageDto);
    
    // Broadcast to the couple room
    this.server.to(createMessageDto.coupleId).emit('newMessage', message);
    
    // Check if partner is offline to send notification
    const onlineInRoom = this.onlineUsers.get(createMessageDto.coupleId);
    // Assuming a couple only has 2 people. If only 1 is online, it's the sender.
    if (!onlineInRoom || onlineInRoom.size < 2) {

      
      try {
        const partner = await this.messagesService.getPartner(createMessageDto.coupleId, createMessageDto.senderId);
        if (partner && (partner as any).fcmToken) {
          const sender = await this.messagesService.getUser(createMessageDto.senderId);
          const senderName = (sender as any)?.fullName || 'Partner';
          
          let body = createMessageDto.content;
          if (createMessageDto.type === 'IMAGE') body = '📷 Sent a photo';
          if (createMessageDto.type === 'VIDEO') body = '🎥 Sent a video';
          if (createMessageDto.type === 'AUDIO') body = '🎤 Sent a voice message';

          await this.notificationsService.sendPushNotification(
            (partner as any).fcmToken,
            senderName,
            body,
            { type: createMessageDto.type, senderId: createMessageDto.senderId }
          );
        }
      } catch (error) {

      }
    }
    
    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { coupleId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.coupleId).emit('partnerTyping', { userId: data.userId, isTyping: true });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @MessageBody() data: { coupleId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.coupleId).emit('partnerTyping', { userId: data.userId, isTyping: false });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { coupleId: string; userId: string; lastMessageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { coupleId, userId, lastMessageId } = data;

    await this.messagesService.markAsRead(coupleId, userId, lastMessageId);

    // Notify the partner that their messages were read
    this.server.to(coupleId).emit('messagesRead', { userId, lastMessageId });
  }
}
