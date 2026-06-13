import { useAuth } from "@/contexts/AuthContext";
import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge, UrgencyBadge } from "@/components/ui/badges";
import { AlertCircle, CheckCircle2, Users, BarChart3, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { buildingId, currentUser } = useAuth();
  const { t } = useTranslation();
  
  const { data: dashboard, isLoading } = useGetDashboard(buildingId as number, {
    query: {
      enabled: !!buildingId,
      queryKey: ["getDashboard", buildingId],
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("adminDashboard.title")}</h1>
          <p className="text-slate-500 mt-1">{currentUser?.building?.name} {t("adminDashboard.overview")}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/announcements">
            <Button variant="outline">{t("adminDashboard.postAnnouncement")}</Button>
          </Link>
          <Link href="/admin/settings">
            <Button className="bg-slate-900 hover:bg-slate-800">{t("adminDashboard.buildingSettings")}</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t("adminDashboard.totalResidents")}</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.residentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t("adminDashboard.openIssues")}</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.openIssueCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t("adminDashboard.resolvedIssues")}</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.resolvedIssueCount}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{t("adminDashboard.activeResolutions")}</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.activeResolutionCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-orange-200">
          <CardHeader className="bg-orange-50/50 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center text-orange-900">
                <Clock className="mr-2 h-5 w-5" /> {t("adminDashboard.recentIssues")}
              </CardTitle>
              <Link href="/admin/issues" className="text-sm font-medium text-orange-700 hover:underline">
                {t("common.viewAll")}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {dashboard.recentIssues?.length > 0 ? (
              dashboard.recentIssues.slice(0, 5).map(issue => (
                <div key={issue.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 flex-1 pr-4">{issue.title}</h3>
                    <UrgencyBadge urgency={issue.urgency} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="flex items-center gap-2">
                      <StatusBadge status={issue.status} />
                      <span>{format(new Date(issue.createdAt), "MMM d")}</span>
                    </span>
                    <Link href={`/admin/issues?id=${issue.id}`}>
                      <Button variant="ghost" size="sm" className="h-8">{t("common.manage")}</Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">{t("adminDashboard.noRecentIssues")}</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg">{t("adminDashboard.issuesByCategory")}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {(dashboard.issuesByCategory ?? []).length > 0 ? (
                (dashboard.issuesByCategory ?? []).map((cat, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-32 truncate text-sm font-medium text-slate-700">{cat.category || "Uncategorized"}</div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.max(5, (cat.count / Math.max(...(dashboard.issuesByCategory ?? []).map(c => c.count))) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-8 text-right text-sm font-bold text-slate-900">{cat.count}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-4">{t("adminDashboard.notEnoughData")}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
