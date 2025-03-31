import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai  = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai", 
  subsets: ["thai","latin"],       
  weight: ["400"]
});

export const metadata: Metadata = {
  title: "My Next App",
  description: "A Next.js application with Inter font",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansThai.variable} antialiased`}>{children}</body>
    </html>
  );
}
