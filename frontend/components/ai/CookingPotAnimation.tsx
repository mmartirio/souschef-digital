import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { SvgXml } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

/**
 * Panela animada lida de assets/panela animated.svg (gerado pelo ezgif). O SVG anima seus quadros
 * (<g class="f fN">) com CSS, que o React Native não executa; aqui cada quadro vira um SVG próprio
 * e eles se alternam com os tempos dos @keyframes. Editar o arquivo muda a animação no app.
 */
const POT_SVG = require('../../assets/panela animated.svg');

interface Frame {
  xml: string;
  ms: number;
}

interface Animation {
  frames: Frame[];
  aspectRatio: number; // altura / largura
}

/** Extrai os quadros e a duração de cada um do SVG animado. */
export function parseAnimatedSvg(xml: string): Animation {
  const svgOpen = xml.match(/<svg[^>]*>/)?.[0] ?? '<svg>';
  const [, width = '1', height = '1'] = svgOpen.match(/viewBox="[\d.\s-]*?\s([\d.]+)\s([\d.]+)"/) ?? [];
  const totalMs = parseFloat(xml.match(/animation:\s*f\d+\s+([\d.]+)s/)?.[1] ?? '0.8') * 1000;

  const frames: (Frame & { start: number })[] = [];
  for (const [, id, inner] of xml.matchAll(/<g class="f (f\d+)">([\s\S]*?)<\/g>/g)) {
    const keyframes = xml.match(new RegExp(`@keyframes ${id}\\{([\\s\\S]*?)(?=@keyframes|</style>)`))?.[1] ?? '';
    const [, start = '0', end = '100'] =
      keyframes.match(/([\d.]+)%\{visibility:visible\}([\d.]+)%\{visibility:hidden\}/) ?? [];
    const share = (parseFloat(end) - parseFloat(start)) / 100;
    frames.push({ xml: `${svgOpen}${inner}</svg>`, ms: Math.max(share * totalMs, 16), start: parseFloat(start) });
  }
  frames.sort((a, b) => a.start - b.start);
  return { frames, aspectRatio: parseFloat(height) / parseFloat(width) };
}

/** Carrega e interpreta o SVG uma vez por sessão do app. */
let loading: Promise<Animation> | null = null;
function loadAnimation(): Promise<Animation> {
  loading ??= (async () => {
    const asset = Asset.fromModule(POT_SVG);
    await asset.downloadAsync();
    return parseAnimatedSvg(await new File(asset.localUri ?? asset.uri).text());
  })();
  loading.catch(() => (loading = null)); // tenta de novo na próxima vez
  return loading;
}

interface Props {
  /** Largura em px; a altura segue a proporção do SVG. */
  width?: number;
}

export default function CookingPotAnimation({ width = 96 }: Props) {
  const [animation, setAnimation] = useState<Animation | null>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    let active = true;
    loadAnimation()
      .then((loaded) => active && setAnimation(loaded))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!animation?.frames.length) return;
    const timer = setTimeout(() => setFrame((frame + 1) % animation.frames.length), animation.frames[frame].ms);
    return () => clearTimeout(timer);
  }, [animation, frame]);

  if (!animation?.frames.length) {
    return (
      <View style={{ width, height: width * 0.78, justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <SvgXml
      xml={animation.frames[frame].xml}
      width={width}
      height={width * animation.aspectRatio}
      accessibilityLabel="Preparando a resposta"
    />
  );
}
