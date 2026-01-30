"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Recipe, MealPlan } from "@/types/database";
import { getMealPlans, addToMealPlan, removeFromMealPlan } from "@/app/actions/meal-plans";

interface MealPlanCalendarProps {
  recipes: Recipe[];
}

export default function MealPlanCalendar({ recipes }: MealPlanCalendarProps) {
  const [isPending, startTransition] = useTransition();
  const [weekOffset, setWeekOffset] = useState(0);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("dinner");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");

  // Calculate week dates
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (offset * 7));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(weekOffset);
  const startDate = weekDates[0].toISOString().split("T")[0];
  const endDate = weekDates[6].toISOString().split("T")[0];

  // Fetch meal plans for the current week
  useEffect(() => {
    setIsLoading(true);
    getMealPlans(startDate, endDate).then(({ data }) => {
      setMealPlans(data || []);
      setIsLoading(false);
    });
  }, [startDate, endDate]);

  // Get meal plans for a specific date
  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return mealPlans.filter((plan) => plan.planned_date === dateStr);
  };

  // Open add modal for a specific date and meal type
  const openAddModal = (date: Date, mealType: "breakfast" | "lunch" | "dinner" | "snack") => {
    setSelectedDate(date.toISOString().split("T")[0]);
    setSelectedMealType(mealType);
    setSelectedRecipeId("");
    setShowAddModal(true);
  };

  // Add meal to plan
  const handleAddMeal = () => {
    if (!selectedRecipeId) return;

    startTransition(async () => {
      await addToMealPlan({
        recipe_id: selectedRecipeId,
        planned_date: selectedDate,
        meal_type: selectedMealType,
      });

      // Refresh meal plans
      const { data } = await getMealPlans(startDate, endDate);
      setMealPlans(data || []);
      setShowAddModal(false);
    });
  };

  // Remove meal from plan
  const handleRemoveMeal = (mealPlanId: string) => {
    startTransition(async () => {
      await removeFromMealPlan(mealPlanId);
      setMealPlans(mealPlans.filter((p) => p.id !== mealPlanId));
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
  const mealEmojis = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍎",
  };

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] 
                   hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Previous Week
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {weekDates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Back to this week
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] 
                   hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Next Week →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[var(--card)] rounded-xl shadow-card overflow-hidden border border-[var(--border)]">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            <span className="animate-spin inline-block mr-2">⏳</span>
            Loading meal plan...
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-[var(--border)]">
            {weekDates.map((date) => {
              const dayMeals = getMealsForDate(date);
              const today = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[300px] ${today ? "bg-[var(--muted)]/50" : ""}`}
                >
                  {/* Day Header */}
                  <div className={`p-3 border-b border-[var(--border)] text-center
                                ${today ? "bg-green-900/30 text-[var(--foreground)]" : "bg-[var(--muted)]"}`}>
                    <div className="text-sm font-medium">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className={`text-lg font-semibold ${today ? "text-green-300" : "text-[var(--foreground)]"}`}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Meals */}
                  <div className="p-2 space-y-2">
                    {mealTypes.map((mealType) => {
                      const meals = dayMeals.filter((m) => m.meal_type === mealType);

                      return (
                        <div key={mealType} className="min-h-[50px]">
                          <div className="text-xs text-[var(--muted-foreground)] mb-1 flex items-center gap-1">
                            <span>{mealEmojis[mealType]}</span>
                            <span className="capitalize">{mealType}</span>
                          </div>

                          {meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="group bg-[var(--muted)] rounded-lg p-2 mb-1 relative border border-[var(--border)]"
                            >
                              {meal.recipe_id ? (
                                <Link
                                  href={`/recipes/${meal.recipe_id}`}
                                  className="text-sm text-[var(--foreground)] hover:text-[var(--accent)] 
                 line-clamp-2 pr-6"
                                >
                                  {(meal.recipe as Recipe)?.title || "Recipe"}
                                </Link>
                              ) : (
                                <span className="text-sm text-[var(--muted-foreground)] line-clamp-2 pr-6">
                                  {(meal.recipe as Recipe)?.title || "Missing Recipe"}
                                </span>
                              )}
                              <button
                                onClick={() => handleRemoveMeal(meal.id)}
                                className="absolute top-1 right-1 w-5 h-5 flex items-center 
               justify-center text-[var(--muted-foreground)] hover:text-red-400 
               opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove"
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          {meals.length === 0 && (
                            <button
                              onClick={() => openAddModal(date, mealType)}
                              className="w-full p-2 border border-dashed border-[var(--border)] 
                                       rounded-lg text-[var(--muted-foreground)] text-xs hover:border-[var(--accent)] 
                                       hover:text-[var(--accent)] transition-colors"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grocery List Link */}
      <div className="mt-6 flex justify-center">
        <Link
          href="/groceries"
          className="px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg 
                   hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>🛒</span>
          <span>Generate Grocery List</span>
        </Link>
      </div>

      {/* Add Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] rounded-xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Add Meal for {formatDate(new Date(selectedDate))}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                  Meal Type
                </label>
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value as typeof selectedMealType)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]
                           text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                >
                  {mealTypes.map((type) => (
                    <option key={type} value={type}>
                      {mealEmojis[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                  Recipe
                </label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]
                           text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                >
                  <option value="">Select a recipe...</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.title}
                    </option>
                  ))}
                </select>
              </div>

              {recipes.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No recipes yet.{" "}
                  <Link href="/recipes/new" className="text-[var(--accent)] hover:text-[var(--accent)]/80 underline">
                    Add one first!
                  </Link>
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-[var(--border)] text-[var(--muted-foreground)] 
                         rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMeal}
                disabled={isPending || !selectedRecipeId}
                className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg 
                         hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Adding..." : "Add Meal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}