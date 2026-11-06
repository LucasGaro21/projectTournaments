import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-slate-700 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Política de privacidad</h1>
      <div className="mt-8 space-y-6 text-sm leading-7">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Qué datos guardamos</h2>
          <p>
            Para organizadores: el correo electrónico de la cuenta y los torneos que crean
            (nombre, deporte, ubicación opcional, participantes y resultados). Los nombres de
            participantes son cargados por el organizador y se muestran públicamente cuando el
            torneo se publica. No pedimos datos a los jugadores que solo consultan resultados.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Pagos</h2>
          <p>
            Los pagos de Premium se procesan en Mercado Pago. No almacenamos datos de tarjetas;
            solo registramos el identificador, el estado y el importe de la operación.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cookies y publicidad</h2>
          <p>
            Usamos cookies necesarias para mantener la sesión del organizador. En las páginas
            públicas de torneos gratuitos mostramos anuncios de Google AdSense. Google y sus
            socios pueden usar cookies para mostrar anuncios basados en visitas anteriores a
            este u otros sitios. Podés desactivar la publicidad personalizada en{" "}
            <a
              href="https://adssettings.google.com"
              className="text-brand underline underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              la configuración de anuncios de Google
            </a>
            . Más información en{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              className="text-brand underline underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              cómo usa Google las cookies en publicidad
            </a>
            .
          </p>
          <p className="mt-3">
            En el navegador guardamos localmente qué participante elegiste seguir en cada
            torneo; ese dato no se envía a nuestros servidores.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Tus derechos</h2>
          <p>
            Los organizadores pueden eliminar sus torneos desde el panel en cualquier momento.
            Para eliminar tu cuenta o pedir que se quite un nombre de un torneo público,
            escribinos al contacto indicado en el sitio.
          </p>
        </section>
      </div>
    </main>
  );
}
