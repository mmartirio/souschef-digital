import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Button from '../ui/Button';
import { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_IDS = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};

/** Entrar/cadastrar com Google. Só aparece se os client IDs estiverem configurados. */
export default function GoogleButton() {
  return Object.values(CLIENT_IDS).some(Boolean) ? <GoogleSignIn /> : null;
}

function GoogleSignIn() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(CLIENT_IDS);

  useEffect(() => {
    if (response?.type !== 'success') return;
    setLoading(true);
    loginWithGoogle(response.params.id_token)
      .catch((e) => Alert.alert('Google', errorMessage(e, 'Falha ao entrar com Google')))
      .finally(() => setLoading(false));
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Button
      title="Continuar com Google"
      icon="logo-google"
      variant="outline"
      disabled={!request}
      loading={loading}
      onPress={() => promptAsync()}
    />
  );
}
