import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../src/utils/api';
import { Lesson, CATEGORIES } from '../src/types';

export default function LessonDetailScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const data = await api.get(`/api/lessons/${lessonId}`);
      setLesson(data);
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22D3EE" />
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F43F5E" />
          <Text style={styles.errorText}>Lesson not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = CATEGORIES.find(c => c.id === lesson.category);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={[styles.categoryBadge, { backgroundColor: category?.color || '#22D3EE' }]}>
            <Ionicons name={category?.icon as any || 'book'} size={16} color="#fff" />
            <Text style={styles.categoryText}>{category?.label || 'General'}</Text>
          </View>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.description}>{lesson.description}</Text>
          
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="eye" size={18} color="#22D3EE" />
              <Text style={styles.statText}>{lesson.views_count} views</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="heart" size={18} color="#F43F5E" />
              <Text style={styles.statText}>{lesson.likes_count} likes</Text>
            </View>
            {lesson.author && (
              <View style={styles.stat}>
                <Ionicons name="person" size={18} color="#8B5CF6" />
                <Text style={styles.statText}>{lesson.author.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.lessonContent}>
          <View style={styles.contentHeader}>
            <Ionicons name="document-text" size={20} color="#22D3EE" />
            <Text style={styles.contentTitle}>Lesson Content</Text>
          </View>
          
          {/* Render markdown-like content */}
          {lesson.content.split('\n').map((line, index) => {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('# ')) {
              return (
                <Text key={index} style={styles.h1}>
                  {trimmed.substring(2)}
                </Text>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <Text key={index} style={styles.h2}>
                  {trimmed.substring(3)}
                </Text>
              );
            }
            if (trimmed.startsWith('### ')) {
              return (
                <Text key={index} style={styles.h3}>
                  {trimmed.substring(4)}
                </Text>
              );
            }
            if (trimmed.startsWith('- ')) {
              return (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listText}>{trimmed.substring(2)}</Text>
                </View>
              );
            }
            if (/^\d+\./.test(trimmed)) {
              const match = trimmed.match(/^(\d+)\.\s*(.*)/);
              if (match) {
                return (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.number}>{match[1]}.</Text>
                    <Text style={styles.listText}>{match[2]}</Text>
                  </View>
                );
              }
            }
            if (trimmed.startsWith('```')) {
              return null; // Skip code block markers
            }
            if (trimmed.length > 0) {
              return (
                <Text key={index} style={styles.paragraph}>
                  {trimmed}
                </Text>
              );
            }
            return <View key={index} style={styles.spacer} />;
          })}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.likeButton}>
          <Ionicons name="heart-outline" size={24} color="#F43F5E" />
          <Text style={styles.likeButtonText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#fff" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
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
  content: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#888',
    fontSize: 14,
  },
  lessonContent: {
    padding: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  h1: {
    fontSize: 24,
    fontWeight: '800',
    color: '#22D3EE',
    marginTop: 24,
    marginBottom: 16,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F43F5E',
    marginTop: 20,
    marginBottom: 12,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    color: '#22D3EE',
    fontSize: 16,
    marginRight: 10,
    width: 16,
  },
  number: {
    color: '#F43F5E',
    fontSize: 15,
    marginRight: 10,
    width: 24,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
  },
  spacer: {
    height: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    gap: 12,
  },
  likeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  likeButtonText: {
    color: '#F43F5E',
    fontWeight: '600',
    fontSize: 16,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
