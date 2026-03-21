import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function ShineScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [title, setTitle] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleStartLive = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your SHINE');
      return;
    }
    
    setIsStarting(true);
    // In production, this would start the actual live stream
    setTimeout(() => {
      Alert.alert(
        'Coming Soon!',
        'SHINE live streaming is launching soon! You\'ll be able to go live, receive virtual gifts, and earn real money.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      setIsStarting(false);
    }, 1500);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.loginPrompt}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={styles.logo}
          />
          <Text style={styles.title}>Go Live with SHINE</Text>
          <Text style={styles.subtitle}>Sign in to start streaming</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Preview Area */}
        <View style={styles.previewArea}>
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="videocam" size={60} color="#D4AF37" />
            <Text style={styles.cameraText}>Camera Preview</Text>
          </View>
          
          {/* SHINE Badge */}
          <View style={styles.shineBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.shineLabel}>SHINE</Text>
          </View>
        </View>

        {/* Stream Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Stream Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="What's your SHINE about?"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Stats Preview */}
          <View style={styles.statsPreview}>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={20} color="#D4AF37" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Viewers</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="gift" size={20} color="#D4AF37" />
              <Text style={styles.statValue}>$0</Text>
              <Text style={styles.statLabel}>Gifts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={20} color="#D4AF37" />
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.featureText}>Live Chat</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="gift" size={24} color="#fff" />
              <Text style={styles.featureText}>Virtual Gifts</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cash" size={24} color="#fff" />
              <Text style={styles.featureText}>Earn Money</Text>
            </View>
          </View>

          {/* Go Live Button */}
          <TouchableOpacity
            style={[styles.goLiveButton, isStarting && styles.goLiveButtonDisabled]}
            onPress={handleStartLive}
            disabled={isStarting}
          >
            {isStarting ? (
              <Text style={styles.goLiveText}>Starting...</Text>
            ) : (
              <>
                <View style={styles.liveDotLarge} />
                <Text style={styles.goLiveText}>Go SHINE</Text>
              </>
            )}
          </TouchableOpacity>
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
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  loginPrompt: {
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#D4AF37',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingTop: 80,
  },
  previewArea: {
    height: '45%',
    backgroundColor: '#1a1a2e',
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
  shineBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4458',
  },
  shineLabel: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  infoSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  statsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    color: '#888',
    fontSize: 12,
  },
  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4458',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 10,
  },
  goLiveButtonDisabled: {
    opacity: 0.7,
  },
  liveDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  goLiveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
