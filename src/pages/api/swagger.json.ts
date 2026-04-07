import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "Hostify API",
      description: "API para la gestión de archivos y actualización del motor Hostify.",
      version: "1.0.0"
    },
    paths: {
      "/api/files": {
        get: {
          summary: "Listar archivos",
          description: "Obtiene la lista completa de archivos o realiza una búsqueda filtrada.",
          parameters: [
            { name: "search", in: "query", schema: { type: "string" }, description: "Término de búsqueda" },
            { name: "path", in: "query", schema: { type: "string" }, description: "Filtrar por subcarpeta" }
          ],
          responses: { 200: { description: "Lista de archivos en JSON" } }
        }
      },
      "/api/template": {
        get: {
          summary: "Descargar Hostify Motor (.zip)",
          description: "Redirige a la última versión del código fuente de Hostify para replicar el nodo.",
          responses: { 302: { description: "Redirección al zip de GitHub" } }
        }
      }
    }
  };

  return new Response(JSON.stringify(spec), {
    headers: { 'Content-Type': 'application/json' }
  });
};
