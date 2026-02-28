import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouplesService {
  constructor(private prisma: PrismaService) {}

  async generateCode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.coupleId) throw new ConflictException('User is already in a couple');

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Update user with the pair code
    await this.prisma.user.update({
      where: { id: userId },
      data: { pairCode: code }
    });

    return { code };
  }

  async join(userId: string, code: string) {
    const userB = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userB) throw new NotFoundException('User not found');
    if (userB.coupleId) throw new ConflictException('User is already in a couple');

    // Find the user who generated this code (User A)
    const userA = await this.prisma.user.findUnique({
      where: { pairCode: code }
    });

    if (!userA) throw new NotFoundException('Invalid pairing code');
    if (userA.id === userId) throw new ConflictException('You cannot pair with yourself');
    if (userA.coupleId) throw new ConflictException('User is already in a couple');

    // Create a new couple record for both
    const couple = await this.prisma.couple.create({
      data: {
        code: Math.random().toString(36).substring(2, 8).toUpperCase(), // Unique couple code for internal use if needed
        users: {
          connect: [
            { id: userA.id },
            { id: userB.id }
          ]
        }
      }
    });

    // Clear the pair code from User A
    await this.prisma.user.update({
      where: { id: userA.id },
      data: { pairCode: null }
    });

    return couple;
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { couple: { include: { users: true } } },
    });
    return user;
  }
}
