import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🍳</div>
        <h1 className="text-3xl font-display font-semibold text-sage-800 mb-2">
          Recipe Not Found
        </h1>
        <p className="text-sage-600 mb-6">
          We couldn&apos;t find the recipe you&apos;re looking for.
        </p>
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 px-6 py-3 bg-sage-600 
                   text-white font-medium rounded-lg hover:bg-sage-700 
                   transition-colors"
        >
          <span>←</span>
          <span>Back to Recipes</span>
        </Link>
      </div>
    </div>
  );
}
