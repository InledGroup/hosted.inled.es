import type { APIRoute } from 'astro';
import fileIndex from '../../data/file-index.json';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({
    success: true,
    count: fileIndex.length,
    items: fileIndex
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
