import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';

export default function Settings({ onClose }) {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme, customBg, setCustomBg, customText, setCustomText, fontSize, setFontSize } = useTheme();

  // Username
  const [newUsername, setNewUsername]   = useState(user?.username || '');
  const [usernameMsg, setUsernameMsg]   = useState(null);
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg]         = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete account
  const [showDelete, setShowDelete]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMsg, setDeleteMsg]         = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleUsernameChange(e) {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.trim() === user?.username) return;
    setUsernameLoading(true);
    setUsernameMsg(null);
    try {
      const res = await api.put('/users/username', { username: newUsername.trim() });
      updateUser({ username: res.data.username });
      setUsernameMsg({ ok: true, text: 'Username updated successfully.' });
    } catch (err) {
      setUsernameMsg({ ok: false, text: err.response?.data?.error || 'Failed to update username.' });
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ ok: false, text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ ok: false, text: 'Password must be at least 6 characters.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await api.put('/users/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ ok: true, text: 'Password updated successfully.' });
    } catch (err) {
      setPasswordMsg({ ok: false, text: err.response?.data?.error || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (deleteConfirm !== 'DELETE MY ACCOUNT') return;
    setDeleteLoading(true);
    setDeleteMsg(null);
    try {
      await api.delete('/users/account', { data: { password: deletePassword } });
      logout();
    } catch (err) {
      setDeleteMsg({ text: err.response?.data?.error || 'Failed to delete account.' });
      setDeleteLoading(false);
    }
  }

  function syncPreferences(t, bg, txt, fs) {
    api.put('/users/preferences', { theme: t, customBg: bg, customText: txt, fontSize: fs }).catch(() => {});
  }

  function handleThemeChange(t) {
    setTheme(t);
    syncPreferences(t, customBg, customText, fontSize);
  }

  function handleFontSizeChange(s) {
    setFontSize(s);
    syncPreferences(theme, customBg, customText, s);
  }

  function handleCustomBgChange(c) {
    setCustomBg(c);
    if (theme === 'custom') syncPreferences('custom', c, customText, fontSize);
  }

  function handleCustomTextChange(c) {
    setCustomText(c);
    if (theme === 'custom') syncPreferences('custom', customBg, c, fontSize);
  }

  // ── Shared input class ─────────────────────────────────────────────────────
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white text-gray-900';
  const btnPrimary = 'px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Back to dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* ── Account ─────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account</h2>
        <form onSubmit={handleUsernameChange} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className={inputCls}
            />
          </div>
          {usernameMsg && (
            <p className={`text-xs ${usernameMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {usernameMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={usernameLoading || !newUsername.trim() || newUsername.trim() === user?.username}
            className={btnPrimary}
          >
            {usernameLoading ? 'Saving…' : 'Save Username'}
          </button>
        </form>
      </section>

      {/* ── Security ────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Security</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {passwordMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            className={btnPrimary}
          >
            {passwordLoading ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </section>

      {/* ── Appearance ──────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Appearance</h2>

        {/* Theme */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Theme</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'light',  label: 'Light',  icon: '☀️',  preview: 'bg-white border-gray-200' },
              { id: 'dark',   label: 'Dark',   icon: '🌙',  preview: 'bg-gray-900 border-gray-700' },
              { id: 'custom', label: 'Custom', icon: '🎨', preview: 'bg-gradient-to-r from-purple-400 to-pink-400 border-transparent' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border-2 font-medium transition-all ${
                  theme === t.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom color pickers — only shown when custom theme is active */}
        {theme === 'custom' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customBg}
                  onChange={(e) => handleCustomBgChange(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <span className="text-xs text-gray-500 font-mono">{customBg}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Text Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={customText}
                  onChange={(e) => handleCustomTextChange(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <span className="text-xs text-gray-500 font-mono">{customText}</span>
              </div>
            </div>
            {/* Live preview */}
            <div className="col-span-2">
              <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
              <div
                className="rounded-lg p-4 text-sm border border-gray-200"
                style={{ backgroundColor: customBg, color: customText }}
              >
                The quick brown fox jumps over the lazy dog. — Sample Quote
              </div>
            </div>
          </div>
        )}

        {/* Font Size */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Font Size</p>
          <div className="flex gap-2">
            {[
              { id: 'small',  label: 'Small',  sample: 'text-xs' },
              { id: 'medium', label: 'Medium', sample: 'text-sm' },
              { id: 'large',  label: 'Large',  sample: 'text-base' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => handleFontSizeChange(s.id)}
                className={`flex-1 py-2.5 rounded-lg border-2 font-medium transition-all ${
                  fontSize === s.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                }`}
              >
                <span className={`block ${s.sample}`}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Danger Zone ─────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-red-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">
          Deleting your account is permanent. All quotes, saved quotes, friends, and messages will be removed and cannot be recovered.
        </p>

        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-3">
            <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
              <span className="text-red-500 mt-0.5">⚠️</span>
              <p className="text-xs text-red-700">
                This will permanently delete your account and all associated data. This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Type <span className="font-mono font-bold text-gray-800 select-all">DELETE MY ACCOUNT</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Your Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                autoComplete="current-password"
              />
            </div>
            {deleteMsg && <p className="text-xs text-red-500">{deleteMsg.text}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDelete(false); setDeleteConfirm(''); setDeletePassword(''); setDeleteMsg(null); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteLoading || deleteConfirm !== 'DELETE MY ACCOUNT' || !deletePassword}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {deleteLoading ? 'Deleting…' : 'Permanently Delete Account'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── Sign Out ────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Sign Out</h2>
        <p className="text-xs text-gray-500 mb-4">Sign out of your account on this device.</p>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </section>

      {/* Bottom padding so content isn't hidden behind mobile nav */}
      <div className="h-4" />
    </div>
  );
}
