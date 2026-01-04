import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../lib/constants';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="(auth)/login"
        options={{
          title: 'Login',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="(auth)/register"
        options={{
          title: 'Cadastro',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
