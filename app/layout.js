// File: app/layout.js

import { League_Spartan } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/AuthContext"; // <-- 1. IMPORT IT

const leagueSpartan = League_Spartan({ subsets: ["latin"] });

export const metadata = {
  title: "IEDC Carmel",
  description: "Innovation and Entrepreneurship Development Club.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={leagueSpartan.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* 2. WRAP YOUR APP WITH THE AUTH PROVIDER */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}