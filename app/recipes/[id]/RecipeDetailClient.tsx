"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import { Recipe, Ingredient } from "@/types/database";
import { updateRecipe, deleteRecipe } from "@/app/actions/recipes";
import { addToMealPlan } from "@/app/actions/meal-plans";

interface RecipeDetailClientProps {
  recipe: Recipe;
}

export default function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Servings scaling
  const [scaledServings, setScaledServings] = useState(recipe.servings);
  const scale = scaledServings / recipe.servings;
  
  // Instruction checkboxes
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Editing states
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(recipe.notes || "");
  const [stars, setStars] = useState(recipe.stars);
  
  // Meal planning modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planDate, setPlanDate] = useState(new Date().toISOString().split("T")[0]);
  const [planMealType, setPlanMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("dinner");
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calculate scaled amount
  const scaleAmount = (amount: string): string => {
    if (!amount) return amount;
    
    // Handle fractions like "1/2"
    if (amount.includes("/")) {
      const parts = amount.split("/");
      if (parts.length === 2) {
        const [num, denom] = parts.map(Number);
        if (!isNaN(num) && !isNaN(denom)) {
          const result = (num / denom) * scale;
          return formatScaledAmount(result);
        }
      }
    }
    
    // Handle ranges like "1-2"
    if (amount.includes("-")) {
      const [min, max] = amount.split("-").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        return `${formatScaledAmount(min * scale)}-${formatScaledAmount(max * scale)}`;
      }
    }
    
    // Regular number
    const num = parseFloat(amount);
    if (!isNaN(num)) {
      return formatScaledAmount(num * scale);
    }
    
    return amount;
  };

  // Format scaled amount nicely
  const formatScaledAmount = (num: number): string => {
    // Common fractions
    const fractions: [number, string][] = [
      [0.25, "¼"],
      [0.333, "⅓"],
      [0.5, "½"],
      [0.666, "⅔"],
      [0.75, "¾"],
    ];
    
    const whole = Math.floor(num);
    const decimal = num - whole;
    
    // Check for common fractions
    for (const [value, symbol] of fractions) {
      if (Math.abs(decimal - value) < 0.05) {
        return whole > 0 ? `${whole} ${symbol}` : symbol;
      }
    }
    
    // Round to reasonable precision
    if (num < 1) {
      return num.toFixed(2).replace(/\.?0+$/, "");
    }
    return num.toFixed(1).replace(/\.0$/, "");
  };

  // Toggle instruction completion
  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
  };

  // Save rating
  const handleRatingChange = (newRating: number) => {
    setStars(newRating);
    startTransition(async () => {
      await updateRecipe(recipe.id, { stars: newRating });
    });
  };

  // Save notes
  const handleSaveNotes = () => {
    startTransition(async () => {
      await updateRecipe(recipe.id, { notes });
      setIsEditingNotes(false);
    });
  };

  // Add to meal plan
  const handleAddToPlan = () => {
    startTransition(async () => {
      await addToMealPlan({
        recipe_id: recipe.id,
        planned_date: planDate,
        meal_type: planMealType,
        servings_override: scaledServings !== recipe.servings ? scaledServings : undefined,
      });
      setShowPlanModal(false);
    });
  };

  // Delete recipe
  const handleDelete = () => {
    startTransition(async () => {
      await deleteRecipe(recipe.id);
      // Will redirect in the action
    });
  };

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-2 text-sage-600 hover:text-sage-800 mb-6"
      >
        <span>←</span>
        <span>Back to recipes</span>
      </Link>

      <article className="print-friendly">
        {/* Header with Image */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden mb-6">
          {recipe.image_url && (
            <div className="aspect-[21/9] relative bg-sage-100">
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          
          <div className="p-6">
            {/* Title and Rating */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-semibold text-sage-800">
                  {recipe.title}
                </h1>
                {recipe.source_url && (
                  <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sage-500 hover:text-sage-700 mt-1 inline-block"
                  >
                    View original recipe ↗
                  </a>
                )}
              </div>
              
              <div className="flex-shrink-0">
                <StarRating rating={stars} onChange={handleRatingChange} size="lg" />
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-sage-600">
              {recipe.prep_time && (
                <span className="flex items-center gap-1">
                  <span>🔪</span>
                  <span>Prep: {recipe.prep_time} min</span>
                </span>
              )}
              {recipe.cook_time && (
                <span className="flex items-center gap-1">
                  <span>🍳</span>
                  <span>Cook: {recipe.cook_time} min</span>
                </span>
              )}
              {totalTime > 0 && (
                <span className="flex items-center gap-1 font-medium">
                  <span>⏱️</span>
                  <span>Total: {totalTime} min</span>
                </span>
              )}
            </div>

            {/* Tags */}
            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-sage-100 text-sage-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <button
            onClick={() => setShowPlanModal(true)}
            className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 
                     transition-colors flex items-center gap-2"
          >
            <span>📅</span>
            <span>Add to Plan</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-sage-200 text-sage-600 rounded-lg 
                     hover:bg-sage-50 transition-colors flex items-center gap-2"
          >
            <span>🖨️</span>
            <span>Print</span>
          </button>
          
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="px-4 py-2 border border-sage-200 text-sage-600 rounded-lg 
                     hover:bg-sage-50 transition-colors flex items-center gap-2"
          >
            <span>✏️</span>
            <span>Edit</span>
          </Link>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg 
                     hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-card p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-sage-800">Ingredients</h2>
              </div>

              {/* Servings Adjuster */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-sage-50 rounded-lg">
                <span className="text-sm text-sage-600">Servings:</span>
                <button
                  onClick={() => setScaledServings(Math.max(1, scaledServings - 1))}
                  className="w-8 h-8 flex items-center justify-center bg-white border 
                           border-sage-200 rounded-lg hover:bg-sage-100 transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold text-sage-800">
                  {scaledServings}
                </span>
                <button
                  onClick={() => setScaledServings(scaledServings + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-white border 
                           border-sage-200 rounded-lg hover:bg-sage-100 transition-colors"
                >
                  +
                </button>
                {scaledServings !== recipe.servings && (
                  <button
                    onClick={() => setScaledServings(recipe.servings)}
                    className="text-xs text-sage-500 hover:text-sage-700"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Ingredient List */}
              <ul className="space-y-2">
                {recipe.ingredients.map((ing: Ingredient, index: number) => (
                  <li key={index} className="flex gap-2 text-sage-700">
                    <span className="font-medium whitespace-nowrap">
                      {scaleAmount(ing.amount)} {ing.unit}
                    </span>
                    <span>{ing.name}</span>
                    {ing.notes && (
                      <span className="text-sage-500 text-sm">({ing.notes})</span>
                    )}
                  </li>
                ))}
              </ul>

              {recipe.ingredients.length === 0 && (
                <p className="text-sage-500 italic">No ingredients listed</p>
              )}
            </div>
          </div>

          {/* Instructions and Notes */}
          <div className="md:col-span-2 space-y-6">
            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-sage-800 mb-4">Instructions</h2>
              
              <ol className="space-y-4">
                {recipe.instructions.map((step: string, index: number) => (
                  <li key={index} className="flex gap-4">
                    <button
                      onClick={() => toggleStep(index)}
                      className={`flex-shrink-0 w-8 h-8 flex items-center justify-center 
                                rounded-full border-2 transition-colors no-print
                                ${completedSteps.has(index)
                                  ? "bg-sage-600 border-sage-600 text-white"
                                  : "border-sage-300 text-sage-500 hover:border-sage-400"
                                }`}
                    >
                      {completedSteps.has(index) ? "✓" : index + 1}
                    </button>
                    <span className="print:ml-0">
                      <span className="hidden print:inline font-semibold">{index + 1}. </span>
                    </span>
                    <p
                      className={`flex-1 leading-relaxed ${
                        completedSteps.has(index) ? "text-sage-400 line-through" : "text-sage-700"
                      }`}
                    >
                      {step}
                    </p>
                  </li>
                ))}
              </ol>

              {recipe.instructions.length === 0 && (
                <p className="text-sage-500 italic">No instructions listed</p>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-sage-800">Personal Notes</h2>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-sm text-sage-600 hover:text-sage-800 no-print"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your personal notes, tweaks, or tips..."
                    rows={4}
                    className="w-full px-4 py-3 border border-sage-200 rounded-lg
                             focus:ring-2 focus:ring-sage-400 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={isPending}
                      className="px-4 py-2 bg-sage-600 text-white rounded-lg 
                               hover:bg-sage-700 disabled:opacity-50 transition-colors"
                    >
                      {isPending ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setNotes(recipe.notes || "");
                        setIsEditingNotes(false);
                      }}
                      className="px-4 py-2 text-sage-600 hover:text-sage-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className={notes ? "text-sage-700 whitespace-pre-wrap" : "text-sage-500 italic"}>
                  {notes || "No personal notes yet"}
                </p>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Add to Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-sage-800 mb-4">
              Add to Meal Plan
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="w-full px-4 py-2 border border-sage-200 rounded-lg
                           focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">
                  Meal
                </label>
                <select
                  value={planMealType}
                  onChange={(e) => setPlanMealType(e.target.value as typeof planMealType)}
                  className="w-full px-4 py-2 border border-sage-200 rounded-lg
                           focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex-1 px-4 py-2 border border-sage-200 text-sage-600 
                         rounded-lg hover:bg-sage-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToPlan}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-sage-600 text-white rounded-lg 
                         hover:bg-sage-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Adding..." : "Add to Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-sage-800 mb-2">
              Delete Recipe?
            </h3>
            <p className="text-sage-600 mb-6">
              Are you sure you want to delete &quot;{recipe.title}&quot;? This cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-sage-200 text-sage-600 
                         rounded-lg hover:bg-sage-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg 
                         hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
