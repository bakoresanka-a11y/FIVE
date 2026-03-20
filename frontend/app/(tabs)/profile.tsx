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
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/utils/api';
import { Post, INTENTS } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserPosts();
    }
  }, [isAuthenticated, user]);

  const fetchUserPosts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/api/users/${user.user_id}/posts`);
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserPosts();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loginPrompt}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.logo}
          />
          <Text style={styles.loginTitle}>Join Five</Text>
          <Text style={styles.loginSubtitle}>
            Create an account to share content and earn money
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          )}
          <Text style={styles.name}>{user?.name}</Text>
          {user?.username && <Text style={styles.username}>@{user.username}</Text>}
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user?.posts_count || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user?.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user?.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>My Posts</Text>
          {isLoading ? (
            <ActivityIndicator color="#D4AF37" style={styles.loader} />
          ) : posts.length > 0 ? (
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
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/upload')}
              >
                <Text style={styles.createButtonText}>Create your first post</Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  loginSubtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
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
  editButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  editButtonText: {
    color: '#D4AF37',
    fontWeight: '600',
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
  loader: {
    marginTop: 24,
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
  createButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#000',
    fontWeight: '600',
  },
});
