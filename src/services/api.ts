import { User, Item, Claim } from '../types';

const API_BASE = '/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const userService = {
  getUsers: (search?: string) => fetch(`${API_BASE}/users?search=${search || ''}`).then(r => r.json()),
  getUser: (id: string) => fetch(`${API_BASE}/users/${id}`).then(r => r.json()),
  follow: (id: string) => fetch(`${API_BASE}/users/${id}/follow`, { method: 'POST', headers: getHeaders() }).then(r => r.json()),
  unfollow: (id: string) => fetch(`${API_BASE}/users/${id}/follow`, { method: 'DELETE', headers: getHeaders() }).then(r => r.json()),
  isFollowing: (id: string) => fetch(`${API_BASE}/users/${id}/is-following`, { headers: getHeaders() }).then(r => r.json()),
  getFollowers: (id: string) => fetch(`${API_BASE}/users/${id}/followers`).then(r => r.json()),
  getFollowing: (id: string) => fetch(`${API_BASE}/users/${id}/following`).then(r => r.json()),
};

export const notificationService = {
  getNotifications: () => fetch(`${API_BASE}/notifications`, { headers: getHeaders() }).then(r => r.json()),
  markAsRead: (id: number) => fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() }).then(r => r.json()),
  markAllAsRead: () => fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT', headers: getHeaders() }).then(r => r.json()),
};

export const adminService = {
  getStats: () => fetch(`${API_BASE}/admin/stats`, { headers: getHeaders() }).then(r => r.json()),
  getAudit: () => fetch(`${API_BASE}/admin/audit`, { headers: getHeaders() }).then(r => r.json()),
  updateItemStatus: (id: number, status: string) => fetch(`${API_BASE}/admin/items/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  }).then(r => r.json()),
};

export const chatService = {
  getConversations: () => fetch(`${API_BASE}/chat/conversations`, { headers: getHeaders() }).then(r => r.json()),
  getMessages: (otherUserId: number) => fetch(`${API_BASE}/chat/messages/${otherUserId}`, { headers: getHeaders() }).then(r => r.json()),
};
