import { useAuth } from "@/contexts/AuthContext";
import { useGetNotifications, useMarkAllNotificationsRead, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function ResidentNotifications() {
  const { buildingId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const { data: notifications, isLoading } = useGetNotifications(
    buildingId as number,
    { query: { enabled: !!buildingId, queryKey: ["getNotifications", buildingId] } }
  );

  const markReadMutation = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey(buildingId as number) });
        toast({ title: t("residentNotifications.toastSuccess") });
      }
    }
  });

  const hasUnread = notifications?.some(n => !n.readAt);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("residentNotifications.title")}</h1>
          <p className="text-slate-500 mt-1">{t("residentNotifications.subtitle")}</p>
        </div>
        {hasUnread && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markReadMutation.mutate({ buildingId: buildingId as number })}
            disabled={markReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {t("residentNotifications.markAllRead")}
          </Button>
        )}
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0 divide-y divide-slate-100">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4"><Skeleton className="h-16 w-full" /></div>
            ))
          ) : notifications?.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-12 w-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">{t("residentNotifications.noNotifications")}</h3>
              <p className="text-slate-500 mt-1">{t("residentNotifications.allCaughtUp")}</p>
            </div>
          ) : (
            notifications?.map(notification => (
              <div 
                key={notification.id} 
                className={`p-5 flex gap-4 transition-colors ${!notification.readAt ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${!notification.readAt ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`font-medium ${!notification.readAt ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                </div>
                {!notification.readAt && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
