"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { RECIPE_TAGS } from "@/types/database";

interface RecipeFiltersProps {
  initialSearch: string;
  initialTags: string[];
  initialMinStars?: number;
  initialSort: string;
}

export default function RecipeFilters({
  initialSearch,
  initialTags,
  initialMinStars,
  initialSort,
}: RecipeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(initialSearch);
  const [showFilters, setShowFilters] = useState(false);

  // Update URL with new params
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`/recipes?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: search || undefined });
  };

  const toggleTag = (tag: string) => {
    const currentTags = new Set(initialTags);
    if (currentTags.has(tag)) {
      currentTags.delete(tag);
    } else {
      currentTags.add(tag);
    }
    updateFilters({ 
      tags: currentTags.size > 0 ? Array.from(currentTags).join(",") : undefined 
    });
  };

  const clearFilters = () => {
    setSearch("");
    router.push("/recipes");
  };

  const hasActiveFilters = initialSearch || initialTags.length > 0 || initialMinStars;

  return (
    <div className="mb-6 space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] 
                       rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)]
                       focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50 
                       transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              🔍
            </span>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2.5 bg-[var(--accent)] text-white rounded-lg 
                     hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors flex items-center gap-2"
          >
            Search
          </button>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 border rounded-lg transition-colors flex items-center gap-2
                    ${showFilters || hasActiveFilters
                      ? "bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]"
                      : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                    }`}
        >
          <span>🎛️</span>
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-[var(--accent)] text-white text-xs rounded-full 
                           flex items-center justify-center">
              {(initialTags.length > 0 ? 1 : 0) + 
               (initialMinStars ? 1 : 0) + 
               (initialSearch ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-[var(--card)] rounded-xl p-4 shadow-card space-y-4 border border-[var(--border)]">
          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
              Sort by
            </label>
            <select
              value={initialSort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]
                       text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
            >
              <option value="created_at">Recently Added</option>
              <option value="title">Title (A-Z)</option>
              <option value="stars">Rating (Highest)</option>
            </select>
          </div>

          {/* Star Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
              Minimum Rating
            </label>
            <div className="flex gap-2 flex-wrap">
              {[undefined, 1, 2, 3].map((stars) => (
                <button
                  key={stars ?? "all"}
                  onClick={() => updateFilters({ 
                    minStars: stars?.toString() 
                  })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[var(--border)]
                            ${initialMinStars === stars || (!initialMinStars && !stars)
                              ? "bg-[var(--accent)] text-white"
                              : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                            }`}
                >
                  {stars ? `${"⭐".repeat(stars)}+` : "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {RECIPE_TAGS.map((tag) => {
                const isSelected = initialTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors border border-[var(--border)]
                              ${isSelected
                                ? "bg-[var(--accent)] text-white"
                                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                              }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 underline transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <span className="animate-spin">⏳</span>
          <span>Updating...</span>
        </div>
      )}
    </div>
  );
}