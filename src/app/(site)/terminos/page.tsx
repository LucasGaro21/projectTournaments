import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  alternates: { canonical: "/terminos" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-slate-700 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Términos y condiciones</h1>
      <div className="mt-8 space-y-6 text-sm leading-7">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">El servicio</h2>
          <p>
            TorneosPro permite crear torneos, generar fixtures, cargar resultados y publicar
            una página pública con la clasificación. El uso gratuito incluye publicidad en las
            páginas públicas.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Responsabilidad del organizador</h2>
          <p>
            El organizador es responsable de los nombres que carga y de los resultados que
            publica, y declara tener autorización de los participantes para mostrarlos. No se
            permite contenido ofensivo, datos personales sensibles ni usos ajenos a la
            organización de competencias.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Premium</h2>
          <p>
            Premium es un pago único por torneo que se activa cuando Mercado Pago confirma la
            operación. Quita la publicidad de ese torneo, habilita la planilla imprimible y lo
            destaca en el listado público. No es transferible a otros torneos.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cambios</h2>
          <p>
            Podemos actualizar estos términos. Los cambios relevantes se informarán en el sitio.
          </p>
        </section>
      </div>
    </main>
  );
}
