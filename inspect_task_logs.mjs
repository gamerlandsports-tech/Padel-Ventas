import fs from 'fs';
import path from 'path';

const tasksDir = 'C:\\Users\\Carmelo\\.gemini\\antigravity-ide\\brain\\548d40c2-aee2-4a31-b7ab-ec8b6475278f\\.system_generated\\tasks';

function listTasks() {
  console.log("=== INSPECCIONANDO LOGS DE TAREAS ANTERIORES ===");
  if (!fs.existsSync(tasksDir)) {
    console.log("No existe el directorio de tareas");
    return;
  }

  const files = fs.readdirSync(tasksDir);
  console.log(`Archivos de log encontrados: ${files.length}`);

  const backupImages = new Map();

  for (const file of files) {
    if (file.endsWith('.log')) {
      const fullPath = path.join(tasksDir, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Buscar líneas como: [X/Y] Buscando X fotos para "NOMBRE"... ✓ Asignadas
        // O buscar Data URLs y HTTP URLs asignadas a productos
        const matches = content.match(/Buscando \d+ fotos.*?"([^"]+)"/g);
        if (matches) {
          console.log(`Log ${file}: ${matches.length} asignaciones registradas.`);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  process.exit(0);
}

listTasks();
