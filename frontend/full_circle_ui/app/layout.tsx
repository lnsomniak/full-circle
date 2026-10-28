import type { Metadata } from "next";
import "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "FullCircle Recs",
  description: "Personalized music recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme and lang are set on this element by Demo before first paint.
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
