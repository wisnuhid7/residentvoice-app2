import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterBuilding } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const registerBuildingSchema = z.object({
  buildingName: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().optional(),
  country: z.string().min(2),
  numberOfFloors: z.coerce.number().min(1),
  numberOfUnits: z.coerce.number().min(1),
  buildingType: z.enum(["high_rise", "condo", "apartment", "gated_community", "residential_tower", "mixed"]),
  adminFullName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPhone: z.string().min(5),
  password: z.string().min(8),
});

export default function RegisterBuilding() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof registerBuildingSchema>>({
    resolver: zodResolver(registerBuildingSchema),
    defaultValues: {
      buildingName: "", slug: "", address: "", city: "", state: "", country: "",
      numberOfFloors: 1, numberOfUnits: 1, buildingType: "apartment",
      adminFullName: "", adminEmail: "", adminPhone: "", password: "",
    },
  });

  const registerMutation = useRegisterBuilding({
    mutation: {
      onSuccess: () => {
        toast({ title: t("registerBuilding.toastSuccess") });
        setLocation("/admin");
      },
      onError: () => {
        toast({ title: t("registerBuilding.toastError"), description: t("registerBuilding.toastErrorDesc"), variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof registerBuildingSchema>) => {
    registerMutation.mutate({ data: values });
  };

  const nextStep = async () => {
    const fields = step === 1
      ? ["buildingName", "slug", "address", "city", "state", "country", "numberOfFloors", "numberOfUnits", "buildingType"] as const
      : ["adminFullName", "adminEmail", "adminPhone", "password"] as const;
    const isValid = await form.trigger(fields);
    if (isValid) setStep(2);
  };

  const stepLabel = step === 1 ? t("registerBuilding.stepBuilding") : t("registerBuilding.stepAdmin");

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-4 py-12">
      <Card className="w-full max-w-2xl shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold">{t("registerBuilding.title")}</CardTitle>
          <CardDescription>
            {t("registerBuilding.step", { step })} — {stepLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="buildingName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registerBuilding.buildingName")}</FormLabel>
                      <FormControl><Input placeholder="Sunset Towers" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registerBuilding.portalSlug")}</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-slate-500 bg-slate-100 px-3 py-2 border border-r-0 rounded-l-md text-sm">residentvoice.com/b/</span>
                          <Input className="rounded-l-none" placeholder="sunset-towers" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>{t("registerBuilding.portalSlugDesc")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="buildingType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registerBuilding.buildingType")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={t("registerBuilding.selectBuildingType")} /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apartment">{t("registerBuilding.types.apartment")}</SelectItem>
                          <SelectItem value="condo">{t("registerBuilding.types.condo")}</SelectItem>
                          <SelectItem value="high_rise">{t("registerBuilding.types.high_rise")}</SelectItem>
                          <SelectItem value="residential_tower">{t("registerBuilding.types.residential_tower")}</SelectItem>
                          <SelectItem value="gated_community">{t("registerBuilding.types.gated_community")}</SelectItem>
                          <SelectItem value="mixed">{t("registerBuilding.types.mixed")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="numberOfUnits" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("registerBuilding.numberOfUnits")}</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="numberOfFloors" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("registerBuilding.numberOfFloors")}</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registerBuilding.streetAddress")}</FormLabel>
                      <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("registerBuilding.city")}</FormLabel>
                        <FormControl><Input placeholder="City" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("registerBuilding.stateProvince")}</FormLabel>
                        <FormControl><Input placeholder="State" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("registerBuilding.country")}</FormLabel>
                        <FormControl><Input placeholder="Country" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={nextStep}>{t("registerBuilding.continueToAdmin")}</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <FormField control={form.control} name="adminFullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registerBuilding.fullName")}</FormLabel>
                      <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="adminEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registerBuilding.adminEmail")}</FormLabel>
                      <FormControl><Input placeholder="admin@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="adminPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registerBuilding.phoneNumber")}</FormLabel>
                      <FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("registerBuilding.password")}</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>{t("registerBuilding.back")}</Button>
                    <Button type="submit" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? t("registerBuilding.registering") : t("registerBuilding.completeRegistration")}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
