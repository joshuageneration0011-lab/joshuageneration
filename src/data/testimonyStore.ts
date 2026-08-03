import { api } from '../utils/api';
import type { Testimony } from '../types';
import { testimonies as defaultTestimonies } from './mockData';

export const getSavedTestimonies = async (): Promise<Testimony[]> => {
  try {
    const data = await api.getTestimonies();
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }
    return defaultTestimonies;
  } catch (e) {
    console.error('Error fetching testimonies from API:', e);
    return defaultTestimonies;
  }
};

export const saveTestimony = async (testimony: Testimony): Promise<Testimony> => {
  const saved = await api.saveTestimony(testimony);
  window.dispatchEvent(new CustomEvent('testimonies_updated'));
  return saved;
};

export const deleteTestimony = async (id: string): Promise<boolean> => {
  const success = await api.deleteTestimony(id);
  window.dispatchEvent(new CustomEvent('testimonies_updated'));
  return success;
};
