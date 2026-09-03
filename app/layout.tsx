import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Absolut Parfum • Sistema de Gestão & Vendas de Luxo",
  description: "Sistema integrado para gestão de perfumaria fina, decants, controle de estoque, frente de caixa (PDV), simulador de taxas e emissão fiscal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-gold-500 selection:text-zinc-950">
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950 p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
