import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateResolution, useGetIssues, getGetIssuesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

const createResolutionSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  proposedAction: z.string().min(10),
  relatedIssueId: z.coerce.number().optional(),
  votingType: z.enum(["informal", "official", "petition"]),
  eligibleVoters: z.enum(["owners_only", "tenants_only", "all_residents", "one_per_unit"]),
  oneVotePerUnit: z.boolean().default(true),
  passPercentage: z.coerce.number().min(1).max(100).default(50),
});

export default function ResidentResolutionNew() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { buildingId, currentUser } = useAuth();
  const { t } = useTranslation();
  const slug = currentUser?.building?.slug || '';

  const { data: issues } = useGetIssues(buildingId as number, undefined, {
    query: { enabled: !!buildingId, queryKey: getGetIssuesQueryKey(buildingId as number) }
  });

  const form = useForm<z.infer<typeof createResolutionSchema>>({
    resolver: zodResolver(createResolutionSchema),
    defaultValues: {
      title: "", description: "", proposedAction: "",
      votingType: "informal", eligibleVoters: "all_residents",
      oneVotePerUnit: true, passPercentage: 50,
    },
  });

  const createMutation = useCreateResolution({
    mutation: {
      onSuccess: () => {
        toast({ title: t("residentResolutionNew.toastSuccess") });
        setLocation(`/b/${slug}/resolutions`);
      },
      onError: () => {
        toast({ title: t("residentResolutionNew.toastError"), description: t("residentResolutionNew.toastErrorDesc"), variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof createResolutionSchema>) => {
    const endAt = new Date();
    endAt.setDate(endAt.getDate() + 14);
    createMutation.mutate({ buildingId: buildingId as number, data: { ...values, votingEndAt: endAt.toISOString() } });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/b/${slug}/resolutions`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("residentResolutionNew.backToResolutions")}
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("residentResolutionNew.title")}</h1>
          <p className="text-slate-500 text-sm">{t("residentResolutionNew.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("residentResolutionNew.resolutionTitle")}</FormLabel>
                  <FormControl><Input placeholder={t("residentResolutionNew.titlePlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("residentResolutionNew.background")}</FormLabel>
                  <FormControl><Textarea placeholder={t("residentResolutionNew.backgroundPlaceholder")} className="h-24" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="proposedAction" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("residentResolutionNew.proposedAction")}</FormLabel>
                  <FormControl><Textarea placeholder={t("residentResolutionNew.actionPlaceholder")} className="h-24" {...field} /></FormControl>
                  <FormDescription>{t("residentResolutionNew.backgroundDesc")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="relatedIssueId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("residentResolutionNew.relatedIssue")}</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val ? Number(val) : undefined)} value={field.value?.toString() || ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("residentResolutionNew.selectRelatedIssue")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {issues?.map(i => <SelectItem key={i.id} value={i.id.toString()}>{i.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <FormField control={form.control} name="votingType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("residentResolutionNew.voteType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white"><SelectValue placeholder={t("residentResolutionNew.selectVoteType")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="informal">{t("residentResolutionNew.types.informal_poll")}</SelectItem>
                        <SelectItem value="petition">{t("residentResolutionNew.types.petition")}</SelectItem>
                        <SelectItem value="official">{t("residentResolutionNew.types.official")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="eligibleVoters" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("residentResolutionNew.whoVotes")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white"><SelectValue placeholder={t("residentResolutionNew.selectVoters")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all_residents">{t("residentResolutionNew.voters.all")}</SelectItem>
                        <SelectItem value="owners_only">{t("residentResolutionNew.voters.owners_only")}</SelectItem>
                        <SelectItem value="tenants_only">{t("residentResolutionNew.voters.tenants_only")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="passPercentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("residentResolutionNew.passThreshold")}</FormLabel>
                    <FormControl><Input type="number" className="bg-white" min={1} max={100} {...field} /></FormControl>
                    <FormDescription>{t("residentResolutionNew.passThresholdDesc")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="oneVotePerUnit" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3 shadow-sm mt-8">
                    <div className="space-y-0.5">
                      <FormLabel>{t("residentResolutionNew.votePerUnit")}</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="button" variant="outline" className="mr-3" onClick={() => setLocation(`/b/${slug}/resolutions`)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                  {createMutation.isPending ? t("residentResolutionNew.proposing") : t("residentResolutionNew.submitProposal")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
