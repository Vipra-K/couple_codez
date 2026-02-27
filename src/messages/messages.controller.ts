import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
          // Allow common audio mimetypes as well
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
      console.log('Validation Failed: Missing required fields');
      throw new BadRequestException('File, coupleId, and senderId are required');
    }

    // 1. Upload to Drive
    const { id: driveFileId, webViewLink } = await this.driveService.uploadFile(
      file,
      coupleId,
    );

    // 2. Determine Message Type
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

    // 3. Save to Database
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

    // 4. Notify via WebSocket
    this.messagesGateway.notifyNewMessage(coupleId, message);

    return message;
  }

  @Get(':coupleId')
  findAll(@Param('coupleId') coupleId: string) {
    return this.messagesService.findHistory(coupleId);
  }

  @Get(':coupleId/partner/:userId')
  async getPartner(
    @Param('coupleId') coupleId: string,
    @Param('userId') userId: string,
  ) {
    return this.messagesService.getPartner(coupleId, userId);
  }
}
