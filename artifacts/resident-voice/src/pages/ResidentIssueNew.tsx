import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateIssue, useGetCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const createIssueSchema = z.object({
  title: z.string().min(5),
  categoryId: z.coerce.number().optional(),
  description: z.string().min(10),
  locationType: z.enum(["lobby", "elevator", "floor", "apartment", "garage", "roof", "pool", "gym", "hallway", "stairs", "other"]),
  locationText: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "emergency"]),
  isRecurring: z.boolean().default(false),
  affectsSafety: z.boolean().default(false),
  affectsMultipleResidents: z.enum(["yes", "no", "not_sure"]),
  suggestedSolution: z.string().optional(),
  anonymousPublic: z.boolean().default(false),
});

export default function ResidentIssueNew() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { buildingId, currentUser } = useAuth();
  const { t } = useTranslation();
  const slug = currentUser?.building?.slug || '';
  
  const { data: categories } = useGetCategories(buildingId as number, { query: { enabled: !!buildingId, queryKey: ["getCategories", buildingId] } });

  const form = useForm<z.infer<typeof createIssueSchema>>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      title: "",
      description: "",
      locationType: "floor",
      locationText: "",
      urgency: "medium",
      isRecurring: false,
      affectsSafety: false,
      affectsMultipleResidents: "not_sure",
      suggestedSolution: "",
      anonymousPublic: false,
    },
  });

  const createMutation = useCreateIssue({
    mutation: {
      onSuccess: () => {
        toast({ title: t("residentIssueNew.toastSuccess") });
        setLocation(`/b/${slug}/issues`);
      },
      onError: () => {
        toast({
          title: t("residentIssueNew.toastError"),
          description: t("residentIssueNew.toastErrorDesc"),
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof createIssueSchema>) => {
    createMutation.mutate({ buildingId: buildingId as number, data: values });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href={`/b/${slug}/issues`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("residentIssueNew.backToIssues")}
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("residentIssueNew.title")}</h1>
          <p className="text-slate-500 text-sm">{t("residentIssueNew.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("residentIssueNew.shortTitle")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("residentIssueNew.titlePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("residentIssueNew.category")}</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val ? Number(val) : undefined)} 
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("residentIssueNew.selectCategory")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("residentIssueNew.urgency")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("residentIssueNew.selectUrgency")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">{t("residentIssueNew.urgencyLow")}</SelectItem>
                          <SelectItem value="medium">{t("residentIssueNew.urgencyMedium")}</SelectItem>
                          <SelectItem value="high">{t("residentIssueNew.urgencyHigh")}</SelectItem>
                          <SelectItem value="emergency">{t("residentIssueNew.urgencyEmergency")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("residentIssueNew.locationArea")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("residentIssueNew.selectArea")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lobby">{t("residentIssueNew.locationLobby")}</SelectItem>
                          <SelectItem value="elevator">{t("residentIssueNew.locationElevator")}</SelectItem>
                          <SelectItem value="floor">{t("residentIssueNew.locationFloor")}</SelectItem>
                          <SelectItem value="apartment">{t("residentIssueNew.locationApartment")}</SelectItem>
                          <SelectItem value="garage">{t("residentIssueNew.locationGarage")}</SelectItem>
                          <SelectItem value="roof">{t("residentIssueNew.locationRoof")}</SelectItem>
                          <SelectItem value="pool">{t("residentIssueNew.locationPool")}</SelectItem>
                          <SelectItem value="gym">{t("residentIssueNew.locationGym")}</SelectItem>
                          <SelectItem value="stairs">{t("residentIssueNew.locationStairs")}</SelectItem>
                          <SelectItem value="other">{t("residentIssueNew.locationOther")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("residentIssueNew.locationDetails")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("residentIssueNew.locationDetailsPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("residentIssueNew.description")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("residentIssueNew.descriptionPlaceholder")}
                        className="h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <FormField
                  control={form.control}
                  name="affectsMultipleResidents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("residentIssueNew.affectsOthers")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">{t("residentIssueNew.affectsYes")}</SelectItem>
                          <SelectItem value="no">{t("residentIssueNew.affectsNo")}</SelectItem>
                          <SelectItem value="not_sure">{t("residentIssueNew.affectsNotSure")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-2 md:pt-8">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>{t("residentIssueNew.recurring")}</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="affectsSafety"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-red-100 bg-red-50 p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-red-900">{t("residentIssueNew.safetyHazard")}</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="button" variant="outline" className="mr-3" onClick={() => setLocation(`/b/${slug}/issues`)}>
                  {t("residentIssueNew.cancel")}
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                  {createMutation.isPending ? t("residentIssueNew.submitting") : t("residentIssueNew.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
