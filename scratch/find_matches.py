import json
import os

def find_matches():
    sermons_file = '/Users/macbook/Downloads/joshuageneration/server/data/sermons.json'
    default_file = '/Users/macbook/Downloads/joshuageneration/server/default_data.json'
    
    with open(sermons_file, 'r', encoding='utf-8') as f:
        sermons = json.load(f)
        
    with open(default_file, 'r', encoding='utf-8') as f:
        defaults = json.load(f)
        
    default_sermons = defaults.get('sermons', [])
    defaults_by_id = {s['id']: s for s in default_sermons}
    
    match_count = 0
    duration_updated = 0
    track_updated = 0
    
    for s in sermons:
        sid = s['id']
        if sid in defaults_by_id:
            match_count += 1
            def_s = defaults_by_id[sid]
            
            # Check main duration
            if s.get('duration') == '45:00' and def_s.get('duration') != '45:00':
                duration_updated += 1
                
            # Check audios/tracks duration
            s_audios = s.get('audios', [])
            def_audios = def_s.get('audios', [])
            def_tracks_by_id = {t['id']: t for t in def_audios if 'id' in t}
            
            for track in s_audios:
                tid = track.get('id')
                if tid in def_tracks_by_id:
                    def_t = def_tracks_by_id[tid]
                    if track.get('duration') == '45:00' and def_t.get('duration') != '45:00':
                        track_updated += 1
                        
    print(f"Total sermons in sermons.json: {len(sermons)}")
    print(f"Total sermons in default_data.json: {len(default_sermons)}")
    print(f"Matches by ID: {match_count}")
    print(f"Main durations that could be updated from default_data.json: {duration_updated}")
    print(f"Track/series durations that could be updated from default_data.json: {track_updated}")

if __name__ == '__main__':
    find_matches()
