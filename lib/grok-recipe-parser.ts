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
    let state: 'none' | 'intro' | 'ingredients' | 'instructions' | 'notes' = 'none';

    const recipe: Partial<RecipeInsert> = {
        title: '',
        source_url: null,
        image_url: null,
        ingredients: [],
        instructions: [],
        servings: 4, // default fallback
        prep_time: null,
        cook_time: null,
        stars: 0,
        notes: null,
        tags: [],
    };

    let currentIng: Partial<Ingredient> | null = null;
    const introLines: string[] = []; // collect intro text as fallback for notes/description

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimEnd();
        if (!line) continue;

        const lowerLine = line.toLowerCase();

        // ── Extract source URL (anywhere) ─────────────────────────────────────
        if (!recipe.source_url) {
            const urlMatch = line.match(/https?:\/\/(?:www\.)?(youtube\.com|youtu\.be)\/[^\s.,)]+/i);
            if (urlMatch) {
                recipe.source_url = urlMatch[0].replace(/[).,]$/, '');
            }
        }

        // ── Title extraction ──────────────────────────────────────────────────
        if (!recipe.title) {
            // Prefer bold text in intro (most common Grok pattern)
            const boldMatch = line.match(/\*\*(.*?)\*\*/);
            if (boldMatch && boldMatch[1].length > 5 && !boldMatch[1].toLowerCase().includes('channel')) {
                recipe.title = boldMatch[1].trim().replace(/^["']|["']$/g, ''); // remove quotes
                continue;
            }

            // Fallback: first substantial non-list line
            if (state === 'none' && line.length > 15 && !line.startsWith('-') && !line.startsWith('**For') && !lowerLine.includes('serves')) {
                recipe.title = line.trim().replace(/\.$/, '');
            }
        }

        // ── Collect intro text (before first section header) ──────────────────
        if (state === 'none' && !lowerLine.match(/###|ingredients|instructions|method|tips|notes/)) {
            introLines.push(line);
        }

        // ── Servings from intro/metadata ─────────────────────────────────────
        if (lowerLine.includes('serves') || lowerLine.includes('makes about') || lowerLine.includes('serving')) {
            const numMatch = lowerLine.match(/(\d+)(?:-|–|to)(\d+)|(\d+)/);
            if (numMatch) {
                const servings = numMatch[3] ? parseInt(numMatch[3], 10) : parseInt(numMatch[1], 10);
                if (!isNaN(servings) && servings > 0) recipe.servings = servings;
            }
        }

        // Detect prep/cook time lines (e.g. "Prep time ~20 minutes", "bake time ~50-55 minutes")
        if (!recipe.prep_time || !recipe.cook_time) {
            const timeMatch = line.match(/(prep|active|cook|bake|roast|total)\s*(?:time)?\s*[:~-]?\s*([\d\s-–]+)\s*(min|minute|minutes|hr|hour|hours)/i);
            if (timeMatch) {
                const type = timeMatch[1].toLowerCase();
                const timeStr = timeMatch[2] + ' ' + timeMatch[3];
                const minutes = timeToMinutes(timeStr);
                if (minutes !== null) {
                    if (type.includes('prep') || type.includes('active')) {
                        recipe.prep_time = minutes;
                    } else if (type.includes('cook') || type.includes('bake') || type.includes('roast')) {
                        recipe.cook_time = minutes;
                    } else if (type.includes('total')) {
                        // Optional: split if needed
                        recipe.cook_time = minutes;
                    }
                }
            }
        }

        // ── Section detection (flexible keywords + header patterns) ───────────
        if (lowerLine.includes('ingredients') || lowerLine.match(/^\s*###\s*.*ingredients/i)) {
            state = 'ingredients';
            continue;
        }

        if (
            lowerLine.includes('instructions') ||
            lowerLine.includes('step-by-step') ||
            lowerLine.includes('method') ||
            lowerLine.includes('full step') ||
            lowerLine.match(/^\s*###\s*.*(step|method|instructions)/i)
        ) {
            state = 'instructions';
            continue;
        }

        if (
            lowerLine.includes('tips') ||
            lowerLine.includes('notes') ||
            lowerLine.includes('success') ||
            lowerLine.includes('suggestions') ||
            lowerLine.includes('serve') ||
            lowerLine.match(/^\s*###\s*.*(tips|notes|success|suggestions|serve)/i)
        ) {
            state = 'notes';
            if (!recipe.notes) recipe.notes = '';
            continue;
        }

        // ── Ingredients parsing ───────────────────────────────────────────────
        if (state === 'ingredients') {
            // Subheading (e.g. **For the Kebab Meat (about 800 g total):**) 
            if (line.startsWith('**') && line.endsWith(':**')) {
                const category = line.replace(/^\*\*(.*?):\*\*$/, '$1').trim();
                warnings.push(`Detected subheading: "${category}" – following ingredients grouped under it`);
                // You could store category on next ingredients if you add a category field later
                continue;
            }

            // Bullet or numbered line
            if (/^[-*•]|\d+\.\s/.test(line)) {
                const cleaned = line.replace(/^[-*•]|\d+\.\s*/, '').trim();
                if (cleaned) {
                    const ing = parseIngredient(cleaned);
                    if (ing) {
                        recipe.ingredients!.push(ing as Ingredient);
                        currentIng = ing;
                    }
                }
            }
            // Continuation line for previous ingredient
            else if (currentIng && line && !line.startsWith('**') && !line.startsWith('###')) {
                currentIng.notes = (currentIng.notes || '') + (currentIng.notes ? ' ' : '') + line.trim();
            }
        }

        // ── Instructions parsing ──────────────────────────────────────────────
        if (state === 'instructions') {
            if (/^\d+\.\s|^[-*•]\s/.test(line)) {
                let step = line.replace(/^\d+\.\s*|^[-*•]\s*/, '').trim();
                // Clean bold sub-titles if present
                step = step.replace(/^\*\*(.*?):\*\*\s*/, '$1: ');
                if (step) {
                    recipe.instructions!.push(step);
                }
            }
            // Append continuation to last step
            else if (recipe.instructions!.length > 0 && line && !line.startsWith('**') && !line.startsWith('###')) {
                recipe.instructions![recipe.instructions!.length - 1] += ' ' + line.trim();
            }
        }

        // ── Notes / Tips ──────────────────────────────────────────────────────
        if (state === 'notes') {
            if (line && !line.startsWith('**') && !line.startsWith('###')) {
                recipe.notes += (recipe.notes ? '\n' : '') + line.trim();
            }
        }
    }

    // ── Post-processing & fallbacks ───────────────────────────────────────
    if (!recipe.title) {
        return { recipe: null, error: 'Could not detect recipe title' };
    }

    // Fallback: use intro text as notes if no dedicated notes/tips section
    if (introLines.length > 0 && (!recipe.notes || recipe.notes.trim().length < 20)) {
        recipe.notes = introLines.join('\n').trim();
        warnings.push('No separate tips/notes section found – used intro paragraph as notes');
    }

    if (recipe.notes) {
        recipe.notes = recipe.notes.trim();
    }

    if (recipe.ingredients!.length === 0) {
        warnings.push('No ingredients were parsed – check the markdown format');
    }

    if (recipe.instructions!.length === 0) {
        warnings.push('No instructions were parsed – check the markdown format');
    }

    // Return even partial results with warnings instead of hard failure
    if (recipe.title && recipe.ingredients!.length > 0 && recipe.instructions!.length > 0) {
        return {
            recipe: recipe as RecipeInsert,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }

    return {
        recipe: null,
        error: 'Incomplete recipe: missing key sections (ingredients or instructions)',
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

// ── Improved parseIngredient ─────────────────────────────────────────────
function parseIngredient(text: string): Partial<Ingredient> | null {
    text = text.trim().replace(/\s+/g, ' ');

    // Capture amount (with ~, ranges, fractions)
    const amountMatch = text.match(/^([~≈]?\s*[\d½¼¾⅓⅔⅛\s\/.-]+(?:-\s*[\d½¼¾⅓⅔⅛\s\/.-]+)?)\s*/i);
    let amount = amountMatch ? amountMatch[1].trim() : '1';

    const rest = text.replace(amountMatch?.[0] || '', '').trim();

    // Unit(s) – greedy until name
    const unitMatch = rest.match(/^([a-zA-Z]+(?:\s+[a-zA-Z]+)?(?:\s*\([^)]*\))?)\s+(.*)/i);
    let unit = '';
    let name = rest;

    if (unitMatch) {
        unit = unitMatch[1].trim();
        name = unitMatch[2].trim();
    }

    // Extract trailing notes in parentheses
    const notesMatch = name.match(/^(.*?)\s*\(([^)]+)\)$/);
    let notes: string | undefined;
    if (notesMatch) {
        name = notesMatch[1].trim();
        notes = notesMatch[2].trim();
    }

    amount = amount.replace(/\s+/g, ' ').trim();
    unit = unit.replace(/,$/, '').trim();
    name = name.trim();

    if (!name) return null;

    return {
        amount,
        unit,
        name,
        notes,
        category: undefined, // could be set from subheadings if added later
    };
}

function timeToMinutes(str: string): number | null {
    if (!str) return null;
    const clean = str.toLowerCase().replace(/about|approx|roughly/gi, '').trim();
  
    // Handle ranges like "50-55" → average
    const rangeMatch = clean.match(/(\d+)[–-–](\d+)/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1], 10);
      const max = parseInt(rangeMatch[2], 10);
      if (!isNaN(min) && !isNaN(max)) {
        return Math.round((min + max) / 2);
      }
    }
  
    let total = 0;
    const hMatch = clean.match(/(\d+)\s*(h|hour|hr)s?/i);
    const mMatch = clean.match(/(\d+)\s*(m|min|minute)s?/i);
  
    if (hMatch) total += parseInt(hMatch[1], 10) * 60;
    if (mMatch) total += parseInt(mMatch[1], 10);
  
    return total > 0 ? total : null;
  }