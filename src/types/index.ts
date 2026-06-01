export type ItemCategory =
  | 'furniture' | 'electronics' | 'clothing' | 'books'
  | 'kitchen'   | 'sports'      | 'toys'     | 'other';

export type ItemSource  = 'user' | 'facebook' | 'craigslist' | 'buynot';
export type ItemStatus  = 'available' | 'claimed' | 'deleted';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  location: LatLng & { address?: string };
  photoUrls: string[];
  source: ItemSource;
  sourceId?: string;
  userId?: string;
  status: ItemStatus;
  createdAt: string;
  expiresAt: string;
  distanceKm?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  messageCount: number;
}

export interface Conversation {
  id: string;
  itemId: string;
  item?: Pick<Item, 'title' | 'photoUrls'>;
  otherUser?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface FilterState {
  radiusKm: number;
  category?: ItemCategory;
  maxAgeHours?: number;
}
