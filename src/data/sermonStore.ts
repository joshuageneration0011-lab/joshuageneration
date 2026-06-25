import { api } from '../utils/api';
import type { Sermon } from '../types';

export const getSavedSermons = async (): Promise<Sermon[]> => {
  try {
    return await api.getSermons();
  } catch (e) {
    console.error('Error fetching sermons from API:', e);
    return [];
  }
};

export const saveSermon = async (sermon: Sermon): Promise<Sermon> => {
  const saved = await api.saveSermon(sermon);
  window.dispatchEvent(new Event('sermons_updated'));
  return saved;
};

export const deleteSermon = async (id: string): Promise<boolean> => {
  const success = await api.deleteSermon(id);
  window.dispatchEvent(new Event('sermons_updated'));
  return success;
};
