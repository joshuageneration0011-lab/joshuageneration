import os
import re
import html
import json
import requests
import urllib.parse
import subprocess
from bs4 import BeautifulSoup

# ==============================================================================
# Configuration
# ==============================================================================
# The source WordPress website URL (domain only)
SOURCE_WP_SITE = "https://joshuasgeneration.net"

# The target website where blogs should be migrated
TARGET_SITE = "https://joshuasgeneration.com"

# The default author name for the imported blogs
DEFAULT_AUTHOR = "Apostle Joshua Iyemifokhae"

# The default category for the imported blogs
DEFAULT_CATEGORY = "Inspiration"

# Will be populated automatically upon successful login
AUTH_TOKEN = ""


def clean_html(raw_html):
    """Decodes HTML entities in raw content strings."""
    return html.unescape(raw_html) if raw_html else ""


def strip_tags(html_str):
    """Strips all HTML tags to retrieve plain text."""
    if not html_str:
        return ""
    soup = BeautifulSoup(html_str, "html.parser")
    return soup.get_text()


def make_slug(title):
    """Generates a clean, URL-friendly slug from a title."""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')


def fetch_wp_data_with_curl(url):
    """Uses the system's curl.exe to fetch data from WordPress, bypassing Cloudflare JA3 bot fingerprint checks."""
    try:
        cmd = [
            "curl.exe",
            "-4",      # Force IPv4 to bypass IPv6 connection issues
            "-L",      # Follow redirects
            "-k",      # Ignore SSL certificate verification issues
            "--ssl-no-revoke", # Disable Windows CRL revocation check (prevents SSL error 35)
            "-s",      # Silent mode
            "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            url
        ]
        result = subprocess.run(cmd, capture_output=True, check=True)
        return result.stdout
    except Exception as e:
        print(f"Failed to fetch {url} using curl.exe: {e}")
        return None


def login():
    """Prompts the user for admin credentials and logs into the target platform to retrieve an authorization token."""
    global AUTH_TOKEN
    print("=" * 70)
    print("        JOSHUA GENERATION DIGITAL MINISTRY PLATFORM - LOGIN REQUIRED")
    print("=" * 70)
    email = input("Admin Email/Username: ").strip()
    password = input("Admin Password: ").strip()

    try:
        login_url = f"{TARGET_SITE.rstrip('/')}/api/auth/login"
        res = requests.post(login_url, json={"email": email, "password": password}, timeout=15)
        if res.status_code == 200:
            data = res.json()
            if data.get("success"):
                AUTH_TOKEN = data.get("token")
                print("\nLogin Successful! Admin session authenticated.\n")
                return True
        print(f"\nLogin Failed. Status: {res.status_code}, Response: {res.text}")
    except Exception as e:
        print(f"\nError connecting to destination login endpoint: {e}")
    return False


def upload_image(image_url, post_id):
    """Downloads a featured image from WordPress via curl.exe and streams it to the destination site."""
    if not image_url:
        print("No featured image URL provided for this post.")
        return ""

    try:
        print(f"Downloading featured image from WP (using curl): {image_url}")
        img_bytes = fetch_wp_data_with_curl(image_url)
        if not img_bytes:
            print("Failed to download image from WordPress.")
            return ""

        # Extract filename from URL
        parsed_url = urllib.parse.urlparse(image_url)
        filename = os.path.basename(parsed_url.path)
        if not filename or '.' not in filename:
            filename = f"blog_thumb_{post_id}.jpg"

        # Stream binary upload to target platform endpoint
        print(f"Streaming binary upload of image to target: {filename}")
        upload_url = f"{TARGET_SITE.rstrip('/')}/api/upload?filename={filename}"
        
        # Standard image content type mapping
        content_type = "image/jpeg"
        if filename.endswith(".png"):
            content_type = "image/png"
        elif filename.endswith(".webp"):
            content_type = "image/webp"
        elif filename.endswith(".gif"):
            content_type = "image/gif"

        upload_res = requests.post(
            upload_url,
            data=img_bytes,
            headers={
                "Content-Type": content_type,
                "Authorization": f"Bearer {AUTH_TOKEN}"
            },
            timeout=30
        )

        if upload_res.status_code == 200:
            uploaded_url = upload_res.json().get("url")
            print(f"Image uploaded successfully! Relative path: {uploaded_url}")
            return uploaded_url
        else:
            print(f"Image upload endpoint failed. Status: {upload_res.status_code}, Response: {upload_res.text}")
    except Exception as e:
        print(f"Error during image download/upload process: {e}")
    
    return ""


