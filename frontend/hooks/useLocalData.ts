import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { onLocalChange } from '../lib/localStore';

/**
 * Lê do banco local e recarrega quando os dados mudam (gravação local ou sincronização)
 * e quando a tela volta a aparecer. `data` é null até a primeira leitura.
 */
export function useLocalData<T>(load: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async () => {
    const value = await loadRef.current();
    setData(value);
    return value;
  }, []);

  useEffect(() => {
    void reload();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => onLocalChange(() => void reload()), [reload]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, reload };
}
