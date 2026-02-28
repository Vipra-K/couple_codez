import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class NotificationsService {
  constructor(private configService: ConfigService) {
    if (admin.apps.length === 0) {
      try {
        // Use path.resolve to ensure we find the file regardless of the cwd
        const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
        console.log('Attempting to load service account from:', serviceAccountPath);
        
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase initialized with service account successfully.');
      } catch (e) {
        console.error('Failed to load service account key, falling back to default:', e.message);
        // Fall back to application default credentials (e.g., in production)
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      }
    }
  }

  async sendPushNotification(fcmToken: string, title: string, body: string, data?: any) {
    if (!fcmToken) return;

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'chat_messages',
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
