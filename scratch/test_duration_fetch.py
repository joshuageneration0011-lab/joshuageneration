import subprocess
import os
import re
import ssl
import time

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

def get_remote_audio_duration(audio_url):
    try:
        curl_bin = 'curl'
        # Get headers and first 32KB
        cmd = [curl_bin, '-i', '-L', '-k', '-r', '0-32768', '-s', '--connect-timeout', '15', audio_url]
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

        # Extract size from Content-Range or Content-Length
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

        # Handle case where ID3v2 tag is larger than our buffer
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
        print(f"Error parsing: {e}")
    return None

if __name__ == '__main__':
    t0 = time.time()
    url = 'https://joshuasgeneration.net/wp-content/uploads/2026/07/The-Foundation-of-Prayer-by-Apostle-Joshua-Iyemifokhae-.mp3'
    dur = get_remote_audio_duration(url)
    print(f"URL: {url}")
    print(f"Duration: {dur}")
    print(f"Time taken: {time.time() - t0:.2f} seconds")
