const TAG_COLORS = {
  wisdom: "bg-amber-50 text-amber-700",
  literature: "bg-blue-50 text-blue-700",
  philosophy: "bg-violet-50 text-violet-700",
  motivation: "bg-emerald-50 text-emerald-700",
  inspiration: "bg-emerald-50 text-emerald-700",
  love: "bg-rose-50 text-rose-700",
  life: "bg-teal-50 text-teal-700",
  success: "bg-orange-50 text-orange-700",
  happiness: "bg-yellow-50 text-yellow-700",
  friendship: "bg-pink-50 text-pink-700",
  history: "bg-stone-100 text-stone-700",
  science: "bg-sky-50 text-sky-700",
  art: "bg-fuchsia-50 text-fuchsia-700",
};

const DEFAULT_COLOR = "bg-gray-100 text-gray-600";

export default function QuoteTag({ tag, onClick, active = false }) {
  const color = TAG_COLORS[tag.toLowerCase()] || DEFAULT_COLOR;
  const base =
    "text-xs px-2 py-0.5 rounded-full transition-all duration-150 select-none";
  const interactive = onClick
    ? "cursor-pointer hover:opacity-80"
    : "";
  const ring = active ? "ring-2 ring-offset-1 ring-indigo-400" : "";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(tag)}
        className={`${base} ${color} ${interactive} ${ring}`}
      >
        #{tag}
      </button>
    );
  }

  return <span className={`${base} ${color}`}>#{tag}</span>;
}
