export interface SermonAudio {
  id: string;
  title: string;
  audioUrl: string;
  duration: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  thumbnail: string;
  audioUrl?: string;
  videoUrl?: string;
  views: number;
  downloads?: number;
  date: string;
  description: string;
  category: string;
  audios?: SermonAudio[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  category: string;
  downloadUrl?: string;
  readUrl?: string;
  pdfs?: {
    title: string;
    url: string;
  }[];
  amazonUrl?: string;
  selarUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  imageUrl: string;
  speakers: string[];
  registrations?: number;
  capacity?: number;
  status?: 'Upcoming' | 'Completed' | 'Cancelled';
}

export interface BlogPost {
  id: string;
  title: string;
  author: string;
  date: string;
  readTime: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  slug?: string;
  isDeleted?: boolean;
}

export interface Testimony {
  id: string;
  name: string;
  content: string;
  imageUrl: string;
  type: 'written' | 'video';
  date: string;
}

export interface PrayerRequest {
  id: string;
  name: string;
  request: string;
  isAnonymous: boolean;
  isUrgent: boolean;
  prayerCount: number;
  date: string;
}

export interface Donation {
  id: string;
  donor: string;
  email: string;
  name?: string;
  amount: number;
  purpose: string;
  date: string;
  method: string;
  frequency: string;
}

export interface Settings {
  flutterwave_prophetic_client_id: string;
  flutterwave_prophetic_client_secret: string;
  flutterwave_mission_client_id: string;
  flutterwave_mission_client_secret: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  socialFacebook?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  homeHeadlinePrefix?: string;
  homeHeadlineHighlight?: string;
  homeHeadlineSuffix?: string;
  homeSubheading?: string;
  homeBibleVerse?: string;
  homeBibleReference?: string;
}


export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  is_active: boolean;
  created_at: string;
}
