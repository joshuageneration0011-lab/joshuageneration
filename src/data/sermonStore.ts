import { sermons as defaultSermons } from './mockData';
import type { Sermon } from '../types';

export const getSavedSermons = (): Sermon[] => {
  const saved = localStorage.getItem('jg_sermons');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing saved sermons:', e);
    }
  }

  // Initialize store with default sermons
  localStorage.setItem('jg_sermons', JSON.stringify(defaultSermons));
  return defaultSermons;
};

export const saveSermons = (sermons: Sermon[]) => {
  localStorage.setItem('jg_sermons', JSON.stringify(sermons));
  window.dispatchEvent(new Event('sermons_updated'));
};
