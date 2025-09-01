import { Channel } from '@prisma/client';

export interface WebhookSubscription {
  pageId: string;
  accessToken: string;
  fields: string[];
  callbackUrl: string;
  verifyToken: string;
}

export class FacebookWebhookService {
  private static readonly GRAPH_API_VERSION = 'v18.0';
  private static readonly BASE_URL = 'https://graph.facebook.com';

  /**
   * Suscribe una página de Facebook a webhooks
   */
  static async subscribePageToWebhook(
    pageId: string, 
    accessToken: string, 
    callbackUrl: string,
    verifyToken: string
  ): Promise<boolean> {
    try {
      console.log(`🔗 Suscribiendo página ${pageId} a webhook...`);
      
      const subscribeUrl = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${pageId}/subscribed_apps`;
      
      const response = await fetch(subscribeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          callback_url: callbackUrl,
          verify_token: verifyToken,
          fields: [
            'feed',           // Posts y contenido
            'insights',       // Métricas de página
            'engagement',     // Engagement en tiempo real
            'messages',       // Mensajes de la página
            'messaging_postbacks', // Respuestas de botones
            'page_changes'    // Cambios en la página
          ],
          object: 'page'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Página ${pageId} suscrita exitosamente:`, result);
        return true;
      } else {
        const error = await response.text();
        console.error(`❌ Error suscribiendo página ${pageId}:`, error);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error en suscripción de webhook para página ${pageId}:`, error);
      return false;
    }
  }

  /**
   * Desuscribe una página de Facebook de webhooks
   */
  static async unsubscribePageFromWebhook(
    pageId: string, 
    accessToken: string
  ): Promise<boolean> {
    try {
      console.log(`🔗 Desuscribiendo página ${pageId} del webhook...`);
      
      const unsubscribeUrl = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${pageId}/subscribed_apps`;
      
      const response = await fetch(unsubscribeUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
        }),
      });

      if (response.ok) {
        console.log(`✅ Página ${pageId} desuscrita exitosamente`);
        return true;
      } else {
        const error = await response.text();
        console.error(`❌ Error desuscribiendo página ${pageId}:`, error);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error en desuscripción de webhook para página ${pageId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene las suscripciones activas de una página
   */
  static async getPageSubscriptions(
    pageId: string, 
    accessToken: string
  ): Promise<any[]> {
    try {
      console.log(`📋 Obteniendo suscripciones de página ${pageId}...`);
      
      const subscriptionsUrl = `${this.BASE_URL}/${this.GRAPH_API_VERSION}/${pageId}/subscribed_apps?access_token=${accessToken}`;
      
      const response = await fetch(subscriptionsUrl);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Suscripciones obtenidas para página ${pageId}:`, result);
        return result.data || [];
      } else {
        const error = await response.text();
        console.error(`❌ Error obteniendo suscripciones de página ${pageId}:`, error);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error obteniendo suscripciones para página ${pageId}:`, error);
      return [];
    }
  }

  /**
   * Verifica el estado de un webhook
   */
  static async verifyWebhookStatus(
    pageId: string, 
    accessToken: string
  ): Promise<{
    isSubscribed: boolean;
    subscriptions: any[];
    status: string;
  }> {
    try {
      const subscriptions = await this.getPageSubscriptions(pageId, accessToken);
      const isSubscribed = subscriptions.length > 0;
      
      return {
        isSubscribed,
        subscriptions,
        status: isSubscribed ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error(`❌ Error verificando estado de webhook para página ${pageId}:`, error);
      return {
        isSubscribed: false,
        subscriptions: [],
        status: 'error'
      };
    }
  }

  /**
   * Configura webhook para todas las páginas de un canal
   */
  static async setupWebhookForChannel(
    channel: Channel, 
    callbackUrl: string,
    verifyToken: string
  ): Promise<{
    success: boolean;
    pagesProcessed: number;
    pagesSubscribed: number;
    errors: string[];
  }> {
    try {
      console.log(`🔗 Configurando webhook para canal ${channel.id}...`);
      
      // Obtener páginas administradas por el usuario
      const pagesResponse = await fetch(
        `https://graph.facebook.com/${this.GRAPH_API_VERSION}/me/accounts?fields=id,name,access_token&access_token=${channel.accessToken}`
      );

      if (!pagesResponse.ok) {
        throw new Error('No se pudieron obtener las páginas administradas');
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];
      
      console.log(`📊 ${pages.length} páginas encontradas para el canal`);

      let pagesSubscribed = 0;
      const errors: string[] = [];

      for (const page of pages) {
        try {
          const success = await this.subscribePageToWebhook(
            page.id,
            page.access_token || channel.accessToken,
            callbackUrl,
            verifyToken
          );

          if (success) {
            pagesSubscribed++;
            console.log(`✅ Página ${page.name} (${page.id}) suscrita exitosamente`);
          } else {
            errors.push(`Error suscribiendo página ${page.name} (${page.id})`);
          }
        } catch (error) {
          const errorMsg = `Error procesando página ${page.name} (${page.id}): ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        success: pagesSubscribed > 0,
        pagesProcessed: pages.length,
        pagesSubscribed,
        errors
      };

    } catch (error) {
      console.error(`❌ Error configurando webhook para canal ${channel.id}:`, error);
      return {
        success: false,
        pagesProcessed: 0,
        pagesSubscribed: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}
