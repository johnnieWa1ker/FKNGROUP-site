export const nativeLanguageNames = {
  ar: 'العربية', cs: 'Čeština', da: 'Dansk', de: 'Deutsch', el: 'Ελληνικά', en: 'English',
  es: 'Español', fi: 'Suomi', fr: 'Français', he: 'עברית', hi: 'हिन्दी', hu: 'Magyar',
  id: 'Bahasa Indonesia', it: 'Italiano', ja: '日本語', ka: 'ქართული', ko: '한국어',
  nl: 'Nederlands', pl: 'Polski', 'pt-BR': 'Português (Brasil)', ro: 'Română', ru: 'Русский',
  sv: 'Svenska', th: 'ไทย', tr: 'Türkçe', uk: 'Українська', vi: 'Tiếng Việt',
  'zh-Hans': '简体中文', 'zh-Hant': '繁體中文',
};

export function matchLocale(requested, supported) {
  if (!requested) return null;
  let locale;
  try { locale = new Intl.Locale(requested.replaceAll('_','-')); } catch { return null; }
  const exact = supported.find(value => value.toLowerCase() === locale.baseName.toLowerCase());
  if (exact) return exact;
  if (locale.language === 'zh') {
    const script = locale.maximize().script;
    return supported.find(value => value === `zh-${script}`) || null;
  }
  return supported.find(value => value === locale.language)
    || supported.find(value => value.split('-')[0] === locale.language) || null;
}

// Decorative country cues; language names remain the accessible labels.
export const languageFlags = {
 ar: '🇸🇦', cs: '🇨🇿', da: '🇩🇰', de: '🇩🇪', el: '🇬🇷', en: '🇬🇧',
 es: '🇪🇸', fi: '🇫🇮', fr: '🇫🇷', he: '🇮🇱', hi: '🇮🇳', hu: '🇭🇺',
 id: '🇮🇩', it: '🇮🇹', ja: '🇯🇵', ka: '🇬🇪', ko: '🇰🇷', nl: '🇳🇱',
 pl: '🇵🇱', 'pt-BR': '🇧🇷', ro: '🇷🇴', ru: '🇷🇺', sv: '🇸🇪',
 th: '🇹🇭', tr: '🇹🇷', uk: '🇺🇦', vi: '🇻🇳', 'zh-Hans': '🇨🇳', 'zh-Hant': '🇹🇼',
};
