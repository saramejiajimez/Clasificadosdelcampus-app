import React, { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/services/auth-context';

export default function RootLayout(): ReactNode {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="anuncio/nuevo"
            options={{ title: 'Publicar anuncio' }}
          />
          <Stack.Screen
            name="anuncio/[id]"
            options={{ title: 'Detalle del anuncio' }}
          />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
