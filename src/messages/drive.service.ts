import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  private drive;

  constructor() {
    const clientId = process.env.DRIVE_CLIENT_ID;
    const clientSecret = process.env.DRIVE_CLIENT_SECRET;
    const redirectUri = process.env.DRIVE_REDIRECT_URI;
    const refreshToken = process.env.DRIVE_REFRESH_TOKEN;
    const accessToken = process.env.DRIVE_ACCESS_TOKEN;
    const expiryDate = process.env.DRIVE_TOKEN_EXPIRY;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing required Google Drive environment variables');
    }

    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expiry_date: expiryDate ? parseInt(expiryDate) : undefined,
    });

    this.drive = google.drive({ version: 'v3', auth: oAuth2Client });
  }

  async uploadFile(
    file: Express.Multer.File,
    coupleId: string,
  ): Promise<{ id: string; webViewLink: string }> {
    const timestamp = Date.now();
    const fileName = `${coupleId}_${timestamp}_${file.originalname}`;

    const fileMetadata = {
      name: fileName,
      parents: [process.env.DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    };

    try {
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      const fileId = response.data.id;

      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const publicUrl = `https://drive.google.com/uc?id=${fileId}`;

      return {
        id: fileId,
        webViewLink: publicUrl,
      };
    } catch (error) {
      this.logger.error(`Error uploading to Drive: ${error.message}`);
      throw error;
    }
  }
}