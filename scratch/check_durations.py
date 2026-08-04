import json
import os

def check_durations():
    sermons_file = '/Users/macbook/Downloads/joshuageneration/server/data/sermons.json'
    private_file = '/Users/macbook/Downloads/joshuageneration/server/private_sermons.json'
    default_file = '/Users/macbook/Downloads/joshuageneration/server/default_data.json'
    
    for name, path in [('sermons.json', sermons_file), ('private_sermons.json', private_file), ('default_data.json', default_file)]:
        if not os.path.exists(path):
            print(f"{name} does not exist at {path}")
            continue
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        sermon_list = data if isinstance(data, list) else data.get('sermons', [])
        
        count_45 = 0
        count_other = 0
        total_tracks = 0
        tracks_45 = 0
        
        for sermon in sermon_list:
            dur = sermon.get('duration', '')
            if dur == '45:00':
                count_45 += 1
            else:
                count_other += 1
                
            audios = sermon.get('audios', [])
            for track in audios:
                total_tracks += 1
                if track.get('duration', '') == '45:00':
                    tracks_45 += 1
                    
        print(f"{name}: {count_45} sermons have 45:00 duration, {count_other} have other durations.")
        if total_tracks > 0:
            print(f"  Tracks: {tracks_45} of {total_tracks} tracks have 45:00 duration.")

if __name__ == '__main__':
    check_durations()
