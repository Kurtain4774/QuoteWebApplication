import { useState, useEffect } from 'react';
import api from '../../utils/api';

function QuoteCard({ quote, isOwned, onDelete, onUnsave }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try { await onDelete(quote._id); } finally { setBusy(false); }
  }

  async function handleUnsave() {
    setBusy(true);
    try { await onUnsave(quote._id); } finally { setBusy(false); }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <p
        className="text-gray-800 leading-relaxed text-sm mb-3"
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
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {isOwned ? (
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        ) : (
          <button
            onClick={handleUnsave}
            disabled={busy}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Unsave
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, quotes, isOwned, onDelete, onUnsave }) {
  if (quotes.length === 0) return null;
  return (
    <div className="mb-10">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        {title}
      </h3>
      <div className="space-y-4">
        {quotes.map((q) => (
          <QuoteCard
            key={q._id}
            quote={q}
            isOwned={isOwned}
            onDelete={onDelete}
            onUnsave={onUnsave}
          />
        ))}
      </div>
    </div>
  );
}

export default function YourQuotes() {
  const [mine, setMine] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/quotes/mine'), api.get('/quotes/saved')])
      .then(([mineRes, savedRes]) => {
        setMine(mineRes.data);
        // exclude quotes the user also created (no duplicates)
        const mineIds = new Set(mineRes.data.map((q) => q._id));
        setSaved(savedRes.data.filter((q) => !mineIds.has(q._id)));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    await api.delete(`/quotes/${id}`);
    setMine((prev) => prev.filter((q) => q._id !== id));
  }

  async function handleUnsave(id) {
    await api.post(`/quotes/${id}/save`);
    setSaved((prev) => prev.filter((q) => q._id !== id));
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-300 text-sm">Loading…</div>;
  }

  const empty = mine.length === 0 && saved.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h2
        className="text-2xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Your Quotes
      </h2>
      <p className="text-gray-400 text-sm mb-8">Quotes you've created and saved.</p>

      {empty ? (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">🔖</span>
          <p className="text-gray-400 text-sm">
            Nothing here yet. Create a quote or save one from Explorer.
          </p>
        </div>
      ) : (
        <>
          <Section
            title="Created by you"
            quotes={mine}
            isOwned
            onDelete={handleDelete}
            onUnsave={handleUnsave}
          />
          <Section
            title="Saved from Explorer"
            quotes={saved}
            isOwned={false}
            onDelete={handleDelete}
            onUnsave={handleUnsave}
          />
        </>
      )}
    </div>
  );
}
