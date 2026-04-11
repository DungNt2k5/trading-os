import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PageList from "@/components/PageList";
import AIChatbox from "@/components/AIChatbox";
import CommandPalette from "@/components/CommandPalette";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal OS",
  description: "Offline Knowledge Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ height: "100%" }}>
      <body
        className={`${inter.className} bg-background text-foreground transition-colors`}
        style={{
          height: "100vh",
          display: "flex",
          overflow: "hidden",
        }}
      >
        <Sidebar />
        <PageList />

        {/* main scroll container — height 100vh + overflowY auto là đủ */}
        <main
          style={{
            flex: 1,
            height: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </main>

        <AIChatbox />
        <CommandPalette />
      </body>
    </html>
  );
}
