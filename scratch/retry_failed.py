import json
import os
import re
import subprocess
import time

BITRATES = {
    1: {
        1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
        2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
        3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
    },
    2: {
        1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
        2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
        3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
    }
}

def get_remote_audio_duration(audio_url):
    try:
        curl_bin = 'curl'
        cmd = [curl_bin, '-i', '-L', '-k', '-r', '0-32768', '-s', '--connect-timeout', '15', audio_url]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output = res.stdout
        
        if len(output) < 4:
            return None

        parts = output.split(b'\r\n\r\n', 1)
        if len(parts) < 2:
            parts = output.split(b'\n\n', 1)
        if len(parts) < 2:
            return None

        headers_text = parts[0].decode('utf-8', errors='ignore')
        buffer = parts[1]

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

        offset = 0
        if buffer[0:3] == b'ID3':
            size = ((buffer[6] & 0x7F) << 21) | \
                   ((buffer[7] & 0x7F) << 14) | \
                   ((buffer[8] & 0x7F) << 7)  | \
                   (buffer[9] & 0x7F)
            offset = size + 10

        if offset >= len(buffer) - 3:
            cmd_next = [curl_bin, '-i', '-L', '-k', '-r', f'{offset}-{offset+8192}', '-s', '--connect-timeout', '15', audio_url]
            res_next = subprocess.run(cmd_next, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            output_next = res_next.stdout
            parts_next = output_next.split(b'\r\n\r\n', 1)
            if len(parts_next) < 2:
                parts_next = output_next.split(b'\n\n', 1)
            if len(parts_next) >= 2:
                buffer = parts_next[1]
                offset = 0

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
        pass
    return None

def main():
    sermons_file = '/Users/macbook/Downloads/joshuageneration/server/data/sermons.json'
    private_file = '/Users/macbook/Downloads/joshuageneration/server/private_sermons.json'
    default_file = '/Users/macbook/Downloads/joshuageneration/server/default_data.json'

    # Load files
    with open(sermons_file, 'r', encoding='utf-8') as f:
        sermons = json.load(f)
    with open(private_file, 'r', encoding='utf-8') as f:
        private = json.load(f)
    with open(default_file, 'r', encoding='utf-8') as f:
        defaults = json.load(f)
    default_sermons = defaults.get('sermons', [])
    
    # Target URLs
    target_urls = [
        "https://joshuasgeneration.net/wp-content/uploads/2025/09/Understanding-Angels-By-Apostle-Joshua-Iyemifokhae-Part-2.mp3",
        "https://joshuasgeneration.net/wp-content/uploads/2025/10/UNDERSTANDING-FASTING-BY-APOSTLE-JOSHUA-IYEMIFOKHAE-PART-1.mp3"
    ]
    
    resolved = {}
    for url in target_urls:
        print(f"Retrying: {url}")
        dur = get_remote_audio_duration(url)
        if dur:
            resolved[url] = dur
            print(f" -> SUCCESS: {dur}")
        else:
            print(" -> FAILED")
        time.sleep(2)  # Pause to avoid rate limits
        
    if not resolved:
        print("No URLs resolved. Exiting.")
        return
        
    # Update sermons.json
    for s in sermons:
        for t in s.get('audios', []):
            if t.get('audioUrl') in resolved:
                t['duration'] = resolved[t['audioUrl']]
                print(f"Updated track in sermons.json: {t['title']} -> {resolved[t['audioUrl']]}")
                
    # Update private_sermons.json
    for s in private:
        for t in s.get('audios', []):
            if t.get('audioUrl') in resolved:
                t['duration'] = resolved[t['audioUrl']]
                print(f"Updated track in private_sermons.json: {t['title']} -> {resolved[t['audioUrl']]}")
                
    # Sync public changes to default_data.json
    sermons_by_id = {s['id']: s for s in sermons}
    for s in default_sermons:
        sid = s['id']
        if sid in sermons_by_id:
            s['audios'] = sermons_by_id[sid].get('audios', [])
            
    # Save back
    with open(sermons_file, 'w', encoding='utf-8') as f:
        json.dump(sermons, f, indent=2, ensure_ascii=False)
    with open(private_file, 'w', encoding='utf-8') as f:
        json.dump(private, f, indent=2, ensure_ascii=False)
    with open(default_file, 'w', encoding='utf-8') as f:
        json.dump(defaults, f, indent=2, ensure_ascii=False)
        
    print("Files updated successfully.")

if __name__ == '__main__':
    main()
