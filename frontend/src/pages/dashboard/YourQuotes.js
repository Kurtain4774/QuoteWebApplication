import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkPlus } from "lucide-react";
import api from "../../utils/api";
import QuoteCard from "../../components/QuoteCard";
import QuoteFilterBar from "../../components/QuoteFilterBar";
import { staggerContainer } from "../../components/Motion";

function applyFilters(list, search, activeTag, sort) {
  const q = search.trim().toLowerCase();
  let filtered = list.filter((quote) => {
    if (activeTag && !quote.tags?.includes(activeTag)) return false;
    if (!q) return true;
    return (
      quote.text?.toLowerCase().includes(q) ||
      quote.author?.toLowerCase().includes(q) ||
      quote.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  filtered = [...filtered];
  if (sort === "recent") {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === "oldest") {
    filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sort === "az") {
    filtered.sort((a, b) =>
      (a.author || "").localeCompare(b.author || "")
    );
  }
  return filtered;
}

function Section({ title, count, quotes, variant, onAction }) {
  if (quotes.length === 0) return null;
  return (
    <div className="mb-12">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-5">
        {title}
        <span className="text-gray-300 ml-2 normal-case tracking-normal">
          · {count}
        </span>
      </h3>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="columns-1 md:columns-2 lg:columns-3 gap-4"
      >
        <AnimatePresence>
          {quotes.map((q) => (
            <QuoteCard
              key={q._id}
              quote={q}
              variant={variant}
              onAction={onAction}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function YourQuotes() {
  const [mine, setMine] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    Promise.all([api.get("/quotes/mine"), api.get("/quotes/saved")])
      .then(([mineRes, savedRes]) => {
        setMine(mineRes.data);
        const mineIds = new Set(mineRes.data.map((q) => q._id));
        setSaved(savedRes.data.filter((q) => !mineIds.has(q._id)));
      })
      .finally(() => setLoading(false));
  }, []);

  // Union of all tags across both lists, for the filter chips
  const allTags = useMemo(() => {
    const set = new Set();
    [...mine, ...saved].forEach((q) =>
      q.tags?.forEach((t) => set.add(t))
    );
    return [...set].sort();
  }, [mine, saved]);

  const filteredMine = useMemo(
    () => applyFilters(mine, search, activeTag, sort),
    [mine, search, activeTag, sort]
  );
  const filteredSaved = useMemo(
    () => applyFilters(saved, search, activeTag, sort),
    [saved, search, activeTag, sort]
  );

  function toggleTag(tag) {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }

  async function handleDelete(id) {
    await api.delete(`/quotes/${id}`);
    setMine((prev) => prev.filter((q) => q._id !== id));
  }

  async function handleUnsave(id) {
    await api.post(`/quotes/${id}/save`);
    setSaved((prev) => prev.filter((q) => q._id !== id));
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-300 text-sm">Loading…</div>
    );
  }

  const totalCount = mine.length + saved.length;
  const empty = totalCount === 0;
  const noMatches =
    !empty && filteredMine.length === 0 && filteredSaved.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Your Quotes</h2>
        <p className="text-gray-400 text-sm">
          Your collection — written and saved.
          {!empty && (
            <span className="text-gray-300 ml-2">· {totalCount} total</span>
          )}
        </p>
      </div>

      {empty ? (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 mb-4">
            <BookmarkPlus size={26} />
          </div>
          <p className="text-gray-500 text-sm">
            Nothing here yet. Create a quote or save one from Explorer.
          </p>
        </div>
      ) : (
        <>
          <QuoteFilterBar
            search={search}
            onSearchChange={setSearch}
            tags={allTags}
            activeTag={activeTag}
            onTagToggle={toggleTag}
            sort={sort}
            onSortChange={setSort}
          />

          {noMatches ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No quotes match your filters.
            </div>
          ) : (
            <>
              <Section
                title="Created by you"
                count={filteredMine.length}
                quotes={filteredMine}
                variant="owned"
                onAction={handleDelete}
              />
              <Section
                title="Saved from Explorer"
                count={filteredSaved.length}
                quotes={filteredSaved}
                variant="saved"
                onAction={handleUnsave}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
