import type { Sermon, Book, Event, BlogPost, Testimony, PrayerRequest } from '../types';

export const sermons: Sermon[] = [
  {
    id: 's1',
    title: 'Walking in Divine Authority',
    speaker: 'Apostle Joshua Iyemifokhae',
    duration: '45:22',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a67343?w=800&q=80',
    views: 12400,
    date: '2025-12-10',
    description: 'Discover the authority given to every believer through Christ and how to walk in it daily.',
    category: 'Faith',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 's2',
    title: 'The Power of Kingdom Prayer',
    speaker: 'Pastor Sarah Williams',
    duration: '38:15',
    thumbnail: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80',
    views: 9800,
    date: '2025-12-03',
    description: 'Learn the principles of effective prayer that moves mountains and transforms lives.',
    category: 'Prayer',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 's3',
    title: 'Breaking Generational Chains',
    speaker: 'Apostle David Thompson',
    duration: '52:40',
    thumbnail: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80',
    views: 15600,
    date: '2025-11-28',
    description: 'Find freedom from patterns that have held your family line captive for generations.',
    category: 'Freedom',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 's4',
    title: 'Grace That Transforms',
    speaker: 'Apostle Joshua Iyemifokhae',
    duration: '42:10',
    thumbnail: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    views: 11200,
    date: '2025-11-20',
    description: 'Understanding the radical grace of God that doesn\'t just forgive but transforms.',
    category: 'Grace',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 's5',
    title: 'Rising in Unshakable Faith',
    speaker: 'Minister Rachel Grace',
    duration: '35:50',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    views: 8700,
    date: '2025-11-15',
    description: 'Build a faith that stands firm no matter what storms life brings your way.',
    category: 'Faith',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 's6',
    title: 'The Season of Harvest',
    speaker: 'Pastor Sarah Williams',
    duration: '48:30',
    thumbnail: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&q=80',
    views: 13200,
    date: '2025-11-08',
    description: 'Recognize the season you\'re in and position yourself for the harvest God is bringing.',
    category: 'Season',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
];

export const books: Book[] = [
  {
    id: 'b1',
    title: 'Purpose & Destiny',
    author: 'Apostle Joshua Iyemifokhae',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    description: 'Discover God\'s unique purpose for your life and walk boldly in your destiny.',
    category: 'Purpose',
    downloadUrl: '#',
    pdfs: [
      {
        title: 'Chapter 1: The Sovereign Plan',
        url: 'Before you were formed in the womb, God knew you and set you apart. Your life is not an accident or a product of chance. There is a divine blueprint written in heaven specifically for you. The sovereign plan of God is the foundation of all true purpose. When you align with His will, your path becomes clear, and your steps are ordered by His grace. Step forward in the confidence that He who began a good work in you will carry it on to completion.'
      },
      {
        title: 'Chapter 2: Uncovering Your Divine Gifts',
        url: 'Every individual has been uniquely equipped by God with talents, spiritual gifts, and capabilities designed to serve the Kingdom. Understanding your gifts is a vital step toward fulfilling your destiny. Take time to pray, self-reflect, and seek counsel to recognize what comes naturally to you and where God\'s power amplifies your efforts. Use your gifts to lift others, build the church, and display His glory.'
      },
      {
        title: 'Chapter 3: Standing Firm in Trials',
        url: 'A strong destiny is forged in the fire of testing. Trials are not meant to destroy you; they are designed to refine you. Keep your eyes fixed on Jesus, the author and finisher of our faith. When storms arise, hold fast to His promises and remember that the trials of today are preparing you for the victories of tomorrow.'
      }
    ]
  },
  {
    id: 'b2',
    title: 'The Prayer Warrior',
    author: 'Sarah Williams',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    description: 'A comprehensive guide to developing a powerful and effective prayer life.',
    category: 'Prayer',
    downloadUrl: '#',
    pdfs: [
      {
        title: 'Chapter 1: The Language of Heaven',
        url: 'Prayer is not a religious duty; it is a relationship. It is the language of communication between heaven and earth. To pray effectively is to communicate from the heart of a child to the ears of a loving Father. When you enter your secret closet and close the door, you enter a realm of limitless power and deep communion.'
      },
      {
        title: 'Chapter 2: Persistent Faith',
        url: 'Persistence in prayer is the key to breakthroughs. Do not grow weary in asking, seeking, and knocking. The answers are on the way. Continue to stand in faith, declaring the scriptures, and praise God even before you see the physical manifestation of your prayers.'
      }
    ]
  },
  {
    id: 'b3',
    title: 'Kingdom Economics',
    author: 'David Thompson',
    coverUrl: 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&q=80',
    description: 'Biblical principles for financial freedom and kingdom stewardship.',
    category: 'Finance',
    downloadUrl: '#',
    pdfs: [
      {
        title: 'Chapter 1: The Principle of Ownership',
        url: 'Everything belongs to God. Once we realize we are not owners but stewards, our relationship with wealth changes. Wealth is a tool to advance the kingdom and bless others, not a treasure to hoard.'
      },
      {
        title: 'Chapter 2: The Sowing and Reaping Cycle',
        url: 'Generosity is the currency of the kingdom. As you sow seed, God multiplies your harvest. Give cheerfully and trust that He will provide all your needs according to His riches in glory.'
      }
    ]
  },
  {
    id: 'b4',
    title: 'Walking in the Spirit',
    author: 'Rachel Grace',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&q=80',
    description: 'Learn to live a Spirit-led life in every area of your daily walk.',
    category: 'Spiritual Growth',
    downloadUrl: '#',
    pdfs: [
      {
        title: 'Chapter 1: Cultivating Sensitivity',
        url: 'The Holy Spirit speaks in a still, small voice. To hear Him, we must quiet the noise of the world. Set aside time each morning to listen and surrender your day to His guidance.'
      },
      {
        title: 'Chapter 2: Fruits of the Spirit',
        url: 'A spirit-led life is evidenced by the character of Christ. Love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control should flow naturally from a heart rooted in Him.'
      }
    ]
  },
  {
    id: 'b5',
    title: 'Healing for the Broken',
    author: 'Apostle Joshua Iyemifokhae',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
    description: 'Find emotional and spiritual healing through God\'s restoring power.',
    category: 'Healing',
    downloadUrl: '#',
    pdfs: [
      {
        title: 'Chapter 1: Binding Up the Wounds',
        url: 'God is close to the brokenhearted and saves those who are crushed in spirit. Bring your pain to the altar. Jesus took our stripes, and by His wounds, we are healed, both physically and emotionally.'
      },
      {
        title: 'Chapter 2: The Freedom of Forgiveness',
        url: 'Unforgiveness is a prison that blocks your healing. Release the offenses and trust God to vindicate you. When you forgive, you release yourself from the burden of the past.'
      }
    ]
  },
  {
    id: 'b6',
    title: 'The Family Altar',
    author: 'Minister Rachel Grace',
    coverUrl: 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&q=80',
    description: 'Building a strong spiritual foundation for your family through daily devotion.',
    category: 'Family',
    downloadUrl: '#',
    pdfs: [
      {
        title: 'Chapter 1: The Devoted Home',
        url: 'A home built on prayer stands strong. Establish a daily family altar where you worship, read the word, and pray together. It seals the hearts of your children and invites God\'s peace into your household.'
      },
      {
        title: 'Chapter 2: Legacy of Faith',
        url: 'What you model in the home will outlive you. Pass down a legacy of scripture reading, integrity, and faith that will guide generations to come.'
      }
    ]
  },
];

export const events: Event[] = [
  {
    id: 'e1',
    title: 'Kingdom Conference 2025',
    date: '2026-01-20',
    time: '09:00 AM',
    location: 'Jerusalem Convention Center',
    description: 'A three-day conference featuring world-renowned speakers, worship, and breakthrough sessions.',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    speakers: ['Apostle Joshua Iyemifokhae', 'Apostle David Thompson', 'Pastor Sarah Williams'],
  },
  {
    id: 'e2',
    title: 'Youth Revival Night',
    date: '2026-01-15',
    time: '06:00 PM',
    location: 'JGen Youth Auditorium',
    description: 'An explosive night of worship, word, and revival for the next generation.',
    imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80',
    speakers: ['Minister Rachel Grace', 'Youth Pastor Mark'],
  },
  {
    id: 'e3',
    title: 'Women of Faith Summit',
    date: '2026-02-08',
    time: '10:00 AM',
    location: 'Grace Cathedral',
    description: 'Empowering women to walk in their God-given purpose and influence.',
    imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80',
    speakers: ['Pastor Sarah Williams', 'Minister Rachel Grace'],
  },
  {
    id: 'e4',
    title: 'Prayer & Fasting Week',
    date: '2026-01-03',
    time: '05:00 AM',
    location: 'JGen Prayer Mountain',
    description: 'Seven days of intense prayer, fasting, and seeking God\'s face for the new year.',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a67343?w=800&q=80',
    speakers: ['Apostle Joshua Iyemifokhae', 'Apostle David Thompson'],
  },
];

export const blogPosts: BlogPost[] = [
  {
    id: 'p1',
    title: '5 Ways to Strengthen Your Faith in Difficult Times',
    author: 'Apostle Joshua Iyemifokhae',
    date: '2025-12-08',
    readTime: '7 min read',
    excerpt: 'When life gets tough, our faith is tested. Here are five powerful ways to keep your faith strong...',
    imageUrl: 'https://images.unsplash.com/photo-1504052434561-5adf5a5c1a1e?w=800&q=80',
    category: 'Faith',
    content: `When life gets tough, our faith is tested in ways we never anticipated. The storms of life have a way of revealing the foundations upon which we stand. If our foundation is weak, we will falter. But if our foundation is built upon the solid rock of Jesus Christ, we can withstand any trial.\n\nHere are five powerful ways to keep your faith strong when you face adversity:\n\n1. Immerse Yourself in the Word of God: Romans 10:17 reminds us that faith comes by hearing, and hearing by the word of God. When the noise of the world is loud, tune in to the whisper of Scripture. Declare the promises of God daily.\n\n2. Maintain a Lifestyle of Praise: Worship is a powerful weapon. Praising God in the midst of your struggle shifts your focus from the size of your giant to the size of your God. It changes the atmosphere of your heart.\n\n3. Stay Connected to Community: Do not isolate yourself. Find a group of believers who will lift you up in prayer, encourage your heart, and stand with you in faith. We are stronger together.\n\n4. Remember Past Victories: David defeated Goliath because he remembered how God had delivered him from the lion and the bear. Journal your testimonies; they will serve as anchors of hope in seasons of doubt.\n\n5. Pray without Ceasing: Keep the communication lines with heaven wide open. Pour out your heart to the Father and allow His peace, which surpasses all understanding, to guard your heart and mind.`
  },
  {
    id: 'p2',
    title: 'The Power of Daily Devotion',
    author: 'Sarah Williams',
    date: '2025-12-05',
    readTime: '5 min read',
    excerpt: 'How establishing a daily devotional practice can transform your spiritual life and deepen your...',
    imageUrl: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&q=80',
    category: 'Devotion',
    content: `In our fast-paced world, it is easy to get caught up in the hustle and bustle of daily activities. However, neglecting our spiritual health leads to exhaustion and dryness. Establishing a daily devotional practice is the key to maintaining a vibrant relationship with Jesus.\n\nA daily devotion is not a ritual to check off your to-do list; it is a vital connection to the Source of life. Here is how it can transform your walk:\n\nFirst, it aligns your perspective. Spending your first moments with God clears the mental clutter and prepares you to face the day with grace and patience. Second, it fills your spiritual tank. Just as physical food sustains the body, the Word sustains the spirit.\n\nStart small: set aside 15 minutes each morning. Read a chapter of Scripture, meditate on it, and pray. You will find that consistency yields deep spiritual growth, bringing peace and strength into every corner of your daily life.`
  },
  {
    id: 'p3',
    title: 'Understanding God\'s Grace in a Performance-Driven World',
    author: 'Rachel Grace',
    date: '2025-12-01',
    readTime: '6 min read',
    excerpt: 'In a world that constantly demands more, understanding God\'s unearned favor brings true freedom...',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    category: 'Grace',
    content: `We live in a performance-driven culture that measures our worth by our achievements. From a young age, we are taught that to receive rewards, we must perform. Unfortunately, we often carry this performance mentality into our relationship with God.\n\nWe think we must earn His love, deserve His mercy, and work for His blessings. But the gospel tells a completely different story. The gospel is a story of grace—unearned, unmerited, and undeserved favor.\n\nGrace means that God loves you because of who He is, not because of what you have done. Ephesians 2:8-9 declares, "For by grace you have been saved through faith; and that not of yourselves, it is the gift of God; not as a result of works, so that no one may boast." When you embrace grace, the pressure is off. You no longer serve God to get Him to love you; you serve Him because He already does.`
  },
  {
    id: 'p4',
    title: 'Building a Prayer Life That Moves Mountains',
    author: 'David Thompson',
    date: '2025-11-28',
    readTime: '8 min read',
    excerpt: 'Discover the secrets to a prayer life that produces results and brings heaven\'s power to earth...',
    imageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80',
    category: 'Prayer',
    content: `Prayer is one of the most powerful privileges given to believers, yet it is often one of the most underutilized. True prayer is not merely reciting a list of requests; it is partnering with heaven to release God's will on earth.\n\nIf you want to build a prayer life that moves mountains, keep these principles in mind:\n\n1. Pray in Alignment with God's Will: Effective prayer is rooted in the Word. When we pray the scriptures, we are praying the very heart of God, and we can be confident He hears us.\n\n2. Pray with Faith: Jesus said, "Whatever you ask for in prayer, believe that you have received it, and it will be yours." Faith is the spark that ignites our prayers.\n\n3. Pray with Persistence: Don't give up. Elijah prayed persistently for rain until a cloud appeared. Persistence builds spiritual muscle and demonstrates earnest trust.`
  },
];

export const testimonies: Testimony[] = [
  {
    id: 't1',
    name: 'Maria Gonzalez',
    content: 'I came to JGen broken and hopeless. Through the teachings and the community, I found my purpose. Today I\'m a youth leader mentoring others!',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    type: 'written',
    date: '2025-11-25',
  },
  {
    id: 't2',
    name: 'James O\'Brien',
    content: 'After 20 years of addiction, God set me free during a JGen conference. The prayer team never gave up on me. Now I\'m free indeed!',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    type: 'written',
    date: '2025-11-20',
  },
  {
    id: 't3',
    name: 'Sarah & David Chen',
    content: 'Our marriage was at the brink of divorce when we attended the Kingdom Marriage seminar. God restored what the enemy stole!',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    type: 'written',
    date: '2025-11-15',
  },
  {
    id: 't4',
    name: 'Pastor Amos Kiprop',
    content: 'The leadership training at JGen transformed how I pastor my church. The resources and mentorship are unparalleled.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    type: 'written',
    date: '2025-11-10',
  },
  {
    id: 't5',
    name: 'Emily Watson',
    content: 'I was diagnosed with a chronic illness, but through the teachings on divine healing and the prayers of the saints, I am completely healed!',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    type: 'written',
    date: '2025-11-05',
  },
  {
    id: 't6',
    name: 'Michael Adebayo',
    content: 'God used JGen to teach me kingdom economics. I went from debt to financial freedom in one year. The principles work!',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
    type: 'written',
    date: '2025-10-30',
  },
];

export const prayerRequests: PrayerRequest[] = [
  {
    id: 'pr1',
    name: 'Anonymous',
    request: 'Please pray for my son who is battling cancer. We need a miracle.',
    isAnonymous: true,
    isUrgent: true,
    prayerCount: 234,
    date: '2025-12-10',
  },
  {
    id: 'pr2',
    name: 'Esther K.',
    request: 'Pray for my marriage restoration. My husband and I are separated and I believe God for reconciliation.',
    isAnonymous: false,
    isUrgent: true,
    prayerCount: 156,
    date: '2025-12-09',
  },
  {
    id: 'pr3',
    name: 'Anonymous',
    request: 'I lost my job last month. Pray for God\'s provision and the right opportunity.',
    isAnonymous: true,
    isUrgent: false,
    prayerCount: 89,
    date: '2025-12-08',
  },
  {
    id: 'pr4',
    name: 'David M.',
    request: 'Pray for my spiritual growth. I want to know God more intimately and walk in my purpose.',
    isAnonymous: false,
    isUrgent: false,
    prayerCount: 67,
    date: '2025-12-07',
  },
];

export const dailyDevotional = {
  verse: 'Joshua 1:9',
  text: 'Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.',
  reflection: 'God\'s command to Joshua echoes through the ages to you today. Strength and courage are not optional—they are commands from the One who goes before you. Whatever valley you face, remember that the God of Joshua is with you. You are not alone, and you are not without power. Rise up, for the Lord your God goes with you!',
};

export const stats = {
  totalSermons: 1240,
  totalBooks: 28,
  totalMembers: 45000,
  totalCountries: 120,
  totalDonations: 1240000,
  liveViewers: 1245,
};
