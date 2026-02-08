// app/recipes/import-grok/page.tsx
'use client';

import { useState } from 'react';
import { importGrokRecipe } from '@/app/actions/recipes';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

type ImportGrokResult = {
    success: boolean;
    recipeId?: string;
    error?: string;
    warnings?: string[] | undefined;
} | null;


export default function ImportGrokPage() {
    const router = useRouter();
    const [markdown, setMarkdown] = useState('');
    const [result, setResult] = useState<ImportGrokResult>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleImport = async () => {
        if (!markdown.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await importGrokRecipe(markdown);

            if (response.success) {
                setResult(response);
                // Redirect to the recipe after successful import
                if (response.recipeId) {
                    router.push(`/recipes/${response.recipeId}`);
                }
            } else {
                setError(response.error || 'Import failed');
            }
        } catch (err) {
            setError('Unexpected error during import');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <Navigation />
            
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-display font-semibold text-[var(--foreground)] mb-6">
                    Import Recipe from Grok
                </h1>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 text-red-200 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Import Form */}
                <div className="bg-[var(--card)] rounded-xl p-6 shadow-card border border-[var(--border)] space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                            Paste Grok Recipe
                        </label>
                        <p className="text-sm text-[var(--muted-foreground)] mb-4">
                            Paste the full markdown response Grok gave you (title, ingredients, instructions, etc.)
                        </p>
                        <textarea
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            placeholder="Paste the entire Grok recipe here..."
                            rows={20}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-[var(--border)] rounded-lg 
                                     bg-[var(--background)] text-[var(--foreground)] 
                                     placeholder-[var(--muted-foreground)] font-mono text-sm
                                     focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50
                                     disabled:opacity-50 resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 flex-col sm:flex-row">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-[var(--border)] text-[var(--muted-foreground)] font-medium 
                                     rounded-lg hover:bg-[var(--muted)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading || !markdown.trim()}
                            className="flex-1 px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg
                                     hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    <span>Importing...</span>
                                </>
                            ) : (
                                <>
                                    <span>🤖</span>
                                    <span>Import Recipe</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Success/Warning Messages */}
                {result?.success && result.warnings && result.warnings.length > 0 && (
                    <div className="mt-6 p-6 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                        <h3 className="font-medium text-amber-200 mb-2">Import Warnings</h3>
                        <ul className="list-disc pl-5 text-sm text-amber-100 space-y-1">
                            {result.warnings.map((w, i) => (
                                <li key={i}>{w}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}
