import urllib.request
import urllib.parse
import re

def get_images_ddg_html(query, count=6):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    }
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            # Extract image URLs from DDG html or proxy
            imgs = re.findall(r'//external-content\.duckduckgo\.com/iu/\?u=([^&"]+)', html)
            urls = [urllib.parse.unquote(u) for u in imgs]
            return urls[:count]
    except Exception as e:
        print("Error DDG HTML:", e)
        return []

def get_images_yahoo(query, count=6):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    }
    url = f"https://images.search.yahoo.com/search/images?p={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            # Yahoo image URLs are in imgurl="http..."
            img_urls = re.findall(r'imgurl=(http[s]?://[^&"]+)', html)
            clean = []
            for u in img_urls:
                u_dec = urllib.parse.unquote(u)
                u_low = u_dec.lower()
                if any(ext in u_low for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    if not any(bad in u_low for bad in ['watermark', 'wm', 'logo', 'icon', 'shutterstock']):
                        clean.append(u_dec)
                        if len(clean) >= count:
                            break
            return clean
    except Exception as e:
        print("Error Yahoo:", e)
        return []

if __name__ == '__main__':
    print("Testing Yahoo Images...")
    y_imgs = get_images_yahoo("Bullpadel Hack 03 2025 paleta padel", 4)
    print("Yahoo results:", y_imgs)
