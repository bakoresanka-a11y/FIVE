import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Post, INTENTS } from '../types';
import { useAuthStore } from '../store/authStore';
import { useFeedStore } from '../store/feedStore';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT - 150;

interface VideoCardProps {
  post: Post;
  isActive: boolean;
}

export default function VideoCard({ post, isActive }: VideoCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { likePost, unlikePost, followUser, unfollowUser } = useFeedStore();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  const intent = INTENTS.find(i => i.id === post.intent_tag);

  useEffect(() => {
    if (isActive && post.media_type === 'video') {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isActive]);

  const handlePlayPause = async () => {
    if (post.media_type !== 'video') return;
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (post.is_liked) {
      unlikePost(post.post_id);
    } else {
      likePost(post.post_id);
    }
  };

  const handleFollow = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (post.is_following) {
      unfollowUser(post.user_id);
    } else {
      followUser(post.user_id);
    }
  };

  const handleComment = () => {
    router.push(`/comments/${post.post_id}`);
  };

  const handleUserPress = () => {
    router.push(`/user/${post.user_id}`);
  };

  const handleProductLink = (url: string) => {
    Linking.openURL(url);
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const mediaUri = post.media_data.startsWith('data:')
    ? post.media_data
    : `data:${post.media_type === 'video' ? 'video/mp4' : 'image/jpeg'};base64,${post.media_data}`;

  return (
    <View style={styles.container}>
      {/* Media Content */}
      <TouchableOpacity
        style={styles.mediaContainer}
        onPress={handlePlayPause}
        activeOpacity={0.9}
      >
        {post.media_type === 'video' ? (
          <Video
            ref={videoRef}
            source={{ uri: mediaUri }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            isLooping
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          />
        ) : (
          <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="cover" />
        )}

        {/* Play/Pause Indicator */}
        {post.media_type === 'video' && !isPlaying && (
          <View style={styles.playIndicator}>
            <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Intent Tag */}
      <View style={[styles.intentTag, { backgroundColor: intent?.color || '#666' }]}>
        <Ionicons name={intent?.icon as any || 'help'} size={14} color="#fff" />
        <Text style={styles.intentText}>{intent?.label || post.intent_tag}</Text>
      </View>

      {/* Right Actions */}
      <View style={styles.actions}>
        {/* User Avatar */}
        <TouchableOpacity onPress={handleUserPress} style={styles.avatarContainer}>
          {post.user?.picture ? (
            <Image source={{ uri: post.user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
          {!post.is_following && isAuthenticated && (
            <TouchableOpacity style={styles.followBadge} onPress={handleFollow}>
              <Ionicons name="add" size={12} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Like */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={post.is_liked ? 'heart' : 'heart-outline'}
            size={32}
            color={post.is_liked ? '#FF4458' : '#fff'}
          />
          <Text style={styles.actionText}>{post.likes_count}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>{post.comments_count}</Text>
        </TouchableOpacity>

        {/* Products */}
        {post.product_links && post.product_links.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowProducts(!showProducts)}
          >
            <Ionicons name="bag-outline" size={30} color="#fff" />
            <Text style={styles.actionText}>{post.product_links.length}</Text>
          </TouchableOpacity>
        )}

        {/* Share */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity onPress={handleUserPress}>
          <Text style={styles.username}>@{post.user?.username || post.user?.name || 'user'}</Text>
        </TouchableOpacity>
        {post.caption && <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>}
      </View>

      {/* Products Panel */}
      {showProducts && post.product_links && post.product_links.length > 0 && (
        <View style={styles.productsPanel}>
          <Text style={styles.productsPanelTitle}>Products in this video</Text>
          {post.product_links.map((product, index) => (
            <TouchableOpacity
              key={index}
              style={styles.productItem}
              onPress={() => handleProductLink(product.url)}
            >
              <View style={styles.productIcon}>
                <Ionicons name="bag" size={20} color="#D4AF37" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPlatform}>{product.platform}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  playIndicator: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intentTag: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  intentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBadge: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4458',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 80,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  productsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: VIDEO_HEIGHT * 0.4,
  },
  productsPanelTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  productPlatform: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
});
