#!/usr/bin/env python3
"""
Joshua Generation Sermon Crawler & Import Tool
- Crawls WordPress sermon pages for audio/image links
- Imports sermons to the Contabo server API with proper authentication
- Supports direct-link mode (uses WordPress URLs) or download+upload mode
"""
import os
import sys
import json
import re
import ssl
import http.client
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
import random
import time
import getpass
import subprocess
from datetime import datetime

# ── SSL & Connection Setup ──────────────────────────────────────────

SSL_CTX = ssl.create_default_context()

MAX_RETRIES = 5
RETRY_BASE_DELAY = 4  # seconds

# Global auth token for Contabo server
AUTH_TOKEN = ""


# Bitrate tables and audio duration helper functions for correct timer metadata estimation
BITRATES = {
    1: { # MPEG-1
        1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448], # Layer I
        2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],    # Layer II
        3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]     # Layer III
    },
    2: { # MPEG-2 & 2.5
        1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
        2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
        3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
    }
}

def get_audio_duration(file_path):
    """Calculate the duration of a local audio file (primarily MP3) in MM:SS or H:MM:SS format."""
    try:
        if not os.path.exists(file_path):
            return "45:00"
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return "45:00"

        with open(file_path, 'rb') as f:
            header = f.read(10)
            if len(header) < 10:
                return "45:00"
            offset = 0
            if header[0:3] == b'ID3':
                size = ((header[6] & 0x7F) << 21) | \
                       ((header[7] & 0x7F) << 14) | \
                       ((header[8] & 0x7F) << 7)  | \
                       (header[9] & 0x7F)
                offset = size + 10
                f.seek(offset)

            buffer = f.read(4096)
            if len(buffer) < 4:
                return "45:00"

            for i in range(len(buffer) - 3):
                if buffer[i] == 0xFF and (buffer[i+1] & 0xE0) == 0xE0:
                    b1 = buffer[i+1]
                    b2 = buffer[i+2]
                    version_bits = (b1 & 0x18) >> 3
                    version = 1
                    if version_bits == 0:
                        version = 2.5
                    elif version_bits == 2:
                        version = 2

                    layer_bits = (b1 & 0x06) >> 1
                    layer = 4 - layer_bits if layer_bits in [1, 2, 3] else 3
                    bitrate_idx = (b2 & 0xF0) >> 4
                    if bitrate_idx == 0 or bitrate_idx == 15:
                        continue

                    if version == 1:
                        br_list = BITRATES[1].get(layer, BITRATES[1][3])
                    else:
                        br_list = BITRATES[2].get(layer, BITRATES[2][3])

                    bitrate = br_list[bitrate_idx]
                    audio_bytes = file_size - offset
                    duration_seconds = int(audio_bytes / (bitrate * 1000 / 8))

                    hours = duration_seconds // 3600
                    minutes = (duration_seconds % 3600) // 60
                    seconds = duration_seconds % 60
                    if hours > 0:
                        return f"{hours}:{minutes:02d}:{seconds:02d}"
                    else:
                        return f"{minutes:02d}:{seconds:02d}"
    except Exception as e:
        print(f"  Warning: Error calculating local audio duration: {e}")
    return "45:00"

