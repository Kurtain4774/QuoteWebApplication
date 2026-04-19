import { useState } from "react";
import api from "../../utils/api";

export default function Create() {
  const [form, setForm] = useState({ text: "", author: "", tags: "" });
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setError("");
    setLoading(true);

    const tags = form.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await api.post("/quotes", { text: form.text, author: form.author, tags });
      setForm({ text: "", author: "", tags: "" });
      setStatus("success");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to publish quote");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create a Quote</h2>
      <p className="text-gray-400 text-sm mb-8">
        Write and publish a quote for the community.
      </p>

      {status === "success" && (
        <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
          Quote published successfully!
        </div>
      )}
      {status === "error" && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Quote text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quote <span className="text-red-400">*</span>
          </label>
          <textarea
            name="text"
            value={form.text}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Enter the quote here…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Author attribution{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            name="author"
            value={form.author}
            onChange={handleChange}
            placeholder="e.g. Marcus Aurelius"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags{" "}
            <span className="text-gray-400 font-normal">
              (optional, comma-separated)
            </span>
          </label>
          <input
            type="text"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="e.g. motivation, philosophy, life"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Publishing…" : "Publish quote"}
        </button>
      </form>
    </div>
  );
}
