import Navigation from "@/components/Navigation";
import { getWeeklyMealPlan } from "@/app/actions/meal-plans";
import { Recipe } from "@/types/database";
import GroceryListClient from "./GroceryListClient";

export default async function GroceriesPage() {
  const { data: mealPlans } = await getWeeklyMealPlan();

  // Extract recipes from meal plans
  const recipes: Recipe[] = (mealPlans || [])
    .map((plan) => plan.recipe as Recipe)
    .filter(Boolean);

  // Get unique recipes (in case same recipe is planned multiple times)
  const uniqueRecipes = Array.from(
    new Map(recipes.map((r) => [r.id, r])).values()
  );

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-semibold text-sage-800">
            Grocery List
          </h1>
          <p className="text-sage-600 mt-1">
            {uniqueRecipes.length > 0
              ? `Ingredients for ${uniqueRecipes.length} recipe${uniqueRecipes.length !== 1 ? "s" : ""} this week`
              : "No meals planned yet - add recipes to your meal plan!"}
          </p>
        </div>

        <GroceryListClient recipes={uniqueRecipes} mealPlans={mealPlans || []} />
      </main>
    </div>
  );
}
