// API client para Next.js API Routes
const api = {
  // Autenticación
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return response.json();
    },
    register: async (userData: { email: string; password: string; firstName?: string; lastName?: string; organizationName: string }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
  },

  // Organizaciones
  organizations: {
    getAll: async () => {
      const response = await fetch('/api/organizations');
      return response.json();
    },
    create: async (orgData: { name: string; description?: string; logo?: string }) => {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      });
      return response.json();
    },
    getStats: async (organizationId: string) => {
      const response = await fetch(`/api/organizations/${organizationId}/stats`);
      return response.json();
    },
    getChannels: async (organizationId: string) => {
      const response = await fetch(`/api/channels?organizationId=${organizationId}`);
      return response.json();
    },
    getChannelMetrics: async (organizationId: string) => {
      const response = await fetch(`/api/organizations/${organizationId}/channels/metrics`);
      return response.json();
    },
  },

  // Canales
  channels: {
    getAll: async (organizationId: string) => {
      const response = await fetch(`/api/organizations/${organizationId}/channels`);
      return response.json();
    },
    create: async (organizationId: string, channelData: any) => {
      const response = await fetch(`/api/organizations/${organizationId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData),
      });
      return response.json();
    },
    sync: async (organizationId: string, channelId: string) => {
      const response = await fetch(`/api/organizations/${organizationId}/channels/${channelId}/sync`, {
        method: 'POST',
      });
      return response.json();
    },
  },

  // Posts
  posts: {
    getAll: async (params: { organizationId: string; status?: string; type?: string; limit?: number }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
      const response = await fetch(`/api/posts?${searchParams.toString()}`);
      return response.json();
    },
    getRecent: async (params: { organizationId: string; limit?: number }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
      const response = await fetch(`/api/posts?${searchParams.toString()}&status=published&limit=${params.limit || 10}`);
      return response.json();
    },
    create: async (postData: any) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      return response.json();
    },
    getCalendar: async (params: { organizationId: string; startDate: string; endDate: string }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
      const response = await fetch(`/api/posts/calendar?${searchParams.toString()}`);
      return response.json();
    },
    update: async (postId: string, postData: any) => {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      return response.json();
    },
    delete: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      return response.json();
    },
    getAnalytics: async (params: { organizationId: string; startDate: string; endDate: string }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
      const response = await fetch(`/api/posts/analytics?${searchParams.toString()}`);
      return response.json();
    },
  },

  // Métricas
  metrics: {
    getMetrics: async (params: { organizationId: string; startDate?: string; endDate?: string }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
      const response = await fetch(`/api/organizations/${params.organizationId}/channels/metrics?${searchParams.toString()}`);
      return response.json();
    },
    exportMetrics: async (params: { organizationId: string; startDate: string; endDate: string; format: 'csv' | 'pdf' }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
      const response = await fetch(`/api/metrics/export?${searchParams.toString()}`);
      return response.json();
    },
  },

  // OAuth
  oauth: {
    getStatus: async (organizationId: string) => {
      const response = await fetch(`/api/oauth/status?organizationId=${organizationId}`);
      return response.json();
    },
    connectInstagram: async (organizationId: string) => {
      const response = await fetch(`/api/oauth/instagram?organizationId=${organizationId}`);
      return response.json();
    },
  },
};

export { api };

// Interfaces para los datos de la API
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizations: Organization[];
}

export interface Organization {
  id: string;
  name: string;
  role: string;
}

export interface Post {
  id: string;
  caption?: string;
  type: PostType;
  status: PostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  channelId: string;
  channel: {
    platform: string;
    name: string;
  };
  assets: Asset[];
  createdAt: string;
  updatedAt: string;
}

export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REEL' | 'STORY' | 'LINK';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

export interface Asset {
  id: string;
  type: string;
  url: string;
  filename: string;
}

export interface Channel {
  id: string;
  platform: string;
  name: string;
  isActive: boolean;
  isConnected: boolean; // Agregar para compatibilidad con componentes
  lastSync?: string;
  followers?: number;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
}

export interface DashboardStats {
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  postsThisMonth: number;
  engagementRate: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  changeValue: number;
}

export interface PostMetric {
  postId: string;
  capturedAt: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  impressions: number;
}
