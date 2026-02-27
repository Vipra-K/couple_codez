import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  private drive;

  constructor() {
    // 1. Load credentials and tokens
    const credentialsPath = path.join(process.cwd(), 'credentials/drive-oauth-client.json');
    const tokenPath = path.join(process.cwd(), 'credentials/drive-token.json');

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_id, client_secret, redirect_uris } =
      credentials.installed || credentials.web;

    // 2. Initialize OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0],
    );

    oAuth2Client.setCredentials(tokens);

    // 3. Initialize Drive client
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

      // Set permission to anyone with link can read
      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Drive direct link format
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
