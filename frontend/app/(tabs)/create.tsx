import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function CreateScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleCreate = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    router.push('/upload');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/logo.jpg')}
          style={styles.logo}
        />
        <Text style={styles.title}>Create Content</Text>
        <Text style={styles.subtitle}>Share your knowledge and earn money</Text>

        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Ionicons name="add-circle" size={24} color="#000" />
          <Text style={styles.createButtonText}>Upload Video or Photo</Text>
        </TouchableOpacity>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for great content:</Text>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.tipText}>Tag your content with the right intent</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.tipText}>Add product links to earn commissions</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.tipText}>Write engaging captions</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.tipText}>Keep videos short and valuable</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  tipsContainer: {
    marginTop: 48,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    color: '#ccc',
    fontSize: 14,
  },
});
