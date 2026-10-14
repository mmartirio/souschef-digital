import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import { errorMessage, usersAPI } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { confirm } from '../../../lib/confirm';
import { COLORS, SIZES } from '../../../lib/constants';

const EMPTY_PASSWORDS = { current: '', next: '', confirmation: '' };

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.full_name ?? '');
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [saving, setSaving] = useState<'name' | 'photo' | 'password' | 'delete' | null>(null);

  if (!user) return null;

  /** Executa uma ação com indicador de carregamento e alerta de erro. */
  const run = async (action: NonNullable<typeof saving>, task: () => Promise<void>) => {
    setSaving(action);
    try {
      await task();
    } catch (e) {
      Alert.alert('Perfil', errorMessage(e));
    } finally {
      setSaving(null);
    }
  };

  const saveName = () =>
    run('name', async () => {
      setUser(await usersAPI.update({ full_name: name.trim() }));
      Alert.alert('Perfil', 'Nome atualizado.');
    });

  const changePhoto = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert('Perfil', 'Permita o acesso às fotos para trocar a imagem.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const photo = result.assets[0];
    await run('photo', async () => setUser(await usersAPI.uploadAvatar(photo.uri, photo.mimeType ?? 'image/jpeg')));
  };

  const changePassword = () => {
    if (passwords.next.length < 6) return Alert.alert('Senha', 'A nova senha deve ter no mínimo 6 caracteres.');
    if (passwords.next !== passwords.confirmation) return Alert.alert('Senha', 'As senhas não coincidem.');
    return run('password', async () => {
      await usersAPI.update({ current_password: passwords.current, new_password: passwords.next });
      setPasswords(EMPTY_PASSWORDS);
      Alert.alert('Senha', 'Senha alterada com sucesso.');
    });
  };

  const deleteAccount = async () => {
    const confirmed = await confirm(
      'Excluir conta',
      'Sua conta, suas receitas, favoritos e foto serão apagados permanentemente. Deseja continuar?',
      'Excluir',
    );
    if (!confirmed) return;
    await run('delete', async () => {
      await usersAPI.deleteMe();
      await logout();
    });
  };

  const setPassword = (field: keyof typeof EMPTY_PASSWORDS) => (value: string) =>
    setPasswords({ ...passwords, [field]: value });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.photo} onPress={changePhoto} disabled={saving === 'photo'}>
        <Avatar path={user.avatar_url} size={112} />
        <Text style={styles.photoText}>{saving === 'photo' ? 'Enviando…' : 'Alterar foto'}</Text>
      </TouchableOpacity>
      <Text style={styles.email}>{user.email}</Text>

      <Card>
        <Text style={styles.sectionTitle}>Nome</Text>
        <Input value={name} onChangeText={setName} placeholder="Seu nome" icon="person-outline" />
        <Button title="SALVAR NOME" onPress={saveName} loading={saving === 'name'} disabled={!name.trim()} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Alterar senha</Text>
        <Input label="Senha atual" value={passwords.current} onChangeText={setPassword('current')} secureTextEntry icon="lock-closed-outline" />
        <Input label="Nova senha" value={passwords.next} onChangeText={setPassword('next')} secureTextEntry icon="lock-closed-outline" />
        <Input label="Confirmar nova senha" value={passwords.confirmation} onChangeText={setPassword('confirmation')} secureTextEntry icon="lock-closed-outline" />
        <Button title="ALTERAR SENHA" onPress={changePassword} loading={saving === 'password'} disabled={!passwords.current} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Excluir conta</Text>
        <Text style={styles.warning}>Apaga permanentemente sua conta e todos os seus dados.</Text>
        <Button title="EXCLUIR MINHA CONTA" variant="secondary" icon="trash-outline" onPress={deleteAccount} loading={saving === 'delete'} />
      </Card>

      <Text style={styles.version}>Versão 1.1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, gap: 16 },
  photo: { alignItems: 'center', gap: 8, marginTop: 8 },
  photoText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  email: { textAlign: 'center', fontSize: 14, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  warning: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  version: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 12, marginVertical: 16 },
});
