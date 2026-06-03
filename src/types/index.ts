export type DealCategory = 'food' | 'drinks' | 'grocery' | 'retail' | 'local' | 'furniture' | 'electronics' | 'clothing' | 'books' | 'kitchen' | 'sports' | 'toys' | 'other';
export type ItemCategory = DealCategory;

export type ClaimType   = 'code' | 'in-store' | 'app-required' | 'no-action';
export type ItemSource  = 'user' | 'reddit' | 'mcdonalds' | 'starbucks' | 'chickfila' | 'flipp' | 'facebook' | 'craigslist' | 'slickdeals' | '9to5toys' | 'hip2save' | 'dealnews' | 'krazycouponlady';
export type ItemStatus  = 'available' | 'claimed' | 'deleted';

export type CommunityPostType = 'coupon' | 'free-stuff' | 'find';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: DealCategory;
  location: LatLng & { address?: string };
  photoUrls: string[];
  source: ItemSource;
  sourceName: string;
  sourceId?: string;
  sourceUrl?: string;
  tags?: string[];
  businessName?: string;
  claimInstructions?: string;
  userId?: string;
  status: ItemStatus;
  claimType: ClaimType;
  couponCode?: string;
  claimedCount?: number;
  likeCount?: number;
  likedByMe?: boolean;
  createdAt: string;
  expiresAt?: string;
  distanceKm?: number;
  distanceMi?: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  userAvatarUrl?: string;
  userLocation: string;
  type: CommunityPostType;
  body: string;
  couponCode?: string;
  couponClaimed: boolean;
  photoUrls?: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userInitials: string;
  userAvatarUrl?: string;
  parentId?: string;
  text: string;
  createdAt: string;
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
