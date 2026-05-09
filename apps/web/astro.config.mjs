import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import node from '@astrojs/node'
import AstroPWA from '@vite-pwa/astro'
import tailwindcss from '@tailwindcss/vite'

const SITE_URL = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321'
const PWA_DISABLED = process.env.PWA_DISABLED === 'true'

const integrations = [
  preact({ compat: false }),
  sitemap({
    filter: (page) => !page.includes('/admin') && !page.includes('/api/'),
  }),
]

if (!PWA_DISABLED) {
  integrations.push(
    AstroPWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,jpg,jpeg,webp,avif,woff2,ico}'],
      },
      manifest: {
        name: 'Carmat — Aracına Özel Paspas, Koltuk & Direksiyon',
        short_name: 'Carmat',
        description:
          'Aracına özel 3D havuzlu paspas, koltuk kılıfı ve direksiyon kılıfı. Konfigüre et, atölyemizden kapına gelsin.',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0B0F',
        theme_color: '#0B0B0F',
        lang: 'tr-TR',
        dir: 'ltr',
        categories: ['shopping', 'automotive', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Konfigüratörü Aç',
            url: '/konfigurator',
            icons: [{ src: '/icons/short-config.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Sipariş Takip',
            url: '/siparis-takip',
            icons: [{ src: '/icons/short-track.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  )
}

export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations,
  // Coolify reverse proxy (Caddy) Origin header'ı düşürebiliyor — admin form POST'larını
  // bu yüzden checkOrigin'i kapattık. Admin'i ayrıca cookie session ile koruyoruz.
  security: { checkOrigin: false },
  vite: {
    plugins: [tailwindcss()],
    ssr: { noExternal: ['lucide-preact'] },
  },
  server: { port: 4321, host: true },
})