def import_blogs():
    # Use WordPress REST API v2 to retrieve posts with embedded featured media
    wp_api_url = f"{SOURCE_WP_SITE.rstrip('/')}/wp-json/wp/v2/posts?_embed&per_page=15"
    print(f"Requesting latest posts from: {wp_api_url}")

    try:
        wp_data_bytes = fetch_wp_data_with_curl(wp_api_url)
        if not wp_data_bytes:
            print("Failed to fetch posts from WordPress via curl.")
            return

        posts = json.loads(wp_data_bytes.decode('utf-8', errors='ignore'))
        print(f"Successfully retrieved {len(posts)} posts. Starting migration...\n")

        for post in posts:
            title = clean_html(post.get("title", {}).get("rendered", "Untitled Post"))
            wp_id = post.get("id")
            slug = post.get("slug") or make_slug(title)

            # Retrieve content and excerpt
            content_html = post.get("content", {}).get("rendered", "")
            excerpt_html = post.get("excerpt", {}).get("rendered", "")
            
            # Format clean plain-text excerpt
            excerpt = strip_tags(clean_html(excerpt_html)).strip()
            if not excerpt:
                excerpt = strip_tags(clean_html(content_html))[:160].strip() + "..."

            # Get publish date (YYYY-MM-DD)
            raw_date = post.get("date", "")
            date_str = raw_date.split("T")[0] if raw_date else "2026-07-09"

            # Parse featured image URL from embedded media object
            featured_media_url = ""
            embedded = post.get("_embedded", {})
            featured_media_list = embedded.get("wp:featuredmedia", [])
            if featured_media_list and len(featured_media_list) > 0:
                featured_media_url = featured_media_list[0].get("source_url", "")

            # Calculate read time dynamically (based on average reading speed of 200 words/min)
            text_content = strip_tags(content_html)
            word_count = len(text_content.split())
            read_time_min = max(1, round(word_count / 200))
            read_time_str = f"{read_time_min} min read"

            print("=" * 70)
            print(f"Migrating Blog Post: '{title}'")
            print(f"Source ID: {wp_id} | Slug: {slug}")

            # Download & Upload featured thumbnail
            uploaded_thumbnail_path = ""
            if featured_media_url:
                uploaded_thumbnail_path = upload_image(featured_media_url, wp_id)

            # Construct our target Blog Post payload
            blog_payload = {
                "id": str(wp_id),
                "title": title,
                "author": DEFAULT_AUTHOR,
                "date": date_str,
                "readTime": read_time_str,
                "excerpt": excerpt,
                "imageUrl": uploaded_thumbnail_path,
                "category": DEFAULT_CATEGORY,
                "content": content_html,
                "seoTitle": title,
                "seoDescription": excerpt[:150],
                "seoKeywords": "faith, sermon, revival, joshua generation",
                "slug": slug
            }

            # Send payload to destination site database save endpoint
            print("Saving blog post to destination server database...")
            save_url = f"{TARGET_SITE.rstrip('/')}/api/blog"
            save_res = requests.post(
                save_url,
                json=blog_payload,
                headers={"Authorization": f"Bearer {AUTH_TOKEN}"},
                timeout=25
            )

            if save_res.status_code == 200:
                print(f"Successfully migrated and saved: '{title}'!")
            else:
                print(f"Failed to save blog post. Status: {save_res.status_code}, Response: {save_res.text}")
            print("=" * 70 + "\n")

    except Exception as e:
        print(f"\nMigration failed due to an error: {e}")


if __name__ == "__main__":
    if login():
        import_blogs()
