type ExpandableRowProps = {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function ExpandableRow({ label, value, open, onToggle, children }: ExpandableRowProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm hover:bg-gray-50"
      >
        <span className="text-gray-500">{label}</span>
        <span className="flex items-center gap-1.5">
          {value}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-4 text-gray-400 transition ${open ? "rotate-90" : ""}`}
            aria-hidden
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </button>
      {open && <div className="border-t border-gray-100 bg-gray-50 p-4">{children}</div>}
    </div>
  );
}
