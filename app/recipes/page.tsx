import Navigation from "@/components/Navigation";
import RecipeCard from "@/components/RecipeCard";
import { getRecipes } from "@/app/actions/recipes";
import Link from "next/link";
import RecipeFilters from "./RecipeFilters";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    tags?: string;
    minStars?: string;
    sort?: string;
  }>;
}

export default async function RecipesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Parse search params
  const search = params.search || "";
  const tags = params.tags ? params.tags.split(",") : [];
  const minStars = params.minStars ? parseInt(params.minStars, 10) : undefined;
  const sortBy = (params.sort as "created_at" | "title" | "stars") || "created_at";

  const { data: recipes, error } = await getRecipes({
    search: search || undefined,
    tags: tags.length > 0 ? tags : undefined,
    minStars,
    sortBy,
    sortOrder: sortBy === "title" ? "asc" : "desc",
  });

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-sage-800">
              Recipe Collection
            </h1>
            <p className="text-sage-600 mt-1">
              {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          
          <Link
            href="/recipes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage-600 
                     text-white font-medium rounded-lg hover:bg-sage-700 
                     transition-colors self-start sm:self-auto"
          >
            <span>➕</span>
            <span>Add Recipe</span>
          </Link>
        </div>

        {/* Filters - Client Component */}
        <RecipeFilters 
          initialSearch={search}
          initialTags={tags}
          initialMinStars={minStars}
          initialSort={sortBy}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {recipes.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-xl shadow-card">
            {search || tags.length > 0 || minStars ? (
              <>
                <div className="text-5xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold text-sage-800 mb-2">
                  No recipes found
                </h2>
                <p className="text-sage-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Link
                  href="/recipes"
                  className="text-sage-600 hover:text-sage-800 underline"
                >
                  Clear all filters
                </Link>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">📖</div>
                <h2 className="text-xl font-semibold text-sage-800 mb-2">
                  No recipes yet
                </h2>
                <p className="text-sage-600 mb-4">
                  Start building your cookbook by adding your first recipe
                </p>
                <Link
                  href="/recipes/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage-600 
                           text-white font-medium rounded-lg hover:bg-sage-700 
                           transition-colors"
                >
                  <span>➕</span>
                  <span>Add Recipe</span>
                </Link>
              </>
            )}
          </div>
        )}

        {/* Recipe Grid */}
        {recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
