import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Building2, LayoutDashboard, AlertCircle, FileText, 
  Bell, Settings, Users, Building, LogOut, Megaphone 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface SidebarItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();
  const { t } = useTranslation();

  if (!currentUser) return null;

  const role = currentUser.role;
  const bSlug = currentUser.building?.slug || '';

  let navItems: SidebarItem[] = [];

  if (role === 'super_admin') {
    navItems = [
      { icon: LayoutDashboard, labelKey: "sidebar.platformOverview", href: "/superadmin" },
      { icon: Building, labelKey: "sidebar.buildings", href: "/superadmin/buildings" },
    ];
  } else if (role === 'building_admin') {
    navItems = [
      { icon: LayoutDashboard, labelKey: "sidebar.dashboard", href: "/admin" },
      { icon: AlertCircle, labelKey: "sidebar.issues", href: "/admin/issues" },
      { icon: FileText, labelKey: "sidebar.resolutions", href: "/admin/resolutions" },
      { icon: Megaphone, labelKey: "sidebar.announcements", href: "/admin/announcements" },
      { icon: Users, labelKey: "sidebar.residents", href: "/admin/residents" },
      { icon: Settings, labelKey: "sidebar.settings", href: "/admin/settings" },
    ];
  } else {
    navItems = [
      { icon: LayoutDashboard, labelKey: "sidebar.dashboard", href: `/b/${bSlug}` },
      { icon: AlertCircle, labelKey: "sidebar.issues", href: `/b/${bSlug}/issues` },
      { icon: FileText, labelKey: "sidebar.resolutions", href: `/b/${bSlug}/resolutions` },
      { icon: Megaphone, labelKey: "sidebar.announcements", href: `/b/${bSlug}/announcements` },
      { icon: Bell, labelKey: "sidebar.notifications", href: `/b/${bSlug}/notifications` },
    ];
  }

  const initials = currentUser.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const activeLabel = navItems.find(
    i => location === i.href || (i.href !== '/' && location.startsWith(i.href + '/'))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 text-white font-bold text-xl border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-400" />
            ResidentVoice
          </Link>
        </div>
        
        {currentUser.building && (
          <div className="px-6 py-4 border-b border-slate-800">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">{t("sidebar.building")}</div>
            <div className="text-white font-medium truncate">{currentUser.building.name}</div>
          </div>
        )}

        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  location === item.href || (item.href !== '/' && location.startsWith(item.href + '/'))
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h1 className="font-semibold text-lg text-slate-800">
            {activeLabel ? t(activeLabel.labelKey) : "ResidentVoice"}
          </h1>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">{t("sidebar.profileSettings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("sidebar.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
