"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; 
import { createBrowserClient } from "@/services/supabaseClient";
import { usersApi } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  LayoutDashboard, Users, BarChart2, Settings,
  LogOut, Menu, X, ChevronRight, Bug
} from "lucide-react";
import type { User } from "@/utils/types";

const NAV_ITEMS = [
  { href: "/dashboard",         label: "Dashboard",  icon: LayoutDashboard },
  { 
    label: "Clients", 
    icon: Users,
    children: [
      { href: "/dashboard/clients/residential", label: "Residential" },
      { href: "/dashboard/clients/commercial",  label: "Commercial" },
    ]
  },
  { href: "/dashboard/reports", label: "Reports",    icon: BarChart2 },
  { href: "/dashboard/admin",   label: "Admin",      icon: Settings, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
    });
  }, []);

  const { data: me } = useQuery<User>({
    queryKey: ["me"],
    queryFn: usersApi.me,
    retry: false,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };
  
  
  const navItems = NAV_ITEMS.filter((item) =>
    !item.adminOnly || me?.role === "admin"
  );

  function NavItem({ item, pathname, onNavClick }: { item: any, pathname: string, onNavClick: () => void }) {
    const [isOpen, setIsOpen] = useState(pathname.startsWith("/dashboard/clients"));
    const Icon = item.icon;
    const hasChildren = !!item.children;
    
    // Si no tiene hijos, es un Link normal
    if (!hasChildren) {
      const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
      return (
        <li>
          <Link
            href={item.href}
            onClick={onNavClick}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-phantom-700 text-white" : "text-phantom-300 hover:bg-phantom-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
          </Link>
        </li>
      );
    }

    // Si tiene hijos, renderizamos el desplegable
    return (
      <li className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-phantom-300 transition-colors hover:bg-phantom-800 hover:text-white"
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight className={clsx("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
        </button>
        
        {isOpen && (
          <ul className="ml-7 space-y-1 border-l border-phantom-800 pl-2">
            {item.children.map((child: any) => {
              const active = pathname === child.href;
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    onClick={onNavClick}
                    className={clsx(
                      "block rounded-md px-3 py-2 text-xs font-medium transition-colors",
                      active ? "text-white bg-phantom-800" : "text-phantom-400 hover:text-white hover:bg-phantom-800"
                    )}
                  >
                    {child.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-phantom-950 transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-phantom-800 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            {/* <Bug className="h-4 w-4 text-white" /> */}
             <Image 
              src="/phantom-logo.png" // <-- Cambia esto por el nombre exacto de tu archivo en /public
              alt="Phantom Pest Control Logo"
              width={240}  // Equivalente a w-14 de Tailwind
              height={240} // Equivalente a h-14 de Tailwind
              priority    // Carga esta imagen primero (esencial para el LCP)
              className="object-contain p-1" // Asegura que no se deforme y tenga aire
            />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Phantom</p>
            <p className="text-xs text-phantom-400 leading-tight">Pest Control CRM</p>
          </div>
          <button
            className="ml-auto text-phantom-400 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavItem 
              key={item.label} 
              item={item} 
              pathname={pathname} 
              onNavClick={() => setSidebarOpen(false)} 
            />
          ))}
        </ul>
      </nav>
        {/* <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-phantom-700 text-white"
                        : "text-phantom-300 hover:bg-phantom-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav> */}

        {/* User section */}
        <div className="border-t border-phantom-800 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-phantom-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {me?.full_name?.[0] || me?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {me?.full_name || me?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-phantom-400 capitalize">{me?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-phantom-400 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-phantom-600" />
            <span className="font-semibold text-gray-900 text-sm">Phantom CRM</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
