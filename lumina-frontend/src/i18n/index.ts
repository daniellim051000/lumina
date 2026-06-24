/**
 * Lightweight, dependency-free internationalization.
 *
 * Provides a `useTranslation` hook and `changeLanguage` helper with an API
 * compatible with how the app uses them, without pulling in i18next/react-i18next
 * (which would require a lockfile change). Supports nested keys, `{{var}}`
 * interpolation, and simple `_one`/`_other` pluralization via a `count` param.
 */
import { useSyncExternalStore } from 'react';

import en from './locales/en/common.json';
import zhHans from './locales/zh-hans/common.json';

export const SUPPORTED_LANGUAGES = ['en', 'zh-hans'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'lng';

type TranslationTree = { [key: string]: string | TranslationTree };

const resources: Record<SupportedLanguage, TranslationTree> = {
  en: en as unknown as TranslationTree,
  'zh-hans': zhHans as unknown as TranslationTree,
};

const isSupported = (lng: string | null): lng is SupportedLanguage =>
  !!lng && (SUPPORTED_LANGUAGES as readonly string[]).includes(lng);

const resolveInitialLanguage = (): SupportedLanguage => {
  const stored =
    typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEY)
      : null;
  if (isSupported(stored)) {
    return stored;
  }
  const browser =
    typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
  return browser.startsWith('zh') ? 'zh-hans' : 'en';
};

let currentLanguage: SupportedLanguage = resolveInitialLanguage();
const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

const getSnapshot = () => currentLanguage;

/** Resolve a dotted key against a translation tree, returning a string or undefined. */
const lookup = (
  tree: TranslationTree,
  key: string
): string | undefined => {
  const value = key
    .split('.')
    .reduce<string | TranslationTree | undefined>((node, part) => {
      if (node && typeof node === 'object') {
        return node[part];
      }
      return undefined;
    }, tree);
  return typeof value === 'string' ? value : undefined;
};

const interpolate = (
  template: string,
  params?: Record<string, string | number>
): string => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`
  );
};

const translate = (
  language: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string => {
  // Pluralization: prefer `${key}_one` / `${key}_other` when a count is given.
  const candidateKeys: string[] = [];
  if (params && typeof params.count === 'number') {
    candidateKeys.push(`${key}_${params.count === 1 ? 'one' : 'other'}`);
  }
  candidateKeys.push(key);

  for (const candidate of candidateKeys) {
    const resolved =
      lookup(resources[language], candidate) ??
      lookup(resources.en, candidate);
    if (resolved !== undefined) {
      return interpolate(resolved, params);
    }
  }
  // Fall back to the key itself so missing translations are visible but harmless.
  return key;
};

export const changeLanguage = (lng: SupportedLanguage): void => {
  if (!isSupported(lng) || lng === currentLanguage) {
    if (isSupported(lng) && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lng);
    }
    return;
  }
  currentLanguage = lng;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lng);
  }
  listeners.forEach(listener => listener());
};

export interface UseTranslationResult {
  t: (key: string, params?: Record<string, string | number>) => string;
  i18n: {
    language: SupportedLanguage;
    changeLanguage: (lng: SupportedLanguage) => void;
  };
}

export const useTranslation = (): UseTranslationResult => {
  const language = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    t: (key, params) => translate(language, key, params),
    i18n: { language, changeLanguage },
  };
};
