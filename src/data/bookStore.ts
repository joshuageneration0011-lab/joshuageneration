import { books as defaultBooks } from './mockData';
import type { Book } from '../types';

export const getSavedBooks = (): Book[] => {
  const saved = localStorage.getItem('jg_books');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing saved books:', e);
    }
  }
  
  // Set default book structures
  const initialized = defaultBooks.map(book => ({
    ...book,
    amazonUrl: book.amazonUrl || 'https://amazon.com',
    selarUrl: book.selarUrl || 'https://selar.co'
  }));
  localStorage.setItem('jg_books', JSON.stringify(initialized));
  return initialized;
};

export const saveBooks = (books: Book[]) => {
  localStorage.setItem('jg_books', JSON.stringify(books));
  window.dispatchEvent(new Event('books_updated'));
};
