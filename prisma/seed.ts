import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear organizaciones de ejemplo
  const garrasFelinas = await prisma.organization.upsert({
    where: { slug: 'garras-felinas' },
    update: {},
    create: {
      name: 'Garras Felinas',
      slug: 'garras-felinas',
      description: 'Organización dedicada al cuidado y protección de gatos',
      logo: 'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=GF',
    },
  });

  const arbitDigital = await prisma.organization.upsert({
    where: { slug: 'arbit-digital' },
    update: {},
    create: {
      name: 'Arbit Digital',
      slug: 'arbit-digital',
      description: 'Agencia digital especializada en marketing y tecnología',
      logo: 'https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=AD',
    },
  });

  console.log('✅ Organizaciones creadas:', { garrasFelinas, arbitDigital });

  // Crear usuarios de ejemplo
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@integracion.com' },
    update: {},
    create: {
      email: 'admin@integracion.com',
      password: await bcrypt.hash('admin123', 12),
      firstName: 'Admin',
      lastName: 'Sistema',
      avatar: 'https://via.placeholder.com/150x150/95E1D3/FFFFFF?text=A',
    },
  });

  const garrasUser = await prisma.user.upsert({
    where: { email: 'garras@felinas.com' },
    update: {},
    create: {
      email: 'garras@felinas.com',
      password: await bcrypt.hash('garras123', 12),
      firstName: 'María',
      lastName: 'González',
      avatar: 'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=MG',
    },
  });

  const arbitUser = await prisma.user.upsert({
    where: { email: 'arbit@digital.com' },
    update: {},
    create: {
      email: 'arbit@digital.com',
      password: await bcrypt.hash('arbit123', 12),
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      avatar: 'https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=CR',
    },
  });

  console.log('✅ Usuarios creados:', { adminUser, garrasUser, arbitUser });

  // Crear membresías
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: garrasFelinas.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      organizationId: garrasFelinas.id,
      role: 'OWNER',
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: garrasUser.id,
        organizationId: garrasFelinas.id,
      },
    },
    update: {},
    create: {
      userId: garrasUser.id,
      organizationId: garrasFelinas.id,
      role: 'ADMIN',
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: arbitUser.id,
        organizationId: arbitDigital.id,
      },
    },
    update: {},
    create: {
      userId: arbitUser.id,
      organizationId: arbitDigital.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Membresías creadas');

  // Crear canales de ejemplo
  const instagramGarras = await prisma.channel.upsert({
    where: {
      organizationId_platform_externalId: {
        organizationId: garrasFelinas.id,
        platform: 'INSTAGRAM',
        externalId: 'garras_felinas_official',
      },
    },
    update: {},
    create: {
      organizationId: garrasFelinas.id,
      platform: 'INSTAGRAM',
      externalId: 'garras_felinas_official',
      name: 'Garras Felinas Oficial',
      accessToken: 'token_ejemplo_instagram',
      meta: {
        followers: 1250,
        verified: false,
        category: 'Pet Services',
      },
    },
  });

  const facebookGarras = await prisma.channel.upsert({
    where: {
      organizationId_platform_externalId: {
        organizationId: garrasFelinas.id,
        platform: 'FACEBOOK',
        externalId: 'garrasfelinas',
      },
    },
    update: {},
    create: {
      organizationId: garrasFelinas.id,
      platform: 'FACEBOOK',
      externalId: 'garrasfelinas',
      name: 'Garras Felinas',
      accessToken: 'token_ejemplo_facebook',
      meta: {
        followers: 2100,
        verified: true,
        category: 'Pet Services',
      },
    },
  });

  console.log('✅ Canales creados:', { instagramGarras, facebookGarras });

  // Crear posts de ejemplo
  const post1 = await prisma.post.create({
    data: {
      organizationId: garrasFelinas.id,
      channelId: instagramGarras.id,
      type: 'IMAGE',
      caption: '🐱 ¡Nuevo gatito rescatado! Necesita un hogar amoroso. #GarrasFelinas #Rescate #Adopción',
      hashtags: ['GarrasFelinas', 'Rescate', 'Adopción', 'Gatos', 'Amor'],
      createdBy: garrasUser.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const post2 = await prisma.post.create({
    data: {
      organizationId: garrasFelinas.id,
      channelId: facebookGarras.id,
      type: 'TEXT',
      caption: '📢 ¡Evento este sábado! Jornada de adopción en el parque central. ¡Ven a conocer a nuestros gatitos!',
      hashtags: ['Evento', 'Adopción', 'GarrasFelinas', 'Sábado'],
      createdBy: garrasUser.id,
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
    },
  });

  console.log('✅ Posts creados:', { post1, post2 });

  // Crear métricas de ejemplo
  await prisma.postMetric.create({
    data: {
      postId: post1.id,
      capturedAt: new Date(),
      impressions: 1250,
      reach: 980,
      likes: 45,
      comments: 12,
      shares: 8,
      engagement: 5.2,
    },
  });

  console.log('✅ Métricas creadas');

  // Crear notificaciones de ejemplo
  const notification1 = await prisma.notification.create({
    data: {
      organizationId: garrasFelinas.id,
      type: 'system',
      title: '¡Bienvenido a la plataforma! 🎉',
      message: 'Tu cuenta ha sido configurada exitosamente. Comienza conectando tus redes sociales.',
      category: 'system',
      metadata: { welcome: true },
      actionUrl: '/dashboard?tab=channels',
      isRead: false,
    },
  });

  const notification2 = await prisma.notification.create({
    data: {
      organizationId: garrasFelinas.id,
      type: 'post_scheduled',
      title: 'Post programado',
      message: 'Se ha programado un post para Facebook el 15/12/2024 a las 10:00.',
      category: 'posts',
      metadata: { platform: 'facebook', scheduledAt: '2024-12-15T10:00:00Z' },
      actionUrl: '/dashboard?tab=calendar',
      isRead: false,
    },
  });

  const notification3 = await prisma.notification.create({
    data: {
      organizationId: garrasFelinas.id,
      type: 'metrics_highlight',
      title: '📈 Engagement en Instagram',
      message: 'Tu engagement en Instagram es 5.2% (+12% vs período anterior).',
      category: 'metrics',
      metadata: { platform: 'instagram', metric: 'engagement', value: 5.2, change: 12 },
      actionUrl: '/dashboard?tab=analytics',
      isRead: true,
    },
  });

  // Crear preferencias de notificaciones de ejemplo
  const notificationPreferences = await prisma.notificationPreferences.create({
    data: {
      userId: garrasUser.id,
      organizationId: garrasFelinas.id,
      email: true,
      push: true,
      categories: {
        posts: true,
        metrics: true,
        channels: true,
        system: true,
        engagement: true,
      },
      frequency: 'realtime',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    },
  });

  console.log('✅ Notificaciones y preferencias creadas');

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
