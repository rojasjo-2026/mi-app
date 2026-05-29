export function ClientListLoadingState() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">
      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="h-5 w-44 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-64 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />

          <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1fr_240px]">
            <div>
              <div className="mb-3 h-3 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="h-10 w-24 animate-pulse rounded-full bg-slate-100"
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 h-3 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-10 w-28 animate-pulse rounded-full bg-slate-100"
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 h-3 w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-1 gap-4">
                  <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-100" />

                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-72 max-w-full animate-pulse rounded-full bg-slate-200" />
                    <div className="flex gap-2">
                      <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-7 w-32 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                      {[1, 2, 3, 4, 5, 6].map((box) => (
                        <div
                          key={box}
                          className="h-16 animate-pulse rounded-2xl bg-slate-100"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 xl:flex-col">
                  <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-11 w-24 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
