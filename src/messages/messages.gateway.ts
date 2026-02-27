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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
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
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { coupleId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { coupleId, userId } = data;
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
    console.log(`User ${userId} joined room ${coupleId}`);
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
      console.log(`Triggering notification for offline partner in couple ${createMessageDto.coupleId}`);
      
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
        console.error('Failed to send offline notification:', error);
      }
    }
    
    return message;
  }
}
