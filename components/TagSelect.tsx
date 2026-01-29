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
                        transition-all duration-200
                        ${isSelected 
                          ? "bg-sage-600 text-white" 
                          : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                        }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Custom Tags Already Selected */}
      {selectedTags.filter((tag) => !RECIPE_TAGS.includes(tag as typeof RECIPE_TAGS[number])).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-sage-200">
          <span className="text-xs text-sage-500 w-full">Custom tags:</span>
          {selectedTags
            .filter((tag) => !RECIPE_TAGS.includes(tag as typeof RECIPE_TAGS[number]))
            .map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="px-3 py-1.5 rounded-full text-sm font-medium 
                         bg-spice-100 text-spice-700 hover:bg-spice-200
                         transition-all duration-200 flex items-center gap-1"
              >
                {tag}
                <span className="text-spice-500 hover:text-spice-700">×</span>
              </button>
            ))}
        </div>
      )}

      {/* Add Custom Tag */}
      {allowCustom && (
        <div>
          {showCustomInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                placeholder="Enter custom tag..."
                className="flex-1 px-3 py-1.5 border border-sage-200 rounded-lg text-sm
                         focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="px-3 py-1.5 bg-sage-600 text-white text-sm rounded-lg
                         hover:bg-sage-700 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomTag("");
                }}
                className="px-3 py-1.5 text-sage-600 text-sm rounded-lg
                         hover:bg-sage-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="text-sm text-sage-600 hover:text-sage-800 
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
