// File: app/layout.js

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // <-- Import it

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "IEDC Carmel",
  description: "Innovation and Entrepreneurship Development Centre",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Add the provider here */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}