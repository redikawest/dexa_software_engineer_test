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

export const secondaryButton =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-4 sm:p-5 ${className}`}>
      {title && <h2 className="mb-3 text-sm font-medium text-gray-500">{title}</h2>}
      {children}
    </section>
  );
}

const chipStyles = {
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  gray: "bg-gray-100 text-gray-600",
} as const;

export function Chip({
  tone,
  children,
}: {
  tone: keyof typeof chipStyles;
  children: React.ReactNode;
}) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${chipStyles[tone]}`}>
      {children}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = { sm: "size-8 text-xs", md: "size-12 text-sm", lg: "size-24 text-2xl" }[size];
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return src ? (
    <img src={src} alt={name} className={`${dim} shrink-0 rounded-full object-cover`} />
  ) : (
    <span
      aria-hidden
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-700`}
    >
      {initials}
    </span>
  );
}

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
