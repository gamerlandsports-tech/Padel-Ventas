import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\Carmelo\\.gemini\\antigravity-ide\\brain\\548d40c2-aee2-4a31-b7ab-ec8b6475278f';

function findImageStringsInDir(dirPath) {
  const recovered = [];
  
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.log') || file.endsWith('.jsonl') || file.endsWith('.mjs') || file.endsWith('.js') || file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Buscar data:image/ o URLs de imágenes subidas
          const base64Matches = content.match(/data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+/g);
          if (base64Matches) {
            base64Matches.forEach(b64 => {
              recovered.push({ source: file, type: 'base64', data: b64 });
            });
          }
          
          const cloudinaryMatches = content.match(/https:\/\/res\.cloudinary\.com\/[^\s"'\\]+/g);
          if (cloudinaryMatches) {
            cloudinaryMatches.forEach(url => {
              recovered.push({ source: file, type: 'cloudinary', data: url });
            });
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }
  
  walk(dirPath);
  return recovered;
}

async function recover() {
  console.log("=== REVISANDO REPOSITORIO Y LOGS HISTÓRICOS DE TAREAS PARA RECUPERAR IMÁGENES DE USUARIO ===");
  const found = findImageStringsInDir(brainDir);
  console.log(`Encontradas ${found.length} imágenes en registros históricos de tareas/logs.`);
  
  const uniqueData = new Map();
  found.forEach(item => {
    if (!uniqueData.has(item.data)) {
      uniqueData.set(item.data, item.source);
    }
  });
  
  console.log(`Únicas: ${uniqueData.size}`);
  uniqueData.forEach((src, data) => {
    console.log(`- [Origen: ${src}] ${data.substring(0, 80)}...`);
  });
  
  process.exit(0);
}

recover();
