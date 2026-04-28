# MangaThiago — Documentación técnica

## Stack
- **Next.js 16** (App Router, Turbopack)
- **SWR** para fetching client-side con cache automático
- **Shadcn UI + Tailwind** para componentes y estilos
- **pnpm** como package manager

---

## APIs integradas

### MangaDex (`lib/mangadex.ts`)
**Base:** `https://api.mangadex.org`  
Sin autenticación. Rate limit: no documentado públicamente.

| Función | Endpoint | Uso |
|---|---|---|
| `searchManga` | `GET /manga` | Búsqueda con filtros |
| `getPopularManga` | `GET /manga` | Populares con offset |
| `getMangaDetails` | `GET /manga/:id` | Detalle de manga |
| `getMangaChapters` | `GET /manga/:id/feed` | Capítulos paginados (usa /feed, NO /chapter) |
| `getChapterPages` | `GET /at-home/server/:id` | URLs de páginas de un capítulo |
| `getPageUrl` | helper | Construye URL: `{baseUrl}/data-saver/{hash}/{file}` |

> **Importante:** El endpoint correcto para capítulos es `/manga/:id/feed`, no `/chapter?manga=:id`. El segundo devuelve "Non-feed limit" en texto plano cuando se intenta paginar.

### AniList (`lib/anilist.ts`)
**Base:** `https://graphql.anilist.co` (GraphQL, POST)  
Sin autenticación para lectura pública. Cache: 1h (`next: { revalidate: 3600 }`).

| Función | Query | Uso |
|---|---|---|
| `getAniListMangaByTitle` | `Page > media` | Busca manga por título, devuelve el primero |
| `getTrendingManga` | `Page > media` | Trending JP manga (disponible, no implementado en UI aún) |
| `stripHtml` | helper | Limpia HTML de las descripciones de AniList |

Los datos que enriquecen la página de manga:
- Score (`averageScore / 10`)
- Staff (autor/arte filtrados por role)
- Géneros
- Relaciones (anime adaptaciones, secuelas, spin-offs)
- Banner image + cover extraLarge
- Título nativo (japonés)

### Danbooru (`lib/danbooru.ts`)
**Base:** `https://danbooru.donmai.us`  
Sin autenticación (acceso anónimo). Rate limit: 10 req/s globales.

| Función | Endpoint | Uso |
|---|---|---|
| `searchPosts` | `GET /posts.json` | Posts por tags. Fuerza `rating:g,s` si no se especifica rating |
| `searchPools` | `GET /pools.json` | Colecciones/doujinshi por nombre |
| `getPool` | `GET /pools/:id.json` | Detalle de pool con `post_ids` en orden |
| `getPoolPosts` | `GET /posts.json` (batches) | Posts de un pool en orden del pool |

**Ratings de Danbooru:**
- `g` = General (safe)
- `s` = Sensitive (levemente ecchi)
- `q` = Questionable (ecchi)
- `e` = Explicit (NSFW)

Por defecto la app filtra a `rating:g,s`.

### Jikan / MAL (`lib/jikan.ts`)
**Base:** `https://api.jikan.moe/v4`  
Sin autenticación. **Actualmente poco usado** — AniList reemplazó la mayoría de sus funciones.  
Solo queda la ruta `GET /api/jikan/manga?title=...` disponible.

---

## Rutas API (Next.js)

```
app/api/
├── manga/
│   ├── search/           GET ?q&limit&offset&demographic&status&orderBy&tags
│   └── [id]/
│       ├── route.ts      GET — detalle del manga
│       └── chapters/     GET ?all=true (paginación interna) | ?limit&offset
├── chapter/
│   └── [id]/pages/       GET ?quality=data|dataSaver
├── proxy-image/          GET ?url= (proxy de imágenes para evitar CORS, cache 24h)
├── anilist/
│   └── manga/            GET ?title= (busca en AniList por título)
├── danbooru/
│   ├── posts/            GET ?tags&page&limit
│   ├── pools/            GET ?q&page
│   └── pool/[id]/        GET — devuelve { pool, posts[] } en orden del pool
└── jikan/
    └── manga/            GET ?title=
```

---

## Páginas

| Ruta | Descripción |
|---|---|
| `/` | Home: búsqueda + populares con paginación |
| `/manga/[id]` | Detalle: info MangaDex + metadata AniList + capítulos |
| `/read/[id]` | Lector de capítulos MangaDex (modo página o scroll) |
| `/danbooru` | Browser de ilustraciones y colecciones de Danbooru |
| `/danbooru/pool/[id]` | Lector de colecciones/doujinshi de Danbooru |
| `/favorites` | Lista de favoritos (localStorage) |
| `/news` | Enciclopedia ANN |

---

## Lector (`/read/[id]` y `/danbooru/pool/[id]`)

**Modos de lectura** (persistidos en `localStorage["reading-mode"]`):
- `page` — una imagen a la vez, slider en bottom bar, click zones L/R
- `scroll` — todas las imágenes apiladas verticalmente, lazy loading, IntersectionObserver para tracking de página actual

**Atajos de teclado (modo página):** `←` página anterior, `→` página siguiente, `Escape` cerrar paneles.

---

## Estado del cliente

| Key localStorage | Valor | Usado en |
|---|---|---|
| `manga-favorites` | `Array<{id, title, coverUrl, status, year}>` | `/favorites`, header badge |
| `manga-progress-{mangaId}` | `{chapterId, page}` | Reader (guardar progreso) |
| `reading-mode` | `"page" \| "scroll"` | Ambos readers |
