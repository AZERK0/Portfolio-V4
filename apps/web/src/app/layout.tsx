import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raphaël Charpentier — Software Engineer",
  description: "Portfolio de Raphaël Charpentier, software engineer freelance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geistSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
