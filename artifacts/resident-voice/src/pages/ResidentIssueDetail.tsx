import { useState } from "react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetIssue, 
  useGetIssueComments, 
  useAddIssueComment,
  useGetIssueStatusHistory, 
  useGetSolutions,
  useCreateSolution,
  useVoteOnSolution,
  useVoteOnIssue 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge, UrgencyBadge } from "@/components/ui/badges";
import { format } from "date-fns";
import { ArrowLeft, MessageSquare, ArrowUp, AlertTriangle, MapPin, Calendar, Users, RefreshCw, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { getGetIssueQueryKey, getGetIssueCommentsQueryKey, getGetSolutionsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function ResidentIssueDetail() {
  const { id } = useParams<{ id: string }>();
  const issueId = Number(id);
  const { buildingId, currentUser } = useAuth();
  const slug = currentUser?.building?.slug || '';
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [commentText, setCommentText] = useState("");
  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);
  const [solutionTitle, setSolutionTitle] = useState("");
  const [solutionDesc, setSolutionDesc] = useState("");
  const [solutionCost, setSolutionCost] = useState("");

  const { data: issue, isLoading: issueLoading } = useGetIssue(buildingId as number, issueId, {
    query: { enabled: !!buildingId && !!issueId, queryKey: ["getIssue", buildingId, issueId] }
  });
  const { data: comments } = useGetIssueComments(buildingId as number, issueId, {
    query: { enabled: !!buildingId && !!issueId, queryKey: ["getIssueComments", buildingId, issueId] }
  });
  const { data: history } = useGetIssueStatusHistory(buildingId as number, issueId, {
    query: { enabled: !!buildingId && !!issueId, queryKey: ["getIssueStatusHistory", buildingId, issueId] }
  });
  const { data: solutions } = useGetSolutions(buildingId as number, issueId, {
    query: { enabled: !!buildingId && !!issueId, queryKey: ["getSolutions", buildingId, issueId] }
  });

  const voteMutation = useVoteOnIssue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetIssueQueryKey(buildingId as number, issueId) });
        toast({ title: t("residentIssueDetail.toastVote") });
      }
    }
  });
  const commentMutation = useAddIssueComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetIssueCommentsQueryKey(buildingId as number, issueId) });
        setCommentText("");
        toast({ title: t("residentIssueDetail.toastComment") });
      }
    }
  });
  const solutionMutation = useCreateSolution({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSolutionsQueryKey(buildingId as number, issueId) });
        setIsSolutionModalOpen(false);
        setSolutionTitle(""); setSolutionDesc(""); setSolutionCost("");
        toast({ title: t("residentIssueDetail.toastSolution") });
      }
    }
  });
  const voteSolutionMutation = useVoteOnSolution({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSolutionsQueryKey(buildingId as number, issueId) });
        toast({ title: t("residentIssueDetail.toastVote") });
      }
    }
  });

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate({ buildingId: buildingId as number, issueId, data: { comment: commentText, anonymousPublic: false } });
  };

  const submitSolution = () => {
    if (!solutionTitle.trim() || !solutionDesc.trim()) return;
    solutionMutation.mutate({ buildingId: buildingId as number, issueId, data: { title: solutionTitle, description: solutionDesc, estimatedCost: solutionCost || undefined } });
  };

  if (issueLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!issue) return <div>Issue not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/b/${slug}/issues`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("residentIssueDetail.backToIssues")}
      </Link>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 space-y-6 w-full">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <UrgencyBadge urgency={issue.urgency} />
              <StatusBadge status={issue.status} />
              {issue.categoryName && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {issue.categoryName}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{issue.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
              <span>{t("residentIssueDetail.reportedDate", { date: format(new Date(issue.createdAt), "MMMM d, yyyy") })}</span>
              {issue.submittedBy && <span>{t("residentIssueDetail.by", { user: issue.submittedBy })}</span>}
            </div>
          </div>

          {issue.adminResponse && (
            <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-700">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">{t("residentIssueDetail.managementResponse")}</h3>
                    <p className="text-slate-700 whitespace-pre-wrap">{issue.adminResponse}</p>
                    {issue.estimatedCompletionDate && (
                      <p className="text-sm font-medium text-blue-800 mt-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t("residentIssueDetail.estimatedCompletion")}: {format(new Date(issue.estimatedCompletionDate), "MMMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 text-slate-900">{t("residentIssueDetail.description")}</h3>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{issue.description}</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t("residentIssueDetail.proposedSolutions")}</CardTitle>
              <Dialog open={isSolutionModalOpen} onOpenChange={setIsSolutionModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                    {t("residentIssueDetail.proposeSolution")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("residentIssueDetail.proposeTitle")}</DialogTitle>
                    <DialogDescription>{t("residentIssueDetail.proposeDesc")}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("residentIssueDetail.solutionTitle")}</label>
                      <Input value={solutionTitle} onChange={e => setSolutionTitle(e.target.value)} placeholder={t("residentIssueDetail.solutionTitlePlaceholder")} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("residentIssueDetail.solutionDesc")}</label>
                      <Textarea value={solutionDesc} onChange={e => setSolutionDesc(e.target.value)} placeholder={t("residentIssueDetail.solutionDescPlaceholder")} className="h-24" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("residentIssueDetail.estimatedCost")}</label>
                      <Input value={solutionCost} onChange={e => setSolutionCost(e.target.value)} placeholder={t("residentIssueDetail.estimatedCostPlaceholder")} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSolutionModalOpen(false)}>{t("common.cancel")}</Button>
                    <Button onClick={submitSolution} disabled={solutionMutation.isPending}>
                      {solutionMutation.isPending ? t("residentIssueDetail.submitting") : t("residentIssueDetail.submitSolution")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {solutions?.map(solution => (
                  <div key={solution.id} className="p-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-slate-900 text-lg">{solution.title}</h4>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{solution.description}</p>
                      {solution.estimatedCost && (
                        <div className="text-sm text-slate-600 bg-slate-50 inline-block px-2 py-1 rounded border">
                          Est. Cost: <span className="font-medium">{solution.estimatedCost}</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-500">Proposed by {solution.createdBy} on {format(new Date(solution.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center shrink-0 w-24">
                      <Button 
                        variant={solution.hasVoted ? "secondary" : "outline"} 
                        className={`w-full ${solution.hasVoted ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}`}
                        onClick={() => voteSolutionMutation.mutate({ buildingId: buildingId as number, issueId, solutionId: solution.id })}
                        disabled={voteSolutionMutation.isPending}
                      >
                        <ArrowUp className="mr-2 h-4 w-4" /> {solution.voteCount}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">{t("residentIssueDetail.discussion", { n: issue.commentCount })}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {comments?.map(comment => (
                  <div key={comment.id} className={`p-4 ${comment.isAdminResponse ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-slate-900">{comment.authorName || 'Anonymous'}</span>
                      {comment.isAdminResponse && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Management</span>
                      )}
                      <span className="text-xs text-slate-500">{format(new Date(comment.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t bg-slate-50">
                <form onSubmit={submitComment} className="flex gap-2">
                  <Input 
                    placeholder={t("residentIssueDetail.commentPlaceholder")}
                    value={commentText} 
                    onChange={e => setCommentText(e.target.value)} 
                    className="flex-1 bg-white"
                  />
                  <Button type="submit" disabled={commentMutation.isPending || !commentText.trim()}>
                    {t("residentIssueDetail.post")}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-80 space-y-6 shrink-0">
          <Card className="shadow-sm border-blue-100">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-1">{issue.voteCount}</div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{t("residentIssueDetail.residentsAffected")}</div>
                </div>
                <Button 
                  className={`w-full ${issue.hasVoted ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  variant={issue.hasVoted ? "outline" : "default"}
                  onClick={() => voteMutation.mutate({ buildingId: buildingId as number, issueId, data: { voteType: 'affected' } })}
                  disabled={voteMutation.isPending}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  {issue.hasVoted ? t("residentIssueDetail.voted") : t("residentIssueDetail.affectedToo")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t("residentIssueDetail.details")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 capitalize">{issue.locationType}</p>
                  {issue.locationText && <p className="text-slate-500">{issue.locationText}</p>}
                </div>
              </div>
              {issue.affectsSafety && (
                <div className="flex items-start gap-3 text-red-700 bg-red-50 p-2 rounded-md">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="font-medium">{t("residentIssueDetail.safetyHazard")}</p>
                </div>
              )}
              {issue.isRecurring && (
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-4 w-4 text-slate-400 mt-0.5" />
                  <p className="font-medium text-slate-900">{t("residentIssueDetail.recurring")}</p>
                </div>
              )}
              {issue.affectsMultipleResidents && (
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">{t("residentIssueDetail.affectsMultiple")}</p>
                    <p className="text-slate-500 capitalize">{issue.affectsMultipleResidents.replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t("residentIssueDetail.timeline")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {history?.map((event, i) => (
                  <div key={event.id} className="flex gap-3 relative">
                    {i !== (history?.length ?? 0) - 1 && (
                      <div className="absolute top-6 left-[11px] bottom-0 w-px bg-slate-200"></div>
                    )}
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 border border-white">
                      <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-medium text-slate-900 capitalize">{event.newStatus.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500">{format(new Date(event.createdAt), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
