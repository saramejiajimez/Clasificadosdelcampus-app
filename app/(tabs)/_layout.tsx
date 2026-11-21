import React, { type ReactNode } from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout(): ReactNode {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284c7',
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#ffffff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Campus Feed',
          tabBarLabel: 'Explorar',
        }}
      />
      <Tabs.Screen
        name="mis-anuncios"
        options={{
          title: 'Mis Anuncios',
          tabBarLabel: 'Mis Anuncios',
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos (Offline)',
          tabBarLabel: 'Favoritos',
        }}
      />
    </Tabs>
  );
}
