import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  constructor(private configService: ConfigService) {
    if (admin.apps.length === 0) {
      try {
        const privateKey = (
          process.env.FIREBASE_PRIVATE_KEY ||
          this.configService.get<string>('FIREBASE_PRIVATE_KEY')
        )?.replace(/\\n/g, '\n');

        const serviceAccount = {
          type: process.env.FIREBASE_TYPE || this.configService.get('FIREBASE_TYPE'),
          project_id: process.env.FIREBASE_PROJECT_ID || this.configService.get('FIREBASE_PROJECT_ID'),
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || this.configService.get('FIREBASE_PRIVATE_KEY_ID'),
          private_key: privateKey,
          client_email: process.env.FIREBASE_CLIENT_EMAIL || this.configService.get('FIREBASE_CLIENT_EMAIL'),
          client_id: process.env.FIREBASE_CLIENT_ID || this.configService.get('FIREBASE_CLIENT_ID'),
          auth_uri: process.env.FIREBASE_AUTH_URI || this.configService.get('FIREBASE_AUTH_URI'),
          token_uri: process.env.FIREBASE_TOKEN_URI || this.configService.get('FIREBASE_TOKEN_URI'),
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || this.configService.get('FIREBASE_AUTH_PROVIDER_CERT_URL'),
          client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || this.configService.get('FIREBASE_CLIENT_CERT_URL'),
          universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || this.configService.get('FIREBASE_UNIVERSE_DOMAIN'),
        };

        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('Missing required Firebase environment variables');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });

        console.log('Firebase initialized successfully.');
      } catch (e) {
        console.error('Failed to initialize Firebase:', e.message);
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
