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

  // 최대 30개까지 보관.
  // 즐겨찾기(isFavorite=true)는 30개를 넘어가더라도 우선적으로 보존하고,
  // 즐겨찾기가 아닌 오래된 항목부터 잘라낸다.
  const favorites = next.filter(entry => entry.isFavorite);
  const nonFavorites = next.filter(entry => !entry.isFavorite);

  const remainSlotsForNonFavorites = Math.max(0, 30 - favorites.length);
  const limitedNonFavorites = nonFavorites.slice(0, remainSlotsForNonFavorites);

  const pruned = [...favorites, ...limitedNonFavorites];

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
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

