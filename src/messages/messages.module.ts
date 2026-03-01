import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DriveService } from './drive.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule],
  controllers: [MessagesController],
  providers: [MessagesGateway, MessagesService, DriveService, NotificationsService],
  exports: [DriveService, MessagesGateway],
})
export class MessagesModule {}
