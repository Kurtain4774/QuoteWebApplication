import { useState, useRef, useEffect } from "react";
import {
  Library,
  Compass,
  PenLine,
  Users,
  ChevronDown,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import YourQuotes from "./dashboard/YourQuotes";
import Explorer from "./dashboard/Explorer";
import Create from "./dashboard/Create";
import Socials from "./dashboard/Socials";
import Settings from "./dashboard/Settings";

const TABS = [
  { id: "quotes", label: "Your Quotes", Icon: Library },
  { id: "explorer", label: "Explorer", Icon: Compass },
  { id: "create", label: "Create", Icon: PenLine },
  { id: "socials", label: "Socials", Icon: Users },
];

function TabContent({ tab }) {
  switch (tab) {
    case "quotes":
      return <YourQuotes />;
    case "explorer":
      return <Explorer />;
    case "create":
      return <Create />;
    case "socials":
      return <Socials />;
    default:
      return null;
  }
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("quotes");
  const [showSettings, setShowSettings] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const desktopProfileRef = useRef(null);
  const mobileProfileRef = useRef(null);

  // Close dropdown when clicking outside both profile containers
  useEffect(() => {
    function handleClickOutside(e) {
      const inDesktop = desktopProfileRef.current?.contains(e.target);
      const inMobile = mobileProfileRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openSettings() {
    setProfileOpen(false);
    setShowSettings(true);
  }

  function closeSettings() {
    setShowSettings(false);
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar (desktop) ────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-lg font-bold">Quoted</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map((tab) => {
            const isActive = !showSettings && activeTab === tab.id;
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowSettings(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? "bg-black text-white shadow-[0_0_0_1px_rgba(129,140,248,0.35)]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.25 : 1.75} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Profile dropdown trigger */}
        <div
          className="px-4 py-4 border-t border-gray-100"
          ref={desktopProfileRef}
        >
          <div className="relative">
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase shrink-0">
                {user?.username?.[0]}
              </div>
              <span className="text-sm text-gray-700 font-medium truncate flex-1">
                {user?.username}
              </span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform shrink-0 ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                <button
                  onClick={openSettings}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <SettingsIcon size={16} className="text-gray-400" />
                  Settings
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors text-left"
                >
                  <LogOut size={16} className="text-gray-400" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <span className="text-base font-bold">Quoted</span>
          <div className="flex items-center gap-2" ref={mobileProfileRef}>
            {/* Mobile profile button */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase">
                  {user?.username?.[0]}
                </div>
                <span className="text-sm text-gray-600">{user?.username}</span>
                <ChevronDown
                  size={12}
                  className={`text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Mobile dropdown */}
              {profileOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                  <button
                    onClick={openSettings}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <SettingsIcon size={16} className="text-gray-400" />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors text-left"
                  >
                    <LogOut size={16} className="text-gray-400" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab content or Settings */}
        <main className="flex-1 overflow-y-auto">
          {showSettings ? (
            <Settings onClose={closeSettings} />
          ) : (
            <TabContent tab={activeTab} />
          )}
        </main>

        {/* ── Bottom tab bar (mobile) — hidden when settings is open ── */}
        {!showSettings && (
          <nav className="md:hidden flex border-t border-gray-100 bg-white">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                    isActive ? "text-black" : "text-gray-400"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
                  <span className="truncate">{tab.label}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
