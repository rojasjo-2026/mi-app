import { Suspense } from "react";
import FollowUpNewClientPage from "./FollowUpNewClientPage";

export default function NewFollowUpPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-[1280px]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-600">
                Cargando formulario de mantenimiento...
              </p>
            </section>
          </div>
        </main>
      }
    >
      <FollowUpNewClientPage />
    </Suspense>
  );
}
