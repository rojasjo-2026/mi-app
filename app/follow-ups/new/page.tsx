import { Suspense } from "react";
import FollowUpNewClientPage from "./FollowUpNewClientPage";

export default function NewFollowUpPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-medium text-slate-600">
                Cargando formulario de mantenimiento...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <FollowUpNewClientPage />
    </Suspense>
  );
}
