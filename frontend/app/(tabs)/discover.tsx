import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/utils/api';
import { User, Post, Space, INTENTS } from '../../src/types';

type Tab = 'search' | 'spaces';

export default function DiscoverScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('spaces');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'users' | 'posts'>('users');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/spaces');
      setSpaces(data);
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const endpoint = searchType === 'users' 
        ? `/api/search/users?q=${encodeURIComponent(searchQuery)}`
        : `/api/search/posts?q=${encodeURIComponent(searchQuery)}`;
      
      const data = await api.get(endpoint);
      setSearchResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSpace = async (spaceId: string) => {
    try {
      await api.post(`/api/spaces/${spaceId}/join`, {});
      fetchSpaces();
    } catch (error) {
      console.error('Failed to join space:', error);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => router.push(`/user/${item.user_id}`)}
    >
      {item.picture ? (
        <Image source={{ uri: item.picture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        {item.username && <Text style={styles.resultUsername}>@{item.username}</Text>}
        <Text style={styles.resultStats}>
          {item.followers_count} followers
        </Text>
      </View>
      <TouchableOpacity style={styles.followBtn}>
        <Text style={styles.followBtnText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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

  const renderSpaceItem = ({ item }: { item: Space }) => (
    <TouchableOpacity style={styles.spaceCard}>
      {item.cover_image ? (
        <Image 
          source={{ uri: item.cover_image.startsWith('data:') ? item.cover_image : `data:image/jpeg;base64,${item.cover_image}` }} 
          style={styles.spaceCover} 
        />
      ) : (
        <View style={[styles.spaceCover, styles.spaceCoverPlaceholder]}>
          <Ionicons name="people" size={40} color="#D4AF37" />
        </View>
      )}
      <View style={styles.spaceInfo}>
        <Text style={styles.spaceName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.spaceDescription} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.spaceStats}>
          <View style={styles.spaceStat}>
            <Ionicons name="people-outline" size={14} color="#888" />
            <Text style={styles.spaceStatText}>{item.members_count}</Text>
          </View>
          <View style={styles.spaceStat}>
            <Ionicons name="document-text-outline" size={14} color="#888" />
            <Text style={styles.spaceStatText}>{item.posts_count} posts</Text>
          </View>
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.spaceTags}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.spaceTag}>
                <Text style={styles.spaceTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity 
        style={[styles.joinButton, item.is_member && styles.joinedButton]}
        onPress={() => !item.is_member && handleJoinSpace(item.space_id)}
      >
        <Text style={[styles.joinButtonText, item.is_member && styles.joinedButtonText]}>
          {item.is_member ? 'Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'spaces' && styles.tabActive]}
          onPress={() => setActiveTab('spaces')}
        >
          <Ionicons 
            name="people" 
            size={18} 
            color={activeTab === 'spaces' ? '#D4AF37' : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'spaces' && styles.tabTextActive]}>
            Spaces
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Ionicons 
            name="search" 
            size={18} 
            color={activeTab === 'search' ? '#D4AF37' : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'search' ? (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users or posts..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, searchType === 'users' && styles.toggleActive]}
              onPress={() => setSearchType('users')}
            >
              <Text style={[styles.toggleText, searchType === 'users' && styles.toggleTextActive]}>
                Users
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, searchType === 'posts' && styles.toggleActive]}
              onPress={() => setSearchType('posts')}
            >
              <Text style={[styles.toggleText, searchType === 'posts' && styles.toggleTextActive]}>
                Posts
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#D4AF37" />
            </View>
          ) : searchResults.length > 0 ? (
            searchType === 'users' ? (
              <FlatList
                data={searchResults}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={styles.resultsList}
              />
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderPostItem}
                keyExtractor={(item) => item.post_id}
                numColumns={3}
                contentContainerStyle={styles.postsGrid}
              />
            )
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>Search for users or posts</Text>
            </View>
          )}
        </>
      ) : (
        /* Spaces Tab */
        <>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#D4AF37" />
            </View>
          ) : spaces.length > 0 ? (
            <FlatList
              data={spaces}
              renderItem={renderSpaceItem}
              keyExtractor={(item) => item.space_id}
              contentContainerStyle={styles.spacesList}
              ItemSeparatorComponent={() => <View style={styles.spaceSeparator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#333" />
              <Text style={styles.emptyTitle}>No Spaces Yet</Text>
              <Text style={styles.emptyText}>Be the first to create a community!</Text>
              <TouchableOpacity style={styles.createSpaceButton}>
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.createSpaceButtonText}>Create Space</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    gap: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#D4AF37',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
  },
  toggleActive: {
    backgroundColor: '#D4AF37',
  },
  toggleText: {
    color: '#888',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    paddingHorizontal: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    marginLeft: 14,
    flex: 1,
  },
  resultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultUsername: {
    color: '#888',
    fontSize: 14,
  },
  resultStats: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#D4AF37',
  },
  followBtnText: {
    color: '#000',
    fontWeight: '600',
  },
  postsGrid: {
    paddingHorizontal: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  createSpaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  createSpaceButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  spacesList: {
    paddingHorizontal: 16,
  },
  spaceSeparator: {
    height: 16,
  },
  spaceCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  spaceCover: {
    width: '100%',
    height: 120,
  },
  spaceCoverPlaceholder: {
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceInfo: {
    padding: 16,
  },
  spaceName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  spaceDescription: {
    color: '#888',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  spaceStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  spaceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spaceStatText: {
    color: '#888',
    fontSize: 13,
  },
  spaceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  spaceTag: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spaceTagText: {
    color: '#D4AF37',
    fontSize: 12,
  },
  joinButton: {
    position: 'absolute',
    top: 130,
    right: 16,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  joinButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  joinedButtonText: {
    color: '#D4AF37',
  },
});
