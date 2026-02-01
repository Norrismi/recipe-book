/* eslint-disable @typescript-eslint/no-unused-vars */

import * as cheerio from "cheerio";
import { Ingredient } from "@/types/database";

interface ParsedRecipe {
  title: string;
  image_url: string | null;
  ingredients: Ingredient[];
  instructions: string[];
  servings: number;
  prep_time: number | null;
  cook_time: number | null;
}

/**
 * Parses a recipe from a URL.
 * Tries JSON-LD structured data first (most recipe sites have this),
 * then falls back to basic HTML parsing.
 */
export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    const response = await fetch(url, {
      headers: {
        // Pretend to be a browser to avoid blocks
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to find JSON-LD structured data (Recipe schema)
    // Most recipe sites include this for SEO
    const jsonLdScripts = $('script[type="application/ld+json"]');

    for (let i = 0; i < jsonLdScripts.length; i++) {
      try {
        const jsonText = $(jsonLdScripts[i]).html();
        if (!jsonText) continue;

        const json = JSON.parse(jsonText);
        const recipe = findRecipeInJsonLd(json);

        if (recipe) {
          return parseJsonLdRecipe(recipe);
        }
      } catch {
        // Invalid JSON, try next script
        continue;
      }
    }

    // Fallback: Basic HTML parsing
    return parseHtmlFallback($, url);
  } catch (error) {
    console.error("Error parsing recipe:", error);
    return null;
  }
}

/**
 * Recursively searches for a Recipe object in JSON-LD data.
 * Handles both direct Recipe objects and @graph arrays.
 */
function findRecipeInJsonLd(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  // Check if this is a Recipe
  const obj = data as Record<string, unknown>;
  if (obj["@type"] === "Recipe" ||
    (Array.isArray(obj["@type"]) && obj["@type"].includes("Recipe"))) {
    return obj;
  }

  // Check @graph array (common pattern)
  if (Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
  }

  // Check if it's an array
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Parses a JSON-LD Recipe object into our format.
 */
function parseJsonLdRecipe(recipe: Record<string, unknown>): ParsedRecipe {
  // Parse ingredients
  const rawIngredients = recipe.recipeIngredient;
  const ingredients: Ingredient[] = [];

  if (Array.isArray(rawIngredients)) {
    for (const ing of rawIngredients) {
      if (typeof ing === "string") {
        ingredients.push(parseIngredientString(ing));
      }
    }
  }

  // Parse instructions
  const rawInstructions = recipe.recipeInstructions;
  const instructions: string[] = [];

  if (Array.isArray(rawInstructions)) {
    for (const inst of rawInstructions) {
      if (typeof inst === "string") {
        instructions.push(inst);
      } else if (typeof inst === "object" && inst !== null) {
        const step = inst as Record<string, unknown>;
        if (step.text && typeof step.text === "string") {
          instructions.push(step.text);
        }
      }
    }
  } else if (typeof rawInstructions === "string") {
    // Some sites have instructions as a single string with newlines
    instructions.push(...rawInstructions.split(/\n+/).filter(Boolean));
  }

  // Parse image
  let image_url: string | null = null;
  if (typeof recipe.image === "string") {
    image_url = recipe.image;
  } else if (Array.isArray(recipe.image) && recipe.image.length > 0) {
    const firstImage = recipe.image[0];
    image_url = typeof firstImage === "string" ? firstImage :
      (firstImage as Record<string, unknown>)?.url as string || null;
  } else if (typeof recipe.image === "object" && recipe.image !== null) {
    image_url = (recipe.image as Record<string, unknown>).url as string || null;
  }

  // Parse times (ISO 8601 duration format: PT30M, PT1H30M, etc.)
  const prep_time = parseDuration(recipe.prepTime as string);
  const cook_time = parseDuration(recipe.cookTime as string);

  // Parse servings
  let servings = 4; // default
  if (typeof recipe.recipeYield === "string") {
    const match = recipe.recipeYield.match(/\d+/);
    if (match) servings = parseInt(match[0], 10);
  } else if (typeof recipe.recipeYield === "number") {
    servings = recipe.recipeYield;
  } else if (Array.isArray(recipe.recipeYield) && recipe.recipeYield.length > 0) {
    const first = recipe.recipeYield[0];
    if (typeof first === "number") servings = first;
    else if (typeof first === "string") {
      const match = first.match(/\d+/);
      if (match) servings = parseInt(match[0], 10);
    }
  }

  return {
    title: (recipe.name as string) || "Untitled Recipe",
    image_url,
    ingredients,
    instructions,
    servings,
    prep_time,
    cook_time,
  };
}

/**
 * Parses an ISO 8601 duration string (e.g., "PT30M", "PT1H30M") to minutes.
 */
function parseDuration(duration: string | undefined): number | null {
  if (!duration || typeof duration !== "string") return null;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return null;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);

  return hours * 60 + minutes || null;
}

/**
 * Parses an ingredient string like "2 cups all-purpose flour, sifted"
 * into structured data.
 */
function parseIngredientString(text: string): Ingredient {
  // Common units to look for
  const units = [
    "cups?", "cup", "c\\.",
    "tablespoons?", "tbsp?", "T\\.",
    "teaspoons?", "tsp?", "t\\.",
    "ounces?", "oz\\.?",
    "pounds?", "lbs?\\.?",
    "grams?", "g\\.",
    "kilograms?", "kg\\.?",
    "ml", "milliliters?",
    "liters?", "l\\.",
    "pinch(?:es)?",
    "dash(?:es)?",
    "cloves?",
    "cans?",
    "packages?", "pkg\\.?",
    "bunche?s?",
    "stalks?",
    "slices?",
    "pieces?",
  ].join("|");

  // Match pattern: amount (optional), unit (optional), name, notes in parentheses (optional)
  const regex = new RegExp(
    `^([\\d\\s\\-\\/\\.]+)?\\s*(${units})?\\s*(.+?)(?:\\s*[,\\(]\\s*(.+?)\\)?)?$`,
    "i"
  );

  const match = text.trim().match(regex);

  if (!match) {
    return { amount: "", unit: "", name: text.trim() };
  }

  const [, amount = "", unit = "", name = "", notes = ""] = match;

  return {
    amount: amount.trim(),
    unit: unit.replace(/\.$/, "").trim(), // Remove trailing period
    name: name.trim(),
    notes: notes.trim() || undefined,
  };
}

/**
 * Fallback HTML parsing when JSON-LD is not available.
 * This is less reliable but catches some basic cases.
 */
function parseHtmlFallback($: cheerio.CheerioAPI, url: string): ParsedRecipe {
  // Try to find title
  const title =
    $('h1[class*="recipe"]').first().text().trim() ||
    $('h1[class*="title"]').first().text().trim() ||
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    "Untitled Recipe";

  // Try to find image
  const image_url =
    $('meta[property="og:image"]').attr("content") ||
    $('img[class*="recipe"]').first().attr("src") ||
    null;

  // Try to find ingredients (look for common list patterns)
  const ingredients: Ingredient[] = [];
  $('[class*="ingredient"] li, [class*="ingredients"] li').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      ingredients.push(parseIngredientString(text));
    }
  });

  // Try to find instructions
  const instructions: string[] = [];
  $('[class*="instruction"] li, [class*="instructions"] li, [class*="direction"] li, [class*="step"] p').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      instructions.push(text);
    }
  });

  return {
    title: title.substring(0, 200), // Limit length
    image_url,
    ingredients,
    instructions,
    servings: 4,
    prep_time: null,
    cook_time: null,
  };
}

