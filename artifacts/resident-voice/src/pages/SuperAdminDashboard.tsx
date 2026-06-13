import { useSuperAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, AlertCircle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useSuperAdminGetStats();
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t("superAdminDashboard.title")}</h1>
        <p className="text-slate-500 mt-1">{t("superAdminDashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalBuildings}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">{t("superAdminDashboard.totalBuildings")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalResidents}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">{t("superAdminDashboard.totalResidents")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center">
            <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalIssues}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">{t("superAdminDashboard.issuesReported")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center items-center text-center">
            <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.totalResolutions}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">{t("superAdminDashboard.resolutions")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t("superAdminDashboard.buildingsByPlan")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.buildingsByPlan?.map((plan, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium capitalize">{plan.category} Plan</span>
                  <span className="font-bold text-lg">{plan.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
