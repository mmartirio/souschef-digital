import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Link } from 'expo-router';
import AuthScreen, { authStyles } from '../../components/layout/AuthScreen';
import GoogleButton from '../../components/layout/GoogleButton';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (value: string) => setForm({ ...form, [field]: value });

  const validate = (): string | null => {
    if (form.name.trim().length < 3) return 'Nome deve ter no mínimo 3 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Email inválido';
    if (form.password.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
    if (form.password !== form.confirm) return 'As senhas não coincidem';
    return null;
  };

  const submit = async () => {
    const error = validate();
    if (error) return Alert.alert('Atenção', error);
    setLoading(true);
    try {
      await register(form.email.trim(), form.password, form.name.trim());
    } catch (e) {
      Alert.alert('Erro', errorMessage(e, 'Falha ao cadastrar'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen spoon title="Criar conta" subtitle="Cadastre-se para descobrir receitas deliciosas">
      <Input label="Nome" value={form.name} onChangeText={set('name')} icon="person-outline" />
      <Input label="Email" placeholder="seu@email.com" value={form.email} onChangeText={set('email')} keyboardType="email-address" icon="mail-outline" />
      <Input label="Senha" value={form.password} onChangeText={set('password')} secureTextEntry icon="lock-closed-outline" />
      <Input label="Confirmar senha" value={form.confirm} onChangeText={set('confirm')} secureTextEntry icon="lock-closed-outline" />
      <Button title="CADASTRAR" onPress={submit} loading={loading} />
      <View style={authStyles.spacer} />
      <GoogleButton />
      <Text style={authStyles.footer}>
        Já tem conta? <Link href="/login" style={authStyles.link}>Entre aqui</Link>
      </Text>
    </AuthScreen>
  );
}
