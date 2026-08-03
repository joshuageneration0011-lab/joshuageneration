export type LikeType = 'sermon' | 'book' | 'blog';

export const getLikedItems = (type: LikeType): string[] => {
  const data = localStorage.getItem(`jg_likes_${type}`);
  return data ? JSON.parse(data) : [];
};

export const isItemLiked = (type: LikeType, id: string): boolean => {
  const likes = getLikedItems(type);
  return likes.includes(id);
};

export const toggleLikeItem = (type: LikeType, id: string): boolean => {
  const likes = getLikedItems(type);
  const index = likes.indexOf(id);
  let liked = false;
  if (index === -1) {
    likes.push(id);
    liked = true;
  } else {
    likes.splice(index, 1);
  }
  localStorage.setItem(`jg_likes_${type}`, JSON.stringify(likes));
  window.dispatchEvent(new Event('likes_updated'));
  return liked;
};
