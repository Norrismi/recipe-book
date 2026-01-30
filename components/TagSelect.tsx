"use client";

import { useState } from "react";
import { RECIPE_TAGS } from "@/types/database";

interface TagSelectProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  allowCustom?: boolean;
}

export default function TagSelect({ 
  selectedTags, 
  onChange, 
  allowCustom = true 
}: TagSelectProps) {
  const [customTag, setCustomTag] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
      setCustomTag("");
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Predefined Tags */}
      <div className="flex flex-wrap gap-2">
        {RECIPE_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium 
                        transition-all duration-200 border border-[var(--border)]
                        ${isSelected 
                          ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90" 
                          : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
                        }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Custom Tags Already Selected */}
      {selectedTags.filter((tag) => !RECIPE_TAGS.includes(tag as typeof RECIPE_TAGS[number])).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)] w-full">Custom tags:</span>
          {selectedTags
            .filter((tag) => !RECIPE_TAGS.includes(tag as typeof RECIPE_TAGS[number]))
            .map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="px-3 py-1.5 rounded-full text-sm font-medium 
                         bg-[var(--muted)] text-[var(--muted-foreground)]
                         hover:bg-[var(--muted)]/80 transition-all duration-200 
                         flex items-center gap-1 border border-[var(--border)]"
              >
                {tag}
                <span className="text-[var(--muted-foreground)]/70 hover:text-[var(--foreground)] text-lg leading-none">×</span>
              </button>
            ))}
        </div>
      )}

      {/* Add Custom Tag */}
      {allowCustom && (
        <div>
          {showCustomInput ? (
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                placeholder="Enter custom tag..."
                className="flex-1 min-w-[180px] px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm
                         bg-[var(--card)] text-[var(--foreground)]
                         focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50
                         placeholder-[var(--muted-foreground)]/60"
                autoFocus
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-4 py-1.5 bg-[var(--accent)] text-white text-sm rounded-lg
                         hover:bg-[var(--accent)]/90 transition-colors whitespace-nowrap"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomTag("");
                }}
                className="px-4 py-1.5 text-[var(--muted-foreground)] text-sm rounded-lg
                         hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 
                       hover:underline transition-colors"
            >
              + Add custom tag
            </button>
          )}
        </div>
      )}
    </div>
  );
}