import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "Hostify API",
      description: "API para la gestión de archivos y descarga del motor Hostify.",
      version: "1.0.1"
    },
    paths: {
      "/api/files": {
        get: {
          summary: "Listar todos los archivos",
          description: "Obtiene el índice completo de archivos del repositorio. No soporta parámetros de búsqueda, ya que esta debe ser implementada en el cliente.",
          responses: { 
            200: { 
              description: "Lista completa de archivos en formato JSON",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      count: { type: "integer" },
                      items: { 
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            type: { type: "string" },
                            path: { type: "string" },
                            size: { type: "integer" },
                            isImage: { type: "boolean" },
                            extension: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } 
          }
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
