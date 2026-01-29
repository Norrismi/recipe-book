import Navigation from "@/components/Navigation";
import { getRecipes } from "@/app/actions/recipes";
import MealPlanCalendar from "./MealPlanCalendar";

export default async function PlanPage() {
  // Get all recipes for the recipe selector
  const { data: recipes } = await getRecipes({ sortBy: "title", sortOrder: "asc" });

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-semibold text-sage-800">
            Meal Planning
          </h1>
          <p className="text-sage-600 mt-1">
            Plan your week&apos;s meals and generate a grocery list
          </p>
        </div>

        <MealPlanCalendar recipes={recipes || []} />
      </main>
    </div>
  );
}
