"use client";

import { useState } from "react";
import { Ingredient } from "@/types/database";

interface BulkRecipeImportProps {
  onImportComplete: (data: {
    title: string;
    ingredients: Ingredient[];
    instructions: string[];
  }) => void;
  onCancel: () => void;
}

export default function BulkRecipeImport({ onImportComplete, onCancel }: BulkRecipeImportProps) {
  const [title, setTitle] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [parseMode, setParseMode] = useState<"smart" | "simple">("smart");

  // Smart ingredient parser - handles common formats
  const parseIngredients = (text: string): Ingredient[] => {
    const lines = text.split("\n").filter(line => line.trim());
    
    return lines.map(line => {
      let trimmed = line.trim();
      
      if (parseMode === "simple") {
        return { amount: "", unit: "", name: trimmed };
      }

      // Remove bullets/dashes at start
      trimmed = trimmed.replace(/^[•\-*]\s*/, "");
      
      // Split into words
      const words = trimmed.split(/\s+/);
      if (words.length === 0) return { amount: "", unit: "", name: "" };
      
      let amount = "";
      let unit = "";
      let nameStart = 0;
      
      // Check if first word is a number/fraction (including unicode fractions)
      const firstWord = words[0];
      if (/^[\d½⅓¼¾⅔⅛⅜⅝⅞\/\-]+$/.test(firstWord)) {
        amount = firstWord;
        nameStart = 1;
        
        // Check if second word is also a number (for mixed fractions like "1 1/2")
        if (words.length > 1 && /^[\d\/]+$/.test(words[1])) {
          amount = `${amount} ${words[1]}`;
          nameStart = 2;
        }
      }
      
      // If we found an amount, check if next word is a unit
      if (amount && nameStart < words.length) {
        const possibleUnit = words[nameStart];
        // Common units (case insensitive check)
        const units = ['cup', 'cups', 'tsp', 'tsps', 'teaspoon', 'teaspoons', 
                       'tbsp', 'tbsps', 'tablespoon', 'tablespoons',
                       'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
                       'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
                       'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
                       'clove', 'cloves', 'piece', 'pieces', 'pinch', 'dash',
                       'can', 'cans', 'jar', 'jars', 'package', 'packages'];
        
        if (units.includes(possibleUnit.toLowerCase())) {
          unit = possibleUnit;
          nameStart++;
        }
      }
      
      // Everything else is the name
      const name = words.slice(nameStart).join(" ");
      
      // If no amount was found, put everything in name
      if (!amount && !unit) {
        return { amount: "", unit: "", name: trimmed };
      }
      
      return { amount, unit, name };
    }).filter(ing => ing.name || ing.amount);
  };

  // Smart instruction parser - handles numbered lists
  const parseInstructions = (text: string): string[] => {
    const lines = text.split("\n").filter(line => line.trim());
    
    return lines.map(line => {
      // Remove common prefixes: "1.", "Step 1:", "1)", etc.
      return line.trim()
        .replace(/^(step\s*)?\d+[.):]\s*/i, "")
        .replace(/^[•\-*]\s*/, "");
    }).filter(inst => inst.length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const ingredients = parseIngredients(ingredientsText);
    const instructions = parseInstructions(instructionsText);
    
    onImportComplete({
      title: title.trim(),
      ingredients,
      instructions
    });
  };

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 shadow-card border border-[var(--border)]">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          📋 Bulk Import Recipe
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Copy and paste recipe details to quickly import. The smart parser will try to extract amounts and units automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
            Recipe Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The Healthiest Bread in the World"
            required
            className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)]
                     text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                     focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
          />
        </div>

        {/* Parse Mode Toggle */}
        <div className="flex items-center gap-4 p-3 bg-[var(--muted)]/30 rounded-lg">
          <span className="text-sm text-[var(--muted-foreground)]">Parse mode:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="smart"
              checked={parseMode === "smart"}
              onChange={(e) => setParseMode(e.target.value as "smart" | "simple")}
              className="w-4 h-4 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-sm text-[var(--foreground)]">
              Smart (auto-detect amounts & units)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="simple"
              checked={parseMode === "simple"}
              onChange={(e) => setParseMode(e.target.value as "smart" | "simple")}
              className="w-4 h-4 text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-sm text-[var(--foreground)]">
              Simple (keep as-is)
            </span>
          </label>
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
            Ingredients (one per line) *
          </label>
          <div className="mb-2 text-xs text-[var(--muted-foreground)] space-y-1">
            <div>💡 <strong>Smart mode examples:</strong></div>
            <div className="ml-4 font-mono text-[var(--muted-foreground)]/80">
              2 cups flour<br/>
              1/2 tsp salt<br/>
              3-4 cloves garlic<br/>
              2 eggs
            </div>
          </div>
          <textarea
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="1 cup almond flour&#10;1 cup arrowroot flour&#10;1/3 cup coconut flour&#10;1 tsp sea salt&#10;2 tsp active dry yeast"
            rows={10}
            required
            className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)]
                     text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                     focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50 
                     font-mono text-sm resize-none"
          />
          <div className="mt-2 text-xs text-[var(--muted-foreground)]">
            {ingredientsText.split("\n").filter(l => l.trim()).length} ingredients detected
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
            Instructions (one per line) *
          </label>
          <div className="mb-2 text-xs text-[var(--muted-foreground)] space-y-1">
            <div>💡 Numbers and bullets will be automatically removed</div>
          </div>
          <textarea
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            placeholder="1. In a large bowl, whisk together the almond flour...&#10;2. Heat water at 105-110 °F. Add 2 tsp of maple syrup...&#10;3. Stir the finely ground chia and psyllium powder..."
            rows={12}
            required
            className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)]
                     text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60
                     focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50
                     font-mono text-sm resize-none"
          />
          <div className="mt-2 text-xs text-[var(--muted-foreground)]">
            {instructionsText.split("\n").filter(l => l.trim()).length} steps detected
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-[var(--border)] text-[var(--muted-foreground)] font-medium 
                     rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !ingredientsText.trim() || !instructionsText.trim()}
            className="flex-1 px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg
                     hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2"
          >
            <span>✨</span>
            <span>Parse & Continue</span>
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-[var(--muted)]/20 rounded-lg border border-[var(--border)]">
        <div className="text-xs text-[var(--muted-foreground)] space-y-2">
          <div className="font-semibold text-[var(--foreground)]">📝 Tips:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Paste ingredients and instructions directly from recipe websites</li>
            <li>Smart mode works best with formatted text like "2 cups flour"</li>
            <li>Use simple mode if ingredients are already in a custom format</li>
            <li>You can edit individual items after parsing</li>
            <li>Numbers and bullets in instructions are automatically removed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
