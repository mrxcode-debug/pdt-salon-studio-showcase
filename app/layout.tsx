import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salon Studio — Pilot",
  description: "Mobile-first salon owner operating system pilot"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
