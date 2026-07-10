import urllib.request
import json

def test_api():
    try:
        # 1. Fetch all sermons
        url = "https://joshuasgeneration.com/api/sermons"
        print(f"Fetching sermons from: {url}")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            sermons = json.loads(response.read().decode('utf-8'))
            
        if not sermons:
            print("No sermons found.")
            return
            
        first_sermon = sermons[0]
        sermon_id = first_sermon['id']
        title = first_sermon['title']
        initial_downloads = first_sermon.get('downloads', 0)
        print(f"\nFirst Sermon: '{title}' (ID: {sermon_id})")
        print(f"Initial download count: {initial_downloads}")
        
        # 2. Increment download count
        inc_url = f"https://joshuasgeneration.com/api/sermons/{sermon_id}/download"
        print(f"\nIncrementing download count via POST: {inc_url}")
        inc_req = urllib.request.Request(inc_url, data=b"", headers={'User-Agent': 'Mozilla/5.0'}, method='POST')
        with urllib.request.urlopen(inc_req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            print("Response:", res_data)
            
        # 3. Fetch again to confirm persistence
        print(f"\nFetching sermons again to verify persistence...")
        with urllib.request.urlopen(req) as response:
            sermons_new = json.loads(response.read().decode('utf-8'))
            
        updated_sermon = next(s for s in sermons_new if s['id'] == sermon_id)
        new_downloads = updated_sermon.get('downloads', 0)
        print(f"New download count: {new_downloads}")
        
        if new_downloads == initial_downloads + 1:
            print("\nSUCCESS: Download count incremented and persisted successfully!")
        else:
            print("\nFAILURE: Download count did not increment correctly.")
            
    except Exception as e:
        print("Error during test:", e)

if __name__ == "__main__":
    test_api()
