export class CreateMessageDto {
  coupleId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  driveFileId?: string;
  replyToId?: string;
  replyToContent?: string;
  replyToSenderId?: string;
  replyToType?: string;
}
