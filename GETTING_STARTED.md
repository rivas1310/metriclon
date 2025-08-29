# 🚀 Guía de Inicio Rápido - Integración Social MVP

## 📋 Prerrequisitos

- Node.js 18+ 
- Docker y Docker Compose
- PostgreSQL (se incluye en Docker)
- Redis (se incluye en Docker)

## 🛠️ Instalación

### 1. Clonar y configurar el proyecto

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd integracion

# Instalar dependencias del monorepo
npm install

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 2. Configurar variables de entorno

```bash
# En el directorio backend/
cp .env.example .env

# Editar .env con tus configuraciones
nano .env
```

**Variables obligatorias:**
```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/integracion_social"

# JWT
JWT_SECRET="tu-secreto-jwt-super-seguro"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Servidor
PORT=3001
```

### 3. Iniciar servicios con Docker

```bash
# Desde el directorio raíz
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps
```

### 4. Configurar la base de datos

```bash
cd backend

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Poblar con datos de ejemplo
npm run prisma:seed
```

### 5. Iniciar la aplicación

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 Acceso a la aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Swagger Docs**: http://localhost:3001/api
- **pgAdmin**: http://localhost:5050 (opcional)
- **Redis Commander**: http://localhost:8081 (opcional)

## 🔐 Primeros pasos

### 1. Crear una cuenta
- Ve a http://localhost:3000
- Haz clic en "Registrarse"
- Completa el formulario con tu información

### 2. Conectar redes sociales
- En el dashboard, haz clic en "Conectar" en las plataformas deseadas
- Sigue el flujo de OAuth para cada plataforma

### 3. Crear tu primer post
- Haz clic en "Crear Post"
- Selecciona las plataformas
- Añade contenido y medios
- Programa o publica inmediatamente

## 📱 Plataformas Soportadas

- ✅ **Instagram** - Posts, Stories, Reels, Carousels
- ✅ **Facebook** - Posts, Videos, Imágenes
- ✅ **LinkedIn** - Posts, Artículos, Imágenes
- ✅ **Twitter/X** - Tweets, Imágenes, Videos
- ✅ **YouTube** - Videos, Shorts
- ✅ **TikTok** - Videos, Imágenes
- ✅ **Pinterest** - Pins, Boards
- ✅ **Google Business Profile** - Posts

## 🎯 Funcionalidades Principales

### Dashboard
- Estadísticas en tiempo real
- Posts recientes
- Estado de conexiones
- Acciones rápidas

### Calendario
- Vista semanal/mensual
- Drag & Drop para programar
- Mejores horarios para publicar
- Gestión de campañas

### Analytics
- Métricas por plataforma
- Análisis de engagement
- Reportes exportables (CSV/PDF)
- Predicciones de rendimiento

### Gestión de Contenido
- Editor de posts
- Subida de medios
- Programación inteligente
- Duplicación de contenido

## 🔧 Desarrollo

### Estructura del proyecto
```
integracion/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Autenticación JWT
│   │   ├── users/          # Gestión de usuarios
│   │   ├── organizations/  # Multi-tenancy
│   │   ├── channels/       # Canales sociales
│   │   ├── posts/          # Gestión de posts
│   │   ├── campaigns/      # Campañas
│   │   ├── oauth/          # OAuth 2.0
│   │   ├── social-platforms/ # APIs sociales
│   │   ├── metrics/        # Analytics
│   │   └── workers/        # Jobs BullMQ
│   └── prisma/             # Base de datos
├── frontend/                # Next.js 14
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── lib/            # Utilidades
│   │   └── app/            # Páginas
└── docker-compose.yml       # Servicios
```

### Comandos útiles

```bash
# Backend
npm run start:dev          # Desarrollo
npm run build              # Build producción
npm run test               # Tests
npm run prisma:studio      # Editor de BD

# Frontend
npm run dev                # Desarrollo
npm run build              # Build producción
npm run lint               # Linting

# Base de datos
npm run db:generate        # Generar Prisma
npm run db:migrate         # Ejecutar migraciones
npm run db:seed            # Datos de ejemplo
```

## 🚨 Solución de problemas

### Error de conexión a la base de datos
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Reiniciar el servicio
docker-compose restart postgres
```

### Error de Redis
```bash
# Verificar que Redis esté corriendo
docker-compose ps redis

# Reiniciar el servicio
docker-compose restart redis
```

### Error de migración Prisma
```bash
# Resetear la base de datos
cd backend
npx prisma migrate reset

# Regenerar el cliente
npm run prisma:generate
```

## 📚 Recursos adicionales

- [Documentación de NestJS](https://docs.nestjs.com/)
- [Documentación de Prisma](https://www.prisma.io/docs/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de BullMQ](https://docs.bullmq.io/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

---

**¡Disfruta construyendo tu plataforma de integración social! 🎉**

