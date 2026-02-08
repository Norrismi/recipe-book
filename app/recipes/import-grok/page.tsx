// app/recipes/import-grok/page.tsx
'use client';

import { useState } from 'react';
import { importGrokRecipe } from '@/app/actions/recipes';
import Link from 'next/link';

type ImportGrokResult = {
    success: boolean;
    recipeId?: string;
    error?: string;
    warnings?: string[] | undefined;
} | null;


export default function ImportGrokPage() {
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
                setMarkdown(''); // clear input after success (optional)
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
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-[var(--background)] text-[var(--foreground)]">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--foreground)]">Import Recipe from Grok</h1>
                <p className="mt-2 text-[var(--muted-foreground)]">
                    Paste the full markdown response Grok gave you (title, ingredients, instructions, etc.)
                </p>
            </div>

            <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Paste the entire Grok recipe here..."
                className="w-full h-96 p-4 border border-[var(--border)] rounded-lg font-mono text-sm 
                         bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]
                         focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]/50"
                disabled={loading}
            />

            <div className="mt-6 flex flex-wrap gap-4">
                <button
                    onClick={handleImport}
                    disabled={loading || !markdown.trim()}
                    className="px-6 py-3 bg-[var(--accent)] text-white font-medium rounded-lg 
                             hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Importing...' : 'Import Recipe'}
                </button>

                <Link
                    href="/recipes"
                    className="px-6 py-3 border border-[var(--border)] text-[var(--foreground)] font-medium rounded-lg 
                             hover:bg-[var(--muted)] transition"
                >
                    Back to Recipes
                </Link>
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-900/30 border border-red-700/50 text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {result?.success && (
                <div className="mt-8 p-6 bg-green-900/30 border border-green-700/50 rounded-lg">
                    <h2 className="text-xl font-semibold text-green-200">Success!</h2>
                    <p className="mt-2 text-green-100">
                        Recipe imported with ID: <strong>{result.recipeId}</strong>
                    </p>
                    <div className="mt-4">
                        <Link
                            href={`/recipes/${result.recipeId}`}
                            className="text-[var(--accent)] hover:underline font-medium"
                        >
                            → View the imported recipe
                        </Link>
                    </div>

                    {result?.success && result.warnings && result.warnings.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-medium text-amber-200">Warnings / notes from parser:</h3>
                            <ul className="mt-2 list-disc pl-5 text-sm text-amber-100">
                                {result.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
