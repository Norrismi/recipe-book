import Link from "next/link";
import Image from "next/image";
import StarRating from "./StarRating";
import { Recipe } from "@/types/database";

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group block bg-[var(--card)] rounded-xl overflow-hidden shadow-card 
                hover:shadow-card-hover transition-all duration-200 transform hover:-translate-y-1
                border border-[var(--border)]"
    >
      {/* Image */}
      <div className="aspect-[4/3] relative bg-[var(--muted)] overflow-hidden">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--muted)]">
            <span className="text-5xl opacity-50">🍽️</span>
          </div>
        )}
        
        {/* Tags overlay */}
        {recipe.tags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-[var(--card)]/90 backdrop-blur-sm text-xs 
                         font-medium text-[var(--muted-foreground)] rounded-full border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
            {recipe.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-[var(--card)]/90 backdrop-blur-sm text-xs 
                             font-medium text-[var(--muted-foreground)] rounded-full border border-[var(--border)]">
                +{recipe.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-display font-semibold text-lg text-[var(--foreground)] 
                     line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
          {recipe.title}
        </h3>

        {/* Rating */}
        <div className="mt-2">
          <StarRating rating={recipe.stars} size="sm" readonly />
        </div>

        {/* Meta info */}
        <div className="mt-3 flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <span>⏱️</span>
              <span>{totalTime} min</span>
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1">
              <span>👥</span>
              <span>{recipe.servings} servings</span>
            </span>
          )}
        </div>

        {/* Source hint */}
        {recipe.source_url && (
          <p className="mt-2 text-xs text-[var(--muted-foreground)]/80 truncate">
            {new URL(recipe.source_url).hostname.replace("www.", "")}
          </p>
        )}
      </div>
    </Link>
  );
}