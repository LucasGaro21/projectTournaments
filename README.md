# TorneosPro

Plataforma para organizar torneos amateurs (pádel, fútbol 5, tenis, truco,
eSports…): el organizador pega la lista de participantes, se genera el fixture,
carga resultados desde el celular y comparte un enlace público con la tabla en
vivo.

## Modelo de negocio

El producto es **gratis para organizadores** y se monetiza con **publicidad en
las páginas públicas** de los torneos. Cada torneo es una fuente recurrente de
tráfico: todos sus jugadores (y sus familias) vuelven a la página después de
cada fecha para ver resultados y posiciones.

Palancas de tráfico e ingresos incluidas en el código:

| Palanca | Dónde |
| --- | --- |
| Páginas públicas renderizadas en servidor y cacheadas (indexables, rápidas) | `src/app/(site)/torneo/[id]` |
| Metadatos SEO, JSON-LD `SportsEvent`, `sitemap.xml`, `robots.txt` | `generateMetadata`, `src/app/sitemap.ts` |
| Imagen Open Graph con la tabla actual (previews atractivas en WhatsApp) | `opengraph-image.tsx` |
| Botones de compartir (WhatsApp, copiar, nativo) | `ShareButtons` |
| "Seguir a mi equipo": próximo partido y resaltado en la tabla | `PublicTournamentView` |
| Actualización automática cada 45 s mientras el torneo está en juego | `useLiveRefresh` |
| Directorio público por deporte/estado | `/torneos` |
| Anuncios propios cuando AdSense no está configurado → más organizadores | `HouseAd` |
| `ads.txt` generado desde la variable de entorno | `src/app/ads.txt/route.ts` |
| Política de privacidad con la sección de cookies que exige AdSense | `/privacidad` |

**Premium** (pago único por torneo con Mercado Pago) es el ingreso complementario:
quita la publicidad de ese torneo, habilita la planilla imprimible/PDF y lo
destaca primero en Explorar. Se activa solo cuando el webhook verifica el pago
(firma, estado, moneda e importe).

Ubicaciones de anuncios: arriba de la tabla, entre la tabla y los partidos, al
pie, y uno cada seis tarjetas en Explorar. No hay anuncios en el panel ni en el
login. Los anuncios nunca se recargan por código (política de AdSense); la
actualización en vivo solo re-renderiza los datos.

## Reglas del producto

- Un torneo nace como `borrador`, se publica (`activo`) y se cierra
  (`finalizado`). Se puede reabrir para corregir.
- **Liga (Americano):** todos contra todos con el método del círculo. 3 puntos
  por victoria, 1 por empate. Orden: puntos, diferencia, a favor, nombre.
- **Eliminación directa:** llave completa con cabezas de serie estándar; los
  mejores sembrados reciben los byes. El ganador avanza automáticamente. No se
  permiten empates. No se puede cambiar un ganador si la ronda siguiente ya se
  jugó.
- Todas las escrituras pasan por funciones de Postgres (`SECURITY DEFINER`) que
  validan dueño y estado. El navegador no tiene permisos de INSERT/UPDATE/DELETE
  sobre las tablas.
- El sitio público solo lee vistas (`public_*`) que excluyen borradores.

## Arquitectura

```text
src/app/(site)          Sitio público: landing, /torneos, /torneo/[id], legales
src/app/panel           Panel del organizador + server actions (actions.ts)
src/app/api             Checkout y webhook de Mercado Pago
src/components          UI compartida (ads, tabla, llave, compartir)
src/lib/tournament      Dominio puro: fixture, posiciones, errores (con tests)
src/lib/data            Acceso a datos: público cacheado y panel con sesión
src/proxy.ts            Refresco de sesión y redirección optimista del panel
supabase/migrations     Esquema, RLS y funciones versionadas
```

Next.js 16 con Cache Components: los datos públicos usan `"use cache"` con el
perfil `live` (`next.config.ts`) y tags por torneo. Cada acción del organizador
invalida el tag (`updateTag`), así que miles de jugadores recargando la página
cuestan una sola lectura a la base, pero ven el resultado al instante.

## Puesta en marcha

```bash
npm ci
Copy-Item .env.example .env.local   # completar valores
npm run dev
```

Aplicar las migraciones en orden (SQL Editor de Supabase o `supabase db push`):

1. `20261027000000_base_schema.sql` — tablas base (idempotente)
2. `20261028232000_add_tournament_ownership_rls.sql`
3. `20261029000000_create_tournament_transaction.sql`
4. `20261106000000_competition_engine.sql` — motor de competición, permisos,
   vistas públicas, pagos

En Supabase Auth, agregar `<SITE_URL>/auth/callback` a las Redirect URLs.

### AdSense

1. Publicar el sitio en el dominio definitivo con `/privacidad` accesible.
2. Solicitar la aprobación en AdSense y crear tres bloques de anuncios
   (superior, en artículo, inferior).
3. Definir `NEXT_PUBLIC_ADSENSE_CLIENT` y los tres `NEXT_PUBLIC_ADSENSE_SLOT_*`
   y volver a desplegar (son variables de compilación). `/ads.txt` se genera solo.
4. Para tráfico de la UE/Reino Unido, activar el mensaje de consentimiento (CMP)
   de Google desde AdSense → Privacidad y mensajes.

### Mercado Pago

Configurar el webhook en `<SITE_URL>/api/webhooks/mercadopago` con el evento
"Pagos", y copiar la clave secreta a `MP_WEBHOOK_SECRET`.

## Comandos

```bash
npm run dev        # desarrollo
npm test           # tests del dominio (node:test, sin dependencias)
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm run build      # build de producción
```

## Próximos pasos sugeridos

- Página por deporte/ciudad (`/torneos/padel/rosario`) para captar búsquedas locales.
- Notificaciones push o por WhatsApp cuando se carga un resultado del equipo seguido.
- Carga de resultados delegada a un co-organizador o árbitro por enlace.
- Fase de grupos + eliminación (formato mundial) reutilizando ambos motores.
- Métricas: eventos de vistas por torneo para mostrarle al organizador su alcance
  (y venderle Premium a quien tiene sponsors).
