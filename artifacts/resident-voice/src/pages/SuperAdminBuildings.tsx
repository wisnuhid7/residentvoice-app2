import { useState } from "react";
import { useSuperAdminGetBuildings, useSuperAdminUpdateBuildingStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, CheckCircle, Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export default function SuperAdminBuildings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: buildings, isLoading } = useSuperAdminGetBuildings();

  const statusMutation = useSuperAdminUpdateBuildingStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['superAdminGetBuildings'] });
        toast({ title: t("superAdminBuildings.toastSuccess") });
      }
    }
  });

  const handleStatusUpdate = (buildingId: number, status: 'active' | 'suspended') => {
    statusMutation.mutate({ buildingId, data: { status } });
  };

  const filteredBuildings = buildings?.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t("superAdminBuildings.title")}</h1>
        <p className="text-slate-500 mt-1">{t("superAdminBuildings.subtitle")}</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t("superAdminBuildings.searchPlaceholder")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>{t("superAdminBuildings.colBuilding")}</TableHead>
                  <TableHead>{t("superAdminBuildings.colLocation")}</TableHead>
                  <TableHead>{t("superAdminBuildings.colPlan")}</TableHead>
                  <TableHead>{t("superAdminBuildings.colMetrics")}</TableHead>
                  <TableHead>{t("superAdminBuildings.colStatus")}</TableHead>
                  <TableHead className="text-right">{t("superAdminBuildings.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuildings?.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{building.name}</div>
                      <div className="text-xs text-slate-500">/b/{building.slug}</div>
                    </TableCell>
                    <TableCell>{building.city}, {building.country}</TableCell>
                    <TableCell className="capitalize">{building.plan}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div><span className="font-medium">{building.residentCount}</span> {t("superAdminBuildings.resLabel")}</div>
                        <div className="text-slate-500"><span className="font-medium">{building.issueCount}</span> {t("superAdminBuildings.issLabel")}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        building.status === 'active' ? 'bg-green-100 text-green-700' :
                        building.status === 'suspended' ? 'bg-red-100 text-red-700' : ''
                      }>
                        {building.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {building.status !== 'active' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(building.id, 'active')} className="text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" /> {t("superAdminBuildings.setActive")}
                            </DropdownMenuItem>
                          )}
                          {building.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(building.id, 'suspended')} className="text-red-600">
                              <Ban className="mr-2 h-4 w-4" /> {t("superAdminBuildings.suspend")}
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
