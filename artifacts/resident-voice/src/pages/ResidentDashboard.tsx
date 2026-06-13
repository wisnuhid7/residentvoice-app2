import { useAuth } from "@/contexts/AuthContext";
import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { StatusBadge, UrgencyBadge } from "@/components/ui/badges";
import { AlertCircle, CheckCircle2, Megaphone, ArrowRight, PlusCircle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function ResidentDashboard() {
  const { buildingId, currentUser } = useAuth();
  const { t } = useTranslation();
  const slug = currentUser?.building?.slug || '';
  
  const { data: dashboard, isLoading } = useGetDashboard(buildingId as number, {
    query: { enabled: !!buildingId, queryKey: ["getDashboard", buildingId] }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <h1 className="text-3xl font-bold text-slate-900">
            {t("residentDashboard.welcome", { building: currentUser?.building?.name })}
          </h1>
          <p className="text-slate-500 mt-1">{t("residentDashboard.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/b/${slug}/issues/new`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("residentDashboard.reportIssue")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t("residentDashboard.openIssues")}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{dashboard.openIssueCount}</p>
            </div>
            <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t("residentDashboard.resolvedIssues")}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{dashboard.resolvedIssueCount}</p>
            </div>
            <div className="h-12 w-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{t("residentDashboard.activeResolutions")}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{dashboard.activeResolutionCount}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">{t("residentDashboard.topIssues")}</h2>
            <Link href={`/b/${slug}/issues`} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
              {t("residentDashboard.viewAll")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {dashboard.topIssues?.length > 0 ? (
              dashboard.topIssues.map(issue => (
                <Link key={issue.id} href={`/b/${slug}/issues/${issue.id}`}>
                  <Card className="hover:border-blue-300 transition-colors cursor-pointer shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <UrgencyBadge urgency={issue.urgency} />
                            <StatusBadge status={issue.status} />
                            {issue.categoryName && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {issue.categoryName}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg text-slate-900">{issue.title}</h3>
                          <div className="text-sm text-slate-500 flex items-center gap-4">
                            <span>{t("residentDashboard.postedDate", { date: format(new Date(issue.createdAt), "MMM d, yyyy") })}</span>
                            {issue.submittedBy && <span>{t("residentDashboard.by", { user: issue.submittedBy })}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-3 min-w-20 border border-slate-100">
                          <span className="text-2xl font-bold text-blue-600">{issue.voteCount}</span>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t("residentDashboard.votes")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="bg-slate-50 border-dashed">
                <CardContent className="p-8 text-center text-slate-500">
                  {t("residentDashboard.noIssues")}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">{t("residentDashboard.recentAnnouncements")}</h2>
            <Link href={`/b/${slug}/announcements`} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
              {t("residentDashboard.all")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <Card className="shadow-sm">
            <CardContent className="p-0 divide-y divide-slate-100">
              {dashboard.recentAnnouncements?.length > 0 ? (
                dashboard.recentAnnouncements.map(announcement => (
                  <div key={announcement.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-full ${
                        announcement.category === 'emergency' ? 'bg-red-100 text-red-600' :
                        announcement.category === 'maintenance' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {announcement.category === 'emergency' ? <AlertCircle className="h-4 w-4" /> :
                         <Megaphone className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 leading-tight">{announcement.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 mb-2">{format(new Date(announcement.createdAt), "MMM d, yyyy")}</p>
                        <p className="text-sm text-slate-600 line-clamp-2">{announcement.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  {t("residentDashboard.noAnnouncements")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
