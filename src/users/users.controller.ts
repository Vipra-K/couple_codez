import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('fcm-token')
  async updateFcmToken(@Body() data: { userId: string; fcmToken: string }) {
    return this.usersService.updateFcmToken(data.userId, data.fcmToken);
  }
}
