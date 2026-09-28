import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Index Focused Search",
  description: "Focused web search powered by SerpAPI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
