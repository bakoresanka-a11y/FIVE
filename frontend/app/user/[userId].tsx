import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/utils/api';
import { User, Post, INTENTS } from '../../src/types';

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = currentUser?.user_id === userId;

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const [userData, userPosts] = await Promise.all([
        api.get(`/api/users/${userId}`),
        api.get(`/api/users/${userId}/posts`),
      ]);
      setUser(userData);
      setIsFollowing(userData.is_following || false);
      setPosts(userPosts);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      if (isFollowing) {
        await api.delete(`/api/users/${userId}/follow`);
        setIsFollowing(false);
        if (user) {
          setUser({ ...user, followers_count: user.followers_count - 1 });
        }
      } else {
        await api.post(`/api/users/${userId}/follow`, {});
        setIsFollowing(true);
        if (user) {
          setUser({ ...user, followers_count: user.followers_count + 1 });
        }
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => {
    const intent = INTENTS.find(i => i.id === item.intent_tag);
    return (
      <TouchableOpacity style={styles.postItem}>
        <Image
          source={{ uri: item.media_data.startsWith('data:') ? item.media_data : `data:image/jpeg;base64,${item.media_data}` }}
          style={styles.postThumbnail}
        />
        <View style={styles.postOverlay}>
          <View style={[styles.intentBadge, { backgroundColor: intent?.color || '#666' }]}>
            <Ionicons name={intent?.icon as any || 'help'} size={12} color="#fff" />
          </View>
          <View style={styles.postStats}>
            <Ionicons name="heart" size={12} color="#fff" />
            <Text style={styles.postStatText}>{item.likes_count}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#333" />
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{user.username || user.name}</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          {user.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          )}
          <Text style={styles.name}>{user.name}</Text>
          {user.username && <Text style={styles.username}>@{user.username}</Text>}
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user.posts_count || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Follow Button */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Grid */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {posts.length > 0 ? (
            <FlatList
              data={posts}
              renderItem={renderPostItem}
              keyExtractor={(item) => item.post_id}
              numColumns={3}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyPosts}>
              <Ionicons name="images-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  username: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 48,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  followButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  followButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  followingButtonText: {
    color: '#D4AF37',
  },
  postsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  postItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 1,
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intentBadge: {
    padding: 4,
    borderRadius: 4,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  postStatText: {
    color: '#fff',
    fontSize: 10,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
});
