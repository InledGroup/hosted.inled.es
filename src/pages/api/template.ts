import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const repo = "InledGroup/hosted.inled.es";
  const githubZipUrl = `https://github.com/${repo}/archive/refs/heads/main.zip`;
  
  try {
    // Actuamos como proxy para evitar problemas de CORS en el navegador.
    // Descargamos el ZIP desde el servidor (que no tiene restricciones de CORS)
    // y lo enviamos al cliente.
    const response = await fetch(githubZipUrl);
    
    if (!response.ok) {
      throw new Error(`Error al obtener el ZIP de GitHub: ${response.statusText}`);
    }

    // Retornamos el body directamente (como un stream) para que sea eficiente.
    // Esto funciona tanto en Node.js (local) como en Cloudflare Workers (producción).
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Access-Control-Allow-Origin': '*', // Permitimos que el cliente lo lea sin problemas
        'Content-Disposition': 'attachment; filename="Hostify-Source.zip"'
      }
    });
  } catch (error) {
    console.error('Error en el proxy de template:', error);
    return new Response(JSON.stringify({ 
      error: "Error al puentear el ZIP", 
      details: error instanceof Error ? error.message : String(error) 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
