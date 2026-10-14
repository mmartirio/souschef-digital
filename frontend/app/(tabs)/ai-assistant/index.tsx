import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import AIAssistant from '../../../components/ai/AIAssistant';

export default function AIAssistantScreen() {
  const { voice } = useLocalSearchParams<{ voice?: string }>();
  return <AIAssistant listenKey={voice} />;
}
