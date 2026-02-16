import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban App",
  description: "Task management for Walter and agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
