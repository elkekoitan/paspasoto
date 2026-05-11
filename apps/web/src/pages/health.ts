import type { APIRoute } from 'astro'

export const prerender = false

/** Coolify / Docker healthcheck endpoint */
export const GET: APIRoute = () =>
  new Response('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
  })
