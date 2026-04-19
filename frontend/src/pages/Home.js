import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

// ── Reveal helper: fade + slide up when scrolled into view ─────────────────
function Reveal({ children, delay = 0, y = 40, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Stagger variants for lists/grids ─────────────────────────────────────────
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 110 },
  },
};

// ── Famous-quote ambient animation (hero backdrop) ─────────────────────────
const QUOTES = [
  { id: "q1", text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { id: "q2", text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { id: "q3", text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { id: "q4", text: "The only journey is the one within.", author: "Rainer Maria Rilke" },
  { id: "q5", text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
  { id: "q6", text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { id: "q7", text: "The unexamined life is not worth living.", author: "Socrates" },
  { id: "q8", text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson" },
  { id: "q9", text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { id: "q10", text: "The best way out is always through.", author: "Robert Frost" },
  { id: "q11", text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { id: "q12", text: "What we think, we become.", author: "Buddha" },
  { id: "q13", text: "Go confidently in the direction of your dreams.", author: "Henry David Thoreau" },
  { id: "q14", text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { id: "q15", text: "The mind is everything. What you think you become.", author: "Marcus Aurelius" },
  { id: "q16", text: "A room without books is like a body without a soul.", author: "Cicero" },
  { id: "q17", text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { id: "q18", text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
];

// Desktop slots — four corner boxes that leave the center (wordmark zone),
// top (navbar), and bottom (CTAs) clear. 3 concurrent + 4 slots guarantees
// rotation: there's always one empty corner for the next quote.
const DESKTOP_SLOTS = [
  { top: "12%", left: "3%",  width: "30%", align: "left"  },
  { top: "12%", left: "67%", width: "30%", align: "right" },
  { top: "64%", left: "3%",  width: "30%", align: "left"  },
  { top: "64%", left: "67%", width: "30%", align: "right" },
];

// Mobile slots — two rows above wordmark + one row below, 2 concurrent.
// Wordmark sits roughly 40-60% vertical on mobile; these avoid that band.
const MOBILE_SLOTS = [
  { top: "9%",  left: "5%", width: "90%", align: "center" },
  { top: "24%", left: "5%", width: "90%", align: "center" },
  { top: "66%", left: "5%", width: "90%", align: "center" },
];

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

// ── Cursor-follow glow ─────────────────────────────────────────────────────
// A soft radial gradient that trails the mouse inside the hero section.
// Uses a spring for a slight lag → feels organic, not jittery.
function CursorGlow({ containerRef }) {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const springX = useSpring(x, { stiffness: 120, damping: 22, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 120, damping: 22, mass: 0.6 });
  // The glow is 800px wide; offset by half so the center tracks the cursor.
  const glowX = useTransform(springX, (v) => v - 400);
  const glowY = useTransform(springY, (v) => v - 400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleMove(e) {
      const rect = el.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    }
    function handleLeave() {
      x.set(-1000);
      y.set(-1000);
    }
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [containerRef, x, y]);

  return (
    <motion.div
      aria-hidden="true"
      className="absolute w-[800px] h-[800px] rounded-full pointer-events-none blur-3xl"
      style={{
        left: glowX,
        top: glowY,
        background:
          "radial-gradient(circle, rgba(129, 140, 248, 0.18), transparent 65%)",
      }}
    />
  );
}

// ── Quote detail modal ─────────────────────────────────────────────────────
// Opens when a floating quote is clicked — shows the quote in a readable
// card and nudges anonymous visitors toward signup.
function QuoteDetailModal({ quote, onClose }) {
  const auth = useAuth();
  const user = auth?.user;

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 24, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Quote detail"
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12"
      >
        <div className="text-6xl text-gray-200 font-serif leading-none mb-2 select-none">
          &ldquo;
        </div>
        <p className="text-xl md:text-2xl font-serif text-gray-900 leading-relaxed mb-6">
          {quote.text}
        </p>
        <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mb-8">
          — {quote.author}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="flex-1 bg-black text-white rounded-lg py-3 text-sm font-medium text-center hover:bg-gray-800 transition-colors"
            >
              Explore more quotes
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="flex-1 bg-black text-white rounded-lg py-3 text-sm font-medium text-center hover:bg-gray-800 transition-colors"
              >
                Create free account to save
              </Link>
              <Link
                to="/login"
                className="flex-1 border border-gray-200 text-gray-900 rounded-lg py-3 text-sm font-medium text-center hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center text-lg leading-none"
        >
          ×
        </button>
      </motion.div>
    </motion.div>
  );
}

function FloatingQuotes({ onQuoteClick }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const slots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
  const numLanes = isMobile ? 2 : 3;

  // Each lane is either null (empty/gap phase) or a quote descriptor.
  const [lanes, setLanes] = useState(() => Array(numLanes).fill(null));

  const recentRef = useRef([]);
  const keyRef = useRef(0);
  // Mirror of `lanes` for scheduler reads (avoids stale closures and keeps
  // selection logic outside of state updater to stay StrictMode-safe).
  const lanesRef = useRef(Array(numLanes).fill(null));

  useEffect(() => {
    // Reset on param changes (mobile/desktop swap).
    recentRef.current = [];
    lanesRef.current = Array(numLanes).fill(null);
    setLanes(Array(numLanes).fill(null));

    function pickQuoteAndSlot() {
      const activeIds = new Set(
        lanesRef.current.filter(Boolean).map((l) => l.quoteId)
      );
      const activeSlots = new Set(
        lanesRef.current.filter(Boolean).map((l) => l.slotIndex)
      );
      const recent = new Set(recentRef.current);

      let pool = QUOTES.filter(
        (q) => !activeIds.has(q.id) && !recent.has(q.id)
      );
      if (pool.length === 0) pool = QUOTES.filter((q) => !activeIds.has(q.id));
      if (pool.length === 0) return null;
      const quote = pool[Math.floor(Math.random() * pool.length)];

      let slotPool = slots
        .map((_, i) => i)
        .filter((i) => !activeSlots.has(i));
      if (slotPool.length === 0) slotPool = slots.map((_, i) => i);
      const slotIndex = slotPool[Math.floor(Math.random() * slotPool.length)];

      recentRef.current = [...recentRef.current, quote.id].slice(-5);
      keyRef.current += 1;
      return {
        key: keyRef.current,
        quoteId: quote.id,
        text: quote.text,
        author: quote.author,
        slotIndex,
      };
    }

    function updateLane(i, content) {
      const next = [...lanesRef.current];
      next[i] = content;
      lanesRef.current = next;
      setLanes(next);
    }

    if (reducedMotion) {
      // Static snapshot: fill every lane once, no scheduling.
      const snap = Array(numLanes).fill(null);
      for (let i = 0; i < numLanes; i++) {
        const picked = pickQuoteAndSlot();
        if (picked) {
          snap[i] = picked;
          lanesRef.current = snap.slice();
        }
      }
      setLanes(snap);
      return;
    }

    // Animated mode: each lane runs its own explicit lifecycle:
    //   fade-in (FADE_MS) → steady (STEADY_MS) → fade-out (FADE_MS, via exit)
    //   → gap (GAP_MS empty) → repeat with a new quote & slot
    const FADE_MS = 2200;
    const STEADY_MS = 3800;
    const GAP_MS = 1600;
    // Total cycle per lane: FADE + STEADY + FADE + GAP = 9800ms
    const LANE_CYCLE = FADE_MS * 2 + STEADY_MS + GAP_MS;
    // Stagger lanes evenly across the cycle so they never enter the same phase
    // at the same time.
    const LANE_OFFSET = Math.floor(LANE_CYCLE / numLanes);

    const timers = [];
    const mountedRef = { current: true };

    function startLane(i) {
      if (!mountedRef.current) return;
      const picked = pickQuoteAndSlot();
      if (!picked) {
        // Nothing to show (edge case) — try again next cycle.
        timers.push(setTimeout(() => startLane(i), LANE_CYCLE));
        return;
      }
      updateLane(i, picked);

      // After fade-in + steady, remove → triggers exit fade (FADE_MS).
      timers.push(
        setTimeout(() => {
          if (!mountedRef.current) return;
          updateLane(i, null);
          // After exit fade completes + gap, start the next quote in this lane.
          timers.push(
            setTimeout(() => startLane(i), FADE_MS + GAP_MS)
          );
        }, FADE_MS + STEADY_MS)
      );
    }

    // Kick off each lane at a different offset.
    for (let i = 0; i < numLanes; i++) {
      timers.push(setTimeout(() => startLane(i), i * LANE_OFFSET));
    }

    return () => {
      mountedRef.current = false;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, isMobile, numLanes]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Soft gradient orbs so the backdrop isn't flat black */}
      <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <AnimatePresence>
        {lanes.map((item) => {
          if (!item) return null;
          const slot = slots[item.slotIndex];
          const alignClass =
            slot.align === "left"
              ? "text-left"
              : slot.align === "right"
              ? "text-right"
              : "text-center";
          return (
            <motion.button
              type="button"
              key={item.key}
              onClick={() =>
                onQuoteClick &&
                onQuoteClick({ text: item.text, author: item.author })
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: reducedMotion ? 1 : 0.92 }}
              exit={{ opacity: 0 }}
              whileHover={reducedMotion ? undefined : { opacity: 1, scale: 1.02 }}
              transition={{
                duration: reducedMotion ? 0 : 2.2,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                top: slot.top,
                left: slot.left,
                width: slot.width,
              }}
              className={`text-white block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg -m-3 p-3 ${alignClass}`}
            >
              <p className="text-lg md:text-2xl lg:text-3xl font-serif leading-snug drop-shadow-lg">
                &ldquo;{item.text}&rdquo;
              </p>
              <p className="mt-2 text-xs md:text-sm tracking-widest uppercase text-white/60">
                — {item.author}
              </p>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── Hero with scroll-linked parallax ───────────────────────────────────────
function Hero() {
  const ref = useRef(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Nav + CTAs + wordmark fade/lift as the hero exits
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-screen w-full overflow-hidden bg-[#0a0a0f]"
    >
      {/* Cursor-follow glow — low-key radial gradient that trails the mouse */}
      <CursorGlow containerRef={ref} />
      {/* Ambient floating famous-quote backdrop (interactive on click) */}
      <FloatingQuotes onQuoteClick={setSelectedQuote} />
      {/* Subtle vignette so CTAs at the bottom stay readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 pointer-events-none" />

      {/* Navbar — fades with scroll */}
      <motion.nav
        style={{ opacity: contentOpacity }}
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-xl font-bold tracking-tight text-white drop-shadow"
        >
          Quoted
        </motion.span>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
          >
            Log in
          </Link>
        </motion.div>
      </motion.nav>

      {/* Centered wordmark — pointer-events-none so clicks pass through to
          the floating quotes behind it. */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none px-6"
      >
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-7xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight drop-shadow-2xl"
          >
            Quoted
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
            className="mt-4 md:mt-6 text-xs md:text-sm tracking-[0.4em] uppercase text-white/95 drop-shadow-lg"
          >
            Words move worlds
          </motion.p>
        </div>
      </motion.div>

      {/* Bottom CTAs — fade + drift on scroll */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-16 md:pb-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-6"
        >
          <Link
            to="/register"
            className="px-7 py-3.5 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-xl"
          >
            Create free account
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-col items-center text-white/70 text-xs tracking-widest uppercase"
        >
          <span className="mb-2">Scroll</span>
          <span className="w-px h-10 bg-white/40 animate-pulse" />
        </motion.div>
      </motion.div>

      {/* Quote detail modal — fires when a floating quote is clicked */}
      <AnimatePresence>
        {selectedQuote && (
          <QuoteDetailModal
            quote={selectedQuote}
            onClose={() => setSelectedQuote(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Detail modal content for each feature ──────────────────────────────────
const FEATURE_DETAILS = {
  find: {
    title: "Find quotes you love",
    icon: "🔍",
    description:
      "Browse the Explorer to discover quotes from every genre — philosophy, motivation, literature, and more. Filter by keyword, tag, or author to find exactly what resonates with you.",
    steps: [
      "Open the Explorer tab",
      "Search by keyword, tag, or author",
      "Browse results and preview quotes",
    ],
  },
  save: {
    title: "Save to your collection",
    icon: "🔖",
    description:
      'Bookmark any quote you find in the Explorer. Your saved quotes live in the "Your Quotes" tab so you can revisit them anytime — organized and always at hand.',
    steps: [
      "Tap the bookmark icon on any quote",
      'It\'s added to "Your Quotes" instantly',
      "View and manage your full collection",
    ],
  },
  share: {
    title: "Share with friends",
    icon: "✨",
    description:
      "Create your own quotes and publish them for the community. Add friends by username, send messages, and build a network around the words that matter to you.",
    steps: [
      "Create a quote in the Create tab",
      "Add friends via the Socials tab",
      "Your quotes appear in their Explorer",
    ],
  },
};

// ── Dashboard UI mockup ─────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div
      className="relative w-full max-w-2xl mx-auto select-none"
      aria-hidden="true"
    >
      {/* Glow behind the card */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-3xl blur-2xl opacity-60 scale-105" />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-gray-100">
          {["Your Quotes", "Explorer", "Create", "Socials"].map((tab, i) => (
            <div
              key={tab}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg ${
                i === 0
                  ? "bg-black text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Quote cards */}
        <div className="p-5 space-y-3 bg-gray-50">
          {[
            {
              text: "The only way to do great work is to love what you do.",
              author: "Steve Jobs",
              tag: "motivation",
            },
            {
              text: "In the middle of every difficulty lies opportunity.",
              author: "Albert Einstein",
              tag: "wisdom",
            },
            {
              text: "It does not matter how slowly you go as long as you do not stop.",
              author: "Confucius",
              tag: "philosophy",
            },
          ].map((q, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <p className="text-sm text-gray-800 leading-relaxed mb-2">
                "{q.text}"
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">— {q.author}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  #{q.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Feature detail modal ────────────────────────────────────────────────────
function FeatureModal({ feature, onClose }) {
  const detail = FEATURE_DETAILS[feature];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-4">{detail.icon}</div>
        <h3 className="text-2xl font-bold mb-3">{detail.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {detail.description}
        </p>
        <ol className="space-y-2">
          {detail.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <span className="text-gray-700 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="mt-8 w-full border border-gray-200 rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Feature step card ───────────────────────────────────────────────────────
function FeatureStep({ id, icon, title, description, onClick, isLast }) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0">
      <button
        onClick={() => onClick(id)}
        className="group flex flex-col items-center text-center bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all w-full md:w-64"
      >
        <span className="text-3xl mb-3">{icon}</span>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        <span className="mt-4 text-xs text-black underline underline-offset-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Learn more →
        </span>
      </button>

      {/* Arrow between steps */}
      {!isLast && (
        <div className="flex md:flex-row flex-col items-center px-4 text-gray-300">
          <span className="hidden md:block text-2xl">→</span>
          <span className="md:hidden text-2xl">↓</span>
        </div>
      )}
    </div>
  );
}

// ── Animated stat counter ───────────────────────────────────────────────────
// Animates from 0 → target with easeOutQuart easing once `active` flips true.
function AnimatedNumber({ value, active, duration = 2000 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active || value == null) return;

    let rafId;
    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutQuart — fast start, gentle settle
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ── Stats section ───────────────────────────────────────────────────────────
function StatsSection() {
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState(false);
  const sectionRef = useRef(null);

  // Fetch real values once on mount
  useEffect(() => {
    let mounted = true;
    api
      .get("/stats")
      .then((res) => {
        if (mounted) setStats(res.data);
      })
      .catch(() => {
        // Fallback values if the API is down — still lets the animation run
        if (mounted) {
          setStats({
            quotes: 0,
            users: 0,
            authors: 0,
            saves: 0,
            tags: 0,
            quotesThisWeek: 0,
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Trigger counters once the section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items = [
    { key: "quotes", label: "Quotes in the library" },
    { key: "users", label: "Readers & writers" },
    { key: "authors", label: "Authors cited" },
    { key: "saves", label: "Bookmarks saved" },
    { key: "tags", label: "Unique tags" },
    { key: "quotesThisWeek", label: "Added this week" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative px-6 md:px-12 py-24 bg-gray-900 text-white overflow-hidden"
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest text-white/50 uppercase mb-4 block">
            The numbers
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            A growing library, built by its readers
          </h2>
          <p className="text-white/60 text-sm max-w-xl mx-auto">
            Every counter below reflects live data from the Quoted community.
          </p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12"
        >
          {items.map((item) => (
            <motion.div
              key={item.key}
              variants={staggerItem}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold tracking-tight mb-2 tabular-nums">
                <AnimatedNumber
                  value={stats?.[item.key] ?? 0}
                  active={active && stats != null}
                />
              </div>
              <div className="text-xs md:text-sm text-white/60 uppercase tracking-wider">
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Inline register form ────────────────────────────────────────────────────
function InlineRegister() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative px-6 md:px-12 py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left: pitch — slides in from the left */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4 block">
            Join Quoted
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Start your collection in under a minute.
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed mb-8">
            Free forever. No credit card. Just a username and an email — and
            every quote you've been meaning to remember, finally in one place.
          </p>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                ✓
              </span>
              Unlimited saved quotes
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                ✓
              </span>
              Publish and tag your own
            </li>
            <li className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                ✓
              </span>
              Add friends and trade favorites
            </li>
          </ul>
        </motion.div>

        {/* Right: form card — springs in from the right */}
        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 90,
            delay: 0.1,
          }}
          className="w-full max-w-md md:justify-self-end bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          <h3 className="text-2xl font-bold mb-1">Create your account</h3>
          <p className="text-gray-400 text-sm mb-6">It's free and takes seconds.</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="yourname"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Min. 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-black font-medium underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ── Main homepage ───────────────────────────────────────────────────────────
export default function Home() {
  const [activeFeature, setActiveFeature] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero: scroll-linked parallax ─────────────────────────── */}
      <Hero />

      {/* ── What is Quoted? ──────────────────────────────────────── */}
      <section className="px-6 md:px-12 pt-24 pb-12 max-w-6xl mx-auto text-center">
        <Reveal>
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4 block">
            What is Quoted?
          </span>
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6 max-w-3xl mx-auto">
            A home for the words you don't want to forget.
          </h2>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
            Quoted is where readers, writers, and thinkers collect the quotes
            that stay with them. Browse a growing library, save what resonates,
            publish your own, and share with friends.
          </p>
        </Reveal>
      </section>

      {/* ── Dashboard showcase ───────────────────────────────────── */}
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: dashboard mockup — slides in with a 3D tilt that straightens */}
          <motion.div
            style={{ perspective: 1200 }}
            initial={{ opacity: 0, x: -60, rotateY: 18, rotateX: 6 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <DashboardMockup />
          </motion.div>

          {/* Right: benefits list — staggered entry from the right */}
          <motion.div
            className="space-y-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            {[
              {
                icon: "📚",
                title: "Your personal library",
                body: "Every quote you save lives in one place — searchable, organized, and always with you.",
              },
              {
                icon: "🔭",
                title: "Discover without the noise",
                body: "Search by keyword, tag, or author. No feeds, no ads — just the quotes.",
              },
              {
                icon: "✍️",
                title: "Publish your own",
                body: "Write, tag, and share the quotes that matter to you. Build a following around the words you choose.",
              },
              {
                icon: "🤝",
                title: "Connect with friends",
                body: "Add friends by username, trade favorites, and chat about the lines that moved you both.",
              },
            ].map((b) => (
              <motion.div
                key={b.title}
                variants={staggerItem}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center text-lg">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {b.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {b.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How to use it ────────────────────────────────────────── */}
      <section className="bg-gray-50 px-6 md:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4 block">
              How to use it
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Three steps from cover to collection
            </h2>
            <p className="text-gray-400 text-sm">
              Click any step for the details
            </p>
          </Reveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="flex flex-col md:flex-row items-center justify-center"
          >
            <motion.div variants={staggerItem}>
              <FeatureStep
                id="find"
                icon="🔍"
                title="Find"
                description="Browse and search thousands of quotes by keyword, tag, or author."
                onClick={setActiveFeature}
                isLast={false}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FeatureStep
                id="save"
                icon="🔖"
                title="Save"
                description="Bookmark the ones that resonate and build your personal collection."
                onClick={setActiveFeature}
                isLast={false}
              />
            </motion.div>
            <motion.div variants={staggerItem}>
              <FeatureStep
                id="share"
                icon="✨"
                title="Share"
                description="Publish your own quotes and share them with friends."
                onClick={setActiveFeature}
                isLast={true}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Live stats with animated counters ────────────────────── */}
      <StatsSection />

      {/* ── Inline register ──────────────────────────────────────── */}
      <InlineRegister />

      {/* Feature detail modal */}
      {activeFeature && (
        <FeatureModal
          feature={activeFeature}
          onClose={() => setActiveFeature(null)}
        />
      )}
    </div>
  );
}
