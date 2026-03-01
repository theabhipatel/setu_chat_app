import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastContainer } from "@/components/shared/ToastContainer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Setu - Modern Chat Application",
  description:
    "Setu is a modern, real-time chat application with private and group messaging, built for seamless communication.",
  keywords: ["chat", "messaging", "real-time", "communication"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            {children}
            <ToastContainer />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
