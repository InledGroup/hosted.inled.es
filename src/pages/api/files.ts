import type { APIRoute } from 'astro';
import fileIndex from '../../data/file-index.json';

export const GET: APIRoute = ({ url }) => {
  const search = url.searchParams.get('search')?.toLowerCase();
  const path = url.searchParams.get('path');

  let filtered = [...fileIndex];

  if (path) {
    filtered = filtered.filter(item => item.path.startsWith(path));
  }

  if (search) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(search) || 
      item.path.toLowerCase().includes(search)
    );
  }

  return new Response(JSON.stringify({
    success: true,
    count: filtered.length,
    items: filtered
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Permitir que otros dominios consulten esta API
    }
  });
};
