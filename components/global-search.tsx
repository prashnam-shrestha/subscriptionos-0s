"use client";
import { Search } from "lucide-react";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog } from "@/components/ui/command";
import { globalSearchAction, SearchResultItem } from "@/lib/search";

export function GlobalSearch({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim() || val.trim().length < 2) {
      setResults([]);
    }
  }

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearchAction(q);
        setResults(res);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(url: string) {
    onClose();
    setQuery("");
    setResults([]);
    router.push(url);
  }

  return (
    <CommandDialog isOpen={isOpen} onClose={onClose}>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search customers, products, master accounts, subscriptions..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          autoFocus
        />
        {isPending && <span className="text-xs text-slate-400 animate-pulse">Searching...</span>}
      </div>

      <div className="max-h-96 overflow-y-auto p-2">
        {query.trim().length >= 2 && results.length === 0 && !isPending && (
          <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
            No matching results found.
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item.url)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.subtitle}
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {item.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </CommandDialog>
  );
}
