"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Recipe, MealPlan, Ingredient, GROCERY_CATEGORIES } from "@/types/database";
import { aggregateIngredients } from "@/lib/recipe-parser";

interface GroceryListClientProps {
  recipes: Recipe[];
  mealPlans: MealPlan[];
}

export default function GroceryListClient({ recipes, mealPlans }: GroceryListClientProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showChecked, setShowChecked] = useState(true);

  // Calculate recipe multipliers based on servings overrides
  const recipeMultipliers = useMemo(() => {
    const multipliers = new Map<string, number>();
    
    for (const plan of mealPlans) {
      const recipe = plan.recipe as Recipe;
      if (!recipe) continue;
      
      const currentMultiplier = multipliers.get(recipe.id) || 0;
      const servings = plan.servings_override || recipe.servings;
      const planMultiplier = servings / recipe.servings;
      
      multipliers.set(recipe.id, currentMultiplier + planMultiplier);
    }
    
    return multipliers;
  }, [mealPlans]);

  // Aggregate all ingredients
  const groceryItems = useMemo(() => {
    const recipeData = recipes.map((recipe) => ({
      title: recipe.title,
      ingredients: recipe.ingredients as Ingredient[],
      multiplier: recipeMultipliers.get(recipe.id) || 1,
    }));

    const aggregated = aggregateIngredients(recipeData);
    
    // Convert to array and sort by category
    const items: {
      key: string;
      name: string;
      amount: string;
      unit: string;
      category: string;
      fromRecipes: string[];
    }[] = [];

    aggregated.forEach((value, key) => {
      items.push({
        key,
        name: key,
        amount: value.amount > 0 
          ? value.amount % 1 === 0 
            ? String(value.amount) 
            : value.amount.toFixed(2).replace(/\.?0+$/, "")
          : "",
        unit: value.unit,
        category: value.category,
        fromRecipes: value.fromRecipes,
      });
    });

    return items;
  }, [recipes, recipeMultipliers]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof groceryItems>();
    
    // Initialize all categories
    for (const category of GROCERY_CATEGORIES) {
      groups.set(category, []);
    }
    
    // Sort items into categories
    for (const item of groceryItems) {
      const category = GROCERY_CATEGORIES.includes(item.category as typeof GROCERY_CATEGORIES[number])
        ? item.category
        : "Other";
      const existing = groups.get(category) || [];
      groups.set(category, [...existing, item]);
    }
    
    // Remove empty categories
    const result = new Map<string, typeof groceryItems>();
    groups.forEach((items, category) => {
      if (items.length > 0) {
        result.set(category, items);
      }
    });
    
    return result;
  }, [groceryItems]);

  // Toggle checked state
  const toggleItem = (key: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    setCheckedItems(newChecked);
  };

  // Check all / uncheck all
  const toggleAll = (check: boolean) => {
    if (check) {
      setCheckedItems(new Set(groceryItems.map((item) => item.key)));
    } else {
      setCheckedItems(new Set());
    }
  };

  // Count stats
  const totalItems = groceryItems.length;
  const checkedCount = checkedItems.size;
  const uncheckedCount = totalItems - checkedCount;

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-card">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-sage-800 mb-2">
          No Meals Planned
        </h2>
        <p className="text-sage-600 mb-6 max-w-md mx-auto">
          Add some recipes to your weekly meal plan to generate a grocery list.
        </p>
        <Link
          href="/plan"
          className="inline-flex items-center gap-2 px-6 py-3 bg-sage-600 
                   text-white font-medium rounded-lg hover:bg-sage-700 
                   transition-colors"
        >
          <span>📅</span>
          <span>Go to Meal Plan</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats and Controls */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sage-600">
              <span className="font-semibold text-sage-800">{uncheckedCount}</span> items remaining
            </span>
            {checkedCount > 0 && (
              <span className="text-sage-500">
                ({checkedCount} checked)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChecked(!showChecked)}
              className="text-sm text-sage-600 hover:text-sage-800"
            >
              {showChecked ? "Hide checked" : "Show checked"}
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="text-sm text-sage-600 hover:text-sage-800"
            >
              Uncheck all
            </button>
          </div>
        </div>
      </div>

      {/* Recipes included */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <h3 className="text-sm font-medium text-sage-700 mb-2">
          Recipes included:
        </h3>
        <div className="flex flex-wrap gap-2">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="px-3 py-1 bg-sage-100 text-sage-700 text-sm rounded-full
                       hover:bg-sage-200 transition-colors"
            >
              {recipe.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Grocery List by Category */}
      <div className="space-y-4">
        {Array.from(groupedItems.entries()).map(([category, items]) => {
          const visibleItems = showChecked 
            ? items 
            : items.filter((item) => !checkedItems.has(item.key));
          
          if (visibleItems.length === 0) return null;
          
          return (
            <div key={category} className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-4 py-3 bg-sage-50 border-b border-sage-100">
                <h3 className="font-semibold text-sage-800">{category}</h3>
              </div>
              
              <ul className="divide-y divide-sage-100">
                {visibleItems.map((item) => {
                  const isChecked = checkedItems.has(item.key);
                  
                  return (
                    <li key={item.key} className="px-4 py-3">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.key)}
                          className="mt-1 w-5 h-5 rounded border-sage-300 text-sage-600 
                                   focus:ring-sage-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span
                            className={`block ${
                              isChecked ? "line-through text-sage-400" : "text-sage-800"
                            }`}
                          >
                            {item.amount && (
                              <span className="font-medium">{item.amount} </span>
                            )}
                            {item.unit && (
                              <span className="text-sage-600">{item.unit} </span>
                            )}
                            <span className="capitalize">{item.name}</span>
                          </span>
                          {item.fromRecipes.length > 0 && (
                            <span className="text-xs text-sage-400 mt-0.5 block">
                              From: {item.fromRecipes.join(", ")}
                            </span>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Print Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-white border border-sage-200 text-sage-600 
                   font-medium rounded-lg hover:bg-sage-50 transition-colors 
                   flex items-center gap-2"
        >
          <span>🖨️</span>
          <span>Print List</span>
        </button>
      </div>
    </div>
  );
}
