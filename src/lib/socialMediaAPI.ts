import { Channel } from '@prisma/client';

// Interfaces para las métricas de Facebook e Instagram
export interface FacebookPageMetrics {
  id: string;
  name: string;
  followers_count: number;
  fan_count: number;
  talking_about_count: number;
  were_here_count?: number;
  checkins?: number;
  impressions?: number;
  reach?: number;
  engaged_users?: number;
  page_views?: number;
  page_posts_impressions?: number;
  page_video_views?: number;
}

export interface InstagramAccountMetrics {
  id: string;
  username: string;
  name: string;
  biography?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url?: string;
  account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  website?: string;
}

export interface InstagramMediaMetrics {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  impressions?: number;
  reach?: number;
  saved?: number;
  video_views?: number;
  engagement?: number;
}

export interface FacebookPostMetrics {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  type: string;
  impressions?: number;
  reach?: number;
  clicks?: number;
  reactions?: {
    like: number;
    love: number;
    wow: number;
    haha: number;
    sad: number;
    angry: number;
    thankful: number;
  };
  comments?: number;
  shares?: number;
  video_views?: number;
}

export interface PlatformAnalytics {
  platform: 'FACEBOOK' | 'INSTAGRAM';
  accountInfo: FacebookPageMetrics | InstagramAccountMetrics;
  recentPosts: (FacebookPostMetrics | InstagramMediaMetrics)[];
  insights: {
    totalImpressions: number;
    totalReach: number;
    totalEngagement: number;
    engagementRate: number;
    averageImpressions: number;
    averageReach: number;
    postCount: number;
    followerGrowth?: number;
  };
  dateRange: {
    since: string;
    until: string;
  };
}

/**
 * Obtiene métricas de Facebook (detecta automáticamente si es perfil o página)
 */
