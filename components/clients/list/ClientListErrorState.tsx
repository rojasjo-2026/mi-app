type ClientListErrorStateProps = {
  message: string;
};

export function ClientListErrorState({ message }: ClientListErrorStateProps) {
  return (
    <main className="p-6 md:p-8">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-red-600">{message}</p>
      </div>
    </main>
  );
}
