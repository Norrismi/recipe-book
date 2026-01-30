import Navigation from "@/components/Navigation";
import RecipeCard from "@/components/RecipeCard";
import { getRecipes } from "@/app/actions/recipes";
import { getWeeklyMealPlan } from "@/app/actions/meal-plans";
import Link from "next/link";
import { Recipe } from "@/types/database";

export default async function DashboardPage() {
  const [recipesResult, mealPlanResult] = await Promise.all([
    getRecipes({ sortBy: "stars", sortOrder: "desc" }),
    getWeeklyMealPlan(),
  ]);

  const recipes = recipesResult.data || [];
  const mealPlans = mealPlanResult.data || [];
  
  // Get top-rated recipes (3 stars)
  const favorites = recipes.filter((r) => r.stars === 3).slice(0, 4);
  
  // Get recent recipes
  const recentRecipes = [...recipes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // Get today's and this week's planned meals
  const today = new Date().toISOString().split("T")[0];
  const todaysMeals = mealPlans.filter((m) => m.planned_date === today);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-semibold text-[var(--foreground)]">
            Welcome back! 👋
          </h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            What are we cooking today?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <QuickStatCard 
            icon="📖" 
            label="Total Recipes" 
            value={recipes.length} 
            href="/recipes"
          />
          <QuickStatCard 
            icon="⭐" 
            label="Favorites" 
            value={favorites.length} 
            href="/recipes?minStars=3"
          />
          <QuickStatCard 
            icon="📅" 
            label="This Week" 
            value={mealPlans.length} 
            href="/plan"
          />
          <QuickStatCard 
            icon="🛒" 
            label="Groceries" 
            value="View List" 
            href="/groceries"
          />
        </div>

        {/* Today's Meals */}
        {todaysMeals.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-[var(--foreground)]">
                🍽️ Today&apos;s Menu
              </h2>
              <Link 
                href="/plan" 
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                View full plan →
              </Link>
            </div>
            <div className="bg-[var(--card)] rounded-xl p-4 shadow-card border border-[var(--border)]">
              <div className="divide-y divide-[var(--border)]">
                {todaysMeals.map((meal) => (
                  <div key={meal.id} className="py-3 flex items-center gap-4">
                    <span className="text-sm font-medium text-[var(--muted-foreground)] w-20 capitalize">
                      {meal.meal_type}
                    </span>
                    <Link 
                      href={`/recipes/${meal.recipe_id}`}
                      className="text-[var(--foreground)] hover:text-[var(--accent)] font-medium"
                    >
                      {(meal.recipe as Recipe)?.title || "Unknown Recipe"}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty State for New Users */}
        {recipes.length === 0 && (
          <div className="text-center py-16 bg-[var(--card)] rounded-xl shadow-card border border-[var(--border)]">
            <div className="text-6xl mb-4">🍳</div>
            <h2 className="text-2xl font-display font-semibold text-[var(--foreground)] mb-2">
              Your cookbook is empty!
            </h2>
            <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
              Start building your collection by adding your first recipe. 
              You can import from a URL or add it manually.
            </p>
            <Link
              href="/recipes/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] 
                       text-white font-medium rounded-lg hover:bg-[var(--accent)]/90 
                       transition-colors"
            >
              <span>➕</span>
              <span>Add Your First Recipe</span>
            </Link>
          </div>
        )}

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-[var(--foreground)]">
                ⭐ Family Favorites
              </h2>
              <Link 
                href="/recipes?minStars=3" 
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {favorites.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Recipes Section */}
        {recentRecipes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-[var(--foreground)]">
                📝 Recently Added
              </h2>
              <Link 
                href="/recipes" 
                className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Quick stat card component
function QuickStatCard({ 
  icon, 
  label, 
  value, 
  href 
}: { 
  icon: string; 
  label: string; 
  value: number | string; 
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-[var(--card)] rounded-xl p-4 shadow-card hover:shadow-card-hover
               transition-all duration-200 flex items-center gap-3
               border border-[var(--border)] text-[var(--foreground)]"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      </div>
    </Link>
  );
}