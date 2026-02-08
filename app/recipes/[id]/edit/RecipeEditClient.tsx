"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import TagSelect from "@/components/TagSelect";
import StarRating from "@/components/StarRating";
import { updateRecipe } from "@/app/actions/recipes";
import { Recipe, Ingredient } from "@/types/database";

interface RecipeEditClientProps {
  recipe: Recipe;
}

export default function RecipeEditClient({ recipe }: RecipeEditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Recipe form state - initialized with existing recipe data
  const [title, setTitle] = useState(recipe.title);
  const [sourceUrl, setSourceUrl] = useState(recipe.source_url || "");
  const [imageUrl, setImageUrl] = useState(recipe.image_url || "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe.ingredients);
  const [instructions, setInstructions] = useState<string[]>(recipe.instructions);
  const [servings, setServings] = useState(recipe.servings);
  const [prepTime, setPrepTime] = useState<number | "">(recipe.prep_time || "");
  const [cookTime, setCookTime] = useState<number | "">(recipe.cook_time || "");
  const [stars, setStars] = useState(recipe.stars);
  const [notes, setNotes] = useState(recipe.notes || "");
  const [tags, setTags] = useState<string[]>(recipe.tags);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a recipe title.");
      return;
    }

    startTransition(async () => {
      const result = await updateRecipe(recipe.id, {
        title: title.trim(),
        source_url: sourceUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        ingredients,
        instructions: instructions.filter((i) => i.trim()),
        servings,
        prep_time: prepTime ? Number(prepTime) : null,
        cook_time: cookTime ? Number(cookTime) : null,
        stars,
        notes: notes.trim() || null,
        tags,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(`/recipes/${recipe.id}`);
    });
  };

  // Ingredient management
  const addIngredient = () => {
    setIngredients([...ingredients, { amount: "", unit: "", name: "" }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Instruction management
  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-semibold text-[var(--foreground)] mb-6">
          Edit Recipe
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-[var(--card)] rounded-xl p-6 shadow-card space-y-4 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Basic Info</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                Recipe Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Grandma's Apple Pie"
                required
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)]
                         text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                         focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
              />
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                Source URL (optional)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/recipe"
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)]
                         text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                         focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                Image URL (optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)]
                         text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                         focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
              />
              {imageUrl && (
                <div className="mt-2 w-32 h-24 bg-[var(--muted)] rounded-lg overflow-hidden border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Time and Servings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value ? Number(e.target.value) : "")}
                  min="0"
                  placeholder="15"
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)]
                           text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                           focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                  Cook Time (min)
                </label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value ? Number(e.target.value) : "")}
                  min="0"
                  placeholder="30"
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)]
                           text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                           focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                  Servings
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value) || 4)}
                  min="1"
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)]
                           text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                           focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-[var(--card)] rounded-xl p-6 shadow-card space-y-4 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Ingredients</h2>

            {ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2 items-start">
                <input
                  type="text"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                  placeholder="2"
                  className="w-16 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]
                           text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                           focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                />
                <input
                  type="text"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                  placeholder="cups"
                  className="w-20 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]
                           text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                           focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                />
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, "name", e.target.value)}
                  placeholder="all-purpose flour"
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]
                           text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                           focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-red-400 transition-colors"
                  aria-label="Remove ingredient"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addIngredient}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 flex items-center gap-1 transition-colors"
            >
              <span>➕</span>
              <span>Add Ingredient</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-[var(--card)] rounded-xl p-6 shadow-card space-y-4 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Instructions</h2>

            {instructions.map((inst, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="w-8 h-8 flex items-center justify-center bg-[var(--muted)]
                               text-[var(--muted-foreground)] rounded-full text-sm font-medium flex-shrink-0">
                  {index + 1}
                </span>
                <textarea
                  value={inst}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder="Describe this step..."
                  rows={2}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)]
                           text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                           focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50 resize-none"
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-red-400 transition-colors"
                  aria-label="Remove step"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addInstruction}
              className="text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 flex items-center gap-1 transition-colors"
            >
              <span>➕</span>
              <span>Add Step</span>
            </button>
          </div>

          {/* Personal Notes */}
          <div className="bg-[var(--card)] rounded-xl p-6 shadow-card space-y-4 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Your Notes</h2>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                Your Rating
              </label>
              <StarRating rating={stars} onChange={setStars} size="lg" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                Personal Notes & Tweaks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add 1/4 tsp more cinnamon, use Granny Smith apples..."
                rows={3}
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)]
                         text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                         focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50 resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                Categories
              </label>
              <TagSelect selectedTags={tags} onChange={setTags} />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 flex-col sm:flex-row">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-[var(--border)] text-[var(--muted-foreground)] font-medium 
                       rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="flex-1 px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg
                       hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
