import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PK LASER OS",
  description: "Hệ điều hành quản trị vận hành PK LASER",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
