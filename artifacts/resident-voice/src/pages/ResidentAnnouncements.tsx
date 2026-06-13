import { useAuth } from "@/contexts/AuthContext";
import { useGetAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Megaphone, AlertCircle, Calendar, Shield, DollarSign, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export default function ResidentAnnouncements() {
  const { buildingId } = useAuth();
  const { t } = useTranslation();
  
  const { data: announcements, isLoading } = useGetAnnouncements(
    buildingId as number,
    { query: { enabled: !!buildingId, queryKey: ["getAnnouncements", buildingId] } }
  );

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'emergency': return { icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-200' };
      case 'maintenance': return { icon: Wrench, color: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'meeting': return { icon: Calendar, color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'security': return { icon: Shield, color: 'bg-slate-800 text-white border-slate-900' };
      case 'financial': return { icon: DollarSign, color: 'bg-green-100 text-green-700 border-green-200' };
      default: return { icon: Megaphone, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t("residentAnnouncements.title")}</h1>
        <p className="text-slate-500 mt-1">{t("residentAnnouncements.subtitle")}</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : announcements?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-medium text-slate-900">{t("residentAnnouncements.noAnnouncements")}</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              {t("residentAnnouncements.noAnnouncementsDesc")}
            </p>
          </div>
        ) : (
          announcements?.map(announcement => {
            const config = getCategoryConfig(announcement.category);
            const Icon = config.icon;
            return (
              <Card key={announcement.id} className="shadow-sm border-slate-200 overflow-hidden relative">
                {announcement.priority === 'high' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                )}
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="hidden sm:flex flex-col items-center shrink-0">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${config.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${config.color} capitalize`}>
                            {announcement.category}
                          </Badge>
                          {announcement.priority === 'high' && (
                            <Badge variant="destructive" className="uppercase text-[10px]">{t("residentAnnouncements.highPriority")}</Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                          {format(new Date(announcement.createdAt), "MMMM d, yyyy")}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{announcement.title}</h3>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{announcement.message}</p>
                      </div>
                      {announcement.createdBy && (
                        <p className="text-xs text-slate-500 text-right">
                          {t("residentAnnouncements.postedBy", { user: announcement.createdBy })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
