import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Si la ruta ya empieza por /1/, /_astro/ o es la raíz, no hacemos nada
  if (
    pathname === '/' || 
    pathname.startsWith('/1/') || 
    pathname.startsWith('/_astro/') ||
    pathname.includes('.') === false // Si no tiene extensión, probablemente sea una ruta de Astro
  ) {
    return next();
  }

  // Intentamos reescribir la URL internamente a /1/nombre-del-archivo
  // Esto es invisible para el usuario, la URL en el navegador no cambia.
  const response = await fetch(new URL(`/1${pathname}`, url.origin));
  
  // Si el archivo existe en /1/, lo devolvemos
  if (response.status === 200) {
    return response;
  }

  // Si no, dejamos que Astro siga su curso normal (que acabará en 404)
  return next();
});