import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GSI Asset Control System",
  description:
    "Asset management system for project-based companies — register, assign, transfer, maintain, audit, and dispose of assets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
