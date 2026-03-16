import type { PromptHistoryItem } from './types';

const HISTORY_KEY = 'promman_history';

function safeParse(json: string | null): PromptHistoryItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed as PromptHistoryItem[];
    return [];
  } catch {
    return [];
  }
}

export function getHistory(): PromptHistoryItem[] {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(HISTORY_KEY));
}

export function saveToHistory(item: PromptHistoryItem) {
  if (typeof window === 'undefined') return;
  const current = getHistory();
  const next = [item, ...current];
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function toggleFavorite(id: string): PromptHistoryItem[] {
  if (typeof window === 'undefined') return [];
  const current = getHistory();
  const next = current.map(entry =>
    entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry,
  );
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function deleteHistoryItem(id: string): PromptHistoryItem[] {
  if (typeof window === 'undefined') return [];
  const current = getHistory();
  const next = current.filter(entry => entry.id !== id);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

