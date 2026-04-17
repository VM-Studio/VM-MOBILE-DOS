import dbConnect from '@/lib/db';
import Notification from '@/lib/models/Notification';

interface SendNotificationParams {
  userId: string;
  type: 'proyecto' | 'mensaje' | 'factura' | 'ticket' | 'general';
  title: string;
  message: string;
  link?: string;
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  try {
    await dbConnect();
    await Notification.create(params);
  } catch (err) {
    console.error('[sendNotification] Error:', err);
  }
}
