export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  username?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}

export interface ProductLink {
  name: string;
  url: string;
  platform: string;
}

export interface Post {
  post_id: string;
  user_id: string;
  media_data: string;
  media_type: 'video' | 'image';
  caption?: string;
  intent_tag: IntentTag;
  product_links?: ProductLink[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  user?: {
    user_id: string;
    name: string;
    username?: string;
    picture?: string;
  };
  is_liked?: boolean;
  is_following?: boolean;
}

export interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    user_id: string;
    name: string;
    username?: string;
    picture?: string;
  };
}

export type IntentTag = 'learn' | 'earn' | 'relax' | 'explore' | 'shop';

export interface Intent {
  id: IntentTag;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const INTENTS: Intent[] = [
  { id: 'learn', label: 'Learn', icon: 'book', color: '#4F46E5', description: 'Discover knowledge' },
  { id: 'earn', label: 'Earn', icon: 'cash', color: '#10B981', description: 'Make money' },
  { id: 'relax', label: 'Relax', icon: 'happy', color: '#F59E0B', description: 'Chill & enjoy' },
  { id: 'explore', label: 'Explore', icon: 'compass', color: '#3B82F6', description: 'Find new things' },
  { id: 'shop', label: 'Shop', icon: 'cart', color: '#EC4899', description: 'Buy products' },
];
