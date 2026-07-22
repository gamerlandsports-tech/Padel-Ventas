import fs from 'fs';

const data = JSON.parse(fs.readFileSync('recovered_images.json', 'utf8'));
console.log("=== IMÁGENES RECUPERADAS ===");
Object.entries(data).forEach(([prod, imgs]) => {
  console.log(`Producto: ${prod}`);
  imgs.forEach((img, i) => {
    console.log(`  [${i+1}] ${img.substring(0, 100)}...`);
  });
});
