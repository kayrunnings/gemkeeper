import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/error-toast";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "ThoughtFolio | Your Wisdom Accountability Partner",
  description: "Your wisdom accountability partner",
};

// Inline script to prevent flash of wrong theme
// Must match the theme list in lib/themes.ts
const themeScript = `
  (function() {
    try {
      var validThemes = ['midnight', 'obsidian', 'amethyst', 'ocean', 'ruby', 'sunrise'];
      var stored = localStorage.getItem('thoughtfolio-theme');
      var theme = validThemes.includes(stored) ? stored : 'midnight';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="midnight">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
