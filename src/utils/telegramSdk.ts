import { TelegramUser } from '../types';

/**
 * Helper utility to interact with the Telegram Mini App (TMA) WebApp SDK
 */
export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  return null;
};

export const isTelegramEnvironment = (): boolean => {
  const tg = getTelegramWebApp();
  return Boolean(tg && (tg.initData || tg.initDataUnsafe?.user || window.location.hash.includes('tgWebAppData')));
};

export const getTelegramUser = (): TelegramUser | null => {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  return null;
};

export const initTelegramMiniApp = () => {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    
    // Set header color to match Telegram aesthetic
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#24A1DE');
    }
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#F3F4F6');
    }
  } catch (err) {
    console.debug('Telegram WebApp init notice:', err);
  }
};

export const triggerTelegramHaptic = (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'medium'
) => {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  try {
    if (type === 'success' || type === 'error' || type === 'warning') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Graceful fallback if unsupported
  }
};

export const shareToTelegram = (text: string, url?: string) => {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  const shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  
  const tg = getTelegramWebApp();
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
};
