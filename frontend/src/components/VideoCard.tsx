import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Post, INTENTS, RECOMMENDATION_REASONS } from '../types';
import { useAuthStore } from '../store/authStore';
import { useFeedStore } from '../store/feedStore';
import { useRouter } from 'expo-router';
import TipModal from './TipModal';
import ProductModal from './ProductModal';
import WhySeeing from './WhySeeing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_HEIGHT - 60;

interface VideoCardProps {
  post: Post;
  isActive: boolean;
}

export default function VideoCard({ post, isActive }: VideoCardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { likePost, unlikePost, followUser, unfollowUser } = useFeedStore();
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showWhySeeing, setShowWhySeeing] = useState(false);

  const intent = INTENTS.find(i => i.id === post.intent_tag);
  const recommendationReason = post.recommendation_reason || 
    RECOMMENDATION_REASONS[Math.floor(Math.random() * RECOMMENDATION_REASONS.length)].replace('{intent}', intent?.label || 'content');

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

  const handleTip = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (post.user_id === user?.user_id) return;
    setShowTipModal(true);
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

      {/* Intent Tag - Clickable for "Why seeing this" */}
      <TouchableOpacity 
        style={[styles.intentTag, { backgroundColor: intent?.color || '#666' }]}
        onPress={() => setShowWhySeeing(true)}
      >
        <Ionicons name={intent?.icon as any || 'help'} size={14} color="#fff" />
        <Text style={styles.intentText}>{intent?.label || post.intent_tag}</Text>
        <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

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
          {!post.is_following && isAuthenticated && post.user_id !== user?.user_id && (
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
          <Ionicons name="chatbubble-ellipses-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>{post.comments_count}</Text>
        </TouchableOpacity>

        {/* Tip */}
        {post.user_id !== user?.user_id && (
          <TouchableOpacity style={styles.actionButton} onPress={handleTip}>
            <Ionicons name="gift-outline" size={30} color="#D4AF37" />
            <Text style={[styles.actionText, { color: '#D4AF37' }]}>Tip</Text>
          </TouchableOpacity>
        )}

        {/* Products */}
        {post.product_links && post.product_links.length > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowProductModal(true)}
          >
            <Ionicons name="bag-outline" size={30} color="#fff" />
            <Text style={styles.actionText}>{post.product_links.length}</Text>
          </TouchableOpacity>
        )}

        {/* Share */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-redo-outline" size={28} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity onPress={handleUserPress}>
          <Text style={styles.username}>@{post.user?.username || post.user?.name || 'user'}</Text>
        </TouchableOpacity>
        {post.caption && <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>}
        
        {/* Product tag preview */}
        {post.product_links && post.product_links.length > 0 && (
          <TouchableOpacity 
            style={styles.productPreview}
            onPress={() => setShowProductModal(true)}
          >
            <Ionicons name="bag" size={14} color="#D4AF37" />
            <Text style={styles.productPreviewText}>
              {post.product_links.length} product{post.product_links.length > 1 ? 's' : ''} tagged
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tip Modal */}
      {post.user && (
        <TipModal
          visible={showTipModal}
          onClose={() => setShowTipModal(false)}
          creator={{
            user_id: post.user_id,
            name: post.user.name,
            picture: post.user.picture,
          }}
        />
      )}

      {/* Product Modal */}
      <ProductModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        products={post.product_links}
      />

      {/* Why Seeing Modal */}
      <WhySeeing
        visible={showWhySeeing}
        onClose={() => setShowWhySeeing(false)}
        reason={recommendationReason}
        intentTag={post.intent_tag}
        engagement={{
          watchTime: Math.floor(Math.random() * 30) + 10,
          completionRate: Math.floor(Math.random() * 40) + 60,
          likes: post.likes_count,
        }}
      />
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
    top: 60,
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
    bottom: 120,
    alignItems: 'center',
    gap: 18,
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
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  productPreviewText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
});
