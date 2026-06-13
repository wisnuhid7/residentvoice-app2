import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetBuildingSettings, useUpdateBuildingSettings, useGetBuilding } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const buildingSettingsSchema = z.object({
  verificationMethod: z.enum(["manual_approval", "invite_code", "document_upload"]),
  inviteCode: z.string().optional(),
  allowTenantOfficialVotes: z.boolean(),
  oneVotePerUnit: z.boolean(),
  passPercentage: z.coerce.number().min(1).max(100),
  allowAnonymousPosts: z.boolean(),
});

export default function AdminSettings() {
  const { buildingId } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: building, isLoading: buildingLoading } = useGetBuilding(buildingId as number, { query: { enabled: !!buildingId, queryKey: ["getBuilding", buildingId] } });
  const { data: settings, isLoading: settingsLoading } = useGetBuildingSettings(buildingId as number, { query: { enabled: !!buildingId, queryKey: ["getBuildingSettings", buildingId] } });

  const updateSettingsMutation = useUpdateBuildingSettings();

  const form = useForm<z.infer<typeof buildingSettingsSchema>>({
    resolver: zodResolver(buildingSettingsSchema),
    defaultValues: {
      verificationMethod: "manual_approval",
      inviteCode: "",
      allowTenantOfficialVotes: false,
      oneVotePerUnit: true,
      passPercentage: 50,
      allowAnonymousPosts: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        verificationMethod: settings.verificationMethod || "manual_approval",
        inviteCode: settings.inviteCode || "",
        allowTenantOfficialVotes: settings.allowTenantOfficialVotes ?? false,
        oneVotePerUnit: settings.oneVotePerUnit ?? true,
        passPercentage: settings.passPercentage || 50,
        allowAnonymousPosts: settings.allowAnonymousPosts ?? true,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof buildingSettingsSchema>) => {
    updateSettingsMutation.mutate(
      { buildingId: buildingId as number, data: values },
      {
        onSuccess: () => toast({ title: t("adminSettings.toastSuccess") }),
        onError: () => toast({ title: t("adminSettings.toastError"), variant: "destructive" })
      }
    );
  };

  if (buildingLoading || settingsLoading) {
    return <div className="p-8"><Skeleton className="h-96 w-full max-w-2xl" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t("adminSettings.title")}</h1>
        <p className="text-slate-500 mt-1">{t("adminSettings.configureDesc", { building: building?.name })}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("adminSettings.verificationSection")}</CardTitle>
              <CardDescription>{t("adminSettings.verificationDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="verificationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("adminSettings.verificationMethod")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("adminSettings.selectMethod")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual_approval">{t("adminSettings.manualApproval")}</SelectItem>
                        <SelectItem value="invite_code">{t("adminSettings.inviteCode")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("verificationMethod") === "invite_code" && (
                <FormField
                  control={form.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("adminSettings.buildingInviteCode")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("adminSettings.inviteCodePlaceholder")} />
                      </FormControl>
                      <FormDescription>{t("adminSettings.inviteCodeDesc")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("adminSettings.votingSection")}</CardTitle>
              <CardDescription>{t("adminSettings.votingDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="passPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("adminSettings.passThreshold")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormDescription>{t("adminSettings.passThresholdDesc")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oneVotePerUnit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("adminSettings.votePerUnit")}</FormLabel>
                      <FormDescription>{t("adminSettings.votePerUnitDesc")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allowTenantOfficialVotes"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("adminSettings.tenantsVote")}</FormLabel>
                      <FormDescription>{t("adminSettings.tenantsVoteDesc")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("adminSettings.communitySection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="allowAnonymousPosts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("adminSettings.anonymousPosting")}</FormLabel>
                      <FormDescription>{t("adminSettings.anonymousPostingDesc")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettingsMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {updateSettingsMutation.isPending ? t("common.saving") : t("adminSettings.saveBtn")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
