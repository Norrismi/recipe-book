"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import TagSelect from "@/components/TagSelect";
import StarRating from "@/components/StarRating";
import { parseRecipe, createRecipe } from "@/app/actions/recipes";
import { Ingredient } from "@/types/database";

type FormMode = "import" | "manual";

export default function NewRecipePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<FormMode>("import");
  const [error, setError] = useState<string | null>(null);
  
  // Import form state
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  // Recipe form state
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState<number | "">("");
  const [cookTime, setCookTime] = useState<number | "">("");
  const [stars, setStars] = useState(0);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Handle URL import
  const handleImport = async () => {
    if (!importUrl.trim()) return;
    
    setIsImporting(true);
    setError(null);

    const result = await parseRecipe(importUrl);

    if (result.error) {
      setError(result.error);
      setIsImporting(false);
      return;
    }

    if (result.data) {
      // Populate form with parsed data
      setTitle(result.data.title);
      setSourceUrl(importUrl);
      setImageUrl(result.data.image_url || "");
      setIngredients(result.data.ingredients);
      setInstructions(result.data.instructions);
      setServings(result.data.servings);
      setPrepTime(result.data.prep_time || "");
      setCookTime(result.data.cook_time || "");
      setMode("manual"); // Switch to manual mode to review/edit
    }

    setIsImporting(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a recipe title.");
      return;
    }

    startTransition(async () => {
      const result = await createRecipe({
        title: title.trim(),
        source_url: sourceUrl.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        ingredients,
        instructions: instructions.filter((i) => i.trim()),
        servings,
        prep_time: prepTime ? Number(prepTime) : undefined,
        cook_time: cookTime ? Number(cookTime) : undefined,
        stars,
        notes: notes.trim() || undefined,
        tags,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect to the new recipe
      router.push(`/recipes/${result.data?.id}`);
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
    <div className="min-h-screen bg-cream">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-display font-semibold text-sage-800 mb-6">
          Add New Recipe
        </h1>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("import")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors
                      ${mode === "import"
                        ? "bg-sage-600 text-white"
                        : "bg-white text-sage-600 hover:bg-sage-50"
                      }`}
          >
            🔗 Import from URL
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors
                      ${mode === "manual"
                        ? "bg-sage-600 text-white"
                        : "bg-white text-sage-600 hover:bg-sage-50"
                      }`}
          >
            ✏️ Manual Entry
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Import Mode */}
        {mode === "import" && (
          <div className="bg-white rounded-xl p-6 shadow-card mb-6">
            <h2 className="text-lg font-semibold text-sage-800 mb-4">
              Import from Recipe Website
            </h2>
            <p className="text-sage-600 text-sm mb-4">
              Paste a URL from popular recipe sites (AllRecipes, Food Network, etc.) 
              and we&apos;ll try to extract the recipe details.
            </p>
            
            <div className="flex gap-3">
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://example.com/recipe..."
                className="flex-1 px-4 py-3 border border-sage-200 rounded-lg
                         focus:ring-2 focus:ring-sage-400 focus:border-transparent"
              />
              <button
                onClick={handleImport}
                disabled={isImporting || !importUrl.trim()}
                className="px-6 py-3 bg-sage-600 text-white font-medium rounded-lg
                         hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Import</span>
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-xs text-sage-500">
              Note: Not all websites can be parsed. If import fails, you can enter 
              the recipe manually.
            </p>
          </div>
        )}

        {/* Manual Entry Form */}
        {mode === "manual" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-sage-800">Basic Info</h2>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Grandma's Apple Pie"
                  required
                  className="w-full px-4 py-2.5 border border-sage-200 rounded-lg
                           focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                />
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Source URL (optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://example.com/recipe"
                  className="w-full px-4 py-2.5 border border-sage-200 rounded-lg
                           focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2.5 border border-sage-200 rounded-lg
                           focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                />
                {imageUrl && (
                  <div className="mt-2 w-32 h-24 bg-sage-100 rounded-lg overflow-hidden">
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
                  <label className="block text-sm font-medium text-sage-700 mb-1">
                    Prep Time (min)
                  </label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value ? Number(e.target.value) : "")}
                    min="0"
                    placeholder="15"
                    className="w-full px-4 py-2.5 border border-sage-200 rounded-lg
                             focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-1">
                    Cook Time (min)
                  </label>
                  <input
                    type="number"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value ? Number(e.target.value) : "")}
                    min="0"
                    placeholder="30"
                    className="w-full px-4 py-2.5 border border-sage-200 rounded-lg
                             focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sage-700 mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value) || 4)}
                    min="1"
                    className="w-full px-4 py-2.5 border border-sage-200 rounded-lg
                             focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-xl p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-sage-800">Ingredients</h2>
              
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                    placeholder="2"
                    className="w-16 px-3 py-2 border border-sage-200 rounded-lg text-sm
                             focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                    placeholder="cups"
                    className="w-20 px-3 py-2 border border-sage-200 rounded-lg text-sm
                             focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(index, "name", e.target.value)}
                    placeholder="all-purpose flour"
                    className="flex-1 px-3 py-2 border border-sage-200 rounded-lg text-sm
                             focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="p-2 text-sage-400 hover:text-red-500 transition-colors"
                    aria-label="Remove ingredient"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addIngredient}
                className="text-sm text-sage-600 hover:text-sage-800 flex items-center gap-1"
              >
                <span>➕</span>
                <span>Add Ingredient</span>
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-sage-800">Instructions</h2>
              
              {instructions.map((inst, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="w-8 h-8 flex items-center justify-center bg-sage-100 
                                 text-sage-600 rounded-full text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <textarea
                    value={inst}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder="Describe this step..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-sage-200 rounded-lg text-sm
                             focus:ring-2 focus:ring-sage-400 focus:border-transparent resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="p-2 text-sage-400 hover:text-red-500 transition-colors"
                    aria-label="Remove step"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addInstruction}
                className="text-sm text-sage-600 hover:text-sage-800 flex items-center gap-1"
              >
                <span>➕</span>
                <span>Add Step</span>
              </button>
            </div>

            {/* Personal Notes */}
            <div className="bg-white rounded-xl p-6 shadow-card space-y-4">
              <h2 className="text-lg font-semibold text-sage-800">Your Notes</h2>
              
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Your Rating
                </label>
                <StarRating rating={stars} onChange={setStars} size="lg" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Personal Notes & Tweaks
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add 1/4 tsp more cinnamon, use Granny Smith apples..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-sage-200 rounded-lg
                           focus:ring-2 focus:ring-sage-400 focus:border-transparent resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-2">
                  Categories
                </label>
                <TagSelect selectedTags={tags} onChange={setTags} />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-sage-200 text-sage-600 font-medium 
                         rounded-lg hover:bg-sage-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="flex-1 px-6 py-3 bg-sage-600 text-white font-medium rounded-lg
                         hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed
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
                    <span>Save Recipe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
