import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';

interface TipModalProps {
  visible: boolean;
  onClose: () => void;
  creator: {
    user_id: string;
    name: string;
    picture?: string;
  };
}

const TIP_AMOUNTS = [1, 5, 10, 20, 50, 100];

export default function TipModal({ visible, onClose, creator }: TipModalProps) {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTip = async () => {
    const tipAmount = customAmount ? parseFloat(customAmount) : amount;
    if (tipAmount < 1) {
      Alert.alert('Error', 'Minimum tip is $1');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/users/${creator.user_id}/tip`, {
        amount: tipAmount,
        message: message || null,
      });
      Alert.alert('Success', `You sent $${tipAmount} to ${creator.name}!`);
      onClose();
      setAmount(5);
      setCustomAmount('');
      setMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send tip');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>Send a Tip</Text>
          
          <View style={styles.creatorInfo}>
            {creator.picture ? (
              <Image source={{ uri: creator.picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            )}
            <Text style={styles.creatorName}>{creator.name}</Text>
          </View>

          <View style={styles.amountsGrid}>
            {TIP_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.amountButton,
                  amount === amt && !customAmount && styles.amountButtonActive,
                ]}
                onPress={() => {
                  setAmount(amt);
                  setCustomAmount('');
                }}
              >
                <Text
                  style={[
                    styles.amountButtonText,
                    amount === amt && !customAmount && styles.amountButtonTextActive,
                  ]}
                >
                  ${amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.customInput}
            placeholder="Custom amount"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={customAmount}
            onChangeText={setCustomAmount}
          />

          <TextInput
            style={styles.messageInput}
            placeholder="Add a message (optional)"
            placeholderTextColor="#666"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
          />

          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={handleSendTip}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="gift" size={20} color="#000" />
                <Text style={styles.sendButtonText}>
                  Send ${customAmount || amount}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Test mode - no actual charge will be made
          </Text>
        </View>
      </View>
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
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  amountButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 70,
    alignItems: 'center',
  },
  amountButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  amountButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  amountButtonTextActive: {
    color: '#000',
  },
  customInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  messageInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
    minHeight: 60,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
