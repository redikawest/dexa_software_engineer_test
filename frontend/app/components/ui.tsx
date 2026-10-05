export function inputClass(hasError?: boolean) {
  return [
    "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-900",
    "placeholder:text-gray-400 outline-none transition focus:ring-4",
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-gray-300 focus:border-blue-600 focus:ring-blue-600/20",
  ].join(" ");
}

export const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

export function Alert({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  const style =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3.5 py-2.5 text-sm ${style}`}
    >
      {children}
    </div>
  );
}
