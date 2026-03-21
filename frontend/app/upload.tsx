import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../src/store/authStore';
import { useFeedStore } from '../src/store/feedStore';
import { api } from '../src/utils/api';
import { INTENTS, IntentTag } from '../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function UploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addPost } = useFeedStore();
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video'; base64: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [intentTag, setIntentTag] = useState<IntentTag>('learn');
  const [productLinks, setProductLinks] = useState<{ name: string; url: string; platform: string }[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUrl, setNewProductUrl] = useState('');
  const [newProductPlatform, setNewProductPlatform] = useState('amazon');
  const [showProductForm, setShowProductForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        base64: asset.base64 || '',
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMedia({
        uri: asset.uri,
        type: 'image',
        base64: asset.base64 || '',
      });
    }
  };

  const addProductLink = () => {
    if (newProductName && newProductUrl) {
      setProductLinks([...productLinks, {
        name: newProductName,
        url: newProductUrl,
        platform: newProductPlatform,
      }]);
      setNewProductName('');
      setNewProductUrl('');
      setShowProductForm(false);
    }
  };

  const removeProductLink = (index: number) => {
    setProductLinks(productLinks.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!media) {
      Alert.alert('Error', 'Please select a photo or video');
      return;
    }

    setIsUploading(true);
    try {
      const postData = {
        media_data: media.base64,
        media_type: media.type,
        caption: caption.trim() || null,
        intent_tag: intentTag,
        product_links: productLinks.length > 0 ? productLinks : null,
      };

      const newPost = await api.post('/api/posts', postData);
      addPost({ ...newPost, user: { user_id: user?.user_id, name: user?.name, picture: user?.picture } });
      Alert.alert('Success', 'Your post has been uploaded!');
      router.back();
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const platforms = ['amazon', 'aliexpress', 'shopify', 'taobao', 'ebay', 'other'];
  const selectedIntent = INTENTS.find(i => i.id === intentTag);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={[styles.postButton, (!media || isUploading) && styles.postButtonDisabled]}
            onPress={handleUpload}
            disabled={!media || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Left side - Media and Caption */}
          <ScrollView style={styles.leftSection} showsVerticalScrollIndicator={false}>
            {/* Media Preview */}
            <View style={styles.mediaSection}>
              {media ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: media.uri }} style={styles.preview} />
                  <TouchableOpacity style={styles.removeMedia} onPress={() => setMedia(null)}>
                    <Ionicons name="close-circle" size={32} color="#FF4458" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mediaButtons}>
                  <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
                    <Ionicons name="images" size={36} color="#D4AF37" />
                    <Text style={styles.mediaButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={36} color="#D4AF37" />
                    <Text style={styles.mediaButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Caption */}
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="#666"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />

            {/* Product Links */}
            <View style={styles.productsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Product Links</Text>
                <TouchableOpacity onPress={() => setShowProductForm(!showProductForm)}>
                  <Ionicons name={showProductForm ? 'remove-circle' : 'add-circle'} size={24} color="#D4AF37" />
                </TouchableOpacity>
              </View>

              {productLinks.map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPlatform}>{product.platform}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeProductLink(index)}>
                    <Ionicons name="trash" size={20} color="#FF4458" />
                  </TouchableOpacity>
                </View>
              ))}

              {showProductForm && (
                <View style={styles.productForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Product name"
                    placeholderTextColor="#666"
                    value={newProductName}
                    onChangeText={setNewProductName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Product URL"
                    placeholderTextColor="#666"
                    value={newProductUrl}
                    onChangeText={setNewProductUrl}
                    autoCapitalize="none"
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.platformSelector}>
                      {platforms.map((platform) => (
                        <TouchableOpacity
                          key={platform}
                          style={[
                            styles.platformChip,
                            newProductPlatform === platform && styles.platformChipActive,
                          ]}
                          onPress={() => setNewProductPlatform(platform)}
                        >
                          <Text
                            style={[
                              styles.platformChipText,
                              newProductPlatform === platform && styles.platformChipTextActive,
                            ]}
                          >
                            {platform}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <TouchableOpacity style={styles.addProductButton} onPress={addProductLink}>
                    <Text style={styles.addProductButtonText}>Add Product</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Right side - Intent Tags (vertical scroll) */}
          <View style={styles.rightSection}>
            <Text style={styles.intentTitle}>Type</Text>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.intentList}
            >
              {INTENTS.map((intent) => (
                <TouchableOpacity
                  key={intent.id}
                  style={[
                    styles.intentChip,
                    intentTag === intent.id && { backgroundColor: intent.color, borderColor: intent.color },
                  ]}
                  onPress={() => setIntentTag(intent.id)}
                >
                  <Ionicons
                    name={intent.icon as any}
                    size={20}
                    color={intentTag === intent.id ? '#fff' : intent.color}
                  />
                  <Text
                    style={[
                      styles.intentChipText,
                      intentTag === intent.id && styles.intentChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {intent.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  leftSection: {
    flex: 1,
    paddingRight: 8,
  },
  rightSection: {
    width: 90,
    backgroundColor: '#0a0a0a',
    borderLeftWidth: 1,
    borderLeftColor: '#1a1a2e',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  intentTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  intentList: {
    gap: 8,
  },
  intentChip: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a2e',
    gap: 4,
  },
  intentChipText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  intentChipTextActive: {
    color: '#fff',
  },
  mediaSection: {
    padding: 16,
  },
  previewContainer: {
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
  },
  removeMedia: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 50,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  mediaButton: {
    alignItems: 'center',
    gap: 8,
  },
  mediaButtonText: {
    color: '#fff',
    fontSize: 13,
  },
  captionInput: {
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
  },
  productsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#fff',
    fontWeight: '600',
  },
  productPlatform: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  productForm: {
    marginTop: 12,
    gap: 10,
  },
  input: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  platformSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  platformChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
  },
  platformChipActive: {
    backgroundColor: '#D4AF37',
  },
  platformChipText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  platformChipTextActive: {
    color: '#000',
  },
  addProductButton: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  addProductButtonText: {
    color: '#D4AF37',
    fontWeight: '600',
  },
});
