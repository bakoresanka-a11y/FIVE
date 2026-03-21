import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INTENTS, IntentTag } from '../types';

interface SmartPromptProps {
  visible: boolean;
  type: 'continue' | 'intent';
  currentIntent: IntentTag | 'all';
  onContinue: () => void;
  onSwitchIntent: (intent: IntentTag | 'all') => void;
  onClose: () => void;
}

export default function SmartPrompt({
  visible,
  type,
  currentIntent,
  onContinue,
  onSwitchIntent,
  onClose,
}: SmartPromptProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {type === 'continue' ? (
            <>
              <Text style={styles.title}>Still watching?</Text>
              <Text style={styles.subtitle}>
                You've been scrolling for a while. Want to continue or switch things up?
              </Text>
              
              <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
                <Ionicons name="play" size={20} color="#000" />
                <Text style={styles.primaryButtonText}>Continue Watching</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onSwitchIntent(currentIntent)}>
                <Ionicons name="shuffle" size={20} color="#D4AF37" />
                <Text style={styles.secondaryButtonText}>Switch Intent</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.textButton} onPress={onClose}>
                <Text style={styles.textButtonText}>Take a break</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>What's your mood?</Text>
              <Text style={styles.subtitle}>Choose your intent for a personalized feed</Text>
              
              <View style={styles.intentGrid}>
                {INTENTS.map((intent) => (
                  <TouchableOpacity
                    key={intent.id}
                    style={[
                      styles.intentButton,
                      { borderColor: intent.color },
                      currentIntent === intent.id && { backgroundColor: intent.color },
                    ]}
                    onPress={() => onSwitchIntent(intent.id)}
                  >
                    <Ionicons
                      name={intent.icon as any}
                      size={24}
                      color={currentIntent === intent.id ? '#fff' : intent.color}
                    />
                    <Text
                      style={[
                        styles.intentButtonText,
                        currentIntent === intent.id && { color: '#fff' },
                      ]}
                    >
                      {intent.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.allButton}
                onPress={() => onSwitchIntent('all')}
              >
                <Text style={styles.allButtonText}>Show All Content</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    paddingVertical: 12,
  },
  textButtonText: {
    color: '#666',
    fontSize: 14,
  },
  intentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  intentButton: {
    width: '45%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  intentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  allButton: {
    paddingVertical: 12,
  },
  allButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
});
