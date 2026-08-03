import { api } from '../utils/api';
import type { Book } from '../types';

export const getSavedBooks = async (): Promise<Book[]> => {
  try {
    return await api.getBooks();
  } catch (e) {
    console.error('Error fetching books from API:', e);
    return [];
  }
};

export const saveBook = async (book: Book): Promise<Book> => {
  const saved = await api.saveBook(book);
  window.dispatchEvent(new Event('books_updated'));
  return saved;
};

export const deleteBook = async (id: string): Promise<boolean> => {
  const success = await api.deleteBook(id);
  window.dispatchEvent(new Event('books_updated'));
  return success;
};
