import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";  // Adjust path if your components folder is aliased differently

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mom's Recipe Book",
  description: "Your personal digital cookbook - save, organize, and plan your favorite recipes",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <header className="border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              Mom&apos;s Recipe Book
            </h1>
            <ThemeToggle />
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}