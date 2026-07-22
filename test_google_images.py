import urllib.request
import urllib.parse
import re

def get_google_images(query, count=4):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    }
    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&tbm=isch&asearch=arc&async=_id:rg_s,_pms:s"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            # Extraer URLs de imágenes JPG/PNG/WEBP que empiezan con http
            matches = re.findall(r'\["(https?://[^"]+\.(?:jpg|jpeg|png|webp))",\d+,\d+\]', html, re.IGNORECASE)
            if not matches:
                matches = re.findall(r'(https?://[^\s"\'<>]+?\.(?:jpg|jpeg|png|webp))', html, re.IGNORECASE)
            
            clean = []
            for u in matches:
                u_lower = u.lower()
                if 'gstatic.com' in u_lower or 'googleusercontent.com' in u_lower:
                    continue
                if not any(bad in u_lower for bad in ['watermark', 'wm', 'shutterstock', 'stock', 'logo', 'icon', 'favicon']):
                    clean.append(u)
                    if len(clean) >= count:
                        break
            return clean
    except Exception as e:
        print("Error Google:", e)
        return []

if __name__ == '__main__':
    print("Probando Google Image Search...")
    imgs = get_google_images("Bullpadel Hack 03 2025 paleta de padel", 4)
    print("Resultados:", imgs)
