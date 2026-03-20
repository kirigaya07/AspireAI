import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  ChevronDown,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  PenBox,
  Sparkles,
  Brain,
  Menu,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { cn } from "@/lib/utils";

async function getTokenBalance() {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { tokens: true },
    });
    return user?.tokens ?? null;
  } catch {
    return null;
  }
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/resume", icon: FileText, label: "Resume" },
  { href: "/ai-cover-letter", icon: PenBox, label: "Cover Letters" },
  { href: "/interview", icon: GraduationCap, label: "Interview Prep" },
  { href: "/interview/agent", icon: Brain, label: "AI Agent", badge: "New" },
];

const Header = async () => {
  await checkUser();
  const tokenBalance = await getTokenBalance();

  const formatTokens = (t) => {
    if (t == null) return null;
    if (t >= 1000) return `${(t / 1000).toFixed(1)}k`;
    return t.toString();
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6">
        <nav className="h-16 flex items-center justify-between gap-4">

          {/* ── Left: Logo ── */}
          <div className="flex items-center gap-3 shrink-0">
            <SignedIn>
              {/* Mobile menu trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                    <Menu className="h-4.5 w-4.5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 pt-8">
                  <Link href="/" className="flex items-center gap-2 mb-8 px-1">
                    <div className="h-7 w-7 rounded-lg bg-gradient-brand flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="font-bold text-base">AspireAI</span>
                  </Link>
                  <nav className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.badge && (
                          <Badge className="ml-auto text-[10px] py-0 px-1.5 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                    <div className="pt-3 border-t border-border mt-3">
                      <Link
                        href="/tokens"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        <CreditCard className="h-4 w-4" />
                        Buy Tokens
                        {tokenBalance != null && (
                          <span className="ml-auto text-xs text-indigo-400 font-mono font-semibold">
                            {formatTokens(tokenBalance)}
                          </span>
                        )}
                      </Link>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </SignedIn>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">AspireAI</span>
            </Link>
          </div>

          {/* ── Center: Desktop Nav ── */}
          <SignedIn>
            <div className="hidden md:flex items-center gap-1 flex-1 justify-center max-w-lg">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground rounded-lg">
                  <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                  Dashboard
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground rounded-lg">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Resume
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48 rounded-xl p-1.5">
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/resume" className="flex items-center gap-2.5 px-3 py-2">
                      <FileText className="h-4 w-4 text-violet-400" />
                      <span className="text-sm">Build Resume</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/ai-cover-letter" className="flex items-center gap-2.5 px-3 py-2">
                      <PenBox className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">Cover Letters</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground rounded-lg">
                    <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                    Interview
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-52 rounded-xl p-1.5">
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/interview" className="flex items-center gap-2.5 px-3 py-2">
                      <GraduationCap className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm">Mock Interview</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link href="/interview/agent" className="flex items-center gap-2.5 px-3 py-2">
                      <Brain className="h-4 w-4 text-indigo-400" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm">AI Agent</span>
                        <Badge className="text-[10px] py-0 px-1.5 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                          New
                        </Badge>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SignedIn>

          {/* ── Right: Auth / Tokens ── */}
          <div className="flex items-center gap-2 shrink-0">
            <SignedOut>
              <SignInButton asChild>
                <Button variant="ghost" size="sm" className="h-8 text-sm rounded-lg cursor-pointer">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton asChild>
                <Button
                  size="sm"
                  className="h-8 px-4 text-sm rounded-lg bg-gradient-brand text-white border-0 hover:opacity-90 cursor-pointer"
                >
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              {/* Token balance */}
              {tokenBalance != null && (
                <Link href="/tokens">
                  <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/15 transition-colors cursor-pointer">
                    <Zap className="h-3 w-3" />
                    {formatTokens(tokenBalance)}
                  </div>
                </Link>
              )}

              <Link href="/tokens" className="hidden sm:block">
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs bg-gradient-brand text-white border-0 rounded-lg hover:opacity-90 transition-opacity"
                >
                  + Tokens
                </Button>
              </Link>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 ring-2 ring-border",
                    userButtonPopoverCard: "shadow-2xl rounded-2xl",
                  },
                }}
                afterSignOutUrl="/"
              />
            </SignedIn>
          </div>

        </nav>
      </div>
    </header>
  );
};

export default Header;
