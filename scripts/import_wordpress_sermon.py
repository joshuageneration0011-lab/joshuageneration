#!/usr/bin/env python3
import os
import sys
import json
import urllib.request
import urllib.parse
import random
import time
from datetime import datetime

def show_progress(block_num, block_size, total_size):
    if total_size <= 0:
        return
    downloaded = block_num * block_size
    percent = min(100, int(downloaded * 100 / total_size))
    bar = '#' * (percent // 5) + '-' * (20 - (percent // 5))
    sys.stdout.write(f"\rDownloading: [{bar}] {percent}% ({downloaded / (1024*1024):.2f}MB / {total_size / (1024*1024):.2f}MB)")
    sys.stdout.flush()

def main():
    print("=" * 60)
    print("      JOSHUA GENERATION SERMON IMPORT UTILITY")
    print("=" * 60)

    # 1. Input Server URL
    default_host = "https://joshuasgeneration.com"
    host_input = input(f"Enter Contabo Server API URL [{default_host}]: ").strip()
    api_base = host_input if host_input else default_host
    if api_base.endswith('/'):
        api_base = api_base[:-1]

    # 2. Input Audio URL
    audio_url = ""
    while not audio_url:
        audio_url = input("Enter WordPress/External Audio MP3 URL: ").strip()
        if not audio_url:
            print("Audio URL is required!")

    # 3. Input Sermon Title
    title = ""
    while not title:
        title = input("Enter Sermon Title: ").strip()
        if not title:
            print("Sermon Title is required!")

    # 4. Input Description
    description = input("Enter Description [Optional]: ").strip()

    # 5. Input Image URL
    thumbnail_url = input("Enter WordPress/External Thumbnail Image URL [Optional]: ").strip()

    # 6. Input Speaker Name
    default_speaker = "Apostle Joshua Iyemifokhae"
    speaker = input(f"Enter Speaker Name [{default_speaker}]: ").strip()
    if not speaker:
        speaker = default_speaker

    # 7. Input Category
    default_category = "Faith"
    category = input(f"Enter Category [{default_category}]: ").strip()
    if not category:
        category = default_category

    # --- DOWNLOAD & UPLOAD THUMBNAIL IMAGE ---
    uploaded_thumbnail_path = ""
    if thumbnail_url:
        print("\n[1/4] Downloading thumbnail image...")
        parsed_img_url = urllib.parse.urlparse(thumbnail_url)
        img_filename = os.path.basename(parsed_img_url.path)
        if not img_filename or '.' not in img_filename:
            img_filename = "thumbnail.jpg"
        
        temp_img_path = os.path.join(os.getcwd(), img_filename)
        try:
            urllib.request.urlretrieve(thumbnail_url, temp_img_path)
            print("Image download complete!")
            
            print("Uploading image to Contabo server...")
            img_upload_url = f"{api_base}/api/upload?filename={urllib.parse.quote(img_filename)}"
            with open(temp_img_path, 'rb') as f:
                img_data = f.read()
                
            req = urllib.request.Request(
                img_upload_url,
                data=img_data,
                headers={'Content-Type': 'application/octet-stream'},
                method='POST'
            )
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                uploaded_thumbnail_path = res_data.get('url')
                print(f"Image upload complete! URL: {uploaded_thumbnail_path}")
        except Exception as e:
            print(f"Failed to process image: {e}")
        finally:
            if os.path.exists(temp_img_path):
                try:
                    os.remove(temp_img_path)
                except Exception:
                    pass

    # --- DOWNLOAD & UPLOAD AUDIO FILE ---
    parsed_audio_url = urllib.parse.urlparse(audio_url)
    original_filename = os.path.basename(parsed_audio_url.path)
    if not original_filename.lower().endswith('.mp3'):
        original_filename = "sermon_imported.mp3"

    temp_filepath = os.path.join(os.getcwd(), original_filename)

    print("\n[2/4] Downloading audio from WordPress/source...")
    try:
        urllib.request.urlretrieve(audio_url, temp_filepath, reporthook=show_progress)
        print("\nDownload complete successfully!")
    except Exception as e:
        print(f"\nFailed to download audio file: {e}")
        return

    print("\n[3/4] Uploading audio to Contabo server...")
    upload_url = f"{api_base}/api/upload?filename={urllib.parse.quote(original_filename)}"
    try:
        with open(temp_filepath, 'rb') as f:
            file_data = f.read()

        req = urllib.request.Request(
            upload_url,
            data=file_data,
            headers={'Content-Type': 'application/octet-stream'},
            method='POST'
        )

        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            uploaded_audio_path = res_data.get('url')
            if not uploaded_audio_path:
                raise Exception("Server did not return url path")
            print(f"Upload complete! File URL: {uploaded_audio_path}")
    except Exception as e:
        print(f"Failed to upload audio: {e}")
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
        return

    # Clean up local temp file
    if os.path.exists(temp_filepath):
        try:
            os.remove(temp_filepath)
        except Exception:
            pass

    # --- CREATE SERMON ENTRY ---
    print("\n[4/4] Creating sermon entry on server...")
    sermon_id = f"sermon_{int(time.time())}{random.randint(100, 999)}"
    today_str = datetime.now().strftime("%Y-%m-%d")

    sermon_payload = {
        "id": sermon_id,
        "title": title,
        "speaker": speaker,
        "duration": "45:00",
        "thumbnail": uploaded_thumbnail_path,
        "audioUrl": uploaded_audio_path,
        "videoUrl": "",
        "views": 0,
        "downloads": 0,
        "date": today_str,
        "description": description if description else "Imported from WordPress archive.",
        "category": category,
        "audios": []
    }

    sermon_url = f"{api_base}/api/sermons"
    try:
        req = urllib.request.Request(
            sermon_url,
            data=json.dumps(sermon_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            print("Sermon entry created successfully on the server!")
            print(f"\nSermon details:")
            print(f"  - ID: {sermon_id}")
            print(f"  - Title: {title}")
            print(f"  - Speaker: {speaker}")
            print(f"  - Audio Path: {uploaded_audio_path}")
            print(f"  - Image Path: {uploaded_thumbnail_path}")
            print(f"  - Date: {today_str}")
            print("\nYou can now open your Admin Dashboard, view the sermon, or edit it anytime!")
    except Exception as e:
        print(f"Failed to save sermon entry: {e}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
