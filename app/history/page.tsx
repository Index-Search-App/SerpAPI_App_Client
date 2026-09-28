"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3080";

type HistoryItem = { id: number; search_string: string };

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      const token = window.localStorage.getItem("serp_token");
      if (!token) {
        setMessage("Sign in from the search page to view your search history.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/client/getSearchHistory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error("Could not load your search history.");
        }
        if (!cancelled) {
          setHistory(Array.isArray(data) ? (data as HistoryItem[]) : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not load your search history.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Index home">
          <Image
            src="/android-chrome-512x512.png"
            alt=""
            width={81}
            height={81}
          />
          <span>INDEX</span>
        </Link>
        <nav>
          <Link href="/">Search</Link>
        </nav>
      </header>

      <section className="history-page" aria-labelledby="history-title">
        <div className="history-page-heading">
          <div>
            <span className="section-label">YOUR SEARCHES</span>
            <h1 className="history-title" id="history-title">
              Search history
            </h1>
          </div>
          {!loading && !message && (
            <p className="history-count">
              {history.length} {history.length === 1 ? "search" : "searches"}
            </p>
          )}
        </div>

        {loading && (
          <p className="history-status" role="status">
            Loading your search history…
          </p>
        )}
        {!loading && message && (
          <p className="history-status" role="status">
            {message}{" "}
            <Link className="history-signin-link" href="/">
              Back to search
            </Link>
          </p>
        )}
        {!loading && !message && history.length === 0 && (
          <p className="history-status">No saved searches yet.</p>
        )}
        {!loading && !message && history.length > 0 && (
          <ol className="history-page-list">
            {history.map((item, index) => (
              <li key={item.id}>
                <span className="history-page-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p>{item.search_string}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
