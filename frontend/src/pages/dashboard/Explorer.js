import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../utils/api";

const SUB_TABS = [
  { id: "community", label: "Community" },
  { id: "famous", label: "Famous" },
];

const PAGE_SIZE = 20;

function QuoteCard({ quote, onToggleSave }) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onToggleSave(quote._id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <p className="text-gray-800 leading-relaxed text-sm flex-1">
        "{quote.text}"
      </p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {quote.author && (
            <span className="text-xs text-gray-400">— {quote.author}</span>
          )}
          {quote.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Famous quotes have no createdBy — hide the attribution line */}
          {quote.createdBy?.username && (
            <span className="text-xs text-gray-300">
              by {quote.createdBy.username}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            title={quote.isSaved ? "Unsave" : "Save"}
            className={`text-lg transition-transform hover:scale-110 disabled:opacity-50 ${
              quote.isSaved ? "text-black" : "text-gray-300"
            }`}
          >
            🔖
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Explorer() {
  const [mode, setMode] = useState("community");
  const [quotes, setQuotes] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);    // initial load only
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  // requestIdRef ensures stale responses from older fetches don't overwrite newer state
  const requestIdRef = useRef(0);
  const sentinelRef = useRef(null);

  // Fetch a page. If `reset`, starts from the beginning and replaces the list;
  // otherwise appends using the current cursor.
  const fetchPage = useCallback(
    async (reset) => {
      const reqId = ++requestIdRef.current;

      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = { source: mode, limit: PAGE_SIZE };
        if (query) params.q = query;
        if (!reset && cursor) params.cursor = cursor;

        const res = await api.get("/quotes", { params });

        // Discard if a newer request has started (stale response)
        if (reqId !== requestIdRef.current) return;

        // Defensive: fall back to [] if backend returns unexpected shape
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        const nextCursor = res.data?.nextCursor ?? null;
        setQuotes((prev) => (reset ? items : [...prev, ...items]));
        setCursor(nextCursor);
        setHasMore(Boolean(nextCursor));
      } catch {
        // keep existing state on error
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [mode, query, cursor]
  );

  // Reset + fetch first page whenever mode or search query changes.
  // Note: cursor is intentionally excluded so that a state update to cursor
  // mid-pagination doesn't accidentally retrigger a reset.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, query]);

  // IntersectionObserver — trigger next page when the sentinel enters the viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchPage(false);
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchPage]);

  function handleSearch(e) {
    e.preventDefault();
    setQuery(search.trim());
  }

  async function toggleSave(id) {
    const res = await api.post(`/quotes/${id}/save`);
    setQuotes((prev) =>
      prev.map((q) =>
        q._id === id
          ? { ...q, isSaved: res.data.isSaved, savedCount: res.data.savedCount }
          : q
      )
    );
  }

  const subheading =
    mode === "community"
      ? "Discover quotes from the community."
      : "Curated quotes from notable figures.";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Explorer</h2>
      <p className="text-gray-400 text-sm mb-6">{subheading}</p>

      {/* Sub-tab toggle: Community vs Famous */}
      <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`flex-1 text-sm py-2 rounded-md transition-colors ${
              mode === tab.id
                ? "bg-black text-white"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by keyword, author, or tag…"
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          Search
        </button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setQuery("");
            }}
            className="px-4 py-2.5 border border-gray-200 text-sm rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="text-center py-20 text-gray-300 text-sm">Loading…</div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">
            {query
              ? `No results for "${query}"`
              : mode === "famous"
              ? "No famous quotes seeded yet."
              : "No quotes yet. Be the first to create one!"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {quotes.map((quote) => (
              <QuoteCard
                key={quote._id}
                quote={quote}
                onToggleSave={toggleSave}
              />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} />

          {/* Pagination status line */}
          {loadingMore && (
            <div className="text-center py-4 text-gray-300 text-sm">
              Loading more…
            </div>
          )}
          {!hasMore && !loadingMore && (
            <div className="text-center py-4 text-gray-300 text-sm">
              End of list
            </div>
          )}
        </>
      )}
    </div>
  );
}
