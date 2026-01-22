import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/error-toast";

export const metadata: Metadata = {
  title: "GemKeeper | Your Wisdom Accountability Partner",
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
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
