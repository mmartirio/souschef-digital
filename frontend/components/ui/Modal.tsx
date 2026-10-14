import React, { ReactNode } from 'react';
import { Modal as RNModal } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../lib/constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal de tela cheia com safe area. No Android (edge-to-edge) o modal se estende sob as barras do
 * sistema para que a safe area meça os insets e o rodapé não fique escondido atrás da navegação.
 */
export default function Modal({ visible, onClose, children }: Props) {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>{children}</SafeAreaView>
      </SafeAreaProvider>
    </RNModal>
  );
}
