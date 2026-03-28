export interface User {
  id: number;
  name: string;
  email: string;
  uucms_number?: string;
  role: 'user' | 'admin';
  bio?: string;
  avatar?: string;
  created_at: string;
  followersCount?: number;
  followingCount?: number;
}

export interface Notification {
  id: number;
  recipient_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  item_id?: number;
  message: string;
  type: 'FOUND_MATCH' | 'CLAIM_REQUEST' | 'FOLLOW' | 'SYSTEM';
  read_status: number;
  created_at: string;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url?: string;
  type: 'lost' | 'found';
  status: 'pending' | 'approved' | 'returned' | 'rejected';
  user_id: number;
  user_name: string;
  date_reported: string;
}

export interface Claim {
  id: number;
  item_id: number;
  user_id: number;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  item_title: string;
  user_name: string;
}
