import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DriveService } from '../messages/drive.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private driveService: DriveService,
  ) {}

  async updateFcmToken(userId: string, fcmToken: string) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { fcmToken },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async updateProfilePic(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Reuse DriveService. We use userId as the "coupleId" equivalent for the filename prefix
    const { webViewLink } = await this.driveService.uploadFile(file, userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePic: webViewLink },
    });
  }
}
