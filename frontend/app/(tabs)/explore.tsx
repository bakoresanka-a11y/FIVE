import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/utils/api';
import { User, Post, INTENTS } from '../../src/types';

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'users' | 'posts'>('users');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const endpoint = searchType === 'users' 
        ? `/api/search/users?q=${encodeURIComponent(searchQuery)}`
        : `/api/search/posts?q=${encodeURIComponent(searchQuery)}`;
      
      const data = await api.get(endpoint);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
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
          {item.followers_count} followers • {item.posts_count} posts
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }: { item: Post }) => {
    const intent = INTENTS.find(i => i.id === item.intent_tag);
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => router.push(`/post/${item.post_id}`)}
      >
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#888"
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

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#D4AF37" />
        </View>
      ) : results.length > 0 ? (
        searchType === 'users' ? (
          <FlatList
            data={results}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={styles.resultsList}
          />
        ) : (
          <FlatList
            data={results}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.post_id}
            numColumns={3}
            contentContainerStyle={styles.postsGrid}
          />
        )
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="compass-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>Search for users or posts</Text>
        </View>
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
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    marginLeft: 16,
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
    marginTop: 4,
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
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
});
