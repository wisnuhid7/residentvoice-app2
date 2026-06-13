import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function Pricing() {
  const { t } = useTranslation();

  const tiers = [
    {
      name: t("pricing.freeTier"),
      price: "$0",
      description: t("pricing.freeDesc"),
      features: [
        t("pricing.freeFeature1"),
        t("pricing.freeFeature2"),
        t("pricing.freeFeature3"),
        t("pricing.freeFeature4"),
      ],
      cta: t("pricing.startTrial"),
      href: "/register-building",
      popular: false
    },
    {
      name: t("pricing.basicTier"),
      price: "$29",
      period: "/mo",
      description: t("pricing.basicDesc"),
      features: [
        t("pricing.basicFeature1"),
        t("pricing.basicFeature2"),
        t("pricing.basicFeature3"),
        t("pricing.basicFeature4"),
        t("pricing.basicFeature5"),
      ],
      cta: t("pricing.comingSoon"),
      href: "#",
      popular: true
    },
    {
      name: t("pricing.proTier"),
      price: "$79",
      period: "/mo",
      description: t("pricing.proDesc"),
      features: [
        t("pricing.proFeature1"),
        t("pricing.proFeature2"),
        t("pricing.proFeature3"),
        t("pricing.proFeature4"),
        t("pricing.proFeature5"),
      ],
      cta: t("pricing.comingSoon"),
      href: "#",
      popular: false
    },
    {
      name: t("pricing.enterpriseTier"),
      price: t("pricing.custom"),
      description: t("pricing.enterpriseDesc"),
      features: [
        t("pricing.enterpriseFeature1"),
        t("pricing.enterpriseFeature2"),
        t("pricing.enterpriseFeature3"),
        t("pricing.enterpriseFeature4"),
        t("pricing.enterpriseFeature5"),
      ],
      cta: t("pricing.contactUs"),
      href: "#",
      popular: false
    }
  ];

  return (
    <div className="flex-1 bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">{t("pricing.heading")}</h1>
          <p className="text-xl text-slate-600">{t("pricing.subheading")}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl p-8 border ${tier.popular ? 'border-blue-600 shadow-lg relative' : 'border-slate-200 shadow-sm'} flex flex-col`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {t("pricing.mostPopular")}
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">{tier.description}</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                {tier.period && <span className="text-slate-500">{tier.period}</span>}
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mr-3 shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={tier.href}>
                <Button
                  className={`w-full ${tier.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
