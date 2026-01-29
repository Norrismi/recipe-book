"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { parseRecipeFromUrl } from "@/lib/recipe-parser";
import { RecipeInsert, RecipeUpdate, Ingredient } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Parses a recipe from a URL and returns the extracted data.
 * Does NOT save to database - that's a separate step.
 */
export async function parseRecipe(url: string) {
  try {
    const parsed = await parseRecipeFromUrl(url);
    
    if (!parsed) {
      return { error: "Could not parse recipe from this URL. Try manual entry." };
    }

    return { data: parsed };
  } catch (error) {
    console.error("Parse recipe error:", error);
    return { error: "Failed to fetch the recipe. Please check the URL or enter manually." };
  }
}

/**
 * Creates a new recipe in the database.
 */
export async function createRecipe(data: {
  title: string;
  source_url?: string;
  image_url?: string;
  ingredients: Ingredient[];
  instructions: string[];
  servings: number;
  prep_time?: number;
  cook_time?: number;
  stars?: number;
  notes?: string;
  tags: string[];
}) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to create a recipe." };
  }

  const supabase = await createClient();

  const recipeData: RecipeInsert = {
    user_id: user.id,
    title: data.title,
    source_url: data.source_url || null,
    image_url: data.image_url || null,
    ingredients: data.ingredients,
    instructions: data.instructions,
    servings: data.servings || 4,
    prep_time: data.prep_time || null,
    cook_time: data.cook_time || null,
    stars: data.stars || 0,
    notes: data.notes || null,
    tags: data.tags || [],
  };

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert(recipeData)
    .select()
    .single();

  if (error) {
    console.error("Create recipe error:", error);
    return { error: "Failed to save recipe. Please try again." };
  }

  revalidatePath("/recipes");
  revalidatePath("/");
  
  return { data: recipe };
}

/**
 * Updates an existing recipe.
 */
export async function updateRecipe(id: string, data: RecipeUpdate) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to update a recipe." };
  }

  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id) // Extra safety: only update own recipes
    .select()
    .single();

  if (error) {
    console.error("Update recipe error:", error);
    return { error: "Failed to update recipe." };
  }

  revalidatePath(`/recipes/${id}`);
  revalidatePath("/recipes");
  revalidatePath("/");
  
  return { data: recipe };
}

/**
 * Deletes a recipe.
 */
export async function deleteRecipe(id: string) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to delete a recipe." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Delete recipe error:", error);
    return { error: "Failed to delete recipe." };
  }

  revalidatePath("/recipes");
  revalidatePath("/");
  
  redirect("/recipes");
}

/**
 * Fetches all recipes for the current user.
 */
export async function getRecipes(options?: {
  search?: string;
  tags?: string[];
  minStars?: number;
  sortBy?: "created_at" | "title" | "stars";
  sortOrder?: "asc" | "desc";
}) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to view recipes.", data: [] };
  }

  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select("*")
    .eq("user_id", user.id);

  // Search filter
  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,notes.ilike.%${options.search}%`);
  }

  // Tags filter
  if (options?.tags && options.tags.length > 0) {
    query = query.contains("tags", options.tags);
  }

  // Stars filter
  if (options?.minStars) {
    query = query.gte("stars", options.minStars);
  }

  // Sorting
  const sortBy = options?.sortBy || "created_at";
  const sortOrder = options?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("Get recipes error:", error);
    return { error: "Failed to load recipes.", data: [] };
  }

  return { data: data || [] };
}

/**
 * Fetches a single recipe by ID.
 */
export async function getRecipe(id: string) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to view this recipe." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Get recipe error:", error);
    return { error: "Recipe not found." };
  }

  return { data };
}

/**
 * Quick action to update just the star rating.
 */
export async function updateRecipeRating(id: string, stars: number) {
  return updateRecipe(id, { stars });
}

/**
 * Quick action to update just the notes.
 */
export async function updateRecipeNotes(id: string, notes: string) {
  return updateRecipe(id, { notes });
}
