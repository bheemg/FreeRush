"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, FileText, Settings, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { logOut } from "@/server/auth/signout-action";

const nav = [
  { href: "/dashboard", label: "Projects", icon: LayoutDashboard },
  { href: "/dashboard/keywords", label: "Keyword Research", icon: Search },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ workspaceName, email }: { workspaceName: string; email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-4 text-lg font-bold tracking-tight">
        <Sparkles className="h-5 w-5 text-primary" />
        Free<span className="-ml-2 text-primary">Rush</span>
      </div>

      <div className="px-3 py-2">
        <div className="rounded-lg bg-background px-3 py-2">
          <div className="truncate text-sm font-medium">{workspaceName}</div>
          <div className="truncate text-xs text-muted">{email}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={logOut} className="border-t border-border p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-background hover:text-foreground">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </aside>
  );
}
