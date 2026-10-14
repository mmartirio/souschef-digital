import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/auth';
import { COLORS } from '../lib/constants';
import { VoiceSettingsProvider } from '../lib/voiceSettings';

export default function RootLayout() {
  return (
    <AuthProvider>
      <VoiceSettingsProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
          }}
        />
      </VoiceSettingsProvider>
    </AuthProvider>
  );
}
