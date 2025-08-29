import { prisma } from './prisma';

export interface NotificationData {
  organizationId: string;
  type: string;
  title: string;
  message: string;
  category: string;
  metadata?: any;
  actionUrl?: string;
}

export class NotificationService {
  // Crear notificación
  static async create(notificationData: NotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: notificationData,
        include: {
          organization: true,
        },
      });

      // Enviar notificaciones según preferencias de usuarios
      await this.sendToUsers(notification, notificationData.organizationId);

      return notification;
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw error;
    }
  }

  // Enviar notificación a usuarios según sus preferencias
  private static async sendToUsers(notification: any, organizationId: string) {
    try {
      const members = await prisma.organizationMember.findMany({
        where: { organizationId },
        include: {
          user: {
            include: {
              notificationPreferences: {
                where: { organizationId }
              }
            }
          }
        }
      });

      for (const member of members) {
        const preferences = member.user.notificationPreferences[0];
        
        if (preferences) {
          // Verificar si la categoría está habilitada
          const categoryEnabled = preferences.categories[notification.category as keyof typeof preferences.categories];
          
          if (categoryEnabled) {
            // Enviar por email si está habilitado
            if (preferences.email) {
              await this.sendEmailNotification(member.user, notification);
            }

            // Enviar push si está habilitado
            if (preferences.push) {
              await this.sendPushNotification(member.user, notification);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error enviando notificaciones a usuarios:', error);
    }
  }

  // Enviar notificación por email
  private static async sendEmailNotification(user: any, notification: any) {
    // TODO: Implementar envío de email usando nodemailer o servicio similar
    console.log(`📧 Enviando email a ${user.email}: ${notification.title}`);
  }

  // Enviar notificación push
  private static async sendPushNotification(user: any, notification: any) {
    // TODO: Implementar notificaciones push usando service workers o servicio externo
    console.log(`🔔 Enviando push a ${user.id}: ${notification.title}`);
  }

  // Notificaciones automáticas del sistema

  // Notificación cuando se conecta un canal
  static async channelConnected(organizationId: string, platform: string, channelName: string) {
    return this.create({
      organizationId,
      type: 'channel_connected',
      title: `Canal ${platform} conectado`,
      message: `El canal "${channelName}" de ${platform} se ha conectado exitosamente.`,
      category: 'channels',
      metadata: { platform, channelName },
      actionUrl: `/dashboard?tab=channels`,
    });
  }

  // Notificación cuando falla la conexión de un canal
  static async channelConnectionFailed(organizationId: string, platform: string, channelName: string, error: string) {
    return this.create({
      organizationId,
      type: 'channel_connection_failed',
      title: `Error conectando canal ${platform}`,
      message: `No se pudo conectar el canal "${channelName}" de ${platform}. Error: ${error}`,
      category: 'channels',
      metadata: { platform, channelName, error },
      actionUrl: `/dashboard?tab=channels`,
    });
  }

  // Notificación cuando se programa un post
  static async postScheduled(organizationId: string, postId: string, platform: string, scheduledAt: string) {
    return this.create({
      organizationId,
      type: 'post_scheduled',
      title: 'Post programado',
      message: `Se ha programado un post para ${platform} el ${new Date(scheduledAt).toLocaleDateString('es-ES')} a las ${new Date(scheduledAt).toLocaleTimeString('es-ES')}.`,
      category: 'posts',
      metadata: { postId, platform, scheduledAt },
      actionUrl: `/dashboard?tab=calendar`,
    });
  }

  // Notificación cuando se publica un post
  static async postPublished(organizationId: string, postId: string, platform: string) {
    return this.create({
      organizationId,
      type: 'post_published',
      title: 'Post publicado',
      message: `El post se ha publicado exitosamente en ${platform}.`,
      category: 'posts',
      metadata: { postId, platform },
      actionUrl: `/dashboard?tab=overview`,
    });
  }

  // Notificación cuando falla la publicación de un post
  static async postPublishFailed(organizationId: string, postId: string, platform: string, error: string) {
    return this.create({
      organizationId,
      type: 'post_publish_failed',
      title: 'Error publicando post',
      message: `No se pudo publicar el post en ${platform}. Error: ${error}`,
      category: 'posts',
      metadata: { postId, platform, error },
      actionUrl: `/dashboard?tab=overview`,
    });
  }

  // Notificación de métricas destacadas
  static async metricsHighlight(organizationId: string, platform: string, metric: string, value: number, change: number) {
    const changeText = change > 0 ? `+${change}%` : `${change}%`;
    const emoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
    
    return this.create({
      organizationId,
      type: 'metrics_highlight',
      title: `${emoji} ${metric} en ${platform}`,
      message: `Tu ${metric} en ${platform} es ${value} (${changeText} vs período anterior).`,
      category: 'metrics',
      metadata: { platform, metric, value, change },
      actionUrl: `/dashboard?tab=analytics`,
    });
  }

  // Notificación de recordatorio de publicación
  static async publishReminder(organizationId: string, platform: string, hoursUntilPublish: number) {
    return this.create({
      organizationId,
      type: 'publish_reminder',
      title: 'Recordatorio de publicación',
      message: `Tienes un post programado para ${platform} en ${hoursUntilPublish} horas.`,
      category: 'posts',
      metadata: { platform, hoursUntilPublish },
      actionUrl: `/dashboard?tab=calendar`,
    });
  }

  // Notificación de sistema
  static async systemNotification(organizationId: string, title: string, message: string, actionUrl?: string) {
    return this.create({
      organizationId,
      type: 'system',
      title,
      message,
      category: 'system',
      actionUrl,
    });
  }

  // Notificación de engagement alto
  static async highEngagement(organizationId: string, postId: string, platform: string, engagementRate: number) {
    return this.create({
      organizationId,
      type: 'high_engagement',
      title: '¡Alto engagement! 🎉',
      message: `Tu post en ${platform} tiene un engagement del ${engagementRate.toFixed(1)}%. ¡Excelente trabajo!`,
      category: 'engagement',
      metadata: { postId, platform, engagementRate },
      actionUrl: `/dashboard?tab=analytics`,
    });
  }

  // Notificación de nueva funcionalidad
  static async newFeature(organizationId: string, featureName: string, description: string) {
    return this.create({
      organizationId,
      type: 'new_feature',
      title: `Nueva funcionalidad: ${featureName}`,
      message: description,
      category: 'system',
      metadata: { featureName },
      actionUrl: `/dashboard?tab=settings`,
    });
  }
}