def get_remote_audio_duration(audio_url):
    """Estimate the duration of a remote audio file by parsing its content length and bitrate."""
    try:
        content_length = 0
        cmd_head = ['curl', '-I', '-L', '-s', '--connect-timeout', '10', audio_url]
        res_head = subprocess.run(cmd_head, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        for line in res_head.stdout.split('\n'):
            if line.lower().startswith('content-length:'):
                try:
                    content_length = int(line.split(':')[1].strip())
                except:
                    pass

        if content_length == 0:
            req = urllib.request.Request(audio_url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(req, context=SSL_CTX, timeout=10) as resp:
                    content_length = int(resp.headers.get('Content-Length', 0))
            except:
                pass

        if content_length == 0:
            return "45:00"

        cmd_range = ['curl', '-L', '-r', '0-8192', '-s', '--connect-timeout', '10', audio_url]
        res_range = subprocess.run(cmd_range, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        buffer = res_range.stdout

        if len(buffer) < 4:
            req = urllib.request.Request(audio_url, headers={'Range': 'bytes=0-8192', 'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(req, context=SSL_CTX, timeout=10) as resp:
                    buffer = resp.read()
            except:
                pass

        if len(buffer) < 10:
            return "45:00"

        offset = 0
        if buffer[0:3] == b'ID3':
            size = ((buffer[6] & 0x7F) << 21) | \
                   ((buffer[7] & 0x7F) << 14) | \
                   ((buffer[8] & 0x7F) << 7)  | \
                   (buffer[9] & 0x7F)
            offset = size + 10

        for i in range(offset, len(buffer) - 3):
            if buffer[i] == 0xFF and (buffer[i+1] & 0xE0) == 0xE0:
                b1 = buffer[i+1]
                b2 = buffer[i+2]
                version_bits = (b1 & 0x18) >> 3
                version = 1
                if version_bits == 0:
                    version = 2.5
                elif version_bits == 2:
                    version = 2

                layer_bits = (b1 & 0x06) >> 1
                layer = 4 - layer_bits if layer_bits in [1, 2, 3] else 3
                bitrate_idx = (b2 & 0xF0) >> 4
                if bitrate_idx == 0 or bitrate_idx == 15:
                    continue

                if version == 1:
                    br_list = BITRATES[1].get(layer, BITRATES[1][3])
                else:
                    br_list = BITRATES[2].get(layer, BITRATES[2][3])

                bitrate = br_list[bitrate_idx]
                audio_bytes = content_length - offset
                duration_seconds = int(audio_bytes / (bitrate * 1000 / 8))

                hours = duration_seconds // 3600
                minutes = (duration_seconds % 3600) // 60
                seconds = duration_seconds % 60
                if hours > 0:
                    return f"{hours}:{minutes:02d}:{seconds:02d}"
                else:
                    return f"{minutes:02d}:{seconds:02d}"
    except Exception as e:
        print(f"  Warning: Error calculating remote audio duration: {e}")
    return "45:00"


def get_browser_headers(referer=""):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
    }
    if referer:
        headers['Referer'] = referer
    return headers


def fetch_url(url, timeout=30, max_retries=MAX_RETRIES):
    """Fetch a URL using curl.exe if available (to bypass bot detection like Cloudflare), falling back to urllib."""
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            # Try native curl.exe / curl first
            cmd = [
                'curl.exe',
                '-sS',
                '-L',
                '--max-time', str(timeout),
                '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                '-H', 'Accept-Language: en-US,en;q=0.9',
                url
            ]
            result = subprocess.run(cmd, capture_output=True, timeout=timeout + 5)
            if result.returncode == 0:
                return result.stdout
            else:
                err_msg = result.stderr.decode('utf-8', errors='ignore').strip()
                raise Exception(f"curl failed with code {result.returncode}: {err_msg}")
        except Exception as e:
            # Fallback to urllib.request
            try:
                headers = get_browser_headers(referer=url)
                req = urllib.request.Request(url, headers=headers)
                response = urllib.request.urlopen(req, context=SSL_CTX, timeout=timeout)
                return response.read()
            except Exception as e2:
                last_error = e2
                if attempt < max_retries:
                    wait = RETRY_BASE_DELAY * attempt + random.uniform(0, 2)
                    print(f"  Attempt {attempt}/{max_retries} failed (curl: {e}, urllib: {e2})")
                    print(f"  Waiting {wait:.1f}s before retry...")
                    time.sleep(wait)
                else:
                    print(f"  All {max_retries} attempts failed.")
    raise last_error


def download_file(url, local_filepath, max_retries=MAX_RETRIES):
    """Download a file using curl.exe (to bypass bot detection like Cloudflare), falling back to urllib."""
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            # Try native curl.exe / curl first
            cmd = [
                'curl.exe',
                '-#',  # simple progress bar
                '-L',
                '-o', local_filepath,
                '--max-time', '300',
                '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                url
            ]
            result = subprocess.run(cmd, timeout=300)
            if result.returncode == 0 and os.path.exists(local_filepath) and os.path.getsize(local_filepath) > 0:
                return True
            else:
                raise Exception(f"curl download failed with code {result.returncode}")
        except Exception as e:
            # Fallback to urllib.request
            try:
                headers = get_browser_headers(referer=url)
                req = urllib.request.Request(url, headers=headers)
                response = urllib.request.urlopen(req, context=SSL_CTX, timeout=120)
                total_size = int(response.info().get('Content-Length', 0))
                block_size = 1024 * 64
                downloaded = 0

                with open(local_filepath, 'wb') as f:
                    while True:
                        buffer = response.read(block_size)
                        if not buffer:
                            break
                        f.write(buffer)
                        downloaded += len(buffer)
                        if total_size > 0:
                            percent = min(100, int(downloaded * 100 / total_size))
                            bar = '#' * (percent // 5) + '-' * (20 - (percent // 5))
                            sys.stdout.write(f"\r  Downloading: [{bar}] {percent}% ({downloaded / (1024*1024):.1f}MB / {total_size / (1024*1024):.1f}MB)")
                            sys.stdout.flush()

                if total_size > 0:
                    print()  # newline after progress bar
                return True
            except Exception as e2:
                last_error = e2
                if os.path.exists(local_filepath):
                    try:
                        os.remove(local_filepath)
                    except Exception:
                        pass
                if attempt < max_retries:
                    wait = RETRY_BASE_DELAY * attempt + random.uniform(0, 2)
                    print(f"\n  Download attempt {attempt}/{max_retries} failed (curl: {e}, urllib: {e2})")
                    print(f"  Waiting {wait:.1f}s before retry...")
                    time.sleep(wait)
                else:
                    print(f"\n  All {max_retries} download attempts failed.")
    raise last_error


# ── Authentication ──────────────────────────────────────────────────

def _try_login(api_base, email, password):
    """Attempt login and return True if successful."""
    global AUTH_TOKEN
    login_url = f"{api_base}/api/auth/login"
    payload = json.dumps({"email": email, "password": password}).encode('utf-8')
    
    req = urllib.request.Request(
        login_url,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'SermonCrawler/1.0'
        },
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get('token'):
                AUTH_TOKEN = data['token']
                print(f"  Authenticated as {email} (role: {data.get('role', 'admin')})")
                return True
    except Exception:
        pass
    return False


def login_to_contabo(api_base):
    """Auto-login with default credentials, prompt only if that fails."""
    global AUTH_TOKEN
    
    print("\n--- Server Authentication ---")
    
    # Try default credentials automatically
    default_email = "admin@joshuagen.org"
    default_password = "admin123"
    print(f"  Trying default admin credentials ({default_email})...")
    
    if _try_login(api_base, default_email, default_password):
        return True
    
    # Default failed, try manual entry
    print("  Default credentials failed. Please enter manually.")
    for attempt in range(3):
        email = input(f"  Admin email [{default_email}]: ").strip() or default_email
        password = getpass.getpass("  Admin password: ")
        if _try_login(api_base, email, password):
            return True
        print(f"  Login failed (attempt {attempt+1}/3)")
    
    return False


# ── HTML/RSS Parsing ────────────────────────────────────────────────

def clean_html(raw_html):
    if not raw_html:
        return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext.strip()


def parse_rss_feed(url):
    print(f"Fetching RSS feed from: {url}...")
    xml_data = fetch_url(url)
    root = ET.fromstring(xml_data)
    items = []

    ns = {
        'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
        'media': 'http://search.yahoo.com/mrss/',
        'content': 'http://purl.org/rss/1.0/modules/content/'
    }

    for item in root.findall('.//item'):
        title = item.find('title')
        title_text = title.text if title is not None else "Untitled Sermon"

        audio_url = ""
        enclosure = item.find('enclosure')
        if enclosure is not None:
            audio_url = enclosure.get('url', '')

        description = ""
        desc_node = item.find('description')
        if desc_node is not None:
            description = clean_html(desc_node.text)

        image_url = ""
        itunes_image = item.find('itunes:image', ns)
        if itunes_image is not None:
            image_url = itunes_image.get('href', '')
        if not image_url:
            media_content = item.find('media:content', ns)
            if media_content is not None:
                image_url = media_content.get('url', '')
        if not image_url:
            channel_image = root.find('.//channel/image/url')
            if channel_image is not None:
                image_url = channel_image.text

        pub_date = ""
        date_node = item.find('pubDate')
        if date_node is not None:
            try:
                parsed_date = datetime.strptime(date_node.text[:25].strip(), "%a, %d %b %Y %H:%M:%S")
                pub_date = parsed_date.strftime("%Y-%m-%d")
            except Exception:
                pub_date = date_node.text

        duration = ""
        itunes_dur = item.find('itunes:duration', ns)
        if itunes_dur is not None and itunes_dur.text:
            duration = itunes_dur.text.strip()

        if audio_url:
            items.append({
                'title': title_text,
                'audioUrl': audio_url,
                'imageUrl': image_url,
                'description': description,
                'date': pub_date,
                'duration': duration
            })

    return items


def extract_sermon_details_from_post(url):
    """Visit a single sermon page and extract audio/image/title."""
    print(f"  Visiting: {url}...")
    try:
        # Significant pause between requests to avoid rate limiting
        time.sleep(random.uniform(3.0, 6.0))
        html = fetch_url(url).decode('utf-8', errors='ignore')

        title = ""
        title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        if title_match:
            title = title_match.group(1).split('|')[0].split(' - ')[0].strip()

        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        if h1_match:
            h1_text = clean_html(h1_match.group(1))
            if h1_text:
                title = h1_text

        description = ""
        desc_match = re.search(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\'](.*?)["\']', html, re.IGNORECASE)
        if not desc_match:
            desc_match = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', html, re.IGNORECASE)
        if desc_match:
            description = desc_match.group(1).strip()

        image_url = ""
        img_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\'](.*?)["\']', html, re.IGNORECASE)
        if img_match:
            image_url = img_match.group(1).strip()

        audio_url = ""
        # Find any matching audio url with extensions mp3, m4a, wav, ogg, aac (with optional query string)
        audio_match = re.search(r'(?:href|src)=["\']([^"\'>\s]+\.(?:mp3|m4a|wav|ogg|aac)(?:\?[^"\'>\s]*)?)["\']', html, re.IGNORECASE)
        if audio_match:
            matched_url = audio_match.group(1).strip()
            # If relative, join with page URL
            if not matched_url.startswith('http'):
                audio_url = urllib.parse.urljoin(url, matched_url)
            else:
                audio_url = matched_url

        if audio_url:
            print(f"    -> Audio: {audio_url[:70]}...")
            return {
                'title': title if title else "Untitled Sermon",
                'audioUrl': audio_url,
                'imageUrl': image_url,
                'description': description if description else "Imported from sermon page.",
                'date': datetime.now().strftime("%Y-%m-%d"),
                'duration': ""
            }
        else:
            print(f"    -> No audio found on this page.")
    except Exception as e:
        print(f"    -> Error: {e}")
    return None


def parse_html_page(url):
    """Parse a sermon listing page and find individual sermon links."""
    print(f"Scraping listing page: {url}...")
    html = fetch_url(url).decode('utf-8', errors='ignore')

    link_pattern = re.compile(r'href=["\'](https?://[^"\']+)["\']', re.IGNORECASE)
    all_links = list(set(link_pattern.findall(html)))

    parsed_source = urllib.parse.urlparse(url)
    source_domain = parsed_source.netloc

    sermon_post_links = []
    for link in all_links:
        parsed_link = urllib.parse.urlparse(link)
        if parsed_link.netloc != source_domain:
            continue
        if any(x in link.lower() for x in ['/category/', '/tag/', '/feed/', '/page/', '/wp-content/', '/wp-admin/', '?share=', 'facebook.com', 'twitter.com']):
            continue
        if '/sermon/' in link.lower() or '/sermons/' in link.lower():
            if link != url:
                sermon_post_links.append(link)

    if not sermon_post_links:
        for link in all_links:
            parsed_link = urllib.parse.urlparse(link)
            if parsed_link.netloc != source_domain:
                continue
            path_parts = [p for p in parsed_link.path.split('/') if p]
            if len(path_parts) >= 1 and not any(x in link.lower() for x in ['/category/', '/tag/', '/feed/', '/page/', '/contact', '/about', '/donate', '/give', '/wp-includes/']):
                if link != url:
                    sermon_post_links.append(link)

    sermon_post_links = sorted(list(set(sermon_post_links)))

    items = []
    if sermon_post_links:
        print(f"\nFound {len(sermon_post_links)} potential sermon pages:")
        for i, link in enumerate(sermon_post_links, 1):
            print(f"  [{i}] {link}")

        scan_choice = input("\nScan these pages for audio? (y/n) [y]: ").strip().lower()
        if scan_choice != 'n':
            max_scan = input("How many to scan? (Enter = all): ").strip()
            limit = int(max_scan) if max_scan.isdigit() else len(sermon_post_links)

            for post_url in sermon_post_links[:limit]:
                details = extract_sermon_details_from_post(post_url)
                if details:
                    items.append(details)
            return items

    # Fallback: look for direct audio links on the page
    audio_pattern = re.compile(r'(?:href|src)=["\']([^"\'>\s]+\.(?:mp3|m4a|wav|ogg|aac)(?:\?[^"\'>\s]*)?)["\']', re.IGNORECASE)
    audio_links = list(set(audio_pattern.findall(html)))

    for idx, matched_link in enumerate(audio_links):
        full_audio_url = matched_link if matched_link.startswith('http') else urllib.parse.urljoin(url, matched_link)
        filename = os.path.basename(urllib.parse.urlparse(full_audio_url).path)
        title = os.path.splitext(filename)[0].replace('-', ' ').replace('_', ' ').title()
        items.append({
            'title': f"{title} (Scraped #{idx+1})",
            'audioUrl': full_audio_url,
            'imageUrl': "",
            'description': "Scraped directly from page link.",
            'date': datetime.now().strftime("%Y-%m-%d"),
            'duration': ""
        })

    return items


# ── Contabo Server API ──────────────────────────────────────────────

def upload_file_to_contabo(api_base, local_filepath, original_name):
    """Upload a local file to the Contabo server with auth."""
    upload_url = f"{api_base}/api/upload?filename={urllib.parse.quote(original_name)}"
    file_size = os.path.getsize(local_filepath)
    print(f"  Uploading {file_size / (1024*1024):.1f}MB to server...")
    
    with open(local_filepath, 'rb') as f:
        file_data = f.read()

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(
                upload_url,
                data=file_data,
                headers={
                    'Content-Type': 'application/octet-stream',
                    'Authorization': f'Bearer {AUTH_TOKEN}',
                    'User-Agent': 'SermonCrawler/1.0'
                },
                method='POST'
            )
            with urllib.request.urlopen(req, context=SSL_CTX, timeout=300) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                return res_data.get('url')
        except urllib.error.HTTPError as he:
            try:
                err_body = he.read().decode('utf-8', errors='ignore')
                print(f"  Upload HTTP error {he.code}: {err_body}")
            except:
                print(f"  Upload HTTP error {he.code}: {he.reason}")
            if attempt < MAX_RETRIES:
                wait = RETRY_BASE_DELAY * attempt
                print(f"  Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise he
        except Exception as e:
            if attempt < MAX_RETRIES:
                wait = RETRY_BASE_DELAY * attempt
                print(f"  Upload attempt {attempt} failed: {e}")
                print(f"  Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise


def fetch_existing_sermons(api_base):
    """Retrieve existing sermons list from the Contabo server to prevent duplicate imports."""
    sermons_url = f"{api_base}/api/sermons"
    req = urllib.request.Request(
        sermons_url,
        headers={
            'Accept': 'application/json',
            'User-Agent': 'SermonCrawler/1.0'
        }
    )
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=20) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"  Warning: Could not fetch existing sermons list ({e}). Skipping duplication check.")
        return []


def save_sermon_to_contabo(api_base, sermon_payload):
    """Save a sermon record to the Contabo server with auth."""
    sermon_url = f"{api_base}/api/sermons"
    
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(
                sermon_url,
                data=json.dumps(sermon_payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {AUTH_TOKEN}',
                    'User-Agent': 'SermonCrawler/1.0'
                },
                method='POST'
            )
            with urllib.request.urlopen(req, context=SSL_CTX, timeout=30) as response:
                return response.read().decode('utf-8')
        except Exception as e:
            if attempt < MAX_RETRIES:
                wait = RETRY_BASE_DELAY * attempt
                print(f"  API attempt {attempt} failed: {e}")
                print(f"  Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise


# ── Input Helpers ───────────────────────────────────────────────────

def flush_stdin():
    """Flush any leftover data in stdin."""
    try:
        import msvcrt
        while msvcrt.kbhit():
            msvcrt.getch()
    except ImportError:
        pass


def is_valid_url(text):
    return text.startswith("http://") or text.startswith("https://")


# ── Main ────────────────────────────────────────────────────────────

def main():
    flush_stdin()

    print()
    print("=" * 60)
    print("   JOSHUA GENERATION SERMON CRAWLER & IMPORT")
    print("=" * 60)

    # Support command-line arguments
    cli_source_url = sys.argv[1] if len(sys.argv) > 1 else ""
    cli_api_base = sys.argv[2] if len(sys.argv) > 2 else ""

    if cli_api_base and is_valid_url(cli_api_base):
        api_base = cli_api_base.rstrip('/')
    else:
        host_input = input("Enter Contabo Server API URL [https://joshuasgeneration.com]: ").strip()
        api_base = host_input if host_input and is_valid_url(host_input) else "https://joshuasgeneration.com"
        api_base = api_base.rstrip('/')

    # ── Authentication ──
    if not login_to_contabo(api_base):
        print("Cannot proceed without authentication.")
        return

    # ── Source URLs ──
    source_urls = []
    if cli_source_url:
        for u in cli_source_url.split(','):
            u_clean = u.strip()
            if is_valid_url(u_clean):
                source_urls.append(u_clean)
        print(f"\nUsing URL(s): {source_urls}")
    
    if not source_urls:
        while len(source_urls) < 1:
            raw_input_val = input("\nEnter WordPress RSS Feed or Sermon Page URL: ").strip()
            if not raw_input_val:
                print("URL is required!")
                continue
            if not is_valid_url(raw_input_val):
                print("Invalid URL - must start with http:// or https://")
                continue
            source_urls.append(raw_input_val)

    # ── Crawl ──
    items = []
    seen_audios = set()
    for source_url in source_urls:
        print(f"\nProcessing source URL: {source_url}")
        url_items = []
        try:
            if "feed" in source_url.lower() or source_url.endswith(".xml"):
                url_items = parse_rss_feed(source_url)
            else:
                url_items = parse_html_page(source_url)
                if not url_items:
                    try:
                        url_items = parse_rss_feed(source_url)
                    except Exception:
                        pass
        except Exception as e:
            print(f"Error parsing source: {e}")
            try:
                url_items = parse_html_page(source_url)
            except Exception as e2:
                print(f"Fallback also failed: {e2}")
        
        for item in url_items:
            audio_url = item.get('audioUrl', '')
            if audio_url and audio_url not in seen_audios:
                seen_audios.add(audio_url)
                items.append(item)

    if not items:
        print("\nNo sermons could be extracted from the provided link.")
        return

    # ── Display Results ──
    print(f"\n{'='*60}")
    print(f"  Found {len(items)} sermons")
    print(f"{'='*60}")
    for idx, item in enumerate(items):
        print(f"\n  [{idx+1}] {item['title']}")
        print(f"      Audio: {item['audioUrl'][:75]}...")
        if item['imageUrl']:
            print(f"      Image: {item['imageUrl'][:75]}...")
    print(f"\n{'-'*60}")

    # ── Import Mode Selection ──
    print("\nImport Mode:")
    print("  [1] DIRECT LINK — Use WordPress URLs directly (fast, no downloading)")
    print("  [2] DOWNLOAD+UPLOAD — Download files, re-upload to Contabo server")
    print("  [3] Cancel & Exit")
    mode = input("Select mode [1]: ").strip()
    if mode == '3':
        print("Cancelled.")
        return
    if mode not in ['1', '2', '']:
        mode = '1'
    if mode == '':
        mode = '1'

    # ── Import Option ──
    print("\nImport Option:")
    print("  [a] Auto-import ALL sermons")
    print("  [i] Interactive (choose per sermon)")
    import_mode = input("Select [a]: ").strip().lower()
    if import_mode not in ['a', 'i', '']:
        import_mode = 'a'
    if import_mode == '':
        import_mode = 'a'

    # ── Speaker & Category ──
    default_speaker = "Apostle Joshua Iyemifokhae"
    speaker = input(f"Speaker [{default_speaker}]: ").strip()
    if not speaker:
        speaker = default_speaker

    default_category = "Faith"
    category = input(f"Category [{default_category}]: ").strip()
    if not category:
        category = default_category

    # Fetch existing sermons to prevent duplicates
    print("\nFetching existing sermons from server to check for duplicates...")
    existing_sermons = fetch_existing_sermons(api_base)
    existing_titles = {s.get('title', '').strip().lower() for s in existing_sermons if s.get('title')}
    existing_audio_urls = {s.get('audioUrl', '').strip().lower() for s in existing_sermons if s.get('audioUrl')}
    print(f"  Found {len(existing_sermons)} existing sermons on the server.")

    # ── Process ──
    print(f"\n{'='*60}")
    print(f"  Starting import ({len(items)} sermons, mode={'Direct Link' if mode == '1' else 'Download+Upload'})...")
    print(f"{'='*60}")

    imported_count = 0
    skipped_count = 0

    for idx, item in enumerate(items):
        title_lower = item['title'].strip().lower()
        audio_lower = item['audioUrl'].strip().lower()

        if title_lower in existing_titles or audio_lower in existing_audio_urls:
            print(f"\n[{idx+1}/{len(items)}] '{item['title']}'")
            print("  Already imported. Skipping.")
            skipped_count += 1
            continue

        print(f"\n[{idx+1}/{len(items)}] '{item['title']}'")

        if import_mode == 'i':
            confirm = input("  Import? (y/n/stop): ").strip().lower()
            if confirm == 'stop':
                break
            if confirm != 'y':
                print("  Skipped.")
                skipped_count += 1
                continue

        audio_path = ""
        thumb_path = ""
        duration = item.get('duration', '').strip()

        if mode == '1':
            # Direct link mode — use the WordPress URLs directly
            audio_path = item['audioUrl']
            thumb_path = item['imageUrl'] if item['imageUrl'] else ""
            print(f"  Using direct audio link: {audio_path[:70]}...")
            if not duration:
                print("  Calculating audio duration from remote stream...")
                duration = get_remote_audio_duration(audio_path)
                print(f"  Duration: {duration}")
        else:
            # Download + Upload mode
            # Download & upload thumbnail
            if item['imageUrl']:
                print("  Downloading cover image...")
                parsed_img = urllib.parse.urlparse(item['imageUrl'])
                img_filename = os.path.basename(parsed_img.path)
                if not img_filename or '.' not in img_filename:
                    img_filename = "thumbnail.jpg"
                temp_img = os.path.join(os.getcwd(), f"temp_{img_filename}")
                try:
                    download_file(item['imageUrl'], temp_img)
                    thumb_path = upload_file_to_contabo(api_base, temp_img, img_filename)
                    print(f"  Thumbnail uploaded: {thumb_path}")
                except Exception as e:
                    print(f"  Image failed: {e}")
                finally:
                    if os.path.exists(temp_img):
                        try:
                            os.remove(temp_img)
                        except Exception:
                            pass

            # Download & upload audio
            print("  Downloading audio file...")
            parsed_audio = urllib.parse.urlparse(item['audioUrl'])
            audio_filename = os.path.basename(parsed_audio.path)
            if not audio_filename.lower().endswith('.mp3'):
                audio_filename = "sermon.mp3"
            temp_audio = os.path.join(os.getcwd(), f"temp_{audio_filename}")
            try:
                download_file(item['audioUrl'], temp_audio)
                if not duration:
                    print("  Calculating audio duration from downloaded file...")
                    duration = get_audio_duration(temp_audio)
                    print(f"  Duration: {duration}")
                audio_path = upload_file_to_contabo(api_base, temp_audio, audio_filename)
                print(f"  Audio uploaded: {audio_path}")
            except Exception as e:
                print(f"  Audio failed: {e}")
            finally:
                if os.path.exists(temp_audio):
                    try:
                        os.remove(temp_audio)
                    except Exception:
                        pass

        if not audio_path:
            print("  SKIPPED — no audio available.")
            skipped_count += 1
            continue

        if not duration:
            duration = "45:00"

        # Create sermon record
        sermon_id = f"sermon_{int(time.time())}{random.randint(100, 999)}"
        sermon_date = item['date'] if item['date'] else datetime.now().strftime("%Y-%m-%d")

        sermon_payload = {
            "id": sermon_id,
            "title": item['title'],
            "speaker": speaker,
            "duration": duration,
            "thumbnail": thumb_path,
            "audioUrl": audio_path,
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
            print(f"  SUCCESS — imported!")
            imported_count += 1
        except Exception as e:
            print(f"  FAILED — {e}")

        # Safety pause between imports
        time.sleep(2.0)

    print(f"\n{'='*60}")
    print(f"  IMPORT COMPLETE")
    print(f"  Imported: {imported_count}")
    print(f"  Skipped:  {skipped_count}")
    print(f"  Failed:   {len(items) - imported_count - skipped_count}")
    print(f"{'='*60}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
