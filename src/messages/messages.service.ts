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

    // Create message and update couple's lastMessageAt
    const message = await this.prisma.message.create({
      data: {
        coupleId,
        senderId,
        content,
        type: type as any, // Cast to Prisma Enum
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

  async findHistory(coupleId: string) {
    return this.prisma.message.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'asc' },
      take: 50, // Limit history for now
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
}
