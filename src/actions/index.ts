import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  uploadToGithub: defineAction({
    accept: 'form',
    input: z.object({
      file: z.instanceof(File),
      token: z.string().min(1, 'El token es obligatorio'),
      path: z.string().optional().default('1'),
      repo: z.string().optional().default('InledGroup/hosted.inled.es'),
    }),
    handler: async ({ file, token, path: subPath, repo }) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Content = btoa(binary);
        
        const cleanPath = subPath.replace(/^\/|\/$/g, '');
        const filePath = `${cleanPath}/${file.name}`;
        
        const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'Hostify-App'
          },
          body: JSON.stringify({
            message: `Actualización Hostify: ${file.name}`,
            content: base64Content,
          }),
        });

        const result = await response.json() as any;
        if (!response.ok) throw new Error(result.message || 'Error al subir');

        return { success: true, url: result.content.html_url };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
      }
    },
  }),

  updateHostify: defineAction({
    accept: 'form',
    input: z.object({
      zip: z.instanceof(File),
    }),
    handler: async ({ zip }) => {
      // IMPORTANTE: Al estar en Cloudflare Adapter, no podemos importar 'fs' al inicio.
      // Solo cargamos estos módulos si estamos en entorno DEV (local).
      if (!import.meta.env.DEV) {
        return { success: false, error: "La auto-actualización solo está disponible en modo desarrollo (local)." };
      }

      try {
        // Importaciones dinámicas con prefijo node: y @vite-ignore para evitar errores de resolución en el bundle
        const fs = await import(/* @vite-ignore */ 'node:fs');
        const path = await import(/* @vite-ignore */ 'node:path');
        const { default: AdmZip } = await import('adm-zip');
        
        const arrayBuffer = await zip.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const admZip = new AdmZip(buffer);
        
        const rootDir = process.cwd();
        
        // 1. Extraer en una carpeta temporal
        const tempDir = path.join(rootDir, '.hostify_update');
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
        fs.mkdirSync(tempDir);
        
        admZip.extractAllTo(tempDir, true);

        // 2. Identificar el contenido real
        let sourceDir = tempDir;
        const subfolders = fs.readdirSync(tempDir);
        if (subfolders.length === 1 && fs.statSync(path.join(tempDir, subfolders[0])).isDirectory()) {
          sourceDir = path.join(tempDir, subfolders[0]);
        }

        // 3. Reemplazar archivos clave (excepto public, node_modules, .git y .env)
        const itemsToUpdate = fs.readdirSync(sourceDir);
        for (const item of itemsToUpdate) {
          // Si el archivo/carpeta está en la lista de exclusión, no lo tocamos
          if (['node_modules', '.git', 'public', '.env', '.hostify_update'].includes(item)) continue;
          
          const srcPath = path.join(sourceDir, item);
          const destPath = path.join(rootDir, item);
          
          // Solo borramos el destino si vamos a meter algo nuevo en su lugar
          if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
          }
          fs.cpSync(srcPath, destPath, { recursive: true });
        }

        // Limpiar
        fs.rmSync(tempDir, { recursive: true });
        
        // Hostify OS: Forzar que el servidor detecte el cambio de archivos
        console.log("Hostify OS: Actualización de motor completada con éxito.");

        return { success: true, message: "Hostify actualizado con éxito. Reiniciando servidor..." };
      } catch (error) {
        console.error('Error en updateHostify:', error);
        return { success: false, error: error instanceof Error ? error.message : "Error fatal al actualizar." };
      }
    }
  })
};
