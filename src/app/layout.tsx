import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Documents",
  description: "Write rich-text documents and share them with other users.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
