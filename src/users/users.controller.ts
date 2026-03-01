import {
  Controller,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('fcm-token')
  async updateFcmToken(@Body() data: { userId: string; fcmToken: string }) {
    return this.usersService.updateFcmToken(data.userId, data.fcmToken);
  }

  @Post(':userId/profile-pic')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Only images are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfilePic(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.usersService.updateProfilePic(userId, file);
  }
}
