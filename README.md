# TorneosPro

TorneosPro es una base para operar competencias amateur y semiprofesionales:
creación de torneos, fixtures, resultados, tabla de posiciones y publicación
de un enlace público. La prioridad del proyecto es que el resultado deportivo
sea confiable y que la operación del organizador sea simple.

## Producto y reglas actuales

- El organizador crea una cuenta y administra únicamente sus torneos.
- Un torneo nace como `borrador` y solo se publica cuando tiene participantes
  y fixture.
- Los participantes y partidos se crean junto con el torneo en una única
  operación de base de datos. No se deben crear registros manualmente desde
  el navegador.
- `Americano` genera un todos-contra-todos con rondas rotativas.
- `Eliminatoria` genera la primera ronda de un cuadro de eliminación; las
  rondas siguientes requieren una evolución del modelo de competición.
- Los resultados solo pueden cargarse desde el panel del organizador.
- El sitio público consume vistas que excluyen torneos en borrador.
- Premium se activa únicamente después de verificar el pago recibido por el
  webhook de Mercado Pago.

## Arquitectura

```text
src/app                 Rutas, pantallas y endpoints de Next.js
src/components          Componentes de presentación reutilizables
src/lib                 Clientes de infraestructura y reglas de dominio
supabase/migrations     Cambios versionados de esquema, RLS y funciones
```

La aplicación usa Next.js App Router, React, TypeScript, Tailwind CSS y
Supabase (Auth, Postgres y Row Level Security). Las reglas que afectan la
integridad de un torneo deben vivir en Supabase o en funciones de dominio
deterministas, no solamente en la interfaz.

## Configuración local

Requisitos:

- Node.js compatible con Next.js 16
- Un proyecto Supabase
- Credenciales de Mercado Pago solo si se quiere probar Premium

```bash
npm ci
Copy-Item .env.example .env.local
```

Completar `.env.local` con las variables de `.env.example`. Nunca subir
`.env.local`, claves de servicio ni secretos de webhooks.

Aplicar las migraciones en orden desde el SQL Editor de Supabase:

1. `supabase/migrations/20261028232000_add_tournament_ownership_rls.sql`
2. `supabase/migrations/20261029000000_create_tournament_transaction.sql`

La primera migración presupone que las tablas base (`tournaments`,
`competitors` y `matches`) ya existen en el proyecto Supabase.

## Comandos

```bash
npm run dev       # desarrollo
npm run lint      # ESLint
npm run build     # compilación de producción
npm start         # servir la compilación
```

El build puede compilar sin credenciales locales porque la inicialización del
cliente de Supabase es diferida. Las rutas que requieren datos mostrarán un
error explícito si faltan las variables de entorno.

## Decisiones para escalar

1. **Dominio antes que pantallas:** cada formato debe tener reglas de fixture,
   avance y clasificación verificables.
2. **Operaciones atómicas:** una acción de negocio que crea un torneo no puede
   dejar participantes o partidos huérfanos.
3. **Autorización en profundidad:** la UI oculta acciones, pero RLS y funciones
   de Postgres son la autoridad real.
4. **Estados explícitos:** `borrador`, `activo` y `finalizado` deben gobernar
   qué acciones están disponibles.
5. **Evolución por verticales:** el siguiente bloque recomendado es completar
   el motor de eliminatorias (avance automático, desempates y cierre), seguido
   por invitaciones y métricas de operación.
