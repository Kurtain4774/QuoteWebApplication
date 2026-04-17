import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ── Chat panel ──────────────────────────────────────────────────────────────
function Chat({ friend, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/messages/${friend.user._id}`)
      .then((res) => setMessages(res.data))
      .finally(() => setLoading(false));
  }, [friend.user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await api.post(`/messages/${friend.user._id}`, { text });
      setMessages((prev) => [...prev, res.data]);
      setText('');
    } catch {
      // message failed silently — could add a toast here later
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="font-semibold text-gray-800">{friend.user.username}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-lg transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {loading ? (
          <p className="text-center text-gray-300 text-sm">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-300 text-sm">No messages yet. Say hi!</p>
        ) : (
          messages.map((m) => {
            const isMe = m.from === user._id || m.from?.toString() === user._id;
            return (
              <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                    isMe ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-6 py-4 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ── Main Socials tab ────────────────────────────────────────────────────────
export default function Socials() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/friends')
      .then((res) => {
        setFriends(res.data.friends);
        setRequests(res.data.requests);
      })
      .finally(() => setLoading(false));
  }, []);

  async function searchUsers(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get('/users/search', { params: { username: searchQuery } });
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    }
  }

  async function sendRequest(userId) {
    try {
      await api.post(`/friends/request/${userId}`);
      setSentRequests((prev) => new Set([...prev, userId]));
    } catch {
      // already sent or other error — mark as sent anyway
      setSentRequests((prev) => new Set([...prev, userId]));
    }
  }

  async function acceptRequest(requestId) {
    await api.post(`/friends/accept/${requestId}`);
    const accepted = requests.find((r) => r._id === requestId);
    setRequests((prev) => prev.filter((r) => r._id !== requestId));
    if (accepted) {
      setFriends((prev) => [...prev, { _id: requestId, user: accepted.from }]);
    }
  }

  async function declineRequest(requestId) {
    await api.delete(`/friends/${requestId}`);
    setRequests((prev) => prev.filter((r) => r._id !== requestId));
  }

  async function removeFriend(friendRecordId) {
    await api.delete(`/friends/${friendRecordId}`);
    setFriends((prev) => prev.filter((f) => f._id !== friendRecordId));
    if (activeChat?._id === friendRecordId) setActiveChat(null);
  }

  // Show chat panel when a friend is selected
  if (activeChat) {
    return <Chat friend={activeChat} onClose={() => setActiveChat(null)} />;
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h2
        className="text-2xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Socials
      </h2>
      <p className="text-gray-400 text-sm mb-8">Add friends and send messages.</p>

      {/* Search users */}
      <section className="mb-10">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Find people
        </h3>
        <form onSubmit={searchUsers} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username…"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((u) => {
              const isFriend = friends.some((f) => f.user._id === u._id);
              const sent = sentRequests.has(u._id);
              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-700">{u.username}</span>
                  {isFriend ? (
                    <span className="text-xs text-gray-400">Already friends</span>
                  ) : sent ? (
                    <span className="text-xs text-gray-400">Request sent</span>
                  ) : (
                    <button
                      onClick={() => sendRequest(u._id)}
                      className="text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Add friend
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending requests */}
      {requests.length > 0 && (
        <section className="mb-10">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Friend requests
          </h3>
          <div className="space-y-2">
            {requests.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-700">{r.from.username}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(r._id)}
                    className="text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineRequest(r._id)}
                    className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Friends {friends.length > 0 && `· ${friends.length}`}
        </h3>

        {loading ? (
          <p className="text-sm text-gray-300">Loading…</p>
        ) : friends.length === 0 ? (
          <p className="text-sm text-gray-400">No friends yet. Search for someone above.</p>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3"
              >
                <button
                  onClick={() => setActiveChat(f)}
                  className="flex items-center gap-3 text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 uppercase">
                    {f.user.username[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
                    {f.user.username}
                  </span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveChat(f)}
                    className="text-xs text-gray-400 hover:text-black transition-colors"
                  >
                    Message
                  </button>
                  <button
                    onClick={() => removeFriend(f._id)}
                    className="text-xs text-red-300 hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
