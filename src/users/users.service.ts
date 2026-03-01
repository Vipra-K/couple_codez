import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DriveService } from '../messages/drive.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private driveService: DriveService,
  ) {}

  async updateFcmToken(userId: string, fcmToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
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
