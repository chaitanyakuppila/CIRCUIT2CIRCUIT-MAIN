import { ComponentItem, ItemRequest, StudentUser, Conversation, ChatMessage } from '../types';

const TOKEN_KEY = 'c2c_vasavi_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    // ignore
  }
}

const RAW_API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
export const API_BASE_URL = typeof RAW_API_URL === 'string' ? RAW_API_URL.trim().replace(/\/+$/, '') : '';

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (API_BASE_URL) {
    // If API_BASE_URL ends with /api and endpoint starts with /api, prevent duplicate /api/api
    if (API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
      return `${API_BASE_URL}${cleanEndpoint.substring(4)}`;
    }
    return `${API_BASE_URL}${cleanEndpoint}`;
  }
  return cleanEndpoint;
}

export function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  let normalizedUrl = url;
  if (normalizedUrl.startsWith('/src/assets/images/')) {
    normalizedUrl = normalizedUrl.replace('/src/assets/images/', '/assets/images/');
  }
  if (API_BASE_URL && normalizedUrl.startsWith('/uploads/')) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return `${base}${normalizedUrl}`;
  }
  return normalizedUrl;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const targetUrl = getApiUrl(endpoint);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
    });
  } catch (err: any) {
    console.error(`Network fetch failed for ${targetUrl}:`, err);
    throw new Error('Unable to connect to Circuit2Circuit server. Please check your network connection and try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        data.error || 'Incorrect roll number or password. Please check your credentials and try again.'
      );
    }
    if (response.status === 404) {
      throw new Error(
        data.error ||
          `Backend endpoint not found (404) at ${targetUrl}. If using an external AWS backend, please verify VITE_API_URL.`
      );
    }
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Config
  async getBranches(): Promise<{ collegeName: string; collegeCode: string; branches: string[] }> {
    return request('/api/config/branches');
  },

  // Auth
  async register(data: {
    name: string;
    rollNumber: string;
    branch: string;
    mobile: string;
    year: string;
    password: string;
    shareMobilePublicly: boolean;
  }): Promise<{ message: string; token: string; user: StudentUser }> {
    const res = await request<{ message: string; token: string; user: StudentUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(rollNumber: string, password: string): Promise<{ message: string; token: string; user: StudentUser }> {
    const res = await request<{ message: string; token: string; user: StudentUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ rollNumber, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async getMe(): Promise<{ user: StudentUser }> {
    return request('/api/auth/me');
  },

  async updateProfile(data: Partial<StudentUser> & { currentPassword?: string; newPassword?: string }): Promise<{ message: string; user: StudentUser }> {
    return request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Listings
  async getListings(): Promise<{ listings: ComponentItem[] }> {
    return request('/api/listings');
  },

  async createListing(data: any): Promise<{ message: string; listing: ComponentItem }> {
    return request('/api/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateListing(id: string, data: any): Promise<{ message: string; listing: ComponentItem }> {
    return request(`/api/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async uploadPhoto(imageDataBase64: string): Promise<{ message: string; photoUrl: string }> {
    return request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image: imageDataBase64 }),
    });
  },

  async deleteListing(id: string): Promise<{ message: string }> {
    return request(`/api/listings/${id}`, {
      method: 'DELETE',
    });
  },

  async getMyListings(): Promise<{ listings: ComponentItem[] }> {
    return request('/api/my/listings');
  },

  // Requests
  async submitRequest(data: { itemId: string; preferredTime: string; notes?: string }): Promise<{ message: string; request: ItemRequest }> {
    return request('/api/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyRequests(): Promise<{ sent: ItemRequest[]; received: ItemRequest[] }> {
    return request('/api/my/requests');
  },

  async updateRequestStatus(id: string, status: ItemRequest['status']): Promise<{ message: string; request: ItemRequest }> {
    return request(`/api/requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // OLX-Style In-App Chat
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return request('/api/conversations');
  },

  async getUnreadTotal(): Promise<{ totalUnread: number }> {
    return request('/api/conversations/unread-total');
  },

  async startConversation(listingId: string, initialMessage?: string): Promise<{ conversation: Conversation }> {
    return request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ listingId, initialMessage }),
    });
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: ChatMessage[]; listing: ComponentItem | null }> {
    return request(`/api/conversations/${id}`);
  },

  async sendMessage(id: string, text: string, type: 'text' | 'phone_share' | 'offer' = 'text', extra?: { offerAmount?: string; sharedPhone?: string }): Promise<{ message: ChatMessage; conversation: Conversation }> {
    return request(`/api/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, type, ...extra }),
    });
  },

  async sharePhoneInChat(id: string): Promise<{ message: ChatMessage; conversation: Conversation }> {
    return request(`/api/conversations/${id}/share-phone`, {
      method: 'POST',
    });
  },

  async blockConversation(id: string): Promise<{ message: string; conversation: Conversation }> {
    return request(`/api/conversations/${id}/block`, {
      method: 'POST',
    });
  },

  async unblockConversation(id: string): Promise<{ message: string; conversation: Conversation }> {
    return request(`/api/conversations/${id}/unblock`, {
      method: 'POST',
    });
  },

  async reportConversation(id: string, reason: string): Promise<{ message: string }> {
    return request(`/api/conversations/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
