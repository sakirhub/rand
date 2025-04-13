"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Calendar, 
  Users, 
  Settings, 
  Home, 
  Palette, 
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
    submenu?: {
      href: string;
      title: string;
    }[];
  }[];
}

export function Sidebar({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toggleSubmenu = (href: string) => {
    if (openSubmenu === href) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(href);
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav
      className={cn(
        "flex flex-col space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const active = isActive(item.href);
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        const submenuOpen = openSubmenu === item.href;

        return (
          <div key={item.href} className="space-y-1">
            <Button
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                active && "bg-accent text-accent-foreground"
              )}
              onClick={() => hasSubmenu && toggleSubmenu(item.href)}
              asChild={!hasSubmenu}
            >
              {hasSubmenu ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn(
                      "h-4 w-4 transition-transform",
                      submenuOpen && "rotate-180"
                    )}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              ) : (
                <Link href={item.href} className="flex items-center">
                  {item.icon}
                  <span className="ml-2">{item.title}</span>
                </Link>
              )}
            </Button>

            {hasSubmenu && submenuOpen && (
              <div className="ml-6 space-y-1">
                {item.submenu?.map((subitem) => (
                  <Button
                    key={subitem.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      isActive(subitem.href) && "bg-accent text-accent-foreground"
                    )}
                    asChild
                  >
                    <Link href={subitem.href}>{subitem.title}</Link>
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const sidebarItems = [
    {
      href: "/admin",
      title: "Dashboard",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      href: "/admin/customers",
      title: "Müşteriler",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      href: "/admin/artists",
      title: "Sanatçılar",
      icon: <Palette className="h-4 w-4 mr-2" />,
    },
    {
      href: "/admin/staff",
      title: "Personel",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      href: "/admin/reservations",
      title: "Rezervasyonlar",
      icon: <Calendar className="h-4 w-4 mr-2" />,
    },
    {
      href: "/admin/settings",
      title: "Ayarlar",
      icon: <Settings className="h-4 w-4 mr-2" />,
    },
  ];

  return <Sidebar items={sidebarItems} />;
}

export function DesignerSidebar() {
  const sidebarItems = [
    {
      href: "/designer",
      title: "Dashboard",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      href: "/designer/customers",
      title: "Müşteriler",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      href: "/designer/artists",
      title: "Sanatçılar",
      icon: <Palette className="h-4 w-4 mr-2" />,
    },
    {
      href: "/designer/staff",
      title: "Personel",
      icon: <Users className="h-4 w-4 mr-2" />,
    },
    {
      href: "/designer/reservations",
      title: "Rezervasyonlar",
      icon: <Calendar className="h-4 w-4 mr-2" />,
    },
  ];

  return <Sidebar items={sidebarItems} />;
} 