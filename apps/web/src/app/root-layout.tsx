import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "./layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vendorse - Tender Management System",
  description: "Secure and efficient tender management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}