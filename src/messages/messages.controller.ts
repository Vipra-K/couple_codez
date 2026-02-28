import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';
import { DriveService } from './drive.service';
import { MessagesGateway } from './messages.gateway';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly driveService: DriveService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|mp4|mov|mpeg|mp4|wav|x-wav|audio\/mpeg|audio\/mp4|audio\/wav)$/i)) {
          if (file.mimetype.startsWith('audio/')) {
            return cb(null, true);
          }
          return cb(new BadRequestException('Unsupported file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('coupleId') coupleId: string,
    @Body('senderId') senderId: string,
    @Body('type') requestedType?: string,
    @Body('replyToId') replyToId?: string,
    @Body('replyToContent') replyToContent?: string,
    @Body('replyToSenderId') replyToSenderId?: string,
    @Body('replyToType') replyToType?: string,
  ) {
    console.log('--- Upload Request Received ---');
    console.log('File:', file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size } : 'NULL');
    console.log('Body:', { coupleId, senderId, type: requestedType });

    if (!file || !coupleId || !senderId) {
      throw new BadRequestException('File, coupleId, and senderId are required');
    }

    const { id: driveFileId, webViewLink } = await this.driveService.uploadFile(file, coupleId);

    let type: string;
    if (requestedType) {
      type = requestedType.toUpperCase();
    } else if (file.mimetype.startsWith('video')) {
      type = 'VIDEO';
    } else if (file.mimetype.startsWith('audio')) {
      type = 'AUDIO';
    } else {
      type = 'IMAGE';
    }

    const message = await this.messagesService.create({
      coupleId,
      senderId,
      content: webViewLink,
      type: type as any,
      driveFileId,
      replyToId,
      replyToContent,
      replyToSenderId,
      replyToType,
    });

    this.messagesGateway.notifyNewMessage(coupleId, message);

    return message;
  }

  // Chat history (last 10)
  @Get(':coupleId')
  findAll(@Param('coupleId') coupleId: string) {
    return this.messagesService.findHistory(coupleId);
  }

  // Paginated media (images + videos) for profile screen
  @Get(':coupleId/media')
  findMedia(
    @Param('coupleId') coupleId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '6',
  ) {
    return this.messagesService.findMedia(
      coupleId,
      parseInt(skip, 10),
      parseInt(take, 10),
    );
  }

  @Get(':coupleId/partner/:userId')
  async getPartner(
    @Param('coupleId') coupleId: string,
    @Param('userId') userId: string,
  ) {
    return this.messagesService.getPartner(coupleId, userId);
  }
}