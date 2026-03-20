import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, IntentTag } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface FeedState {
  posts: Post[];
  currentIntent: IntentTag | 'all';
  isLoading: boolean;
  hasMore: boolean;
  skip: number;
  setCurrentIntent: (intent: IntentTag | 'all') => void;
  fetchPosts: (reset?: boolean) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  addPost: (post: Post) => void;
  removePost: (postId: string) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  currentIntent: 'all',
  isLoading: false,
  hasMore: true,
  skip: 0,

  setCurrentIntent: (intent) => {
    set({ currentIntent: intent, posts: [], skip: 0, hasMore: true });
    get().fetchPosts(true);
  },

  fetchPosts: async (reset = false) => {
    const { isLoading, hasMore, currentIntent } = get();
    if (isLoading || (!hasMore && !reset)) return;

    set({ isLoading: true });
    const skip = reset ? 0 : get().skip;

    try {
      const token = await AsyncStorage.getItem('session_token');
      const intentParam = currentIntent !== 'all' ? `&intent=${currentIntent}` : '';
      
      const response = await fetch(
        `${API_URL}/api/posts/feed?skip=${skip}&limit=10${intentParam}`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const newPosts = await response.json();
        set(state => ({
          posts: reset ? newPosts : [...state.posts, ...newPosts],
          skip: skip + newPosts.length,
          hasMore: newPosts.length === 10,
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      set({ isLoading: false });
    }
  },

  likePost: async (postId: string) => {
    const token = await AsyncStorage.getItem('session_token');
    if (!token) return;

    // Optimistic update
    set(state => ({
      posts: state.posts.map(post =>
        post.post_id === postId
          ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
          : post
      ),
    }));

    try {
      await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      // Revert on error
      set(state => ({
        posts: state.posts.map(post =>
          post.post_id === postId
            ? { ...post, is_liked: false, likes_count: post.likes_count - 1 }
            : post
        ),
      }));
    }
  },

  unlikePost: async (postId: string) => {
    const token = await AsyncStorage.getItem('session_token');
    if (!token) return;

    // Optimistic update
    set(state => ({
      posts: state.posts.map(post =>
        post.post_id === postId
          ? { ...post, is_liked: false, likes_count: Math.max(0, post.likes_count - 1) }
          : post
      ),
    }));

    try {
      await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      // Revert on error
      set(state => ({
        posts: state.posts.map(post =>
          post.post_id === postId
            ? { ...post, is_liked: true, likes_count: post.likes_count + 1 }
            : post
        ),
      }));
    }
  },

  followUser: async (userId: string) => {
    const token = await AsyncStorage.getItem('session_token');
    if (!token) return;

    // Optimistic update
    set(state => ({
      posts: state.posts.map(post =>
        post.user_id === userId ? { ...post, is_following: true } : post
      ),
    }));

    try {
      await fetch(`${API_URL}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      // Revert on error
      set(state => ({
        posts: state.posts.map(post =>
          post.user_id === userId ? { ...post, is_following: false } : post
        ),
      }));
    }
  },

  unfollowUser: async (userId: string) => {
    const token = await AsyncStorage.getItem('session_token');
    if (!token) return;

    // Optimistic update
    set(state => ({
      posts: state.posts.map(post =>
        post.user_id === userId ? { ...post, is_following: false } : post
      ),
    }));

    try {
      await fetch(`${API_URL}/api/users/${userId}/follow`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      // Revert on error
      set(state => ({
        posts: state.posts.map(post =>
          post.user_id === userId ? { ...post, is_following: true } : post
        ),
      }));
    }
  },

  addPost: (post) => {
    set(state => ({ posts: [post, ...state.posts] }));
  },

  removePost: (postId) => {
    set(state => ({ posts: state.posts.filter(p => p.post_id !== postId) }));
  },
}));
