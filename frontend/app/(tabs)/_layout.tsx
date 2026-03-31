import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { THEME } from '../../src/types';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={focused ? '#F43F5E' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={focused ? '#22D3EE' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.createButton}>
              <View style={styles.createButtonLeft} />
              <View style={styles.createButtonRight} />
              <View style={styles.createButtonInner}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={24} color={focused ? '#8B5CF6' : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={focused ? '#10B981' : color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a0a0f',
    borderTopWidth: 0.5,
    borderTopColor: '#1a1a2e',
    height: Platform.OS === 'ios' ? 85 : 60,
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 25 : 5,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  createButton: {
    position: 'relative',
    width: 48,
    height: 32,
    marginTop: -2,
  },
  createButtonLeft: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 42,
    height: 28,
    backgroundColor: '#22D3EE',
    borderRadius: 8,
  },
  createButtonRight: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 42,
    height: 28,
    backgroundColor: '#F43F5E',
    borderRadius: 8,
  },
  createButtonInner: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
