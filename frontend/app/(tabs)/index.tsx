import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFeedStore } from '../../src/store/feedStore';
import { useAuthStore } from '../../src/store/authStore';
import VideoCard from '../../src/components/VideoCard';
import SmartPrompt from '../../src/components/SmartPrompt';
import { Post, IntentTag } from '../../src/types';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT - 60;
const PROMPT_INTERVAL = 12; // Show prompt every 12 videos

type FeedTab = 'following' | 'foryou';

export default function HomeScreen() {
  const router = useRouter();
  const { posts, isLoading, currentIntent, setCurrentIntent, fetchPosts, hasMore } = useFeedStore();
  const { isAuthenticated } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<'continue' | 'intent'>('continue');
  const [videosWatched, setVideosWatched] = useState(0);

  useEffect(() => {
    fetchPosts(true);
  }, []);

  // Track videos watched and show prompts
  useEffect(() => {
    if (activeIndex > 0 && activeIndex !== videosWatched) {
      setVideosWatched(activeIndex);
      
      // Show prompt every PROMPT_INTERVAL videos
      if (activeIndex > 0 && activeIndex % PROMPT_INTERVAL === 0) {
        setPromptType(Math.random() > 0.5 ? 'continue' : 'intent');
        setShowPrompt(true);
      }
    }
  }, [activeIndex]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(true);
    setRefreshing(false);
  }, []);

  const onEndReached = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPosts();
    }
  }, [isLoading, hasMore]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <VideoCard post={item} isActive={index === activeIndex} />
    ),
    [activeIndex]
  );

  const keyExtractor = useCallback((item: Post) => item.post_id, []);

  const handlePromptContinue = () => {
    setShowPrompt(false);
  };

  const handlePromptSwitchIntent = (intent: IntentTag | 'all') => {
    setShowPrompt(false);
    if (intent !== currentIntent) {
      setCurrentIntent(intent);
    }
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../../assets/images/logo.jpg')}
        style={styles.logo}
      />
      <Text style={styles.emptyTitle}>Welcome to Five</Text>
      <Text style={styles.emptySubtitle}>Watch. Learn. Earn.</Text>
      <Text style={styles.emptyText}>
        {posts.length === 0 && !isLoading
          ? 'No content yet. Be the first to share!'
          : 'Loading your personalized feed...'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* TikTok-style Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.liveButton}>
            <Ionicons name="radio" size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('following')}
              style={styles.tabButton}
            >
              <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
                Following
              </Text>
              {activeTab === 'following' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveTab('foryou')}
              style={styles.tabButton}
            >
              <Text style={[styles.tabText, activeTab === 'foryou' && styles.tabTextActive]}>
                For You
              </Text>
              {activeTab === 'foryou' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => router.push('/(tabs)/discover')}
          >
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Video Feed */}
      {posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={VIDEO_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          ListFooterComponent={
            isLoading && posts.length > 0 ? (
              <View style={styles.footer}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null
          }
          getItemLayout={(data, index) => ({
            length: VIDEO_HEIGHT,
            offset: VIDEO_HEIGHT * index,
            index,
          })}
        />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : (
        <ListEmptyComponent />
      )}

      {/* Smart Prompt */}
      <SmartPrompt
        visible={showPrompt}
        type={promptType}
        currentIntent={currentIntent}
        onContinue={handlePromptContinue}
        onSwitchIntent={handlePromptSwitchIntent}
        onClose={() => setShowPrompt(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  liveButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 17,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabIndicator: {
    width: 30,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginTop: 4,
  },
  searchButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#D4AF37',
    marginBottom: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
