export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'salvage';

export interface UserProfile {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
  is_seller: boolean;
  seller_rating: number;
  total_sales: number;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: ListingCondition;
  images: string[];
  location?: string | null;
  quantity: number;
  unit: string;
  is_available: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Joined seller profile
  profiles?: {
    username: string;
    full_name?: string | null;
    avatar_url?: string | null;
    seller_rating?: number | null;
  } | null;
  is_favorited?: boolean;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings?: Listing | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id?: string | null;
  buyer_id: string;
  seller_id: string;
  last_message?: string | null;
  last_message_at?: string | null;
  created_at: string;
  listings?: {
    title: string;
    images: string[];
    price: number;
  } | null;
  buyer?: UserProfile | null;
  seller?: UserProfile | null;
}

export type PurchaseRequestStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface PurchaseRequest {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  message?: string | null;
  quantity: number;
  status: PurchaseRequestStatus;
  created_at: string;
  updated_at: string;
  listings?: {
    title: string;
    images: string[];
    price: number;
  } | null;
  buyer?: UserProfile | null;
  seller?: UserProfile | null;
}
