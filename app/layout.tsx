import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "gemkeeper | Your Personal Notes",
  description: "Your wisdom accountability partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
