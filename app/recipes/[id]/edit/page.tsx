import { notFound } from "next/navigation";
import { getRecipe } from "@/app/actions/recipes";
import RecipeEditClient from "./RecipeEditClient";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRecipe(id);

  if (result.error || !result.data) {
    notFound();
  }

  return <RecipeEditClient recipe={result.data} />;
}
