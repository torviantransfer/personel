"use client";

import { useDeferredValue, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";

type Item = { key: string; text: string; content: React.ReactNode };

const normalize = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/\s+/g, "");

/** Sunucuda hazırlanan satırları istemcide anında filtreler (isim, telefon, sicil no). */
export default function SearchableList({ items, placeholder = "Ara" }: { items: Item[]; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const q = normalize(useDeferredValue(query));
  const visible = q ? items.filter((i) => normalize(i.text).includes(q)) : items;

  return (
    <div className="space-y-3">
      {items.length > 5 && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            enterKeyHint="search"
            className="h-11 w-full rounded-xl bg-slate-200/60 pr-10 pl-10 text-base outline-none placeholder:text-muted focus:bg-white focus:ring-4 focus:ring-primary/12 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Temizle" className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center text-muted">
              <X className="size-4" />
            </button>
          )}
        </div>
      )}
      <Card className="overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState icon={SearchX} title="Sonuç bulunamadı" />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((i) => (
              <li key={i.key}>{i.content}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
