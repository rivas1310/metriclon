# 🎵 Integración de TikTok en Metriclon

Esta documentación explica cómo configurar y usar la integración de TikTok en Metriclon para analizar métricas, gestionar contenido y publicar videos.

## 🚀 Características

### ✅ **Funcionalidades Implementadas:**
- **OAuth 2.0** - Conexión segura con cuentas de TikTok
- **Analytics en Tiempo Real** - Métricas de seguidores, engagement y videos
- **Gestión de Videos** - Lista de videos recientes y top performers
- **Métricas Detalladas** - Views, likes, comentarios, shares y downloads
- **Publicación de Videos** - Subir y publicar videos directamente desde Metriclon
- **Refresh de Tokens** - Renovación automática de tokens expirados

### 📊 **Métricas Disponibles:**
- **Seguidores** - Total de followers de la cuenta
- **Total Views** - Reproducciones acumuladas de todos los videos
- **Total Likes** - Me gusta acumulados de todos los videos
- **Total Comments** - Comentarios acumulados
- **Total Shares** - Compartidos acumulados
- **Tasa de Engagement** - Porcentaje de interacción vs. seguidores

## 🛠️ Configuración

### 1. **Crear App en TikTok Developer Portal**

1. Ve a [TikTok for Developers](https://developers.tiktok.com/)
2. Crea una nueva aplicación
3. Selecciona **"Web App"** como tipo de aplicación
4. Configura los permisos necesarios:
   - `user.info.basic` - Información básica del usuario
   - `user.info.profile` - Perfil completo del usuario
   - `video.publish` - Publicar videos
   - `video.list` - Listar videos del usuario

### 2. **Variables de Entorno**

Agrega estas variables a tu archivo `.env`:

```bash
# TikTok Configuration
TIKTOK_CLIENT_ID="tu-client-id-de-tiktok"
TIKTOK_CLIENT_SECRET="tu-client-secret-de-tiktok"
TIKTOK_REDIRECT_URI="https://tudominio.com/api/oauth/callback/tiktok"
```

### 3. **Configurar Redirect URI**

En tu app de TikTok Developer Portal, agrega:
```
https://tudominio.com/api/oauth/callback/tiktok
```

## 🔗 Flujo de OAuth

### **Paso 1: Iniciar Conexión**
```
Usuario → Clic en "Conectar TikTok" → /api/oauth/tiktok
```

### **Paso 2: Autorización en TikTok**
```
TikTok → Usuario autoriza permisos → Código de autorización
```

### **Paso 3: Callback y Token**
```
TikTok → /api/oauth/callback/tiktok → Intercambio de código por token
```

### **Paso 4: Almacenamiento**
```
Token almacenado en DB → Canal TikTok activo → Analytics disponibles
```

## 📱 Uso de la API

### **Obtener Analytics de TikTok**

```typescript
import { getTikTokAnalytics } from '@/lib/tiktokAPI';

const analytics = await getTikTokAnalytics(accessToken);
```

### **Publicar Video**

```typescript
import { publishTikTokVideo } from '@/lib/tiktokAPI';

const result = await publishTikTokVideo(
  accessToken,
  videoFile,
  'Título del video',
  'Descripción del video',
  ['tag1', 'tag2']
);
```

### **Refrescar Token**

```typescript
import { refreshTikTokToken } from '@/lib/tiktokAPI';

const newTokens = await refreshTikTokToken(refreshToken);
```

## 🎯 Endpoints de la API

### **OAuth**
- `GET /api/oauth/tiktok` - Iniciar conexión OAuth
- `GET /api/oauth/callback/tiktok` - Callback de autorización

### **Métricas**
- `GET /api/metrics?platform=tiktok` - Obtener analytics de TikTok

## 🎨 Componentes React

### **TikTokAnalytics**
```tsx
import TikTokAnalytics from '@/components/TikTokAnalytics';

<TikTokAnalytics />
```

**Características:**
- Métricas principales en cards
- Gráfico de tendencias de engagement
- Lista de videos recientes
- Top videos por performance
- Panel de debug integrado

### **TikTokConnect**
```tsx
import TikTokConnect from '@/components/TikTokConnect';

<TikTokConnect 
  organizationId="org-id"
  onConnect={() => console.log('TikTok conectado')}
/>
```

**Características:**
- Botón de conexión OAuth
- Estados de conexión visuales
- Información de funcionalidades
- Enlaces a documentación

## 📊 Estructura de Datos

### **TikTokAnalyticsData**
```typescript
interface TikTokAnalyticsData {
  accountInfo: {
    displayName: string;
    username: string;
    avatarUrl: string;
    isVerified: boolean;
    followerCount: number;
    followingCount: number;
    likesCount: number;
    videoCount: number;
  };
  metrics: TikTokMetrics;
  recentVideos: TikTokVideo[];
  topVideos: TikTokVideo[];
  engagementTrends: EngagementTrend[];
}
```

### **TikTokVideo**
```typescript
interface TikTokVideo {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  videoUrl: string;
  createTime: number;
  stats: {
    playCount: number;
    shareCount: number;
    commentCount: number;
    likeCount: number;
    downloadCount: number;
  };
  tags: string[];
}
```

## 🔒 Seguridad

### **Manejo de Tokens**
- **Access Token** - Para llamadas a la API (vida útil limitada)
- **Refresh Token** - Para renovar access tokens expirados
- **Almacenamiento Seguro** - Encriptado en la base de datos
- **Renovación Automática** - Cuando los tokens expiran

### **Permisos de Usuario**
- Solo el propietario de la cuenta puede conectar TikTok
- Los tokens se almacenan por organización
- Acceso restringido a miembros autorizados

## 🚨 Manejo de Errores

### **Errores Comunes**
- **Token Expirado** - Renovación automática
- **Permisos Insuficientes** - Solicitar permisos adicionales
- **Rate Limiting** - Implementar backoff exponencial
- **Videos No Encontrados** - Verificar permisos de video.list

### **Logging y Debug**
```typescript
console.log('🔍 Obteniendo analytics de TikTok...');
console.log('✅ Información del usuario obtenida:', userData);
console.log('❌ Error obteniendo analytics de TikTok:', error);
```

## 📈 Monitoreo y Analytics

### **Métricas de Performance**
- Tiempo de respuesta de la API
- Tasa de éxito de conexiones OAuth
- Uso de tokens y renovaciones
- Errores por endpoint

### **Alertas Recomendadas**
- Tokens próximos a expirar
- Fallos en renovación de tokens
- Errores de rate limiting
- Videos no procesados

## 🔄 Mantenimiento

### **Tareas Regulares**
- **Diario** - Verificar estado de tokens
- **Semanal** - Revisar logs de errores
- **Mensual** - Actualizar permisos de app
- **Trimestral** - Revisar métricas de performance

### **Actualizaciones de API**
- Monitorear cambios en TikTok Open API
- Actualizar endpoints deprecados
- Implementar nuevas funcionalidades
- Mantener compatibilidad de versiones

## 📚 Recursos Adicionales

### **Documentación Oficial**
- [TikTok for Developers](https://developers.tiktok.com/)
- [Open API v2 Reference](https://developers.tiktok.com/doc/open-api-v2)
- [OAuth 2.0 Guide](https://developers.tiktok.com/doc/oauth-2-0)

### **Comunidad**
- [TikTok Developer Forum](https://developers.tiktok.com/forum/)
- [GitHub Issues](https://github.com/tiktok/tiktok-api-docs/issues)

## 🆘 Soporte

### **Problemas Comunes**
1. **"Error obteniendo información del usuario"**
   - Verificar permisos de la app
   - Comprobar validez del token

2. **"No se pueden obtener videos"**
   - Verificar permiso `video.list`
   - Comprobar que la cuenta tenga videos

3. **"Error en publicación de video"**
   - Verificar permiso `video.publish`
   - Comprobar formato y tamaño del video

### **Contacto**
- **Issues de GitHub** - Para bugs y feature requests
- **Documentación** - Para preguntas técnicas
- **Comunidad** - Para soporte general

---

**¡Con esta integración, Metriclon te permite gestionar completamente tu presencia en TikTok desde un solo lugar!** 🎉
