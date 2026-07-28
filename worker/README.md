# labs-contacto-form (Cloudflare Worker)

Recibe el POST del formulario de Contacto (`Contact.astro`) y envía la
solicitud como correo vía Resend.

## Deploy

```bash
cd worker
npm install
npx wrangler login          # si aún no has autenticado wrangler
npm run secret:resend       # pega tu RESEND_API_KEY cuando lo pida
npm run deploy
```

`wrangler deploy` imprime la URL final, con forma:

```
https://labs-contacto-form.<tu-subdominio>.workers.dev
```

## Después del deploy

1. Copia esa URL.
2. En `src/components/Contact.astro`, reemplaza el placeholder
   `https://labs-contacto-form.TU-SUBDOMINIO.workers.dev` por la URL real.
3. En Resend, verifica el dominio `labs.publifix.net` (o el que uses en
   `FROM_ADDRESS` dentro de `src/index.ts`) — Resend no entrega correos
   desde un dominio no verificado.
4. Vuelve a compilar y hacer push del sitio (`npm run build` en la raíz
   del proyecto, luego commit + push a `main`) para que el fetch del
   formulario apunte a la URL real en producción.

## Notas

- `RESEND_API_KEY` se guarda como *secret* de Cloudflare (`wrangler secret put`),
  nunca en `wrangler.toml` ni en el código.
- El CORS del Worker solo permite `https://labs.publifix.net`. Si agregas
  otro dominio (por ejemplo un ambiente de staging), actualiza
  `ALLOWED_ORIGIN` en `src/index.ts`.
- Si cambias el remitente (`FROM_ADDRESS`), asegúrate de que el dominio
  esté verificado en Resend o el envío fallará.
