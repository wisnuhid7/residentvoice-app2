import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isEs = i18n.language === "es";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs font-semibold tracking-wide px-2 h-7"
      onClick={() => i18n.changeLanguage(isEs ? "en" : "es")}
      aria-label={isEs ? "Switch to English" : "Cambiar a Español"}
    >
      {isEs ? "EN" : "ES"}
    </Button>
  );
}
