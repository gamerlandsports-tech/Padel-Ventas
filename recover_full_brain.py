import os
import json
import re

brain_dir = r"C:\Users\Carmelo\.gemini\antigravity-ide\brain\548d40c2-aee2-4a31-b7ab-ec8b6475278f"

def scan_file(filepath):
    results = []
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for line_idx, line in enumerate(f):
                if 'images' in line or 'data:image' in line or 'cloudinary' in line:
                    # Search for base64 or cloudinary images or custom image URLs
                    base64s = re.findall(r'data:image/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+', line)
                    cloudinarys = re.findall(r'https://res\.cloudinary\.com/[^\s"\']+', line)
                    urls = re.findall(r'https?://[^\s"\']+\.(?:jpg|jpeg|png|webp)', line)
                    
                    if base64s or cloudinarys:
                        # Extract product context if available nearby
                        name_match = re.search(r'"name"\s*:\s*"([^"]+)"', line)
                        brand_match = re.search(r'"brand"\s*:\s*"([^"]+)"', line)
                        sku_match = re.search(r'"sku"\s*:\s*"([^"]+)"', line)
                        
                        name = name_match.group(1) if name_match else "Desconocido"
                        brand = brand_match.group(1) if brand_match else ""
                        sku = sku_match.group(1) if sku_match else ""
                        
                        all_imgs = base64s + cloudinarys
                        results.append({
                            'file': os.path.basename(filepath),
                            'line': line_idx,
                            'name': name,
                            'brand': brand,
                            'sku': sku,
                            'images': all_imgs
                        })
    except Exception as e:
        pass
    return results

print("=== DEEP SEARCH EN EL BRAIN ===")
all_recovered = []
for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file.endswith(('.jsonl', '.log', '.mjs', '.js', '.txt')):
            fp = os.path.join(root, file)
            res = scan_file(fp)
            all_recovered.extend(res)

print(f"Total registros con imágenes recuperados: {len(all_recovered)}")
by_product = {}
for item in all_recovered:
    key = f"{item['brand']} - {item['name']}"
    if key not in by_product:
        by_product[key] = set()
    for img in item['images']:
        by_product[key].add(img)

print("\n=== PRODUCTOS Y SUS IMÁGENES RECUPERADAS ===")
for prod, imgs in by_product.items():
    print(f"- {prod}: {len(imgs)} imagenes recuperadas")

with open(r"c:\MIS DOCUMENTOS\PADEL VENTAS\recovered_images.json", "w", encoding="utf-8") as f:
    json.dump({k: list(v) for k, v in by_product.items()}, f, ensure_ascii=False, indent=2)

print("\nGuardado en recovered_images.json")
