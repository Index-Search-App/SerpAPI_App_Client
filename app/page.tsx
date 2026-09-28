"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3080";

type SearchResult = {
  position?: number;
  title?: string;
  link?: string;
  displayed_link?: string;
  snippet?: string;
};

type SearchResponse = {
  search_information?: {
    total_results?: number;
    time_taken_displayed?: number;
  };
  organic_results?: SearchResult[];
  error?: string;
};

type HistoryItem = { id: number; search_string: string };

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;
    throw new Error(message ?? "The request could not be completed.");
  }
  return data as T;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Colombo, Sri Lanka");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("lk");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setToken(window.localStorage.getItem("serp_token"));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const path = token ? "/client/login/getResults" : "/client/getResults";
      const data = await apiRequest<SearchResponse>(path, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: JSON.stringify({
          engine: "google",
          q: query.trim(),
          location,
          hl: language,
          gl: country,
        }),
      });
      setResults(data);
      if (token) void loadHistory(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const data = await apiRequest<{ access_token: string; status: string }>(
        `/user/${authMode}`,
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      window.localStorage.setItem("serp_token", data.access_token);
      setToken(data.access_token);
      setAuthOpen(false);
      setMessage(data.status);
      await loadHistory(data.access_token);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(activeToken = token) {
    if (!activeToken) return;
    try {
      const data = await apiRequest<HistoryItem[]>("/client/getSearchHistory", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      setHistory(data);
    } catch {
      setHistory([]);
    }
  }

  function signOut() {
    window.localStorage.removeItem("serp_token");
    setToken(null);
    setHistory([]);
    setMessage("Signed out.");
  }

  const organicResults = results?.organic_results ?? [];

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Index home">
          <Image
            src="/android-chrome-512x512.png"
            alt=""
            width={81}
            height={81}
          />
          <span>INDEX</span>
        </a>
        <nav>
          <a href="#search">Search</a>
          {token && (
            <Link className="nav-link" href="/history">
              History
            </Link>
          )}
          {token ? (
            <button className="outline-button" onClick={signOut}>
              Sign out
            </button>
          ) : (
            <button
              className="outline-button"
              onClick={() => setAuthOpen(true)}
            >
              Sign in
            </button>
          )}
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"> SEARCH, WITHOUT THE NOISE</div>
        <h1>
          Find what matters.
          <br />
          <em>Faster.</em>
        </h1>
        <p>
          Focused Google results, shaped around your location and language. No
          distractions, just the answers you came for.
        </p>
        <form className="search-box" id="search" onSubmit={search}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            aria-label="Search query"
          />
          <button disabled={loading || !query.trim()}>
            {loading ? "Searching…" : "Search"}
            <span>→</span>
          </button>
        </form>
        <div className="search-options">
          <label>
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>
          <label>
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="si">Sinhala</option>
              <option value="ta">Tamil</option>
            </select>
          </label>
          <label>
            Country
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="lk">Sri Lanka</option>
              <option value="us">United States</option>
              <option value="gb">United Kingdom</option>
              <option value="in">India</option>
            </select>
          </label>
        </div>
        <p className="session-note">
          {token
            ? "Signed in · Searches are saved to your history"
            : "Search as a guest, or sign in to save your history"}
        </p>
        {message && (
          <div className="message" role="status">
            {message}
          </div>
        )}
      </section>

      {(results || loading) && (
        <section className="results-section">
          <div className="results-heading">
            <div>
              <span className="section-label">SEARCH RESULTS</span>
              <h2>
                {loading ? "Looking across the web…" : `Results for “${query}”`}
              </h2>
            </div>
            {results?.search_information?.total_results && (
              <p>
                {results.search_information.total_results.toLocaleString()}{" "}
                results
              </p>
            )}
          </div>
          <div className="results-list">
            {organicResults.map((result, index) => (
              <article className="result-card" key={`${result.link}-${index}`}>
                <span className="result-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="result-source">
                    {result.displayed_link ?? result.link}
                  </p>
                  <h3>
                    <a href={result.link} target="_blank" rel="noreferrer">
                      {result.title ?? "Untitled result"}
                    </a>
                  </h3>
                  <p>{result.snippet}</p>
                </div>
                <a
                  className="result-arrow"
                  href={result.link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${result.title}`}
                >
                  ↗
                </a>
              </article>
            ))}
            {!loading && results && organicResults.length === 0 && (
              <div className="empty-state">
                No organic results were returned. Try a broader search.
              </div>
            )}
          </div>
        </section>
      )}

      {token && history.length > 0 && (
        <section className="history-section">
          <span className="section-label">RECENT SEARCHES</span>
          <div className="history-row">
            {history.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => setQuery(item.search_string)}
              >
                {item.search_string}
                <span>↗</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <footer>
        <div className="brand">
          <a className="brand" href="#top" aria-label="Index home">
            <Image
              src="/android-chrome-512x512.png"
              alt=""
              width={81}
              height={81}
            />
            <span>INDEX</span>
          </a>
        </div>
        <p>Powered by SerpAPI · Built for focused discovery.</p>
        <span>© 2026</span>
      </footer>

      {authOpen && (
        <div className="modal-backdrop" onMouseDown={() => setAuthOpen(false)}>
          <section
            className="auth-card"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              className="close-button"
              onClick={() => setAuthOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <span className="section-label">YOUR SEARCH, REMEMBERED</span>
            <h2 id="auth-title">
              {authMode === "login" ? "Welcome back." : "Create an account."}
            </h2>
            <p>
              {authMode === "login"
                ? "Sign in to keep a private record of your searches."
                : "Save your searches and return to them anytime."}
            </p>
            <form onSubmit={authenticate}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>
              <button className="primary-button" disabled={loading}>
                {loading
                  ? "Please wait…"
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>
            <button
              className="mode-switch"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
            >
              {authMode === "login"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
