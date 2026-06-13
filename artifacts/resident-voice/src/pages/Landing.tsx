import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, Users, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Landing() {
  const { t } = useTranslation();

  const features = [
    { icon: Activity, titleKey: "landing.feature1Title", descKey: "landing.feature1Desc" },
    { icon: Users, titleKey: "landing.feature2Title", descKey: "landing.feature2Desc" },
    { icon: Building, titleKey: "landing.feature3Title", descKey: "landing.feature3Desc" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-slate-900 text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t("landing.heroTitle")}{" "}
              <span className="text-blue-400">{t("landing.heroTitleHighlight")}</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              {t("landing.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register-building">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 h-auto bg-blue-600 hover:bg-blue-700">
                  {t("landing.registerBtn")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 h-auto text-slate-900 border-white hover:bg-slate-100 hover:text-slate-900">
                  {t("landing.loginBtn")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{t("landing.featuresHeading")}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t("landing.featuresSubheading")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{t(feature.titleKey)}</h3>
                <p className="text-slate-600 leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{t("landing.ctaHeading")}</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            {t("landing.ctaSubheading")}
          </p>
          <Link href="/register-building">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto text-blue-700 bg-white hover:bg-slate-50">
              {t("landing.ctaBtn")}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
