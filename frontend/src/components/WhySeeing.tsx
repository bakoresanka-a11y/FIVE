import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INTENTS, IntentTag } from '../types';

interface WhySeeingProps {
  visible: boolean;
  onClose: () => void;
  reason: string;
  intentTag: IntentTag;
  engagement?: {
    watchTime?: number;
    completionRate?: number;
    likes?: number;
  };
}

export default function WhySeeing({ visible, onClose, reason, intentTag, engagement }: WhySeeingProps) {
  const intent = INTENTS.find(i => i.id === intentTag);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="information-circle" size={24} color="#D4AF37" />
            <Text style={styles.title}>Why am I seeing this?</Text>
          </View>

          <View style={styles.reasonContainer}>
            <Text style={styles.reason}>{reason}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.intentBadge, { backgroundColor: intent?.color || '#666' }]}>
              <Ionicons name={intent?.icon as any || 'help'} size={16} color="#fff" />
              <Text style={styles.intentText}>{intent?.label}</Text>
            </View>
          </View>

          {engagement && (
            <View style={styles.engagementSection}>
              <Text style={styles.sectionTitle}>Content Performance</Text>
              <View style={styles.statsRow}>
                {engagement.watchTime && (
                  <View style={styles.stat}>
                    <Ionicons name="time" size={16} color="#888" />
                    <Text style={styles.statValue}>{engagement.watchTime}s</Text>
                    <Text style={styles.statLabel}>Avg Watch</Text>
                  </View>
                )}
                {engagement.completionRate && (
                  <View style={styles.stat}>
                    <Ionicons name="checkmark-circle" size={16} color="#888" />
                    <Text style={styles.statValue}>{engagement.completionRate}%</Text>
                    <Text style={styles.statLabel}>Complete</Text>
                  </View>
                )}
                {engagement.likes && (
                  <View style={styles.stat}>
                    <Ionicons name="heart" size={16} color="#888" />
                    <Text style={styles.statValue}>{engagement.likes}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="eye-off-outline" size={18} color="#888" />
              <Text style={styles.actionText}>See less like this</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="flag-outline" size={18} color="#888" />
              <Text style={styles.actionText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  reasonContainer: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reason: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  intentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  intentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  engagementSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: '#666',
    fontSize: 11,
  },
  actions: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    color: '#888',
    fontSize: 14,
  },
});
