import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sucatao ARC Companion Offline",
  description: "Precos, raridades, crafting e reciclagem em um painel brasileiro para consulta rapida.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
