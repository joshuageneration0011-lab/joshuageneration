import { api } from '../utils/api';
import type { Event } from '../types';

export const getSavedEvents = async (): Promise<Event[]> => {
  try {
    return await api.getEvents();
  } catch (e) {
    console.error('Error fetching events from API:', e);
    return [];
  }
};

export const saveEvent = async (event: Partial<Event>): Promise<Event> => {
  const saved = await api.createEvent(event);
  window.dispatchEvent(new CustomEvent('events_updated'));
  return saved;
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  const success = await api.deleteEvent(id);
  window.dispatchEvent(new CustomEvent('events_updated'));
  return success;
};
