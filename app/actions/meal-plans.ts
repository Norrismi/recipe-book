"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { MealPlanInsert, MealPlanUpdate } from "@/types/database";
import { revalidatePath } from "next/cache";

/**
 * Adds a recipe to the meal plan for a specific date.
 */
export async function addToMealPlan(data: {
  recipe_id: string;
  planned_date: string; // YYYY-MM-DD
  meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
  servings_override?: number;
}) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to plan meals." };
  }

  const supabase = await createClient();

  const mealPlanData: MealPlanInsert = {
    user_id: user.id,
    recipe_id: data.recipe_id,
    planned_date: data.planned_date,
    meal_type: data.meal_type || "dinner",
    servings_override: data.servings_override || null,
  };

  const { data: mealPlan, error } = await supabase
    .from("meal_plans")
    .insert(mealPlanData)
    .select()
    .single();

  if (error) {
    console.error("Add to meal plan error:", error);
    return { error: "Failed to add recipe to meal plan." };
  }

  revalidatePath("/plan");
  revalidatePath("/groceries");
  
  return { data: mealPlan };
}

/**
 * Updates a meal plan entry.
 */
export async function updateMealPlan(id: string, data: MealPlanUpdate) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to update meal plan." };
  }

  const supabase = await createClient();

  const { data: mealPlan, error } = await supabase
    .from("meal_plans")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Update meal plan error:", error);
    return { error: "Failed to update meal plan." };
  }

  revalidatePath("/plan");
  revalidatePath("/groceries");
  
  return { data: mealPlan };
}

/**
 * Removes a recipe from the meal plan.
 */
export async function removeFromMealPlan(id: string) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to modify meal plan." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Remove from meal plan error:", error);
    return { error: "Failed to remove from meal plan." };
  }

  revalidatePath("/plan");
  revalidatePath("/groceries");
  
  return { success: true };
}

/**
 * Gets meal plans for a date range with recipe details.
 */
export async function getMealPlans(startDate: string, endDate: string) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to view meal plan.", data: [] };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meal_plans")
    .select(`
      *,
      recipe:recipes(*)
    `)
    .eq("user_id", user.id)
    .gte("planned_date", startDate)
    .lte("planned_date", endDate)
    .order("planned_date", { ascending: true })
    .order("meal_type", { ascending: true });

  if (error) {
    console.error("Get meal plans error:", error);
    return { error: "Failed to load meal plan.", data: [] };
  }

  return { data: data || [] };
}

/**
 * Gets meal plans for the current week (starting Sunday).
 */
export async function getWeeklyMealPlan() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  
  // Start of week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // End of week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startDate = startOfWeek.toISOString().split("T")[0];
  const endDate = endOfWeek.toISOString().split("T")[0];
  
  return getMealPlans(startDate, endDate);
}

/**
 * Clears all meal plans for a specific date.
 */
export async function clearDayMealPlan(date: string) {
  const user = await getUser();
  
  if (!user) {
    return { error: "You must be logged in to modify meal plan." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("user_id", user.id)
    .eq("planned_date", date);

  if (error) {
    console.error("Clear day meal plan error:", error);
    return { error: "Failed to clear day's meal plan." };
  }

  revalidatePath("/plan");
  revalidatePath("/groceries");
  
  return { success: true };
}
