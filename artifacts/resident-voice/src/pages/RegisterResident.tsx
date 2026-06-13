import { Link, useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterResident, useGetBuildingBySlug } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const registerResidentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  apartmentNumber: z.string().min(1),
  floor: z.coerce.number().min(0),
  residentType: z.enum(["owner", "tenant", "family_member", "property_manager"]),
  inviteCode: z.string().optional(),
});

export default function RegisterResident() {
  const { buildingSlug } = useParams<{ buildingSlug: string }>();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: building, isLoading, error } = useGetBuildingBySlug(buildingSlug || "", {
    query: { enabled: !!buildingSlug, queryKey: ["getBuildingBySlug", buildingSlug] }
  });

  const form = useForm<z.infer<typeof registerResidentSchema>>({
    resolver: zodResolver(registerResidentSchema),
    defaultValues: {
      fullName: "", email: "", phone: "", password: "",
      apartmentNumber: "", floor: 1, residentType: "tenant", inviteCode: "",
    },
  });

  const registerMutation = useRegisterResident({
    mutation: {
      onSuccess: () => {
        toast({ title: t("registerResident.toastSuccess"), description: t("registerResident.toastSuccessDesc") });
        setLocation(`/b/${buildingSlug}`);
      },
      onError: () => {
        toast({ title: t("registerResident.toastError"), description: t("registerResident.toastErrorDesc"), variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof registerResidentSchema>) => {
    registerMutation.mutate({ data: { ...values, buildingSlug: buildingSlug || "" } });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
        <Skeleton className="w-full max-w-lg h-[500px] rounded-xl" />
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <Building2 className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("registerResident.notFound")}</h2>
        <p className="text-slate-500 mb-6">{t("registerResident.notFoundDesc")}</p>
        <Link href="/"><Button>{t("registerResident.returnHome")}</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-4 py-12">
      <Card className="w-full max-w-lg shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6 border-b mb-6">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{building.name}</CardTitle>
          <CardDescription>{t("registerResident.registrationPortal")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("registerResident.fullName")}</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("registerResident.email")}</FormLabel>
                  <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("registerResident.phone")}</FormLabel>
                  <FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="apartmentNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("registerResident.apartment")}</FormLabel>
                    <FormControl><Input placeholder="4B" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="floor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("registerResident.floor")}</FormLabel>
                    <FormControl><Input type="number" placeholder="4" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="residentType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("registerResident.residentType")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={t("registerResident.selectType")} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tenant">{t("registerResident.types.resident_tenant")}</SelectItem>
                      <SelectItem value="owner">{t("registerResident.types.resident_owner")}</SelectItem>
                      <SelectItem value="family_member">{t("registerResident.types.family")}</SelectItem>
                      <SelectItem value="property_manager">{t("registerResident.types.property_manager")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="inviteCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("registerResident.inviteCode")}</FormLabel>
                  <FormControl><Input placeholder={t("registerResident.inviteCodePlaceholder")} {...field} /></FormControl>
                  <FormDescription>{t("registerResident.inviteCodeDesc")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("registerResident.password")}</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full mt-6 bg-blue-600 hover:bg-blue-700" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? t("registerResident.registering") : t("registerResident.createAccount")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
