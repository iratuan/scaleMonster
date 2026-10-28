/**
 * Detecta fone de ouvido quando a plataforma informa (ponte nativa do Android).
 * Retorna null quando não há como saber (navegador comum e desktop).
 * O contrato é o mesmo do app legado, para o wrapper Android continuar funcionando.
 */
interface AndroidBridgeLike {
  isHeadsetConnected?: () => boolean;
}

export function detectHeadset(): boolean | null {
  const bridge = (globalThis as { AndroidBridge?: AndroidBridgeLike }).AndroidBridge;
  if (!bridge || typeof bridge.isHeadsetConnected !== 'function') return null;
  return bridge.isHeadsetConnected();
}
