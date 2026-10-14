import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Link } from 'expo-router';
import AuthScreen, { authStyles } from '../../components/layout/AuthScreen';
import GoogleButton from '../../components/layout/GoogleButton';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return Alert.alert('Atenção', 'Informe email e senha.');
    setLoading(true);
    try {
      await login(email.trim(), password); // o layout (auth) redireciona ao logar
    } catch (e) {
      Alert.alert('Erro', errorMessage(e, 'Falha ao fazer login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Bem-vindo de volta" subtitle="Faça login para acessar suas receitas">
      <Input label="Email" placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" icon="mail-outline" />
      <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry icon="lock-closed-outline" />
      <Button title="ENTRAR" onPress={submit} loading={loading} />
      <View style={authStyles.spacer} />
      <GoogleButton />
      <Text style={authStyles.footer}>
        Não tem conta? <Link href="/register" style={authStyles.link}>Cadastre-se</Link>
      </Text>
    </AuthScreen>
  );
}
