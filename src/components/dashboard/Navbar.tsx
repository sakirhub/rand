"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminSidebar, DesignerSidebar } from "@/components/dashboard/Sidebar";
import {
  Home, 
  Palette, 
  Menu,
  X,
  User,
  Users,
  Calendar,
  Settings,
  LogOut
} from "lucide-react";

interface NavbarProps {
  userRole?: string;
}

export function Navbar({ userRole = "admin" }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const getNavItems = () => {
    if (userRole === "admin") {
      return [
        { href: "/admin", label: "Dashboard", icon: <Home className="h-4 w-4" /> },
        { href: "/admin/customers", label: "Müşteriler", icon: <Users className="h-4 w-4" /> },
        { href: "/admin/artists", label: "Sanatçılar", icon: <Palette className="h-4 w-4" /> },
        { href: "/admin/reservations", label: "Rezervasyonlar", icon: <Calendar className="h-4 w-4" /> },
        { href: "/admin/settings", label: "Ayarlar", icon: <Settings className="h-4 w-4" /> },
      ];
    } else if (userRole === "designer") {
      return [
        { href: "/designer", label: "Dashboard", icon: <Home className="h-4 w-4" /> },
        { href: "/designer/customers", label: "Müşteriler", icon: <Users className="h-4 w-4" /> },
        { href: "/designer/artists", label: "Sanatçılar", icon: <Palette className="h-4 w-4" /> },
        { href: "/designer/reservations", label: "Rezervasyonlar", icon: <Calendar className="h-4 w-4" /> },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <div className="flex h-16 items-center px-4">
              <Link href="/" className="flex items-center">
                <span className="font-bold">Stüdyo Yönetim</span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto" 
                onClick={() => setOpen(false)}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="py-4">
              {userRole === "admin" ? <AdminSidebar /> : <DesignerSidebar />}
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center">
          <span className="font-bold hidden md:inline-block">Stüdyo Yönetim Sistemi</span>
          <span className="font-bold md:hidden">SYS</span>
        </Link>
        <div className="hidden lg:flex items-center space-x-1 ml-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button 
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className={cn(
                  "text-sm",
                  isActive(item.href) && "bg-accent text-accent-foreground"
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Kullanıcı Menüsü</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Ayarlar</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
} 