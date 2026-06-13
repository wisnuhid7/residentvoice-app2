import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().email(t("login.validEmail")),
    password: z.string().min(6, t("login.validPassword")),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const queryClient = useQueryClient();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (user) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: t("login.toastSuccess") });
        if (user.role === 'super_admin') {
          setLocation('/superadmin');
        } else if (user.role === 'building_admin') {
          setLocation('/admin');
        } else if (user.building?.slug) {
          setLocation(`/b/${user.building.slug}`);
        } else {
          setLocation('/');
        }
      },
      onError: () => {
        toast({
          title: t("login.toastError"),
          description: t("login.toastErrorDesc"),
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values });
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t("login.welcomeBack")}</CardTitle>
          <CardDescription>{t("login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.email")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("login.emailPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("login.password")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? t("login.loggingIn") : t("login.logIn")}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t pt-6 text-center text-sm">
          <div className="text-slate-500">
            {t("login.noAccount")}{" "}
            <Link href="/register-building" className="text-blue-600 hover:underline font-medium">
              {t("login.createPortal")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
