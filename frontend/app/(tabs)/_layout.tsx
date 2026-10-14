import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import Loading from '../../components/ui/Loading';
import { BottomBar, hidden, tabBarOptions } from '../../components/layout/TabBar';
import { useAuth } from '../../lib/auth';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;

  // A barra inferior (BottomBar) decide os botões; as rotas ficam fora da barra padrão.
  return (
    <Tabs screenOptions={tabBarOptions} tabBar={(props) => <BottomBar {...props} />}>
      <Tabs.Screen name="recipes/index" options={{ title: 'Receitas' }} />
      <Tabs.Screen name="favorites/index" options={{ title: 'Favoritos' }} />
      <Tabs.Screen name="categories/index" options={{ ...hidden, title: 'Categorias' }} />
      <Tabs.Screen name="ai-assistant/index" options={{ ...hidden, title: 'Assistente' }} />
      <Tabs.Screen name="assistant-settings/index" options={{ ...hidden, title: 'Assistente de voz' }} />
      <Tabs.Screen name="profile/index" options={{ ...hidden, title: 'Perfil' }} />
      <Tabs.Screen name="recipes/[id]" options={{ ...hidden, title: 'Receita' }} />
      <Tabs.Screen name="recipes/create" options={{ ...hidden, title: 'Nova receita' }} />
    </Tabs>
  );
}
