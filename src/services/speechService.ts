export const speakMessage = (
  text: string,
  lang: 'es-ES' | 'en-US' = 'es-ES',
  enabled: boolean = true
): void => {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.04;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Fallback silencioso si el navegador bloquea autoplay de audio
  }
};

export const stopSpeech = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
