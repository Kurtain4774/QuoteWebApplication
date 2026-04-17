import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

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
      <p
        className="text-gray-800 leading-relaxed text-sm flex-1"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
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
          <span className="text-xs text-gray-300">by {quote.createdBy?.username}</span>
          <button
            onClick={handleSave}
            disabled={saving}
            title={quote.isSaved ? 'Unsave' : 'Save'}
            className={`text-lg transition-transform hover:scale-110 disabled:opacity-50 ${
              quote.isSaved ? 'text-black' : 'text-gray-300'
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
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = query ? { q: query } : {};
      const res = await api.get('/quotes', { params });
      setQuotes(res.data);
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  function handleSearch(e) {
    e.preventDefault();
    setQuery(search.trim());
  }

  async function toggleSave(id) {
    const res = await api.post(`/quotes/${id}/save`);
    setQuotes((prev) =>
      prev.map((q) =>
        q._id === id ? { ...q, isSaved: res.data.isSaved, savedCount: res.data.savedCount } : q
      )
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h2
        className="text-2xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Explorer
      </h2>
      <p className="text-gray-400 text-sm mb-6">Discover quotes from the community.</p>

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
            onClick={() => { setSearch(''); setQuery(''); }}
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
            {query ? `No results for "${query}"` : 'No quotes yet. Be the first to create one!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <QuoteCard key={quote._id} quote={quote} onToggleSave={toggleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
