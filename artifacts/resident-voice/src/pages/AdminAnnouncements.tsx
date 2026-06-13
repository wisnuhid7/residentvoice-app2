import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, getGetAnnouncementsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Megaphone, PlusCircle, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTranslation } from "react-i18next";

const createAnnouncementSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(10),
  category: z.enum(["general", "emergency", "maintenance", "meeting", "financial", "security"]),
  priority: z.enum(["normal", "high"]).optional(),
});

export default function AdminAnnouncements() {
  const { buildingId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: announcements, isLoading } = useGetAnnouncements(
    buildingId as number,
    {
      query: {
        enabled: !!buildingId,
        queryKey: getGetAnnouncementsQueryKey(buildingId as number),
      }
    }
  );

  const form = useForm<z.infer<typeof createAnnouncementSchema>>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: { title: "", message: "", category: "general", priority: "normal" },
  });

  const createMutation = useCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey(buildingId as number) });
        toast({ title: t("adminAnnouncements.toastPosted") });
        setIsModalOpen(false);
        form.reset();
      }
    }
  });

  const deleteMutation = useDeleteAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey(buildingId as number) });
        toast({ title: t("adminAnnouncements.toastDeleted") });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof createAnnouncementSchema>) => {
    createMutation.mutate({ buildingId: buildingId as number, data: values as any });
  };

  const handleDelete = (id: number) => {
    if (confirm(t("adminAnnouncements.deleteConfirm"))) {
      deleteMutation.mutate({ buildingId: buildingId as number, announcementId: id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("adminAnnouncements.title")}</h1>
          <p className="text-slate-500 mt-1">{t("adminAnnouncements.subtitle")}</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("adminAnnouncements.newAnnouncement")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("adminAnnouncements.postTitle")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("adminAnnouncements.labelTitle")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("adminAnnouncements.titlePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("adminAnnouncements.labelCategory")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">{t("adminAnnouncements.categories.general")}</SelectItem>
                            <SelectItem value="maintenance">{t("adminAnnouncements.categories.maintenance")}</SelectItem>
                            <SelectItem value="emergency">{t("adminAnnouncements.categories.emergency")}</SelectItem>
                            <SelectItem value="meeting">{t("adminAnnouncements.categories.meeting")}</SelectItem>
                            <SelectItem value="security">{t("adminAnnouncements.categories.security")}</SelectItem>
                            <SelectItem value="financial">{t("adminAnnouncements.categories.financial")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("adminAnnouncements.labelPriority")}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">{t("adminAnnouncements.priorities.normal")}</SelectItem>
                            <SelectItem value="high">{t("adminAnnouncements.priorities.high")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("adminAnnouncements.labelMessage")}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("adminAnnouncements.messagePlaceholder")} className="h-32" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t("adminAnnouncements.posting") : t("adminAnnouncements.postBtn")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : announcements?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Megaphone className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>{t("adminAnnouncements.noAnnouncements")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>{t("adminAnnouncements.colTitle")}</TableHead>
                  <TableHead>{t("adminAnnouncements.colCategory")}</TableHead>
                  <TableHead>{t("adminAnnouncements.colDate")}</TableHead>
                  <TableHead className="text-right">{t("adminAnnouncements.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements?.map((ann) => (
                  <TableRow key={ann.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {ann.title}
                        {ann.priority === 'high' && <Badge variant="destructive" className="text-[10px]">{t("adminAnnouncements.priorities.high").split(" ")[0]}</Badge>}
                      </div>
                      <div className="text-sm text-slate-500 line-clamp-1 max-w-md mt-1">{ann.message}</div>
                    </TableCell>
                    <TableCell className="capitalize">
                      <Badge variant="outline" className="bg-slate-100">{ann.category}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{format(new Date(ann.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(ann.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
