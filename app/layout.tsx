import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/error-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { UIThemeProvider } from "@/lib/ui-theme-context";

export const metadata: Metadata = {
  title: "ThoughtFolio | Thoughts that find you",
  description: "Thoughts that find you",
};

// Inline script to prevent flash of wrong theme
// Must match the theme list in lib/themes.ts and lib/ui-theme-context.tsx
const themeScript = `
  (function() {
    try {
      // Color theme
      var validThemes = ['midnight', 'obsidian', 'amethyst', 'ocean', 'ruby', 'sunrise'];
      var stored = localStorage.getItem('thoughtfolio-theme');
      var theme = validThemes.includes(stored) ? stored : 'midnight';
      document.documentElement.setAttribute('data-theme', theme);

      // UI theme (Glass/Classic)
      var validUIThemes = ['glass', 'classic'];
      var storedUI = localStorage.getItem('thoughtfolio-ui-theme');
      var uiTheme = validUIThemes.includes(storedUI) ? storedUI : 'glass';
      document.documentElement.setAttribute('data-ui-theme', uiTheme);
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="midnight" data-ui-theme="glass">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <UIThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </UIThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
