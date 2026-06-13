import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetResolutions, useUpdateResolutionStatus, getGetResolutionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, PlusCircle, ExternalLink, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function AdminResolutions() {
  const { buildingId, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [selectedResolutionId, setSelectedResolutionId] = useState<number | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { data: resolutions, isLoading } = useGetResolutions(
    buildingId as number,
    undefined,
    {
      query: {
        enabled: !!buildingId,
        queryKey: getGetResolutionsQueryKey(buildingId as number),
      }
    }
  );

  const updateMutation = useUpdateResolutionStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetResolutionsQueryKey(buildingId as number) });
        toast({ title: t("adminResolutions.toastSuccess") });
        setIsUpdateModalOpen(false);
      }
    }
  });

  const handleUpdate = () => {
    if (!selectedResolutionId) return;
    updateMutation.mutate({
      buildingId: buildingId as number,
      resolutionId: selectedResolutionId,
      data: { status: statusUpdate as any }
    });
  };

  const openUpdateModal = (res: any) => {
    setSelectedResolutionId(res.id);
    setStatusUpdate(res.status);
    setIsUpdateModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("adminResolutions.title")}</h1>
          <p className="text-slate-500 mt-1">{t("adminResolutions.subtitle")}</p>
        </div>
        <Link href={`/b/${currentUser?.building?.slug}/resolutions/new`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("adminResolutions.createResolution")}
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : resolutions?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>{t("adminResolutions.noResolutions")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>{t("adminResolutions.colResolution")}</TableHead>
                  <TableHead>{t("adminResolutions.colType")}</TableHead>
                  <TableHead>{t("adminResolutions.colEligible")}</TableHead>
                  <TableHead>{t("adminResolutions.colCreated")}</TableHead>
                  <TableHead>{t("adminResolutions.colStatus")}</TableHead>
                  <TableHead className="text-right">{t("adminResolutions.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolutions?.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900 max-w-sm truncate">{res.title}</div>
                    </TableCell>
                    <TableCell className="capitalize">{res.votingType}</TableCell>
                    <TableCell className="capitalize">{res.eligibleVoters.replace('_', ' ')}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{format(new Date(res.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell><StatusBadge status={res.status} /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openUpdateModal(res)}>
                        <Settings className="h-4 w-4 mr-2" />
                        {t("adminResolutions.colStatus")}
                      </Button>
                      <Link href={`/b/${currentUser?.building?.slug}/resolutions/${res.id}`}>
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
            <DialogTitle>{t("adminResolutions.updateTitle")}</DialogTitle>
            <DialogDescription>{t("adminResolutions.updateDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("adminResolutions.statusLabel")}</label>
              <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("adminResolutions.statuses.draft")}</SelectItem>
                  <SelectItem value="open">{t("adminResolutions.statuses.open")}</SelectItem>
                  <SelectItem value="closed">{t("adminResolutions.statuses.closed")}</SelectItem>
                  <SelectItem value="passed">{t("adminResolutions.statuses.passed")}</SelectItem>
                  <SelectItem value="failed">{t("adminResolutions.statuses.failed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("adminResolutions.updating") : t("adminResolutions.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
