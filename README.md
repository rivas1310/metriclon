# �� Integración Social - Plataforma Unificada

**Plataforma de integración social para Garras Felinas & Arbit Digital**

Una aplicación **full-stack** construida con Next.js 14 que permite gestionar múltiples redes sociales desde una sola interfaz, similar a Metricool pero con características innovadoras.

## ✨ Características Principales

### 🔐 **Autenticación y Gestión**
- Sistema de usuarios y organizaciones
- Roles y permisos (OWNER, ADMIN, MANAGER, MEMBER)
- JWT con cookies HTTP-only seguras

### 📱 **Plataformas Soportadas**
- **Instagram** - Posts, Stories, Reels
- **Facebook** - Posts, Stories, Videos
- **LinkedIn** - Artículos, Posts
- **Twitter/X** - Tweets, Threads
- **TikTok** - Videos cortos
- **YouTube** - Videos, Shorts
- **Pinterest** - Pins, Boards
- **Google Business Profile** - Reseñas, Posts
- **Threads** - Posts de texto

### 📊 **Analytics y Métricas**
- Estadísticas en tiempo real
- Análisis de engagement
- Reportes personalizables
- Exportación de datos (CSV, PDF)

### 📅 **Programación Inteligente**
- Calendario visual con drag & drop
- Optimización automática de horarios
- Colas de publicación con BullMQ
- Reintentos automáticos en caso de fallo

### 🤖 **Características AI/ML**
- **Optimización de horarios** - Análisis de mejores momentos para publicar
- **Generación de hashtags** - IA para hashtags relevantes
- **Predicción de engagement** - Estimación de rendimiento
- **Integración ChatGPT** - Generación de contenido
- **Análisis de sentimientos** - Monitoreo de comentarios

### 🎯 **Funcionalidades Avanzadas**
- **Análisis de competidores** - Benchmarking automático
- **Gamificación** - Sistema de logros y rankings
- **Workflows personalizables** - Automatización de procesos
- **Integración con CRM** - Sincronización de datos

## 🏗️ Arquitectura Técnica

### **Frontend**
- **Next.js 14** - App Router, Server/Client Components
- **React 18** - Hooks, Suspense, Concurrent Features
- **Tailwind CSS** - Diseño responsive y moderno
- **React Query** - Gestión de estado y caché
- **TypeScript** - Tipado estático completo

### **Backend (API Routes)**
- **Next.js API Routes** - Endpoints RESTful
- **Prisma ORM** - Base de datos y migraciones
- **PostgreSQL** - Base de datos principal
- **Redis** - Caché y sesiones
- **BullMQ** - Colas de trabajo asíncronas

### **Base de Datos**
- **PostgreSQL** - Datos principales
- **Redis** - Caché y colas
- **Prisma Studio** - Interfaz visual para la BD

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18+ 
- Docker y Docker Compose
- PostgreSQL (opcional, Docker incluido)

### **1. Clonar y Instalar**
```bash
git clone <repository-url>
cd integracion
npm install
```

### **2. Configurar Variables de Entorno**
```bash
cp env.example .env.local
```

Editar `.env.local` con tus credenciales:
```env
# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/integracion_social?schema=public"

# JWT
JWT_SECRET="tu-jwt-secret-super-seguro-aqui"

# Redis
REDIS_URL="redis://localhost:6379"

# Instagram
INSTAGRAM_CLIENT_ID="tu-client-id"
INSTAGRAM_CLIENT_SECRET="tu-client-secret"
```

### **3. Levantar Base de Datos**
```bash
npm run docker:up
```

### **4. Configurar Base de Datos**
```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

### **5. Ejecutar Aplicación**
```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📱 Uso de la Aplicación

### **1. Registro e Inicio de Sesión**
- Crear cuenta con organización
- Iniciar sesión con email/contraseña
- Acceso a múltiples organizaciones

### **2. Conectar Redes Sociales**
- OAuth 2.0 para cada plataforma
- Tokens de acceso seguros
- Verificación de permisos

### **3. Crear y Programar Contenido**
- Editor visual de posts
- Subida de imágenes/videos
- Programación automática
- Hashtags inteligentes

### **4. Monitorear Rendimiento**
- Dashboard en tiempo real
- Métricas por plataforma
- Reportes personalizables
- Análisis de tendencias

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción

# Base de datos
npm run db:studio        # Abrir Prisma Studio
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Ejecutar migraciones
npm run db:seed          # Poblar con datos de ejemplo

# Docker
npm run docker:up        # Levantar servicios
npm run docker:down      # Detener servicios
npm run docker:logs      # Ver logs

# Utilidades
npm run lint             # Linting del código
npm run format           # Formatear código
npm test                 # Ejecutar tests
```

## 🗄️ Estructura de la Base de Datos

### **Modelos Principales**
- **User** - Usuarios del sistema
- **Organization** - Organizaciones/clientes
- **Channel** - Canales de redes sociales
- **Post** - Publicaciones programadas
- **Asset** - Archivos multimedia
- **Campaign** - Campañas de marketing
- **PostMetric** - Métricas de rendimiento
- **Job** - Trabajos en cola

### **Relaciones**
- Usuarios pueden pertenecer a múltiples organizaciones
- Cada organización tiene múltiples canales
- Posts se asocian a canales y organizaciones
- Métricas se capturan por post y tiempo

## 🔒 Seguridad

- **JWT** con expiración configurable
- **Cookies HTTP-only** para tokens
- **Hash de contraseñas** con bcrypt
- **Validación de permisos** por organización
- **CORS** configurado para APIs
- **Rate limiting** en endpoints críticos

## 🚀 Roadmap

### **Fase 1 - MVP (Completado)**
- ✅ Autenticación y usuarios
- ✅ Gestión de organizaciones
- ✅ Conexión básica de redes sociales
- ✅ Creación y programación de posts
- ✅ Métricas básicas

### **Fase 2 - Características Avanzadas**
- 🔄 Análisis de competidores
- 🔄 Optimización automática de horarios
- 🔄 Generación de hashtags con IA
- 🔄 Predicción de engagement

### **Fase 3 - Automatización e IA**
- 🔄 Integración ChatGPT
- 🔄 Análisis de sentimientos
- 🔄 Workflows automatizados
- 🔄 Sistema de gamificación

### **Fase 4 - Enterprise**
- 🔄 Multi-tenancy avanzado
- 🔄 API pública
- 🔄 Integraciones con CRM
- 🔄 Reportes avanzados

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

- **Email**: soporte@integracion.com
- **Documentación**: [docs.integracion.com](https://docs.integracion.com)
- **Issues**: [GitHub Issues](https://github.com/username/integracion/issues)

---

**Desarrollado con ❤️ para Garras Felinas & Arbit Digital**
