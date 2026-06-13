import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Building2 className="h-6 w-6" />
            ResidentVoice
          </Link>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {t("nav.pricing")}
            </Link>
            {!isLoading && (
              currentUser ? (
                <Link href={
                  currentUser.role === 'super_admin' ? '/superadmin' :
                  currentUser.role === 'building_admin' ? '/admin' :
                  currentUser.building?.slug ? `/b/${currentUser.building.slug}` : '/'
                }>
                  <Button variant="default">{t("nav.dashboard")}</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">{t("nav.login")}</Button>
                  </Link>
                  <Link href="/register-building">
                    <Button>{t("nav.registerBuilding")}</Button>
                  </Link>
                </>
              )
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t bg-slate-50 py-12">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
}
