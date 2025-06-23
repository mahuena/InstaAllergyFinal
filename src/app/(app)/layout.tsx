"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { Icons } from "@/components/icons";
import { MainNav } from "@/components/main-nav";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const sidebarContent = (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">AllergySafe</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <MainNav />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2">
            <div className="text-sm p-2">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </div>
      </SidebarFooter>
    </>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="hidden lg:flex lg:flex-col border-r">
            {sidebarContent}
        </Sidebar>
        <main className="flex-1 flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:hidden sticky top-0 z-40">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0">
                        {sidebarContent}
                    </SheetContent>
                </Sheet>
                 <div className="flex items-center gap-2">
                    <Icons.logo className="h-7 w-7 text-primary" />
                    <h1 className="text-lg font-bold">AllergySafe</h1>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto bg-background">
              {children}
            </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
