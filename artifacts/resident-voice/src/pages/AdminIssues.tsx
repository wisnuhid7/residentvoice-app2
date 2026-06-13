import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetIssues, useUpdateIssue, getGetIssuesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge, UrgencyBadge } from "@/components/ui/badges";
import { Search, Filter, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function AdminIssues() {
  const { buildingId, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [adminResponse, setAdminResponse] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { data: issues, isLoading } = useGetIssues(
    buildingId as number,
    undefined,
    {
      query: {
        enabled: !!buildingId,
        queryKey: getGetIssuesQueryKey(buildingId as number, { status: statusFilter !== 'all' ? statusFilter : undefined }),
      }
    }
  );

  const updateMutation = useUpdateIssue({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetIssuesQueryKey(buildingId as number) });
        toast({ title: t("adminIssues.toastSuccess") });
        setIsUpdateModalOpen(false);
      }
    }
  });

  const handleUpdate = () => {
    if (!selectedIssueId) return;
    updateMutation.mutate({
      buildingId: buildingId as number,
      issueId: selectedIssueId,
      data: { status: statusUpdate, adminResponse: adminResponse || undefined }
    });
  };

  const openUpdateModal = (issue: any) => {
    setSelectedIssueId(issue.id);
    setStatusUpdate(issue.status);
    setAdminResponse(issue.adminResponse || "");
    setIsUpdateModalOpen(true);
  };

  const filteredIssues = issues?.filter(i => 
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t("adminIssues.title")}</h1>
        <p className="text-slate-500 mt-1">{t("adminIssues.subtitle")}</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={t("adminIssues.searchPlaceholder")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4 text-slate-500" />
                <SelectValue placeholder={t("adminIssues.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("adminIssues.allStatuses")}</SelectItem>
                <SelectItem value="new">{t("adminIssues.statuses.new")}</SelectItem>
                <SelectItem value="in_progress">{t("adminIssues.statuses.in_progress")}</SelectItem>
                <SelectItem value="in_review">{t("adminIssues.statuses.in_review")}</SelectItem>
                <SelectItem value="resolved">{t("adminIssues.statuses.resolved")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredIssues?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>{t("adminIssues.noIssues")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>{t("adminIssues.colIssue")}</TableHead>
                  <TableHead>{t("adminIssues.colUrgency")}</TableHead>
                  <TableHead>{t("adminIssues.colStatus")}</TableHead>
                  <TableHead>{t("adminIssues.colVotes")}</TableHead>
                  <TableHead>{t("adminIssues.colDate")}</TableHead>
                  <TableHead className="text-right">{t("adminIssues.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues?.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{issue.title}</div>
                      {issue.categoryName && <div className="text-xs text-slate-500">{issue.categoryName}</div>}
                    </TableCell>
                    <TableCell><UrgencyBadge urgency={issue.urgency} /></TableCell>
                    <TableCell><StatusBadge status={issue.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">{issue.voteCount}</div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{format(new Date(issue.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openUpdateModal(issue)}>
                        {t("adminIssues.updateTitle")}
                      </Button>
                      <Link href={`/b/${currentUser?.building?.slug}/issues/${issue.id}`}>
                        <Button variant="ghost" size="sm" className="px-2">
                          <ExternalLink className="h-4 w-4 text-slate-500" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminIssues.updateTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("adminIssues.statusLabel")}</label>
              <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                <SelectTrigger>
                  <SelectValue placeholder={t("adminIssues.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t("adminIssues.statuses.new")}</SelectItem>
                  <SelectItem value="in_review">{t("adminIssues.statuses.in_review")}</SelectItem>
                  <SelectItem value="in_progress">{t("adminIssues.statuses.in_progress")}</SelectItem>
                  <SelectItem value="vendor_scheduled">{t("adminIssues.statuses.vendor_scheduled")}</SelectItem>
                  <SelectItem value="resolved">{t("adminIssues.statuses.resolved")}</SelectItem>
                  <SelectItem value="duplicate">{t("adminIssues.statuses.duplicate")}</SelectItem>
                  <SelectItem value="rejected">{t("adminIssues.statuses.rejected")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("adminIssues.responseLabel")}</label>
              <Textarea 
                placeholder={t("adminIssues.responsePlaceholder")}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("adminIssues.updating") : t("adminIssues.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
