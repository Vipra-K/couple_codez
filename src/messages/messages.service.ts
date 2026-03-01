import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto) {
    const { 
      coupleId, 
      senderId, 
      content, 
      type, 
      driveFileId,
      replyToId,
      replyToContent,
      replyToSenderId,
      replyToType
    } = createMessageDto;

    const message = await this.prisma.message.create({
      data: {
        coupleId,
        senderId,
        content,
        type: type as any,
        driveFileId,
        replyToId,
        replyToContent,
        replyToSenderId,
        replyToType,
      },
    });

    await this.prisma.couple.update({
      where: { id: coupleId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async findHistory(coupleId: string, skip: number = 0, take: number = 15) {
    const messages = await this.prisma.message.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    return messages.reverse();
  }

  // Paginated media messages (IMAGE + VIDEO only)
  async findMedia(coupleId: string, skip: number, take: number) {
    return this.prisma.message.findMany({
      where: {
        coupleId,
        type: { in: ['IMAGE', 'VIDEO'] as any },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getPartner(coupleId: string, currentUserId: string) {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      include: {
        users: {
          where: {
            id: { not: currentUserId },
          },
        },
      },
    });

    return (couple?.users[0] as any) || null;
  }

  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async markAsRead(coupleId: string, userId: string, lastMessageId: string) {
    const lastMessage = await this.prisma.message.findUnique({
      where: { id: lastMessageId },
    });

    if (!lastMessage) return;

    await this.prisma.message.updateMany({
      where: {
        coupleId,
        senderId: { not: userId },
        status: { not: 'READ' },
        createdAt: {
          lte: lastMessage.createdAt,
        },
      },
      data: { status: 'READ' },
    });
  }
}