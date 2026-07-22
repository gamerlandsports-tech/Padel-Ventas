import fs from 'fs';
import path from 'path';

const fullLogPath = 'C:\\Users\\Carmelo\\.gemini\\antigravity-ide\\brain\\548d40c2-aee2-4a31-b7ab-ec8b6475278f\\.system_generated\\logs\\transcript_full.jsonl';

async function extractHistory() {
  console.log("=== BUSCANDO DOCUMENTOS E IMÁGENES GUARDADAS EN EL HISTORIAL COMPLETO DE TRANSCRIPCIÓN ===");

  if (!fs.existsSync(fullLogPath)) {
    console.log("No se encontró transcript_full.jsonl en:", fullLogPath);
    return;
  }

  const fileStream = fs.createReadStream(fullLogPath, { encoding: 'utf8' });
  let buffer = '';

  const foundProductPayloads = [];

  fileStream.on('data', chunk => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // guardar línea incompleta para el siguiente chunk

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        if (line.includes('images') && (line.includes('data:image') || line.includes('http'))) {
          // Buscar objetos JSON o estructuras que contengan name/brand/images
          const imgMatches = line.match(/"name":"([^"]+)".*?"images":(\[[^\]]+\])/g);
          if (imgMatches) {
            imgMatches.forEach(m => {
              foundProductPayloads.push(m);
            });
          }
        }
      } catch (e) {
        // skip
      }
    }
  });

  fileStream.on('end', () => {
    console.log(`Finalizada lectura. Encontrados ${foundProductPayloads.length} registros de productos con imágenes en la historia.`);
    foundProductPayloads.slice(0, 10).forEach((p, i) => {
      console.log(`[${i+1}] ${p.substring(0, 120)}...`);
    });
    process.exit(0);
  });
}

extractHistory();
