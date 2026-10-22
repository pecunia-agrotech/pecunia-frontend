import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
export const metadata: Metadata = {
  title: "Pecunia AgroTech | Gestão Econômica Leiteira",
  description:
    "Análise econômica e financeira offline para a pecuária leiteira. Hackathon UFJF 2026.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
