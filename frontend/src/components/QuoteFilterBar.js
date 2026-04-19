import { Search, X } from "lucide-react";
import QuoteTag from "./QuoteTag";

export const SORT_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "A–Z by author" },
];

export default function QuoteFilterBar({
  search,
  onSearchChange,
  tags,
  activeTag,
  onTagToggle,
  sort,
  onSortChange,
}) {
  const hasFilters = Boolean(search || activeTag);

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your quotes…"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
            Tags
          </span>
          {tags.map((tag) => (
            <QuoteTag
              key={tag}
              tag={tag}
              onClick={onTagToggle}
              active={activeTag === tag}
            />
          ))}
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                if (activeTag) onTagToggle(activeTag);
              }}
              className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2 ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
