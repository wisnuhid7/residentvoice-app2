import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetIssues, getGetIssuesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, UrgencyBadge } from "@/components/ui/badges";
import { format } from "date-fns";
import { PlusCircle, Search, Filter, MessageSquare, ArrowUp, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function ResidentIssues() {
  const { buildingId, currentUser } = useAuth();
  const { t } = useTranslation();
  const slug = currentUser?.building?.slug || '';
  
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [sortOrder, setSortOrder] = useState<string>("most_voted");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: issues, isLoading } = useGetIssues(
    buildingId as number,
    undefined,
    {
      query: {
        enabled: !!buildingId,
        queryKey: getGetIssuesQueryKey(buildingId as number, { status: statusFilter !== 'all' ? statusFilter : undefined, sort: sortOrder as any }),
      }
    }
  );

  const filteredIssues = issues?.filter(issue => 
    issue.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("residentIssues.title")}</h1>
          <p className="text-slate-500 mt-1">{t("residentIssues.subtitle")}</p>
        </div>
        <Link href={`/b/${slug}/issues/new`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("residentIssues.reportIssue")}
          </Button>
        </Link>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={t("residentIssues.searchPlaceholder")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("residentIssues.allStatuses")}</SelectItem>
                <SelectItem value="open">{t("residentIssues.openActive")}</SelectItem>
                <SelectItem value="resolved">{t("residentIssues.resolved")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="most_voted">{t("residentIssues.mostVoted")}</SelectItem>
                <SelectItem value="newest">{t("residentIssues.newestFirst")}</SelectItem>
                <SelectItem value="urgent">{t("residentIssues.highestUrgency")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : filteredIssues?.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{t("residentIssues.noIssues")}</h3>
            <p className="text-slate-500 mt-1 mb-6">{t("residentIssues.noIssuesDesc")}</p>
            <Button variant="outline" onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}>
              {t("residentIssues.clearFilters")}
            </Button>
          </div>
        ) : (
          filteredIssues?.map(issue => (
            <Link key={issue.id} href={`/b/${slug}/issues/${issue.id}`}>
              <Card className="hover:border-blue-300 transition-all cursor-pointer shadow-sm group">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  <div className="bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-100 p-4 sm:p-6 flex flex-row sm:flex-col items-center justify-center gap-2 sm:min-w-28 group-hover:bg-blue-50 transition-colors">
                    <ArrowUp className={`h-6 w-6 ${issue.hasVoted ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={`text-2xl font-bold ${issue.hasVoted ? 'text-blue-600' : 'text-slate-700'}`}>
                      {issue.voteCount}
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:block">{t("residentIssues.votes")}</span>
                  </div>
                  <div className="p-4 sm:p-6 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <UrgencyBadge urgency={issue.urgency} />
                      <StatusBadge status={issue.status} />
                      {issue.categoryName && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {issue.categoryName}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {issue.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-slate-500">
                        <span>{t("residentIssues.reportedDate", { date: format(new Date(issue.createdAt), "MMM d, yyyy") })}</span>
                        {issue.submittedBy && (
                          <span className="flex items-center">
                            <span className="w-1 h-1 rounded-full bg-slate-300 mx-2"></span>
                            {t("residentIssues.by", { user: issue.submittedBy })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-slate-300 mx-2"></span>
                          <MessageSquare className="h-4 w-4" />
                          {t("residentIssues.comments", { n: issue.commentCount })}
                        </span>
                        {issue.affectedCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-300 mx-2"></span>
                            <Users className="h-4 w-4" />
                            {t("residentIssues.affected", { n: issue.affectedCount })}
                          </span>
                        )}
                      </div>
                    </div>
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
