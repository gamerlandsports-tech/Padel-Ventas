import urllib.request
import urllib.parse
import re
import json

def get_bing_images(query, count=6):
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.bing.com/images/search?q={encoded_query}&form=HDRSC2&first=1"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
            # Bing codifica las URLs directas de imagen en atributos m="{...murl:\"http...\"...}"
            murls = re.findall(r'&quot;murl&quot;:&quot;(https?://[^&]+)&quot;', html)
            if not murls:
                murls = re.findall(r'murl&quot;:&quot;(http[^&"]+)&quot;', html)
            
            # Filtrar URLs de baja calidad o marcas de agua comunes
            clean_urls = []
            for u in murls:
                u_lower = u.lower()
                # Filtrar extensiones raras o fuentes sospechosas de marcas de agua masivas
                if any(ext in u_lower for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    if not any(bad in u_lower for bad in ['watermark', 'wm', 'marca-de-agua', 'stock-photo', 'depositphotos', 'shutterstock', 'dreamstime', 'vector']):
                        clean_urls.append(u)
                        if len(clean_urls) >= count:
                            break
            return clean_urls
    except Exception as e:
        print("Error en Bing search:", e)
        return []

if __name__ == '__main__':
    print("Probando Bing Image Search en Python...")
    imgs = get_bing_images("Bullpadel Hack 03 2025 paleta", 4)
    print("Encontradas:", json.dumps(imgs, indent=2))
