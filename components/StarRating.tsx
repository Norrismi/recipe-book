"use client";

import { useState } from "react";

interface StarRatingProps {
  rating: number; // 0-3
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export default function StarRating({ 
  rating, 
  onChange, 
  size = "md",
  readonly = false 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const handleClick = (value: number) => {
    if (readonly || !onChange) return;
    if (value === rating) {
      onChange(value - 1);
    } else {
      onChange(value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div 
      className={`inline-flex gap-1 ${sizeClasses[size]}`}
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          onMouseEnter={() => !readonly && setHoverRating(value)}
          disabled={readonly}
          className={`
            transition-all duration-150
            ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}
            ${value <= displayRating 
              ? "text-[var(--accent)]" 
              : "text-[var(--muted-foreground)] opacity-40"
            }
          `}
          aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}