import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TIKTOK CALLBACK SIMULATION ===');
    
    // Simular un callback exitoso
    const mockCode = 'test_authorization_code_123';
    const mockState = 'test_state_456';
    
    console.log('Simulando callback exitoso:');
    console.log('- Code:', mockCode);
    console.log('- State:', mockState);
    
    // Simular respuesta de token de TikTok
    const mockTokenResponse = {
      access_token: 'test_access_token_123',
      refresh_token: 'test_refresh_token_456',
      open_id: 'test_open_id_789',
      scope: 'user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish',
      expires_in: 86400,
      refresh_expires_in: 31536000,
      token_type: 'Bearer'
    };
    
    console.log('Token response simulado:', mockTokenResponse);
    
    // Simular información del usuario
    const mockUserData = {
      data: {
        user: {
          open_id: 'test_open_id_789',
          display_name: 'Test TikTok User',
          avatar_url: 'https://example.com/avatar.jpg',
          is_verified: false,
          follower_count: 1000,
          following_count: 500,
          likes_count: 5000,
          video_count: 50
        }
      }
    };
    
    console.log('User data simulado:', mockUserData);
    
    // Intentar guardar en la base de datos
    const organizationId = '997693ca-8304-464e-87a9-ccb22b576724';
    
    try {
      const channel = await prisma.channel.create({
        data: {
          platform: 'TIKTOK',
          externalId: mockTokenResponse.open_id,
          name: mockUserData.data.user.display_name,
          accessToken: mockTokenResponse.access_token,
          refreshToken: mockTokenResponse.refresh_token,
          tokenExpiresAt: new Date(Date.now() + mockTokenResponse.expires_in * 1000),
          isActive: true,
          organizationId: organizationId,
          meta: {
            openId: mockTokenResponse.open_id,
            scope: mockTokenResponse.scope,
            expires_in: mockTokenResponse.expires_in,
            refresh_expires_in: mockTokenResponse.refresh_expires_in,
            userInfo: mockUserData.data.user,
          },
        },
      });
      
      console.log('✅ Canal TikTok simulado guardado exitosamente:', channel.id);
      
      return NextResponse.json({
        success: true,
        message: 'TikTok callback simulation completed successfully',
        channel: {
          id: channel.id,
          platform: channel.platform,
          name: channel.name,
          isActive: channel.isActive,
          organizationId: channel.organizationId
        },
        simulation: {
          tokenResponse: mockTokenResponse,
          userData: mockUserData
        }
      });
      
    } catch (dbError) {
      console.error('Error guardando canal simulado:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error during simulation',
        details: dbError
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in TikTok callback simulation:', error);
    return NextResponse.json({
      error: 'TikTok callback simulation failed',
      details: error
    }, { status: 500 });
  }
}
