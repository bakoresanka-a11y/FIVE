import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { Product, ProductLink } from '../types';

interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  products?: ProductLink[];
  internalProducts?: Product[];
}

export default function ProductModal({ visible, onClose, products, internalProducts }: ProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleExternalLink = (url: string) => {
    Linking.openURL(url);
  };

  const handlePurchase = async (product: Product) => {
    setIsLoading(true);
    try {
      const result = await api.post(`/api/products/${product.product_id}/purchase`, {
        product_id: product.product_id,
        quantity: 1,
      });
      Alert.alert('Success', `Purchase complete! Order: ${result.order_id}`);
      setSelectedProduct(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Purchase failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'amazon': return 'logo-amazon';
      case 'shopify': return 'storefront';
      case 'aliexpress': return 'cart';
      default: return 'bag';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Products in this video</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.productsList}>
            {/* External product links */}
            {products && products.map((product, index) => (
              <TouchableOpacity
                key={`ext-${index}`}
                style={styles.productItem}
                onPress={() => handleExternalLink(product.url)}
              >
                <View style={styles.productIcon}>
                  <Ionicons name={getPlatformIcon(product.platform) as any} size={24} color="#D4AF37" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPlatform}>{product.platform}</Text>
                </View>
                <Ionicons name="open-outline" size={20} color="#888" />
              </TouchableOpacity>
            ))}

            {/* Internal products with in-app purchase */}
            {internalProducts && internalProducts.map((product) => (
              <TouchableOpacity
                key={product.product_id}
                style={styles.productItem}
                onPress={() => setSelectedProduct(product)}
              >
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productIcon}>
                    <Ionicons name="bag" size={24} color="#D4AF37" />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => handlePurchase(product)}
                >
                  <Text style={styles.buyButtonText}>Buy</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {(!products || products.length === 0) && (!internalProducts || internalProducts.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="bag-outline" size={48} color="#333" />
                <Text style={styles.emptyText}>No products tagged</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Product detail modal */}
      {selectedProduct && (
        <Modal visible={!!selectedProduct} transparent animationType="fade">
          <View style={styles.detailOverlay}>
            <View style={styles.detailContainer}>
              <TouchableOpacity
                style={styles.detailClose}
                onPress={() => setSelectedProduct(null)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>

              {selectedProduct.image && (
                <Image source={{ uri: selectedProduct.image }} style={styles.detailImage} />
              )}
              
              <Text style={styles.detailName}>{selectedProduct.name}</Text>
              {selectedProduct.description && (
                <Text style={styles.detailDescription}>{selectedProduct.description}</Text>
              )}
              <Text style={styles.detailPrice}>${selectedProduct.price.toFixed(2)}</Text>

              <TouchableOpacity
                style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
                onPress={() => handlePurchase(selectedProduct)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="card" size={20} color="#000" />
                    <Text style={styles.purchaseButtonText}>Buy Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.secureText}>
                <Ionicons name="lock-closed" size={12} color="#666" /> Secure checkout
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  productsList: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productPlatform: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  productPrice: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  buyButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#000',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 24,
  },
  detailContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  detailClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  detailImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  detailDescription: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  detailPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#D4AF37',
    marginTop: 16,
    marginBottom: 24,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  secureText: {
    color: '#666',
    fontSize: 12,
    marginTop: 12,
  },
});
