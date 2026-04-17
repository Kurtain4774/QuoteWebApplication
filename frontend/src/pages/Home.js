import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Detail modal content for each feature ──────────────────────────────────
const FEATURE_DETAILS = {
  find: {
    title: 'Find quotes you love',
    icon: '🔍',
    description:
      'Browse the Explorer to discover quotes from every genre — philosophy, motivation, literature, and more. Filter by keyword, tag, or author to find exactly what resonates with you.',
    steps: ['Open the Explorer tab', 'Search by keyword, tag, or author', 'Browse results and preview quotes'],
  },
  save: {
    title: 'Save to your collection',
    icon: '🔖',
    description:
      'Bookmark any quote you find in the Explorer. Your saved quotes live in the "Your Quotes" tab so you can revisit them anytime — organized and always at hand.',
    steps: ['Tap the bookmark icon on any quote', 'It\'s added to "Your Quotes" instantly', 'View and manage your full collection'],
  },
  share: {
    title: 'Share with friends',
    icon: '✨',
    description:
      'Create your own quotes and publish them for the community. Add friends by username, send messages, and build a network around the words that matter to you.',
    steps: ['Create a quote in the Create tab', 'Add friends via the Socials tab', 'Your quotes appear in their Explorer'],
  },
};

// ── Dashboard UI mockup ─────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto select-none" aria-hidden="true">
      {/* Glow behind the card */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 rounded-3xl blur-2xl opacity-60 scale-105" />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-gray-100">
          {['Your Quotes', 'Explorer', 'Create', 'Socials'].map((tab, i) => (
            <div
              key={tab}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg ${
                i === 0
                  ? 'bg-black text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Quote cards */}
        <div className="p-5 space-y-3 bg-gray-50">
          {[
            { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', tag: 'motivation' },
            { text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein', tag: 'wisdom' },
            { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', tag: 'philosophy' },
          ].map((q, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p
                className="text-sm text-gray-800 leading-relaxed mb-2"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
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
        <h3
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {detail.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{detail.description}</p>
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

// ── Main homepage ───────────────────────────────────────────────────────────
export default function Home() {
  const [activeFeature, setActiveFeature] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-gray-100">
        <span
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          QuoteApp
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-16 pb-20 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-14">
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
            For quote lovers
          </span>
          <h1
            className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 max-w-2xl"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Words worth{' '}
            <span className="italic">keeping.</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl leading-relaxed mb-10">
            Discover, save, and share quotes that move you. Build a personal collection
            and connect with others who think in words.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Create free account
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Dashboard mockup */}
        <DashboardMockup />
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 md:px-12 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              How it works
            </h2>
            <p className="text-gray-400 text-sm">Click any step to learn more</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center">
            <FeatureStep
              id="find"
              icon="🔍"
              title="Find"
              description="Browse and search thousands of quotes by keyword, tag, or author."
              onClick={setActiveFeature}
              isLast={false}
            />
            <FeatureStep
              id="save"
              icon="🔖"
              title="Save"
              description="Bookmark the ones that resonate and build your personal collection."
              onClick={setActiveFeature}
              isLast={false}
            />
            <FeatureStep
              id="share"
              icon="✨"
              title="Share"
              description="Publish your own quotes and share them with friends."
              onClick={setActiveFeature}
              isLast={true}
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 md:px-12 py-20 text-center">
        <h2
          className="text-3xl font-bold text-gray-900 mb-4"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Ready to start?
        </h2>
        <p className="text-gray-400 mb-8 text-sm">Free forever. No credit card required.</p>
        <Link
          to="/register"
          className="inline-block px-8 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Create your account
        </Link>
      </section>

      {/* Feature detail modal */}
      {activeFeature && (
        <FeatureModal feature={activeFeature} onClose={() => setActiveFeature(null)} />
      )}
    </div>
  );
}
