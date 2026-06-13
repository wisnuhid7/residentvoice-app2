import { Link, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetResolution, useVoteOnResolution } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badges";
import { format } from "date-fns";
import { ArrowLeft, Check, X, Minus, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { getGetResolutionQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

export default function ResidentResolutionDetail() {
  const { id } = useParams<{ id: string }>();
  const resolutionId = Number(id);
  const { buildingId, currentUser } = useAuth();
  const slug = currentUser?.building?.slug || '';
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: resolution, isLoading } = useGetResolution(buildingId as number, resolutionId, {
    query: { enabled: !!buildingId && !!resolutionId, queryKey: ["getResolution", buildingId, resolutionId] }
  });

  const voteMutation = useVoteOnResolution({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetResolutionQueryKey(buildingId as number, resolutionId) });
        toast({ title: t("residentResolutionDetail.toastSuccess") });
      },
      onError: (err: any) => {
        toast({ title: t("residentResolutionDetail.toastError"), description: err.message, variant: "destructive" });
      }
    }
  });

  const handleVote = (vote: 'yes' | 'no' | 'abstain') => {
    voteMutation.mutate({ buildingId: buildingId as number, resolutionId, data: { vote } });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!resolution) return <div>Resolution not found</div>;

  const totalVotes = resolution.totalVotes || 0;
  const yesPct = totalVotes > 0 ? Math.round((resolution.yesCount / totalVotes) * 100) : 0;
  const noPct = totalVotes > 0 ? Math.round((resolution.noCount / totalVotes) * 100) : 0;
  const abstainPct = totalVotes > 0 ? Math.round((resolution.abstainCount / totalVotes) * 100) : 0;
  const isClosed = ['passed', 'failed', 'closed'].includes(resolution.status);
  const isOpen = resolution.status === 'open';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/b/${slug}/resolutions`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("residentResolutionDetail.backToResolutions")}
      </Link>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 space-y-6 w-full">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={resolution.status} />
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                {resolution.votingType} Vote
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{resolution.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
              <span>{t("residentResolutionDetail.proposedDate", { date: format(new Date(resolution.createdAt), "MMMM d, yyyy") })}</span>
              {resolution.createdBy && <span>{t("residentResolutionDetail.by", { user: resolution.createdBy })}</span>}
              {resolution.votingEndAt && (
                <span className="font-medium text-slate-700">
                  {t("residentResolutionDetail.votingCloses", { date: format(new Date(resolution.votingEndAt), "MMM d, yyyy") })}
                </span>
              )}
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">{t("residentResolutionDetail.background")}</h3>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{resolution.description}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">{t("residentResolutionDetail.proposedAction")}</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-900 font-medium whitespace-pre-wrap">{resolution.proposedAction}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-80 space-y-6 shrink-0">
          <Card className="shadow-sm border-blue-100">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">{t("residentResolutionDetail.votingResults")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-green-700">{t("residentResolutionDetail.yes", { n: resolution.yesCount })}</span>
                    <span className="text-slate-500">{yesPct}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-green-100"><div className="h-full bg-green-600 transition-all" style={{ width: `${yesPct}%` }} /></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-red-700">{t("residentResolutionDetail.no", { n: resolution.noCount })}</span>
                    <span className="text-slate-500">{noPct}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-red-100"><div className="h-full bg-red-600 transition-all" style={{ width: `${noPct}%` }} /></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-600">{t("residentResolutionDetail.abstain", { n: resolution.abstainCount })}</span>
                    <span className="text-slate-500">{abstainPct}%</span>
                  </div>
                  <Progress value={abstainPct} className="h-2" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
                {t("residentResolutionDetail.totalVotes", { n: totalVotes })}
                {resolution.totalEligible > 0 && ` ${t("residentResolutionDetail.ofEligible", { n: resolution.totalEligible })}`}
              </div>

              {!isClosed && isOpen && (
                <div className="pt-4 border-t border-slate-100">
                  {resolution.userVote ? (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-center text-sm font-medium border border-blue-100">
                      {t("residentResolutionDetail.youVoted", { vote: resolution.userVote })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-center text-slate-900 mb-2">{t("residentResolutionDetail.castVote")}</h4>
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleVote('yes')} disabled={voteMutation.isPending}>
                        <Check className="mr-2 h-4 w-4" /> {t("residentResolutionDetail.voteYes")}
                      </Button>
                      <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => handleVote('no')} disabled={voteMutation.isPending}>
                        <X className="mr-2 h-4 w-4" /> {t("residentResolutionDetail.voteNo")}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => handleVote('abstain')} disabled={voteMutation.isPending}>
                        <Minus className="mr-2 h-4 w-4" /> {t("residentResolutionDetail.voteAbstain")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4 flex gap-3 text-sm text-slate-600">
              <Info className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="font-medium text-slate-900 mb-1">{t("residentResolutionDetail.votingRules")}</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>{t("residentResolutionDetail.requiresPercent", { n: resolution.passPercentage })}</li>
                  <li className="capitalize">{resolution.eligibleVoters.replace('_', ' ')} only</li>
                  {resolution.oneVotePerUnit && <li>{t("residentResolutionDetail.votePerUnit")}</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
