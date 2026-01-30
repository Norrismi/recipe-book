import { notFound } from "next/navigation";
import { getRecipe } from "@/app/actions/recipes";
import Navigation from "@/components/Navigation";
import RecipeDetailClient from "./RecipeDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data: recipe, error } = await getRecipe(id);

  if (error || !recipe) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navigation />
      <RecipeDetailClient recipe={recipe} />
    </div>
  );
}