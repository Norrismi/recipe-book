"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { parseRecipeFromUrl } from "@/lib/recipe-parser";
import { RecipeInsert, RecipeUpdate, Ingredient } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseGrokRecipe } from '@/lib/grok-recipe-parser';

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


// ... existing imports and actions ...



export async function importGrokRecipe(rawText: string) {
  'use server';

  const user = await getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Parse once — only one declaration
  const parseResult = parseGrokRecipe(rawText);

  if (!parseResult.recipe) {
    return { success: false, error: parseResult.error || 'Parse failed' };
  }

  // Clean up title: take only the actual recipe name if the parser captured the intro text
  let cleanTitle = parseResult.recipe.title.trim();

  // Common patterns Grok uses – remove intro if title starts with "The video..." or similar
  if (cleanTitle.toLowerCase().startsWith('the video') || cleanTitle.length > 100) {
    // Try to extract just the recipe name (often between ** ** or after "is **...**")
    const match = cleanTitle.match(/\*\*(.+?)\*\*/);
    if (match && match[1]) {
      cleanTitle = match[1].trim();
    } else {
      // Fallback: take first line or up to first period
      cleanTitle = cleanTitle.split('.')[0].trim();
    }
  }

  // Force a fallback title if still too long or empty
  if (!cleanTitle || cleanTitle.length < 3 || cleanTitle.length > 120) {
    cleanTitle = "Imported Recipe";
  }

  const toInsert: RecipeInsert = {
    ...parseResult.recipe,
    title: cleanTitle,   // override here
    user_id: user.id,
    tags: parseResult.recipe.source_url?.includes('youtube') || 
          parseResult.recipe.source_url?.includes('youtu.be')
      ? [...(parseResult.recipe.tags ?? []), 'YouTube', 'Grok Import']
      : (parseResult.recipe.tags ?? []),
  };

  const { data, error } = await supabase
    .from('recipes')
    .insert(toInsert)
    .select('id')
    .single();

  if (error) {
    console.error('Insert error:', error);
    return { success: false, error: error.message };
  }

  // Revalidate so the new recipe shows up immediately in lists
  revalidatePath('/recipes');
  revalidatePath('/');

  return {
    success: true,
    recipeId: data.id,
    warnings: parseResult.warnings ?? undefined,
  };
}