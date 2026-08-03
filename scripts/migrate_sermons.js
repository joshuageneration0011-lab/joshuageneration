import fs from 'fs';
import path from 'path';

// Set your WordPress URL here
const WORDPRESS_URL = 'https://yourwordpresssite.com'; 

// Set the category or speaker default
const DEFAULT_SPEAKER = 'Lead Pastor';
const DEFAULT_CATEGORY = 'Sermon';
const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1499750310107-5fef28a67343?w=800&q=80';

// Helper to strip HTML tags for descriptions
function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to extract MP3 URLs from post content
function extractAudioUrl(contentHtml) {
  if (!contentHtml) return '';
  
  // Look for src="..." or href="..." containing .mp3
  const srcMatch = contentHtml.match(/src="([^"]+\.mp3)"/i);
  if (srcMatch) return srcMatch[1];
  
  const hrefMatch = contentHtml.match(/href="([^"]+\.mp3)"/i);
  if (hrefMatch) return hrefMatch[1];
  
  return '';
}

async function migrateSermons() {
  try {
    console.log(`📡 Fetching sermons from WordPress: ${WORDPRESS_URL}...`);
    
    // We fetch posts with _embed to get featured images directly in the response
    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=100&_embed`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    
    const posts = await response.json();
    console.log(`✅ Loaded ${posts.length} posts. Parsing data...`);
    
    const sermons = posts.map((post, index) => {
      const title = cleanHtml(post.title.rendered);
      const audioUrl = extractAudioUrl(post.content.rendered);
      
      // Get featured image URL from the embedded data
      let thumbnail = DEFAULT_THUMBNAIL;
      const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
      if (featuredMedia && featuredMedia.source_url) {
        thumbnail = featuredMedia.source_url;
      }
      
      // Truncate clean description
      const description = cleanHtml(post.excerpt.rendered || post.content.rendered).slice(0, 180) + '...';
      
      return {
        id: `wp-${post.id || index}`,
        title: title,
        speaker: DEFAULT_SPEAKER,
        duration: '00:00', // WordPress posts don't store audio duration by default
        thumbnail: thumbnail,
        views: Math.floor(Math.random() * 500) + 50, // Simulated initial views
        date: post.date ? post.date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: description,
        category: DEFAULT_CATEGORY,
        audioUrl: audioUrl || undefined,
        videoUrl: undefined
      };
    });
    
    // Filter out posts that don't have an audio file associated with them
    const audioSermons = sermons.filter(s => s.audioUrl);
    
    console.log(`🎵 Found ${audioSermons.length} posts with audio files.`);
    
    const outputPath = path.join(process.cwd(), 'migrated_sermons.json');
    fs.writeFileSync(outputPath, JSON.stringify(audioSermons, null, 2));
    
    console.log(`🎉 Success! Migrated sermons saved to: ${outputPath}`);
    console.log(`👉 You can copy the contents of this file directly into your mockData.ts or database seeds.`);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

migrateSermons();
