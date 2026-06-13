import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetResidents, useUpdateResidentStatus, getGetResidentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Check, X, Ban, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function AdminResidents() {
  const { buildingId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: residents, isLoading } = useGetResidents(
    buildingId as number,
    undefined,
    {
      query: {
        enabled: !!buildingId,
        queryKey: getGetResidentsQueryKey(buildingId as number, { status: statusFilter !== 'all' ? statusFilter as any : undefined }),
      }
    }
  );

  const statusMutation = useUpdateResidentStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetResidentsQueryKey(buildingId as number) });
        toast({ title: t("adminResidents.toastSuccess") });
      }
    }
  });

  const handleStatusUpdate = (userId: number, status: 'verified' | 'rejected' | 'suspended') => {
    statusMutation.mutate({ buildingId: buildingId as number, userId, data: { status } });
  };

  const filteredResidents = residents?.filter(r => 
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.apartmentNumber && r.apartmentNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t("adminResidents.verified")}</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">{t("common.status.pending")}</Badge>;
      case 'rejected': return <Badge variant="destructive">{t("adminResidents.rejected")}</Badge>;
      case 'suspended': return <Badge variant="outline" className="bg-slate-100 text-slate-800">{t("adminResidents.suspended")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t("adminResidents.title")}</h1>
        <p className="text-slate-500 mt-1">{t("adminResidents.subtitle")}</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder={t("adminResidents.searchPlaceholder")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("adminResidents.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("adminResidents.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("adminResidents.pendingApproval")}</SelectItem>
                <SelectItem value="verified">{t("adminResidents.verified")}</SelectItem>
                <SelectItem value="suspended">{t("adminResidents.suspended")}</SelectItem>
                <SelectItem value="rejected">{t("adminResidents.rejected")}</SelectItem>
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
          ) : filteredResidents?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <User className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>{t("adminResidents.noResidents")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>{t("adminResidents.colResident")}</TableHead>
                  <TableHead>{t("adminResidents.colUnit")}</TableHead>
                  <TableHead>{t("adminResidents.colType")}</TableHead>
                  <TableHead>{t("adminResidents.colJoined")}</TableHead>
                  <TableHead>{t("adminResidents.colStatus")}</TableHead>
                  <TableHead className="text-right">{t("adminResidents.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResidents?.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{resident.fullName}</div>
                      <div className="text-sm text-slate-500">{resident.email}</div>
                    </TableCell>
                    <TableCell>
                      {resident.apartmentNumber ? (
                        <span>
                          {resident.floor
                            ? t("adminResidents.unitFloor", { unit: resident.apartmentNumber, floor: resident.floor })
                            : t("adminResidents.unitOnly", { unit: resident.apartmentNumber })}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{resident.residentType?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell className="text-slate-500">{format(new Date(resident.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(resident.verificationStatus)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {resident.verificationStatus !== 'verified' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(resident.id, 'verified')}
                              className="text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" /> {t("adminResidents.approve")}
                            </DropdownMenuItem>
                          )}
                          {resident.verificationStatus === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(resident.id, 'rejected')}
                              className="text-red-600"
                            >
                              <X className="mr-2 h-4 w-4" /> {t("adminResidents.reject")}
                            </DropdownMenuItem>
                          )}
                          {resident.verificationStatus === 'verified' && (
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(resident.id, 'suspended')}
                              className="text-orange-600"
                            >
                              <Ban className="mr-2 h-4 w-4" /> {t("adminResidents.suspend")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
