import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  ViewToken,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeedStore } from '../../src/store/feedStore';
import { useAuthStore } from '../../src/store/authStore';
import VideoCard from '../../src/components/VideoCard';
import IntentSelector from '../../src/components/IntentSelector';
import { Post } from '../../src/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT - 150;

export default function HomeScreen() {
  const { posts, isLoading, currentIntent, setCurrentIntent, fetchPosts, hasMore } = useFeedStore();
  const { isAuthenticated } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts(true);
  }, []);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Intent Selector */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image
            source={require('../../assets/images/logo.jpg')}
            style={styles.headerLogo}
          />
          <Text style={styles.headerTitle}>Five</Text>
        </View>
        <IntentSelector
          selectedIntent={currentIntent}
          onSelect={setCurrentIntent}
        />
      </View>

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
              tintColor="#D4AF37"
            />
          }
          ListFooterComponent={
            isLoading && posts.length > 0 ? (
              <View style={styles.footer}>
                <ActivityIndicator color="#D4AF37" />
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
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : (
        <ListEmptyComponent />
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
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#D4AF37',
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
    color: '#D4AF37',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#fff',
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
