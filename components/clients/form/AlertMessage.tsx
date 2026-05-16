type AlertMessageProps = {
  type: "success" | "error";
  text: string;
};

export default function AlertMessage({ type, text }: AlertMessageProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
        type === "success"
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {text}
    </div>
  );
}
