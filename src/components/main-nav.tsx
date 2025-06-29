"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { LayoutDashboard, User, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const links = [
  {
    href: "/profile",
    label: "My Profile",
    icon: User,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/recommendations",
    label: "Recommendations",
    icon: Sparkles,
  },
];

export function MainNav() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <nav className="flex flex-col gap-2 p-4">
      {isClient ? (
        links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              buttonVariants({
                variant: pathname === href ? "default" : "ghost",
                size: "default",
              }),
              "justify-start"
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </Link>
        ))
      ) : (
        <>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </>
      )}
    </nav>
  );
}
