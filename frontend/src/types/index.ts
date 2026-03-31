export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  username?: string;
  bio?: string;
  phone?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_earnings?: number;
  created_at: string;
}

export interface ProductLink {
  name: string;
  url: string;
  platform: string;
}

export interface Product {
  product_id: string;
  creator_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image?: string;
  external_url?: string;
  platform?: string;
  sales_count: number;
  created_at: string;
  creator?: {
    user_id: string;
    name: string;
    picture?: string;
  };
}

export interface Post {
  post_id: string;
  user_id: string;
  media_data: string;
  media_type: 'video' | 'image';
  caption?: string;
  intent_tag: IntentTag;
  product_links?: ProductLink[];
  products?: string[];
  space_id?: string;
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
  recommendation_reason?: string;
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

export interface Space {
  space_id: string;
  name: string;
  description?: string;
  cover_image?: string;
  tags?: string[];
  members_count: number;
  posts_count: number;
  created_by: string;
  created_at: string;
  is_member?: boolean;
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
  { id: 'learn', label: 'Learn', icon: 'book', color: '#22D3EE', description: 'Discover knowledge' },
  { id: 'earn', label: 'Earn', icon: 'cash', color: '#10B981', description: 'Make money' },
  { id: 'relax', label: 'Relax', icon: 'happy', color: '#F59E0B', description: 'Chill & enjoy' },
  { id: 'explore', label: 'Explore', icon: 'compass', color: '#8B5CF6', description: 'Find new things' },
  { id: 'shop', label: 'MY SHINE', icon: 'storefront', color: '#F43F5E', description: 'Shop & sell' },
];

// Theme colors - Bioluminescent Future
export const THEME = {
  primary: '#F43F5E',      // Pink
  secondary: '#22D3EE',    // Cyan
  accent: '#8B5CF6',       // Purple
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Orange
  background: '#0a0a0f',   // Dark
  surface: '#1a1a2e',      // Surface
  surfaceLight: '#2a2a3e', // Surface light
  text: '#ffffff',
  textSecondary: '#888888',
};

// Categories for educational content
export const CATEGORIES = [
  { id: 'medicine', label: 'Medicine', icon: 'medical', color: '#F43F5E' },
  { id: 'business', label: 'Business', icon: 'briefcase', color: '#10B981' },
  { id: 'technology', label: 'Technology', icon: 'hardware-chip', color: '#22D3EE' },
  { id: 'science', label: 'Science', icon: 'flask', color: '#8B5CF6' },
  { id: 'languages', label: 'Languages', icon: 'language', color: '#F59E0B' },
  { id: 'arts', label: 'Arts', icon: 'color-palette', color: '#EC4899' },
];

export interface Lesson {
  lesson_id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  author_id: string;
  views_count: number;
  likes_count: number;
  created_at: string;
  author?: {
    user_id: string;
    name: string;
    picture?: string;
  };
}

export const RECOMMENDATION_REASONS = [
  'Based on your interests',
  'Popular in your area',
  'Similar to videos you liked',
  'From creators you follow',
  'Trending in {intent}',
  'New creator spotlight',
  'High engagement content',
];