/**
 * Combines and aggregates ingredients from multiple recipes for grocery list.
 * Tries to combine similar items (e.g., "2 cups flour" + "1 cup flour" = "3 cups flour").
 */
export function aggregateIngredients(
  recipes: { title: string; ingredients: Ingredient[]; multiplier?: number }[]
): Map<string, { amount: number; unit: string; category: string; fromRecipes: string[] }> {
  const aggregated = new Map<string, { amount: number; unit: string; category: string; fromRecipes: string[] }>();

  for (const recipe of recipes) {
    const multiplier = recipe.multiplier || 1;

    for (const ing of recipe.ingredients) {
      // Create a normalized key for matching
      const key = ing.name.toLowerCase().trim();

      const existing = aggregated.get(key);
      const amount = parseFloat(ing.amount.replace(/[^\d.\/]/g, "")) || 0;

      // Handle fractions like "1/2"
      let numericAmount = amount;
      if (ing.amount.includes("/")) {
        const [num, denom] = ing.amount.split("/").map(Number);
        if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
          numericAmount = num / denom;
        }
      }

      if (existing) {
        // Only combine if units match (or no unit)
        if (existing.unit === ing.unit || !existing.unit || !ing.unit) {
          existing.amount += numericAmount * multiplier;
          if (!existing.fromRecipes.includes(recipe.title)) {
            existing.fromRecipes.push(recipe.title);
          }
        } else {
          // Different units - keep separate (could add unit conversion later)
          const altKey = `${key} (${ing.unit})`;
          aggregated.set(altKey, {
            amount: numericAmount * multiplier,
            unit: ing.unit,
            category: ing.category || guessCategory(ing.name),
            fromRecipes: [recipe.title],
          });
        }
      } else {
        aggregated.set(key, {
          amount: numericAmount * multiplier,
          unit: ing.unit,
          category: ing.category || guessCategory(ing.name),
          fromRecipes: [recipe.title],
        });
      }
    }
  }

  return aggregated;
}

/**
 * Guesses the grocery category based on ingredient name.
 */
function guessCategory(name: string): string {
  const lowerName = name.toLowerCase();

  const categories: Record<string, string[]> = {
    "Produce": ["lettuce", "tomato", "onion", "garlic", "carrot", "celery", "pepper", "potato", "apple", "banana", "lemon", "lime", "orange", "avocado", "spinach", "kale", "broccoli", "cucumber", "mushroom", "ginger", "herb", "cilantro", "parsley", "basil", "thyme", "rosemary"],
    "Dairy & Eggs": ["milk", "cream", "butter", "cheese", "yogurt", "egg", "sour cream"],
    "Meat & Seafood": ["chicken", "beef", "pork", "turkey", "salmon", "shrimp", "fish", "bacon", "sausage", "ground"],
    "Bakery": ["bread", "tortilla", "bun", "roll", "croissant", "bagel", "pita"],
    "Pantry": ["flour", "sugar", "rice", "pasta", "oil", "vinegar", "sauce", "broth", "stock", "honey", "syrup", "oat", "cereal", "nut", "seed"],
    "Spices & Seasonings": ["salt", "pepper", "cumin", "paprika", "oregano", "cinnamon", "nutmeg", "cayenne", "chili", "curry"],
    "Canned Goods": ["canned", "beans", "tomato paste", "diced tomato", "coconut milk"],
    "Frozen": ["frozen"],
    "Condiments": ["ketchup", "mustard", "mayo", "mayonnaise", "soy sauce", "hot sauce", "dressing"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }

  return "Other";
}
