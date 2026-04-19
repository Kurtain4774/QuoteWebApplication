import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, BookmarkMinus, Bookmark, BookmarkCheck } from "lucide-react";
import QuoteTag from "./QuoteTag";
import { staggerItem } from "./Motion";

// Variants:
//   "owned"    — user's own quote, has Delete action, indigo accent border
//   "saved"    — saved-from-explorer, has Remove (unsave) action
//   "explorer" — Explorer feed, has bookmark toggle + creator attribution
export default function QuoteCard({
  quote,
  variant = "owned",
  onAction,
}) {
  const [busy, setBusy] = useState(false);

  async function handleAction() {
    if (!onAction) return;
    setBusy(true);
    try {
      await onAction(quote._id);
    } finally {
      setBusy(false);
    }
  }

  const accentBorder =
    variant === "owned" ? "border-l-2 border-l-indigo-400" : "";

  return (
    <motion.div
      variants={staggerItem}
      layout
      className={`group bg-white border border-gray-100 ${accentBorder} rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 break-inside-avoid mb-4`}
    >
      <p className="font-serif text-base md:text-lg leading-relaxed text-gray-800 mb-4">
        &ldquo;{quote.text}&rdquo;
      </p>

      {quote.author && (
        <p className="text-[11px] tracking-[0.2em] uppercase text-gray-500 mb-3">
          — {quote.author}
        </p>
      )}

      <div className="flex items-end justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {quote.tags?.map((tag) => (
            <QuoteTag key={tag} tag={tag} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {variant === "explorer" && quote.createdBy?.username && (
            <span className="text-[11px] text-gray-400">
              by {quote.createdBy.username}
            </span>
          )}

          {variant === "owned" && (
            <button
              onClick={handleAction}
              disabled={busy}
              aria-label="Delete quote"
              title="Delete"
              className="text-gray-400 opacity-50 group-hover:opacity-100 hover:text-red-600 transition-all disabled:opacity-25"
            >
              <Trash2 size={16} />
            </button>
          )}

          {variant === "saved" && (
            <button
              onClick={handleAction}
              disabled={busy}
              aria-label="Remove from saved"
              title="Remove"
              className="text-gray-400 opacity-50 group-hover:opacity-100 hover:text-gray-700 transition-all disabled:opacity-25"
            >
              <BookmarkMinus size={16} />
            </button>
          )}

          {variant === "explorer" && (
            <button
              onClick={handleAction}
              disabled={busy}
              aria-label={quote.isSaved ? "Unsave quote" : "Save quote"}
              title={quote.isSaved ? "Unsave" : "Save"}
              className={`transition-all hover:scale-110 disabled:opacity-50 ${
                quote.isSaved
                  ? "text-indigo-500"
                  : "text-gray-300 hover:text-gray-700"
              }`}
            >
              {quote.isSaved ? (
                <BookmarkCheck size={18} />
              ) : (
                <Bookmark size={18} />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
