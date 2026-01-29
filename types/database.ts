// Database types for Supabase tables
// These match the SQL schema we created

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  source_url: string | null;
  image_url: string | null;
  ingredients: Ingredient[];
  instructions: string[];
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
  stars: number; // 0-3
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  amount: string;      // "2", "1/2", "1-2"
  unit: string;        // "cup", "tbsp", "lb", ""
  name: string;        // "all-purpose flour"
  notes?: string;      // "sifted", "room temperature"
  category?: string;   // "produce", "dairy", "pantry" for grocery sorting
}

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  planned_date: string; // YYYY-MM-DD
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  servings_override: number | null;
  created_at: string;
  // Joined data
  recipe?: Recipe;
}

// For insert/update operations (without generated fields)
export type RecipeInsert = Omit<Recipe, "id" | "created_at" | "updated_at">;
export type RecipeUpdate = Partial<Omit<Recipe, "id" | "user_id" | "created_at">>;

export type MealPlanInsert = Omit<MealPlan, "id" | "created_at" | "recipe">;
export type MealPlanUpdate = Partial<Omit<MealPlan, "id" | "user_id" | "created_at" | "recipe">>;

// Grocery list item (computed from recipes)
export interface GroceryItem {
  name: string;
  totalAmount: string;
  unit: string;
  category: string;
  checked: boolean;
  fromRecipes: string[]; // Recipe titles this ingredient comes from
}

// Predefined tags for the UI
export const RECIPE_TAGS = [
  "Breakfast",
  "Lunch", 
  "Dinner",
  "Dessert",
  "Snack",
  "Appetizer",
  "Side Dish",
  "Soup",
  "Salad",
  "Quick (< 30 min)",
  "Slow Cooker",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Kid-Friendly",
  "Holiday",
  "Comfort Food",
] as const;

// Grocery categories for organizing the list
export const GROCERY_CATEGORIES = [
  "Produce",
  "Dairy & Eggs",
  "Meat & Seafood",
  "Bakery",
  "Pantry",
  "Frozen",
  "Canned Goods",
  "Spices & Seasonings",
  "Condiments",
  "Beverages",
  "Other",
] as const;
