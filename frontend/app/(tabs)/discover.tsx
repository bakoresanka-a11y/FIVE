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
import { User, Post, Space, Lesson, INTENTS, CATEGORIES } from '../../src/types';

type Tab = 'discover' | 'learn' | 'trending' | 'spaces';

export default function DiscoverScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'users' | 'posts'>('users');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSpaces();
    fetchLessons();
  }, []);

  useEffect(() => {
    if (activeTab === 'learn') {
      fetchLessons(selectedCategory);
    }
  }, [selectedCategory, activeTab]);

  const fetchSpaces = async () => {
    try {
      const data = await api.get('/api/spaces');
      setSpaces(data);
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    }
  };

  const fetchLessons = async (category?: string | null) => {
    setIsLoading(true);
    try {
      const endpoint = category ? `/api/lessons?category=${category}` : '/api/lessons';
      const data = await api.get(endpoint);
      setLessons(data);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
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
        <Text style={styles.resultStats}>{item.followers_count?.toLocaleString()} followers</Text>
      </View>
      <TouchableOpacity style={styles.followBtn}>
        <Text style={styles.followBtnText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderLessonItem = ({ item }: { item: Lesson }) => {
    const category = CATEGORIES.find(c => c.id === item.category);
    return (
      <TouchableOpacity 
        style={styles.lessonCard}
        onPress={() => router.push(`/lesson/${item.lesson_id}`)}
      >
        <View style={[styles.lessonIcon, { backgroundColor: category?.color || '#22D3EE' }]}>
          <Ionicons name={category?.icon as any || 'book'} size={28} color="#fff" />
        </View>
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{item.title}</Text>
          <Text style={styles.lessonDescription} numberOfLines={2}>{item.description}</Text>
          <View style={styles.lessonMeta}>
            <View style={styles.lessonStat}>
              <Ionicons name="eye" size={14} color="#888" />
              <Text style={styles.lessonStatText}>{item.views_count}</Text>
            </View>
            <View style={styles.lessonStat}>
              <Ionicons name="heart" size={14} color="#888" />
              <Text style={styles.lessonStatText}>{item.likes_count}</Text>
            </View>
            {item.author && (
              <Text style={styles.lessonAuthor}>by {item.author.name}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  const renderSpaceItem = ({ item }: { item: Space }) => (
    <TouchableOpacity style={styles.spaceCard}>
      <View style={[styles.spaceCover, styles.spaceCoverPlaceholder]}>
        <Ionicons name="people" size={32} color="#22D3EE" />
      </View>
      <View style={styles.spaceInfo}>
        <Text style={styles.spaceName}>{item.name}</Text>
        <Text style={styles.spaceStats}>{item.members_count} members</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {(['discover', 'learn', 'trending', 'spaces'] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons 
                name={
                  tab === 'discover' ? 'compass' :
                  tab === 'learn' ? 'book' :
                  tab === 'trending' ? 'flame' : 'people'
                } 
                size={18} 
                color={activeTab === tab ? '#22D3EE' : '#888'} 
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {activeTab === 'discover' && (
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

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#22D3EE" />
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.user_id || item.post_id}
              contentContainerStyle={styles.resultsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#1a1a2e" />
              <Text style={styles.emptyText}>Search for users or posts</Text>
            </View>
          )}
        </>
      )}

      {activeTab === 'learn' && (
        <>
          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <View style={styles.categories}>
              <TouchableOpacity
                style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && { backgroundColor: cat.color }
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={16} 
                    color={selectedCategory === cat.id ? '#fff' : cat.color} 
                  />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Lessons List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#22D3EE" />
            </View>
          ) : lessons.length > 0 ? (
            <FlatList
              data={lessons}
              renderItem={renderLessonItem}
              keyExtractor={(item) => item.lesson_id}
              contentContainerStyle={styles.lessonsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#1a1a2e" />
              <Text style={styles.emptyTitle}>No Lessons Yet</Text>
              <Text style={styles.emptyText}>Educational content coming soon!</Text>
            </View>
          )}
        </>
      )}

      {activeTab === 'trending' && (
        <View style={styles.emptyContainer}>
          <Ionicons name="flame-outline" size={64} color="#F43F5E" />
          <Text style={styles.emptyTitle}>Trending Content</Text>
          <Text style={styles.emptyText}>Hot videos and creators will appear here</Text>
        </View>
      )}

      {activeTab === 'spaces' && (
        <>
          {spaces.length > 0 ? (
            <FlatList
              data={spaces}
              renderItem={renderSpaceItem}
              keyExtractor={(item) => item.space_id}
              numColumns={2}
              contentContainerStyle={styles.spacesGrid}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#1a1a2e" />
              <Text style={styles.emptyTitle}>No Spaces Yet</Text>
              <Text style={styles.emptyText}>Communities will appear here</Text>
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
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  tabsScroll: {
    maxHeight: 50,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderWidth: 1,
    borderColor: '#22D3EE',
  },
  tabText: {
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#22D3EE',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    backgroundColor: '#F43F5E',
  },
  toggleText: {
    color: '#888',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
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
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#F43F5E',
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '600',
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
  categoriesScroll: {
    maxHeight: 50,
    marginVertical: 12,
  },
  categories: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#22D3EE',
  },
  categoryText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#fff',
  },
  lessonsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  separator: {
    height: 12,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  lessonIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 14,
  },
  lessonTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  lessonDescription: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  lessonStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonStatText: {
    color: '#888',
    fontSize: 12,
  },
  lessonAuthor: {
    color: '#666',
    fontSize: 12,
  },
  spacesGrid: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  spaceCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  spaceCover: {
    height: 80,
  },
  spaceCoverPlaceholder: {
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceInfo: {
    padding: 12,
  },
  spaceName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  spaceStats: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
});
