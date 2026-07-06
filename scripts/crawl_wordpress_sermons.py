#!/usr/bin/env python3
import os
import sys
import json
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import random
import time
from datetime import datetime

def show_progress(block_num, block_size, total_size):
    if total_size <= 0:
        return
    downloaded = block_num * block_size
    percent = min(100, int(downloaded * 100 / total_size))
    bar = '#' * (percent // 5) + '-' * (20 - (percent // 5))
    sys.stdout.write(f"\rDownloading file: [{bar}] {percent}% ({downloaded / (1024*1024):.2f}MB / {total_size / (1024*1024):.2f}MB)")
    sys.stdout.flush()

def clean_html(raw_html):
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()

def parse_rss_feed(url):
    print(f"Fetching RSS feed from: {url}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(url, headers=headers)
    
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    items = []
    
    # Namespaces
    ns = {
        'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        'media': 'http://search.yahoo.com/mrss/',
        'content': 'http://purl.org/rss/1.0/modules/content/'
    }
    
    for item in root.findall('.//item'):
        title = item.find('title')
        title_text = title.text if title is not None else "Untitled Sermon"
        
        # Audio URL search in <enclosure>
        audio_url = ""
        enclosure = item.find('enclosure')
        if enclosure is not None:
            audio_url = enclosure.get('url', '')
            
        description = ""
        desc_node = item.find('description')
        if desc_node is not None:
            description = clean_html(desc_node.text)
            
        # Image search in multiple places
        image_url = ""
        itunes_image = item.find('itunes:image', ns)
        if itunes_image is not None:
            image_url = itunes_image.get('href', '')
        
        if not image_url:
            media_content = item.find('media:content', ns)
            if media_content is not None:
                image_url = media_content.get('url', '')
                
        # Fallback to channel image
        if not image_url:
            channel_image = root.find('.//channel/image/url')
            if channel_image is not None:
                image_url = channel_image.text
                
        pub_date = ""
        date_node = item.find('pubDate')
        if date_node is not None:
            try:
                # Parse pubDate and format to YYYY-MM-DD
                parsed_date = datetime.strptime(date_node.text[:25].strip(), "%a, %d %b %Y %H:%M:%S")
                pub_date = parsed_date.strftime("%Y-%m-%d")
            except Exception:
                pub_date = date_node.text
                
        if audio_url:
            items.append({
                'title': title_text,
                'audioUrl': audio_url,
                'imageUrl': image_url,
                'description': description,
                'date': pub_date
            })
            
    return items

def parse_html_page(url):
    print(f"Scraping HTML page from: {url}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(url, headers=headers)
    
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8', errors='ignore')
    
    # 1. Regex to find any MP3 URLs
    mp3_pattern = re.compile(r'href=["\'](https?://[^"\']+\.mp3)["\']', re.IGNORECASE)
    mp3_links = list(set(mp3_pattern.findall(html)))
    
    items = []
    if not mp3_links:
        print("No direct MP3 links found on the page.")
        return items
        
    print(f"Found {len(mp3_links)} audio links on the page. Extracting context...")
    
    # 2. Try to find titles & images around the MP3 links
    for idx, mp3 in enumerate(mp3_links):
        # Generate dummy title from filename
        filename = os.path.basename(urllib.parse.urlparse(mp3).path)
        title = os.path.splitext(filename)[0].replace('-', ' ').replace('_', ' ').title()
        
        # Try to find an image in the HTML
        img_pattern = re.compile(r'src=["\'](https?://[^"\']+\.(?:png|jpg|jpeg|webp))["\']', re.IGNORECASE)
        imgs = img_pattern.findall(html)
        image_url = imgs[0] if imgs else ""
        
        items.append({
            'title': f"{title} (Scraped #{idx+1})",
            'audioUrl': mp3,
            'imageUrl': image_url,
            'description': "Scraped from web archive link.",
            'date': datetime.now().strftime("%Y-%m-%d")
        })
        
    return items

def upload_file_to_contabo(api_base, local_filepath, original_name):
    upload_url = f"{api_base}/api/upload?filename={urllib.parse.quote(original_name)}"
    with open(local_filepath, 'rb') as f:
        file_data = f.read()

    req = urllib.request.Request(
        upload_url,
        data=file_data,
        headers={'Content-Type': 'application/octet-stream'},
        method='POST'
    )
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        return res_data.get('url')

def save_sermon_to_contabo(api_base, sermon_payload):
    sermon_url = f"{api_base}/api/sermons"
    req = urllib.request.Request(
        sermon_url,
        data=json.dumps(sermon_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as response:
        return response.read().decode('utf-8')

def main():
    print("=" * 60)
    print("   JOSHUA GENERATION AUTOMATED SERMON CRAWLER & IMPORT")
    print("=" * 60)

    # 1. Input Server URL
    default_host = "https://joshuasgeneration.com"
    host_input = input(f"Enter Contabo Server API URL [{default_host}]: ").strip()
    api_base = host_input if host_input else default_host
    if api_base.endswith('/'):
        api_base = api_base[:-1]

    # 2. Input Sermon Page or RSS Feed Link
    source_url = ""
    while not source_url:
        source_url = input("Enter WordPress RSS Feed or Sermon Page URL: ").strip()
        if not source_url:
            print("URL is required!")

    # 3. Detect Feed vs HTML page
    items = []
    try:
        if "feed" in source_url.lower() or source_url.endswith(".xml"):
            items = parse_rss_feed(source_url)
        else:
            items = parse_html_page(source_url)
            if not items:
                # Try RSS parser in case it's a feed anyway
                try:
                    items = parse_rss_feed(source_url)
                except Exception:
                    pass
    except Exception as e:
        print(f"Error parsing source: {e}")
        # Try fallback to HTML scraping
        try:
            items = parse_html_page(source_url)
        except Exception as e2:
            print(f"Fallback HTML scraping also failed: {e2}")

    if not items:
        print("No sermons could be extracted from the provided link.")
        return

    print(f"\nSuccessfully extracted {len(items)} sermons.")
    print("-" * 40)
    for idx, item in enumerate(items[:5]):
        print(f" {idx+1}. Title: {item['title']}")
        print(f"    Audio: {item['audioUrl'][:80]}...")
        if item['imageUrl']:
            print(f"    Image: {item['imageUrl'][:80]}...")
    if len(items) > 5:
        print(f" ... and {len(items) - 5} more.")
    print("-" * 40)

    print("\nSelect Import Option:")
    print(" [1] Import interactively (Select yes/no for each sermon)")
    print(" [2] Auto-import ALL sermons automatically")
    print(" [3] Cancel & Exit")
    choice = input("Enter choice [1-3]: ").strip()

    if choice not in ['1', '2']:
        print("Import cancelled.")
        return

    default_speaker = "Apostle Joshua Iyemifokhae"
    speaker = input(f"Enter Speaker Name for imported sermons [{default_speaker}]: ").strip()
    if not speaker:
        speaker = default_speaker

    default_category = "Faith"
    category = input(f"Enter Category for imported sermons [{default_category}]: ").strip()
    if not category:
        category = default_category

    print("\nStarting import process...")
    imported_count = 0
    
    for idx, item in enumerate(items):
        print(f"\nProcessing sermon {idx+1}/{len(items)}: '{item['title']}'")
        
        if choice == '1':
            confirm = input("Import this sermon? (y/n/stop): ").strip().lower()
            if confirm == 'stop':
                break
            if confirm != 'y':
                print("Skipped.")
                continue

        # --- DOWNLOAD & UPLOAD COVER IMAGE ---
        uploaded_thumb_path = ""
        if item['imageUrl']:
            print("Downloading cover image...")
            parsed_img = urllib.parse.urlparse(item['imageUrl'])
            img_filename = os.path.basename(parsed_img.path)
            if not img_filename or '.' not in img_filename:
                img_filename = "thumbnail.jpg"
            
            temp_img = os.path.join(os.getcwd(), f"temp_{img_filename}")
            try:
                urllib.request.urlretrieve(item['imageUrl'], temp_img)
                print("Uploading cover image to Contabo...")
                uploaded_thumb_path = upload_file_to_contabo(api_base, temp_img, img_filename)
                print(f"Cover image uploaded: {uploaded_thumb_path}")
            except Exception as e:
                print(f"Failed to process image: {e}")
            finally:
                if os.path.exists(temp_img):
                    try: os.remove(temp_img)
                    except Exception: pass

        # --- DOWNLOAD & UPLOAD AUDIO ---
        print("Downloading audio file...")
        parsed_audio = urllib.parse.urlparse(item['audioUrl'])
        audio_filename = os.path.basename(parsed_audio.path)
        if not audio_filename.lower().endswith('.mp3'):
            audio_filename = "sermon.mp3"
            
        temp_audio = os.path.join(os.getcwd(), f"temp_{audio_filename}")
        uploaded_audio_path = ""
        try:
            urllib.request.urlretrieve(item['audioUrl'], temp_audio, reporthook=show_progress)
            print("\nUploading audio to Contabo server...")
            uploaded_audio_path = upload_file_to_contabo(api_base, temp_audio, audio_filename)
            print(f"Audio file uploaded: {uploaded_audio_path}")
        except Exception as e:
            print(f"\nFailed to process audio: {e}")
        finally:
            if os.path.exists(temp_audio):
                try: os.remove(temp_audio)
                except Exception: pass

        if not uploaded_audio_path:
            print("Skipping database entry creation due to missing audio link.")
            continue

        # --- SAVE SERMON RECORD ---
        sermon_id = f"sermon_{int(time.time())}{random.randint(100, 999)}"
        sermon_date = item['date'] if item['date'] else datetime.now().strftime("%Y-%m-%d")
        
        sermon_payload = {
            "id": sermon_id,
            "title": item['title'],
            "speaker": speaker,
            "duration": "45:00",
            "thumbnail": uploaded_thumb_path,
            "audioUrl": uploaded_audio_path,
            "videoUrl": "",
            "views": 0,
            "downloads": 0,
            "date": sermon_date,
            "description": item['description'] if item['description'] else "Imported from archive feed.",
            "category": category,
            "audios": []
        }

        try:
            save_sermon_to_contabo(api_base, sermon_payload)
            print(f"Success! Imported: '{item['title']}'")
            imported_count += 1
        except Exception as e:
            print(f"Failed to create database record: {e}")

        # Sleep briefly between requests to prevent rate limit issues
        time.sleep(1)

    print(f"\nAll done! Successfully imported {imported_count} sermons.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
