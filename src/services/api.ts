import {
  ComponentItem,
  ItemRequest,
  StudentUser,
  Conversation,
  ChatMessage,
  StudentCareGuide,
  StudentCareRequest,
  EcoImpactMetrics,
  LeaderboardEntry,
  TransactionRecord,
} from '../types';

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
    if (API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
      return `${API_BASE_URL}${cleanEndpoint.substring(4)}`;
    }
    return `${API_BASE_URL}${cleanEndpoint}`;
  }
  return cleanEndpoint;
}

export function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('data:')) {
    return url;
  }

  // Strip localhost/127.0.0.1 prefixes
  let normalizedUrl = url.trim().replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i, '');

  if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
    return normalizedUrl;
  }

  normalizedUrl = normalizedUrl.replace(/^\/?src\/assets\//, '/assets/').replace(/\/src\/assets\//g, '/assets/');

  if (!normalizedUrl.startsWith('/') && !normalizedUrl.startsWith('data:')) {
    normalizedUrl = `/${normalizedUrl}`;
  }

  if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('/api/uploads/')) {
    const fileId = normalizedUrl.split('/').pop()?.split('?')[0];
    if (fileId) {
      try {
        const cached = localStorage.getItem(`c2c_cached_img_${fileId}`);
        if (cached && (cached.startsWith('data:image/') || cached.startsWith('http'))) {
          return cached;
        }
      } catch (e) {}
    }
  }

  if (API_BASE_URL && (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('/api/uploads/'))) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    const cleanPath = normalizedUrl.startsWith('/api/') ? normalizedUrl.slice(4) : normalizedUrl;
    return `${base}${cleanPath}`;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server or database took too long to respond. Please check your connection and try again.');
    }
    console.error(`Network fetch failed for ${targetUrl}:`, err);
    throw new Error('Unable to connect to Circuit2Circuit server. Please check your network connection and try again.');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(data.error || 'Authentication required. Please sign in with your college credentials.');
    }
    if (response.status === 404) {
      throw new Error(data.error || `Backend endpoint not found (404) at ${targetUrl}.`);
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
    email: string;
    rollNumber: string;
    branch: string;
    mobile: string;
    year: string;
    password: string;
    shareMobilePublicly: boolean;
    resetAccount?: boolean;
  }): Promise<{ message: string; token: string; user: StudentUser }> {
    const res = await request<{ message: string; token: string; user: StudentUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(identifier: string, password: string): Promise<{ message: string; token: string; user: StudentUser }> {
    const res = await request<{ message: string; token: string; user: StudentUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ rollNumber: identifier, password }),
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

  async updateListingStatus(id: string, status: string, extra?: any): Promise<{ message: string; listing: ComponentItem; transaction?: TransactionRecord }> {
    return request(`/api/listings/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, ...extra }),
    });
  },

  async raiseDispute(listingId: string, data: { reason: string; expectedResolution: string; labTestResults?: string }): Promise<{ message: string; dispute: any }> {
    return request(`/api/listings/${listingId}/dispute`, {
      method: 'POST',
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
  async submitRequest(data: { itemId: string; preferredTime: string; handoverLocation?: string; notes?: string }): Promise<{ message: string; request: ItemRequest }> {
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

  async sendMessage(id: string, text: string, type: 'text' | 'phone_share' | 'offer' | 'location_suggest' = 'text', extra?: { offerAmount?: string; sharedPhone?: string; suggestedLocation?: string }): Promise<{ message: ChatMessage; conversation: Conversation }> {
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

  // Student Care Helpdesk
  async getStudentCareGuides(): Promise<{ guides: StudentCareGuide[] }> {
    return request('/api/student-care/guides');
  },

  async createStudentCareGuide(data: {
    title: string;
    category: StudentCareGuide['category'];
    componentOrKit: string;
    summary: string;
    pinoutNotes?: string;
    troubleshootingTips: string[];
    sampleCode?: string;
  }): Promise<{ message: string; guide: StudentCareGuide }> {
    return request('/api/student-care/guides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async upvoteStudentCareGuide(id: string): Promise<{ message: string; guide: StudentCareGuide }> {
    return request(`/api/student-care/guides/${id}/upvote`, {
      method: 'POST',
    });
  },

  async getStudentCareRequests(): Promise<{ requests: StudentCareRequest[] }> {
    return request('/api/student-care/requests');
  },

  async createStudentCareRequest(data: {
    title: string;
    componentNeededOrIssue: string;
    urgency: 'low' | 'medium' | 'high';
    labName?: string;
  }): Promise<{ message: string; request: StudentCareRequest }> {
    return request('/api/student-care/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async answerStudentCareRequest(id: string, data: { answerText: string; sampleCodeSnippet?: string }): Promise<{ message: string; request: StudentCareRequest }> {
    return request(`/api/student-care/requests/${id}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Sustainability Eco-Impact & Leaderboards
  async getEcoImpact(): Promise<{ metrics: EcoImpactMetrics }> {
    return request('/api/eco-impact');
  },

  async getLeaderboard(): Promise<{ leaderboards: LeaderboardEntry[] }> {
    return request('/api/leaderboards');
  },

  // Payment Status & Configuration
  async getPaymentGatewayStatus(): Promise<{
    provider: string;
    status: 'unconfigured' | 'active';
    offlineExchangeActive: boolean;
    requiredConfig: string[];
    message: string;
  }> {
    return request('/api/payment-gateway/status');
  },

  // Admin Management Portal
  async getAdminOverview(): Promise<{
    overview: {
      totalUsers: number;
      totalListings: number;
      totalTransactions: number;
      pendingReports: number;
      activeDisputes: number;
      reports: any[];
      disputes: any[];
      recentTransactions: TransactionRecord[];
    };
  }> {
    return request('/api/admin/overview');
  },

  async resolveAdminDispute(id: string, data: { resolution: 'refund_granted' | 'item_returned' | 'dismissed'; notes: string }): Promise<{ message: string }> {
    return request(`/api/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async moderateListing(id: string, data: { action: 'feature' | 'delist' | 'verify'; status?: string }): Promise<{ message: string; listing: ComponentItem }> {
    return request(`/api/admin/listings/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async dismissReport(id: string): Promise<{ message: string }> {
    return request(`/api/admin/reports/${id}/dismiss`, {
      method: 'POST',
    });
  },
};
