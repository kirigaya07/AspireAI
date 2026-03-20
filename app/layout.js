import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import Footer from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "AspireAI — AI-Powered Career Coach",
  description:
    "Land your dream job 10× faster with AI interview prep, LaTeX resume builder, ATS scoring, and personalized career insights.",
  openGraph: {
    title: "AspireAI — AI-Powered Career Coach",
    description: "AI interview agent, LaTeX resumes, ATS scoring & career insights.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.add('dark');localStorage.setItem('theme','dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans bg-background antialiased`}
        suppressHydrationWarning
      >
        <ClerkProvider appearance={{ baseTheme: dark }}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Header />
            <main className="min-h-screen">{children}</main>
            <Toaster richColors position="bottom-right" />
            <Footer />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
