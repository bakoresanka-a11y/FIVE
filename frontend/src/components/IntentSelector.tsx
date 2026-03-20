import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INTENTS, IntentTag } from '../types';

interface IntentSelectorProps {
  selectedIntent: IntentTag | 'all';
  onSelect: (intent: IntentTag | 'all') => void;
}

export default function IntentSelector({ selectedIntent, onSelect }: IntentSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[
          styles.chip,
          selectedIntent === 'all' && styles.chipSelected,
        ]}
        onPress={() => onSelect('all')}
      >
        <Ionicons
          name="apps"
          size={16}
          color={selectedIntent === 'all' ? '#fff' : '#888'}
        />
        <Text
          style={[
            styles.chipText,
            selectedIntent === 'all' && styles.chipTextSelected,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {INTENTS.map((intent) => (
        <TouchableOpacity
          key={intent.id}
          style={[
            styles.chip,
            selectedIntent === intent.id && { backgroundColor: intent.color },
          ]}
          onPress={() => onSelect(intent.id)}
        >
          <Ionicons
            name={intent.icon as any}
            size={16}
            color={selectedIntent === intent.id ? '#fff' : intent.color}
          />
          <Text
            style={[
              styles.chipText,
              selectedIntent === intent.id && styles.chipTextSelected,
            ]}
          >
            {intent.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    gap: 6,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#D4AF37',
  },
  chipText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
