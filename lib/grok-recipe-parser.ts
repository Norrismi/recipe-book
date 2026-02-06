// lib/grok-recipe-parser.ts

import { RecipeInsert, Ingredient } from '@/types/database';

interface ParseResult {
  recipe: RecipeInsert | null;
  error?: string;
  warnings?: string[];
}

export function parseGrokRecipe(markdown: string): ParseResult {
  if (!markdown?.trim()) {
    return { recipe: null, error: 'No content provided' };
  }

  const lines = markdown.split('\n');
  const warnings: string[] = [];
  let state: 'none' | 'ingredients' | 'instructions' | 'notes' = 'none';

  const recipe: Partial<RecipeInsert> = {
    title: '',
    source_url: null,
    image_url: null,
    ingredients: [],
    instructions: [],
    servings: 4,
    prep_time: null,
    cook_time: null,
    stars: 0,
    notes: null,
    tags: [],
  };

  let currentIng: Partial<Ingredient> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    if (!line) continue;

    // ── Auto-detect source URL anywhere ───────────────────────────────
    if (!recipe.source_url) {
      const urlMatch = line.match(/https?:\/\/(?:www\.)?(youtube\.com|youtu\.be)\/[^\s)]+/i);
      if (urlMatch) {
        recipe.source_url = urlMatch[0].replace(/[).,]$/, '');
      }
    }

    // ── Title ───────────────────────────────────────────────────────────
    if (line.startsWith('### ') && !recipe.title) {
      recipe.title = line.slice(4).trim();
      continue;
    }

    // Fallback title from first meaningful line if no ### found
    if (!recipe.title && line && !line.startsWith('**') && !line.startsWith('-') && state === 'none') {
      if (line.length > 10 && !line.includes('http') && !line.includes('serves')) {
        recipe.title = line.trim().replace(/\.$/, '');
      }
    }

    // ── Metadata lines (Servings, times, source) ───────────────────────
    if (line.startsWith('**') && line.includes(':**')) {
      const [keyPart, ...valParts] = line.split(':**');
      const key = keyPart.replace(/\*\*/g, '').trim().toLowerCase();
      const value = valParts.join(':**').trim();

      if (key === 'servings' || key.includes('serves')) {
        const num = parseInt(value.replace(/\D/g, ''), 10);
        if (!isNaN(num)) recipe.servings = num;
      } else if (/prep|active/i.test(key)) {
        recipe.prep_time = timeToMinutes(value);
      } else if (/cook|bake|roast/i.test(key)) {
        recipe.cook_time = timeToMinutes(value);
      } else if (/source|url|video|channel/i.test(key)) {
        const urlMatch = value.match(/https?:\/\/\S+/i);
        if (urlMatch) recipe.source_url = urlMatch[0].replace(/[).,]$/, '');
      }
      continue;
    }

    // ── Section detection ───────────────────────────────────────────────
    const lower = line.toLowerCase();

    if (
      lower.includes('ingredients') ||
      lower.includes('**ingredients**') ||
      (line.startsWith('### ') && lower.includes('ingredients'))
    ) {
      state = 'ingredients';
      continue;
    }

    if (
      lower.includes('instructions') ||
      lower.includes('step') ||
      lower.includes('method') ||
      lower.includes('full step-by-step') ||
      lower.includes('**instructions**') ||
      lower.includes('**step')
    ) {
      state = 'instructions';
      continue;
    }

    if (
      lower.includes('notes') ||
      lower.includes('tips') ||
      lower.includes('success') ||
      lower.includes('**notes**') ||
      lower.includes('**tips**') ||
      lower.includes('**for success')
    ) {
      state = 'notes';
      if (!recipe.notes) recipe.notes = '';
      continue;
    }

    // ── Ingredients parsing ─────────────────────────────────────────────
    if (state === 'ingredients') {
      // Match bullet lines: - , * , • , or lines starting with number
      if (/^[-*•]\s*/.test(line) || /^\d+\.\s/.test(line)) {
        const cleaned = line.replace(/^[-*•]\s*|\d+\.\s*/, '').trim();
        if (cleaned) {
          const ing = parseIngredient(cleaned);
          if (ing) {
            recipe.ingredients!.push(ing);
            currentIng = ing;
          }
        }
      }
      // Subheadings like **For the chicken:** → treat as category or skip
      else if (line.startsWith('**') && line.endsWith(':**')) {
        // Optional: could set category on next ingredients
        // For now, just continue (subheadings are common in Grok outputs)
        continue;
      }
      // Continuation lines for previous ingredient
      else if (currentIng && line && !line.startsWith('**') && !line.startsWith('###')) {
        currentIng.notes = (currentIng.notes || '') + (currentIng.notes ? ' ' : '') + line;
      }
    }

    // ── Instructions parsing ────────────────────────────────────────────
    if (state === 'instructions') {
      if (/^\d+\.\s/.test(line) || /^[-*•]\s/.test(line)) {
        const step = line.replace(/^\d+\.\s*|^[-*•]\s*/, '').trim();
        if (step) {
          recipe.instructions!.push(step);
        }
      }
      // Multi-line step continuation
      else if (recipe.instructions!.length > 0 && line && !line.startsWith('**') && !line.startsWith('###')) {
        recipe.instructions![recipe.instructions!.length - 1] += ' ' + line;
      }
    }

    // ── Notes / Tips ────────────────────────────────────────────────────
    if (state === 'notes') {
      if (line && !line.startsWith('**') && !line.startsWith('###')) {
        recipe.notes += (recipe.notes ? '\n' : '') + line;
      }
    }
  }

  // ── Final validation & fallbacks ────────────────────────────────────
  if (!recipe.title) {
    return { recipe: null, error: 'Could not detect recipe title' };
  }

  if (recipe.ingredients!.length === 0) {
    return { recipe: null, error: 'No ingredients found' };
  }

  if (recipe.instructions!.length === 0) {
    return { recipe: null, error: 'No instructions found' };
  }

  // Clean up notes
  if (recipe.notes) {
    recipe.notes = recipe.notes.trim();
  }

  return {
    recipe: recipe as RecipeInsert,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ── Helper: parse ingredient line ───────────────────────────────────────
function parseIngredient(text: string): Ingredient {
  // Try to split amount + unit + name
  const match = text.match(/^([\d½¼¾⅓⅔⅛\s\/.-]+)?\s*([a-zA-Z\s]+)?\s*(.+)$/i);

  let amount = '1';
  let unit = '';
  let name = text.trim();

  if (match) {
    [, amount = '1', unit = '', name = ''] = match.map(s => s?.trim() || '');

    if (!name && unit) {
      name = unit;
      unit = '';
    }

    amount = amount.replace(/\s+/g, ' ').trim();
    unit = unit.replace(/,$/, '').trim();
    name = name.trim();
  }

  return {
    amount,
    unit,
    name: name || text.trim(),
    notes: undefined,
    category: undefined, // you can add guessing later if needed
  };
}

// ── Helper: time string to minutes ──────────────────────────────────────
function timeToMinutes(str: string): number | null {
  if (!str) return null;
  const clean = str.toLowerCase().replace(/about|approx|roughly/gi, '').trim();

  let total = 0;
  const hMatch = clean.match(/(\d+)\s*(h|hour|hr)s?/i);
  const mMatch = clean.match(/(\d+)\s*(m|min|minute)s?/i);

  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  if (mMatch) total += parseInt(mMatch[1], 10);

  return total > 0 ? total : null;
}