import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetResolutions, getGetResolutionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badges";
import { format } from "date-fns";
import { PlusCircle, FileText, CheckCircle2, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function ResidentResolutions() {
  const { buildingId, currentUser } = useAuth();
  const { t } = useTranslation();
  const slug = currentUser?.building?.slug || '';
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: resolutions, isLoading } = useGetResolutions(
    buildingId as number,
    undefined,
    {
      query: {
        enabled: !!buildingId,
        queryKey: getGetResolutionsQueryKey(buildingId as number, { status: statusFilter !== 'all' ? statusFilter : undefined }),
      }
    }
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("residentResolutions.title")}</h1>
          <p className="text-slate-500 mt-1">{t("residentResolutions.subtitle")}</p>
        </div>
        <Link href={`/b/${slug}/resolutions/new`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("residentResolutions.proposeResolution")}
          </Button>
        </Link>
      </div>

      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder={t("residentResolutions.filterStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("residentResolutions.allResolutions")}</SelectItem>
            <SelectItem value="open">{t("residentResolutions.openForVoting")}</SelectItem>
            <SelectItem value="passed">{t("residentResolutions.passed")}</SelectItem>
            <SelectItem value="failed">{t("residentResolutions.failed")}</SelectItem>
            <SelectItem value="closed">{t("residentResolutions.closed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : resolutions?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-medium text-slate-900">{t("residentResolutions.noResolutions")}</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">{t("residentResolutions.noResolutionsDesc")}</p>
          </div>
        ) : (
          resolutions?.map(resolution => (
            <Link key={resolution.id} href={`/b/${slug}/resolutions/${resolution.id}`}>
              <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer shadow-sm group">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={resolution.status} />
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                        {resolution.votingType} Vote
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {resolution.title}
                    </h3>
                    <p className="text-slate-600 line-clamp-2">{resolution.description}</p>
                    <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-2">
                      <span>Proposed {format(new Date(resolution.createdAt), "MMM d, yyyy")}</span>
                      {resolution.votingEndAt && (
                        <span>• Closes {format(new Date(resolution.votingEndAt), "MMM d, yyyy")}</span>
                      )}
                      <span className="capitalize">• {resolution.eligibleVoters.replace('_', ' ')} only</span>
                    </div>
                  </div>
                  <div className="md:border-l border-t md:border-t-0 border-slate-100 md:pl-6 pt-4 md:pt-0 w-full md:w-48 shrink-0 flex flex-col items-center justify-center">
                    {resolution.status === 'passed' ? (
                      <div className="flex flex-col items-center text-green-600">
                        <CheckCircle2 className="h-10 w-10 mb-2" />
                        <span className="font-semibold text-lg">{t("residentResolutions.passed")}</span>
                      </div>
                    ) : resolution.status === 'failed' ? (
                      <div className="flex flex-col items-center text-slate-400">
                        <XCircle className="h-10 w-10 mb-2" />
                        <span className="font-semibold text-lg">{t("residentResolutions.failed")}</span>
                      </div>
                    ) : (
                      <div className="w-full">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">{t("residentResolutions.castVote")}</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
