import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import api from "../../utils/api";
import QuoteCard from "../../components/QuoteCard";
import { staggerContainer } from "../../components/Motion";

const SUB_TABS = [
  { id: "community", label: "Community" },
  { id: "famous", label: "Famous" },
];

const PAGE_SIZE = 20;

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
  // cursor is intentionally excluded so a state update mid-pagination
  // doesn't accidentally retrigger a reset.
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
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Explorer</h2>
        <p className="text-gray-400 text-sm">{subheading}</p>
      </div>

      {/* Sub-tab toggle: Community vs Famous */}
      <div className="flex bg-gray-100 p-1 rounded-lg mb-6 max-w-sm">
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
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keyword, author, or tag…"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
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
            aria-label="Clear search"
            className="px-3 py-2.5 border border-gray-200 text-sm rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <X size={16} />
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
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="columns-1 md:columns-2 lg:columns-3 gap-4"
          >
            <AnimatePresence>
              {quotes.map((quote) => (
                <QuoteCard
                  key={quote._id}
                  quote={quote}
                  variant="explorer"
                  onAction={toggleSave}
                />
              ))}
            </AnimatePresence>
          </motion.div>

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
