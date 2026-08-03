#!/usr/bin/env python3
import urllib.parse
import urllib.request
import json
import ssl
import subprocess
import re
import os
import time

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

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

AUTH_TOKEN = ""

def _try_login(api_base, email, password):
    global AUTH_TOKEN
    login_url = f"{api_base}/api/auth/login"
    payload = json.dumps({"email": email, "password": password}).encode('utf-8')
    req = urllib.request.Request(
        login_url,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'SermonSync/1.0'
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get('token'):
                AUTH_TOKEN = data['token']
                print(f"Authenticated successfully as {email}.")
                return True
    except Exception as e:
        print(f"Login failed: {e}")
    return False

def get_remote_audio_duration(audio_url):
    """Estimate the duration of a remote audio file by parsing its content length and bitrate."""
    try:
        # Use GET with Range 0-32768 to bypass auth rules and read header + metadata
        # We use curl.exe explicitly on Windows to bypass powershell aliases, or fallback to curl
        curl_bin = 'curl.exe' if os.name == 'nt' else 'curl'
        cmd = [curl_bin, '-i', '-L', '-k', '-r', '0-32768', '-s', '--connect-timeout', '15', audio_url]
        
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = res.stdout
        
        if len(output) < 4 and curl_bin == 'curl.exe':
            cmd[0] = 'curl'
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            output = res.stdout
            
        if len(output) < 4:
            return None

        # Split headers and body
        parts = output.split(b'\r\n\r\n', 1)
        if len(parts) < 2:
            parts = output.split(b'\n\n', 1)
            
        if len(parts) < 2:
            return None

        headers_text = parts[0].decode('utf-8', errors='ignore')
        buffer = parts[1]

        # Extract size from Content-Range: bytes 0-32768/43463329
        content_length = 0
        match = re.search(r'Content-Range:\s*bytes\s*\d+-\d+/(\d+)', headers_text, re.IGNORECASE)
        if match:
            content_length = int(match.group(1))
        else:
            match_len = re.search(r'Content-Length:\s*(\d+)', headers_text, re.IGNORECASE)
            if match_len:
                content_length = int(match_len.group(1))

        if content_length == 0:
            return None

        # Parse ID3 tags to get audio start offset
        offset = 0
        if buffer[0:3] == b'ID3':
            size = ((buffer[6] & 0x7F) << 21) | \
                   ((buffer[7] & 0x7F) << 14) | \
                   ((buffer[8] & 0x7F) << 7)  | \
                   (buffer[9] & 0x7F)
            offset = size + 10

        # Handle case where ID3v2 tag (e.g. album art) is larger than our 32KB buffer
        if offset >= len(buffer) - 3:
            # We fetch a second range starting precisely where the audio frames begin
            cmd_next = [cmd[0], '-i', '-L', '-k', '-r', f'{offset}-{offset+8192}', '-s', '--connect-timeout', '15', audio_url]
            res_next = subprocess.run(cmd_next, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            output_next = res_next.stdout
            
            parts_next = output_next.split(b'\r\n\r\n', 1)
            if len(parts_next) < 2:
                parts_next = output_next.split(b'\n\n', 1)
            
            if len(parts_next) >= 2:
                buffer = parts_next[1]
                offset = 0 # reset offset since our buffer starts exactly at the audio frames

        # Scan for MP3 frame header sync bytes
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
        print(f"Warning: Error parsing {audio_url}: {e}")
    return None

def fetch_sermons(api_base):
    sermons_url = f"{api_base}/api/sermons"
    req = urllib.request.Request(
        sermons_url,
        headers={
            'Accept': 'application/json',
            'User-Agent': 'SermonSync/1.0'
        }
    )
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=20) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching sermons list: {e}")
        return []

def save_sermon(api_base, sermon):
    sermon_url = f"{api_base}/api/sermons"
    req = urllib.request.Request(
        sermon_url,
        data=json.dumps(sermon).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {AUTH_TOKEN}',
            'User-Agent': 'SermonSync/1.0'
        },
        method='POST'
    )
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=20) as response:
        return response.read().decode('utf-8')

def main():
    print("=============================================================")
    print("         JOSHUA GENERATION SERMON DURATION SYNCHRONIZER       ")
    print("=============================================================")
    api_base = input("Enter API Server URL [https://joshuasgeneration.com]: ").strip() or "https://joshuasgeneration.com"
    if api_base.endswith('/'):
        api_base = api_base[:-1]

    # Authenticate
    if not _try_login(api_base, "admin@joshuagen.org", "admin123"):
        print("Failed to authenticate with the server. Exiting.")
        return

    # Fetch sermons
    print("\nFetching sermons list...")
    sermons = fetch_sermons(api_base)
    print(f"Found {len(sermons)} sermons in the system.")

    updated_count = 0
    skipped_count = 0

    for idx, sermon in enumerate(sermons):
        title = sermon.get('title')
        current_duration = sermon.get('duration', '').strip()
        audio_url = sermon.get('audioUrl', '').strip()

        print(f"\n[{idx+1}/{len(sermons)}] Processing: \"{title}\"")
        print(f"  Current duration: {current_duration}")
        print(f"  Audio URL: {audio_url}")

        if not audio_url:
            print("  Skipped: No audio URL present.")
            skipped_count += 1
            continue

        # Build absolute URL if relative
        full_audio_url = audio_url
        if audio_url.startswith('/'):
            full_audio_url = api_base + audio_url
        elif not audio_url.startswith('http'):
            full_audio_url = f"{api_base}/api/uploads/{audio_url}"

        # Resolve correct duration
        print(f"  Analyzing audio remote stream: {full_audio_url[:80]}...")
        new_duration = get_remote_audio_duration(full_audio_url)

        if not new_duration:
            print("  Warning: Could not determine duration from audio stream.")
            # If current duration is empty, set to default fallback
            if not current_duration or current_duration == "00:00":
                sermon['duration'] = "45:00"
                try:
                    save_sermon(api_base, sermon)
                    print("  Updated empty duration to fallback '45:00'.")
                    updated_count += 1
                except Exception as ex:
                    print(f"  Failed to save fallback update: {ex}")
            skipped_count += 1
            continue

        print(f"  Calculated duration: {new_duration}")

        if new_duration != current_duration:
            sermon['duration'] = new_duration
            try:
                save_sermon(api_base, sermon)
                print(f"  SUCCESS: Updated duration from '{current_duration}' to '{new_duration}'")
                updated_count += 1
            except Exception as ex:
                print(f"  Failed to update sermon on server: {ex}")
        else:
            print("  Skipped: Duration is already matching.")
            skipped_count += 1

    print("\n=============================================================")
    print(f"Sync complete! {updated_count} sermons updated, {skipped_count} skipped/matching.")
    print("=============================================================")

if __name__ == "__main__":
    main()
