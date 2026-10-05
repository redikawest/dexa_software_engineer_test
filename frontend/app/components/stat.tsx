type StatProps = {
  label: string;
  value: string;
};

export function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-base font-medium tabular-nums sm:text-lg">{value}</p>
    </div>
  );
}
