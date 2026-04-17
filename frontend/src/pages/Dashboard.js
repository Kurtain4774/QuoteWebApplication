import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import YourQuotes from './dashboard/YourQuotes';
import Explorer from './dashboard/Explorer';
import Create from './dashboard/Create';
import Socials from './dashboard/Socials';

const TABS = [
  { id: 'quotes',   label: 'Your Quotes', icon: '🔖' },
  { id: 'explorer', label: 'Explorer',    icon: '🔍' },
  { id: 'create',   label: 'Create',      icon: '✍️'  },
  { id: 'socials',  label: 'Socials',     icon: '👥' },
];

function TabContent({ tab }) {
  switch (tab) {
    case 'quotes':   return <YourQuotes />;
    case 'explorer': return <Explorer />;
    case 'create':   return <Create />;
    case 'socials':  return <Socials />;
    default:         return null;
  }
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('quotes');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar (desktop) ────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <span
            className="text-lg font-bold"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            QuoteApp
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase">
              {user?.username?.[0]}
            </div>
            <span className="text-sm text-gray-700 font-medium truncate">{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <span
            className="text-base font-bold"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            QuoteApp
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.username}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto">
          <TabContent tab={activeTab} />
        </main>

        {/* ── Bottom tab bar (mobile) ───────────────────────────── */}
        <nav className="md:hidden flex border-t border-gray-100 bg-white">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id ? 'text-black' : 'text-gray-400'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="w-1 h-1 rounded-full bg-black" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