export async function getFacebookAnalytics(
  channel: Channel, 
  days: number = 30
): Promise<PlatformAnalytics> {
  try {
    console.log(`🔵 Facebook Analytics - Channel ID: ${channel.id}, External ID: ${channel.externalId}`);
    
    const since = new Date();
    since.setDate(since.getDate() - days);
    const until = new Date();
    
    const sinceStr = since.toISOString().split('T')[0];
    const untilStr = until.toISOString().split('T')[0];

    console.log(`📅 Facebook Analytics - Date range: ${sinceStr} to ${untilStr}`);

    // Primero, obtener las páginas que administra el usuario
    console.log(`🔍 Buscando páginas administradas por el usuario...`);
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,followers_count,fan_count,tasks&access_token=${channel.accessToken}`
    );

    let targetPageId = channel.externalId;
    let targetAccessToken = channel.accessToken;
    let isPageAccount = false;

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      console.log(`📊 Páginas encontradas:`, pagesData.data?.length || 0);
      
      if (pagesData.data && pagesData.data.length > 0) {
        // Buscar la página "Garras Felinas" o usar la primera página disponible
        const garrasFelinasPage = pagesData.data.find((page: any) => 
          page.name.toLowerCase().includes('garras felinas') || 
          page.name.toLowerCase().includes('garras') ||
          page.id === channel.externalId
        );

        const targetPage = garrasFelinasPage || pagesData.data[0];
        
        if (targetPage) {
          targetPageId = targetPage.id;
          targetAccessToken = targetPage.access_token || channel.accessToken;
          isPageAccount = true;
          
          console.log(`✅ Usando página de Facebook:`, {
            id: targetPage.id,
            name: targetPage.name,
            category: targetPage.category,
            hasPageToken: !!targetPage.access_token
          });
        }
      } else {
        console.log(`ℹ️ No se encontraron páginas administradas, usando perfil personal`);
      }
    } else {
      console.log(`⚠️ No se pudo acceder a páginas, usando configuración original`);
    }

    // 1. Obtener información de la página (si es una página) o perfil (si es personal)
    let accountInfo: any;
    
    if (isPageAccount) {
      // Obtener información de la página comercial
      const pageInfoUrl = `https://graph.facebook.com/v18.0/${targetPageId}?fields=id,name,category,description,about,website,phone,emails,single_line_address,followers_count,fan_count,talking_about_count,were_here_count,checkins,picture,cover,verification_status,is_verified,username&access_token=${targetAccessToken}`;
      console.log(`📡 Facebook API - Calling page info: ${pageInfoUrl.replace(targetAccessToken, '[TOKEN]')}`);
      
      const pageInfoResponse = await fetch(pageInfoUrl);

      if (!pageInfoResponse.ok) {
        const errorText = await pageInfoResponse.text();
        console.error(`❌ Facebook API page info error: ${pageInfoResponse.status}`, errorText);
        throw new Error(`Facebook API page error: ${pageInfoResponse.status} - ${errorText}`);
      }

      accountInfo = await pageInfoResponse.json();
      console.log(`✅ Facebook page info received:`, accountInfo);
      
    } else {
      // Fallback al perfil personal
      const profileInfoUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,first_name,last_name,picture&access_token=${channel.accessToken}`;
      console.log(`📡 Facebook API - Calling profile info: ${profileInfoUrl.replace(channel.accessToken, '[TOKEN]')}`);
      
      const profileInfoResponse = await fetch(profileInfoUrl);

      if (!profileInfoResponse.ok) {
        const errorText = await profileInfoResponse.text();
        console.error(`❌ Facebook API profile info error: ${profileInfoResponse.status}`, errorText);
        throw new Error(`Facebook API error: ${profileInfoResponse.status} - ${errorText}`);
      }

      accountInfo = await profileInfoResponse.json();
      console.log(`✅ Facebook profile info received:`, accountInfo);
    }

    // 1.5. Intentar obtener información de amigos (conteo público)
    let friendsCount = 0;
    try {
      const friendsUrl = `https://graph.facebook.com/v18.0/me/friends?summary=total_count&access_token=${channel.accessToken}`;
      console.log(`👥 Facebook API - Calling friends count: ${friendsUrl.replace(channel.accessToken, '[TOKEN]')}`);
      
      const friendsResponse = await fetch(friendsUrl);
      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        friendsCount = friendsData.summary?.total_count || 0;
        console.log(`✅ Facebook friends count: ${friendsCount}`);
      } else {
        console.log(`ℹ️ Friends count not accessible (privacy settings)`);
      }
    } catch (error) {
      console.log(`ℹ️ Could not get friends count:`, error);
    }

    // Adaptar la estructura para que sea compatible con FacebookPageMetrics
    const adaptedPageInfo: FacebookPageMetrics = {
      id: accountInfo.id,
      name: accountInfo.name || `${accountInfo.first_name || ''} ${accountInfo.last_name || ''}`,
      followers_count: friendsCount, // Usar amigos como equivalente a seguidores
      fan_count: friendsCount,
      talking_about_count: 0,
      // Campos adicionales disponibles del perfil
      were_here_count: 0,
      checkins: 0,
      impressions: 0,
      reach: 0,
      engaged_users: 0,
      page_views: 0,
      page_posts_impressions: 0,
      page_video_views: 0,
    };

    // 2. Obtener insights (solo para páginas comerciales)
    let pageInsights: any = {
      page_impressions: 0,
      page_reach: 0,
      page_engaged_users: 0,
      page_views: 0,
      page_posts_impressions: 0,
      page_video_views: 0,
    };

    if (isPageAccount) {
      console.log(`📊 Obteniendo insights de la página...`);
      try {
        const pageInsightsUrl = `https://graph.facebook.com/v18.0/${targetPageId}/insights?metric=page_impressions,page_reach,page_engaged_users,page_views,page_posts_impressions,page_video_views&since=${sinceStr}&until=${untilStr}&access_token=${targetAccessToken}`;
        console.log(`📊 Facebook API - Calling page insights: ${pageInsightsUrl.replace(targetAccessToken, '[TOKEN]')}`);
        
        const pageInsightsResponse = await fetch(pageInsightsUrl);

        if (pageInsightsResponse.ok) {
          const insightsData = await pageInsightsResponse.json();
          console.log(`📈 Facebook page insights raw data:`, insightsData);
          
          pageInsights = insightsData.data.reduce((acc: any, insight: any) => {
            const totalValue = insight.values.reduce((sum: number, value: any) => sum + (value.value || 0), 0);
            acc[insight.name] = totalValue;
            return acc;
          }, pageInsights);
          
          console.log(`✅ Facebook page insights processed:`, pageInsights);
        } else {
          const errorText = await pageInsightsResponse.text();
          console.warn(`⚠️ Facebook page insights error (continuing without): ${pageInsightsResponse.status}`, errorText);
        }
      } catch (error) {
        console.warn(`⚠️ Error obteniendo page insights:`, error);
      }
    } else {
      console.log(`ℹ️ Skipping insights - Personal profiles don't have insights access`);
    }

    // 3. Obtener posts de la página o perfil
    let recentPosts: FacebookPostMetrics[] = [];
    
    if (isPageAccount) {
      // 3.1. Obtener posts de la página con insights completos
      try {
        const pagePostsUrl = `https://graph.facebook.com/v18.0/${targetPageId}/posts?fields=id,message,story,created_time,type,description,caption,link,picture,source,insights.metric(post_impressions,post_reach,post_clicks,post_reactions_by_type_total,post_comments,post_shares,post_video_views)&since=${sinceStr}&until=${untilStr}&limit=50&access_token=${targetAccessToken}`;
        console.log(`📝 Facebook API - Calling page posts with insights: ${pagePostsUrl.replace(targetAccessToken, '[TOKEN]')}`);
        
        const postsResponse = await fetch(pagePostsUrl);
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          console.log(`📝 Facebook page posts data:`, postsData);
          
                     const posts = postsData.data.map((post: any) => {
             const insights = post.insights?.data || [];
             const insightsMap = insights.reduce((acc: any, insight: any) => {
               acc[insight.name] = insight.values[0]?.value || 0;
               return acc;
             }, {});

             // Debug: Log de insights del post
             console.log(`🔍 Post ${post.id} insights:`, insights);
             console.log(`🔍 Post ${post.id} insightsMap:`, insightsMap);

             // Intentar obtener reacciones de diferentes maneras
             let reactions = {};
             
             // Método 1: Desde insights
             if (insightsMap.post_reactions_by_type_total) {
               reactions = insightsMap.post_reactions_by_type_total;
             }
             
             // Método 2: Intentar obtener reacciones directamente del post
             if (post.reactions) {
               reactions = { ...reactions, ...post.reactions };
             }
             
             // Método 3: Intentar obtener reacciones por separado
             if (post.likes) {
               reactions = { ...reactions, like: post.likes };
             }

             console.log(`🔍 Post ${post.id} final reactions:`, reactions);

             return {
               id: post.id,
               message: post.message || post.description || post.caption || '',
               story: post.story || '',
               created_time: post.created_time,
               type: post.type || 'status',
               link: post.link,
               picture: post.picture,
               source: post.source,
               impressions: insightsMap.post_impressions || 0,
               reach: insightsMap.post_reach || 0,
               clicks: insightsMap.post_clicks || 0,
               reactions: reactions,
               comments: insightsMap.post_comments || 0,
               shares: insightsMap.post_shares || 0,
               video_views: insightsMap.post_video_views || 0,
             };
           });
          
          recentPosts = recentPosts.concat(posts);
          console.log(`✅ Facebook page posts processed: ${posts.length} items with insights`);
        }
      } catch (error) {
        console.log(`ℹ️ Could not access page posts:`, error);
      }

      // 3.2. Obtener fotos de la página
      try {
        const pagePhotosUrl = `https://graph.facebook.com/v18.0/${targetPageId}/photos?fields=id,name,created_time,picture,source,link&limit=10&access_token=${targetAccessToken}`;
        console.log(`📸 Facebook API - Calling page photos: ${pagePhotosUrl.replace(targetAccessToken, '[TOKEN]')}`);
        
        const photosResponse = await fetch(pagePhotosUrl);
        if (photosResponse.ok) {
          const photosData = await photosResponse.json();
          console.log(`📸 Facebook page photos data:`, photosData);
          
          const photos = photosData.data.map((photo: any) => ({
            id: photo.id,
            message: photo.name || 'Foto de la página',
            story: '',
            created_time: photo.created_time,
            type: 'photo',
            picture: photo.picture,
            source: photo.source,
            link: photo.link,
            impressions: 0,
            reach: 0,
            clicks: 0,
            reactions: {},
            comments: 0,
            shares: 0,
            video_views: 0,
          }));
          
          // Evitar duplicados
          const existingIds = new Set(recentPosts.map(p => p.id));
          const newPhotos = photos.filter(p => !existingIds.has(p.id));
          recentPosts = recentPosts.concat(newPhotos);
          
          console.log(`✅ Facebook page photos processed: ${newPhotos.length} new items`);
        }
      } catch (error) {
        console.log(`ℹ️ Could not access page photos:`, error);
      }

    } else {
      // Fallback para perfil personal (código anterior)
      try {
        const feedUrl = `https://graph.facebook.com/v18.0/me/feed?fields=id,message,story,created_time,type,description,caption,link,picture,source&limit=20&access_token=${channel.accessToken}`;
        console.log(`📰 Facebook API - Calling personal feed: ${feedUrl.replace(channel.accessToken, '[TOKEN]')}`);
        
        const feedResponse = await fetch(feedUrl);
        if (feedResponse.ok) {
          const feedData = await feedResponse.json();
          console.log(`📰 Facebook feed data:`, feedData);
          
          const feedPosts = feedData.data.map((post: any) => ({
            id: post.id,
            message: post.message || post.description || post.caption || '',
            story: post.story || '',
            created_time: post.created_time,
            type: post.type || 'status',
            link: post.link,
            picture: post.picture,
            source: post.source,
            impressions: 0,
            reach: 0,
            clicks: 0,
            reactions: {},
            comments: 0,
            shares: 0,
            video_views: 0,
          }));
          
          recentPosts = recentPosts.concat(feedPosts);
          console.log(`✅ Facebook feed processed: ${feedPosts.length} items`);
        }
      } catch (error) {
        console.log(`ℹ️ Could not access feed:`, error);
      }
    }

    // Ordenar por fecha más reciente y limitar
    recentPosts = recentPosts
      .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
      .slice(0, 20);

    console.log(`✅ Total Facebook content processed: ${recentPosts.length} items`);

    // 4. Calcular analytics agregados
    const totalImpressions = recentPosts.reduce((sum, post) => sum + (post.impressions || 0), 0) + (pageInsights.page_impressions || 0);
    const totalReach = recentPosts.reduce((sum, post) => sum + (post.reach || 0), 0) + (pageInsights.page_reach || 0);
    
    // Calcular engagement total de manera más robusta
    let totalEngagement = 0;
    
    for (const post of recentPosts) {
      // Engagement de reacciones
      if (post.reactions && typeof post.reactions === 'object') {
        const reactionCounts = Object.values(post.reactions);
        for (const count of reactionCounts) {
          if (typeof count === 'number' && !isNaN(count)) {
            totalEngagement += count;
          }
        }
      }
      
      // Engagement de comentarios
      if (typeof post.comments === 'number' && !isNaN(post.comments)) {
        totalEngagement += post.comments;
      }
      
      // Engagement de shares
      if (typeof post.shares === 'number' && !isNaN(post.shares)) {
        totalEngagement += post.shares;
      }
    }

    const followers = accountInfo.followers_count || accountInfo.fan_count || friendsCount || 0;
    const engagementRate = followers > 0 ? (totalEngagement / followers) * 100 : 0;

    // Combinar información de cuenta con insights
    const finalAccountInfo: FacebookPageMetrics = {
      id: accountInfo.id,
      name: accountInfo.name,
      followers_count: accountInfo.followers_count || friendsCount,
      fan_count: accountInfo.fan_count || accountInfo.followers_count || friendsCount,
      talking_about_count: accountInfo.talking_about_count || 0,
      were_here_count: accountInfo.were_here_count || 0,
      checkins: accountInfo.checkins || 0,
      impressions: pageInsights.page_impressions || 0,
      reach: pageInsights.page_reach || 0,
      engaged_users: pageInsights.page_engaged_users || 0,
      page_views: pageInsights.page_views || 0,
      page_posts_impressions: pageInsights.page_posts_impressions || 0,
      page_video_views: pageInsights.page_video_views || 0,
    };

    const result = {
      platform: 'FACEBOOK' as const,
      accountInfo: finalAccountInfo,
      recentPosts,
      insights: {
        totalImpressions,
        totalReach,
        totalEngagement,
        engagementRate,
        averageImpressions: recentPosts.length > 0 ? totalImpressions / recentPosts.length : 0,
        averageReach: recentPosts.length > 0 ? totalReach / recentPosts.length : 0,
        postCount: recentPosts.length,
      },
      dateRange: {
        since: sinceStr,
        until: untilStr,
      },
    };

    console.log(`🎉 Facebook Analytics completed:`, {
      accountName: finalAccountInfo.name,
      accountType: isPageAccount ? `Page (${(accountInfo as any).category})` : 'Personal Profile',
      followers: followers,
      totalPosts: recentPosts.length,
      totalEngagement,
      engagementRate: engagementRate.toFixed(2) + '%',
      hasInsights: isPageAccount
    });

    return result;

  } catch (error) {
    console.error('❌ Facebook Analytics failed:', {
      channelId: channel.id,
      externalId: channel.externalId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Obtiene métricas detalladas de Instagram Business
 */
export async function getInstagramAnalytics(
  channel: Channel, 
  days: number = 30
): Promise<PlatformAnalytics> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const until = new Date();
    
    const sinceStr = since.toISOString().split('T')[0];
    const untilStr = until.toISOString().split('T')[0];

    // 1. Obtener información básica de la cuenta
    const accountInfoResponse = await fetch(
      `https://graph.instagram.com/${channel.externalId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,account_type,website&access_token=${channel.accessToken}`
    );

    if (!accountInfoResponse.ok) {
      throw new Error(`Instagram API error: ${accountInfoResponse.status}`);
    }

    const accountInfo: InstagramAccountMetrics = await accountInfoResponse.json();

    // 2. Obtener insights de la cuenta (solo para cuentas business/creator)
    let accountInsights: any = {};
    if (accountInfo.account_type !== 'PERSONAL') {
      try {
        const accountInsightsResponse = await fetch(
          `https://graph.instagram.com/${channel.externalId}/insights?metric=impressions,reach,profile_views,website_clicks,follower_count&period=day&since=${Math.floor(since.getTime() / 1000)}&until=${Math.floor(until.getTime() / 1000)}&access_token=${channel.accessToken}`
        );

        if (accountInsightsResponse.ok) {
          const insightsData = await accountInsightsResponse.json();
          accountInsights = insightsData.data.reduce((acc: any, insight: any) => {
            const totalValue = insight.values.reduce((sum: number, value: any) => sum + (value.value || 0), 0);
            acc[insight.name] = totalValue;
            return acc;
          }, {});
        }
      } catch (error) {
        console.log('Error obteniendo insights de cuenta Instagram:', error);
      }
    }

    // 3. Obtener media recientes
    const mediaResponse = await fetch(
      `https://graph.instagram.com/${channel.externalId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=50&access_token=${channel.accessToken}`
    );

    let recentPosts: InstagramMediaMetrics[] = [];
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json();
      
      // Filtrar por fecha y obtener insights para cada post
      const filteredMedia = mediaData.data.filter((media: any) => {
        const mediaDate = new Date(media.timestamp);
        return mediaDate >= since && mediaDate <= until;
      });

      // Obtener insights para cada media (solo para cuentas business/creator)
      recentPosts = await Promise.all(
        filteredMedia.map(async (media: any) => {
          let insights: any = {};
          
          if (accountInfo.account_type !== 'PERSONAL') {
            try {
              const mediaInsightsResponse = await fetch(
                `https://graph.instagram.com/${media.id}/insights?metric=impressions,reach,saved&access_token=${channel.accessToken}`
              );

              if (mediaInsightsResponse.ok) {
                const mediaInsightsData = await mediaInsightsResponse.json();
                insights = mediaInsightsData.data.reduce((acc: any, insight: any) => {
                  acc[insight.name] = insight.values[0]?.value || 0;
                  return acc;
                }, {});
              }
            } catch (error) {
              console.log(`Error obteniendo insights para media ${media.id}:`, error);
            }
          }

          const engagement = (media.like_count || 0) + (media.comments_count || 0) + (insights.saved || 0);

          return {
            id: media.id,
            caption: media.caption,
            media_type: media.media_type,
            media_url: media.media_url,
            permalink: media.permalink,
            timestamp: media.timestamp,
            like_count: media.like_count || 0,
            comments_count: media.comments_count || 0,
            impressions: insights.impressions || 0,
            reach: insights.reach || 0,
            saved: insights.saved || 0,
            engagement,
          };
        })
      );
    }

    // 4. Calcular analytics agregados
    const totalImpressions = recentPosts.reduce((sum, post) => sum + (post.impressions || 0), 0) + (accountInsights.impressions || 0);
    const totalReach = recentPosts.reduce((sum, post) => sum + (post.reach || 0), 0) + (accountInsights.reach || 0);
    const totalEngagement = recentPosts.reduce((sum, post) => sum + (post.engagement || 0), 0);

    const engagementRate = accountInfo.followers_count > 0 ? (totalEngagement / accountInfo.followers_count) * 100 : 0;

    return {
      platform: 'INSTAGRAM',
      accountInfo,
      recentPosts,
      insights: {
        totalImpressions,
        totalReach,
        totalEngagement,
        engagementRate,
        averageImpressions: recentPosts.length > 0 ? totalImpressions / recentPosts.length : 0,
        averageReach: recentPosts.length > 0 ? totalReach / recentPosts.length : 0,
        postCount: recentPosts.length,
      },
      dateRange: {
        since: sinceStr,
        until: untilStr,
      },
    };

  } catch (error) {
    console.error('Error obteniendo métricas de Instagram:', error);
    throw error;
  }
}

