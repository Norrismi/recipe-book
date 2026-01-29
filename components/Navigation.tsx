"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/recipes", label: "Recipes", icon: "📖" },
  { href: "/recipes/new", label: "Add Recipe", icon: "➕" },
  { href: "/plan", label: "Meal Plan", icon: "📅" },
  { href: "/groceries", label: "Groceries", icon: "🛒" },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-sage-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">
                🍳
              </span>
              <span className="font-display text-xl text-sage-800 hidden sm:block">
                Mom&apos;s Recipes
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                            transition-colors duration-200
                            ${isActive 
                              ? "bg-sage-100 text-sage-800" 
                              : "text-sage-600 hover:bg-sage-50 hover:text-sage-800"
                            }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       text-sage-600 hover:bg-sage-50 hover:text-sage-800
                       disabled:opacity-50 transition-colors duration-200"
            >
              {isLoggingOut ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <span>👋</span>
              )}
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-sage-100 px-2 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs
                          transition-colors duration-200
                          ${isActive 
                            ? "bg-sage-100 text-sage-800" 
                            : "text-sage-500 hover:text-sage-700"
                          }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
