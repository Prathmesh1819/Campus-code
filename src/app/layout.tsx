import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthModal } from "@/components/AuthModal";
import { AIAssistantWidget } from "@/components/AIAssistantWidget";

export const metadata: Metadata = {
  title: "CampusCode - Enterprise College Coding & Social Platform",
  description: "A futuristic platform where college students practice coding, compete on multi-tier leaderboards, showcase projects, connect with peers, and submit assignments to teachers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#070913]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased animated-bg min-h-screen bg-[#070913] text-gray-100 selection:bg-purple-500 selection:text-white">
        <ToastProvider>
          <AuthProvider>
            {children}
            <AuthModal />
            <AIAssistantWidget />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