/**
 * Obtiene analytics combinados de todas las plataformas conectadas
 */
export async function getAllPlatformAnalytics(
  channels: Channel[], 
  days: number = 30
): Promise<PlatformAnalytics[]> {
  const results: PlatformAnalytics[] = [];

  for (const channel of channels) {
    try {
      console.log(`🔄 Procesando canal: ${channel.platform} (ID: ${channel.id})`);
      
      if (channel.platform === 'FACEBOOK') {
        console.log(`🔵 Iniciando Facebook Analytics para canal ${channel.id}`);
        const analytics = await getFacebookAnalytics(channel, days);
        results.push(analytics);
        console.log(`✅ Facebook Analytics completado para canal ${channel.id}`);
      } else if (channel.platform === 'INSTAGRAM') {
        console.log(`🟣 Iniciando Instagram Analytics para canal ${channel.id}`);
        const analytics = await getInstagramAnalytics(channel, days);
        results.push(analytics);
        console.log(`✅ Instagram Analytics completado para canal ${channel.id}`);
      } else {
        console.warn(`⚠️ Plataforma no soportada: ${channel.platform}`);
      }
    } catch (error) {
      console.error(`❌ Error obteniendo analytics para ${channel.platform} (canal ${channel.id}):`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // No añadir al resultado si hay error, para que no rompa el resto
    }
  }

  console.log(`🎯 Total de analytics exitosos: ${results.length}/${channels.length}`);
  return results;
}
