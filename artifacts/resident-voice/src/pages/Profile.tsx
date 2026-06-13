import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Home, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Profile() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  if (!currentUser) return null;

  const initials = currentUser.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">{t("profile.title")}</h1>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-slate-900 w-full"></div>
        <CardContent className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 mb-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-sm bg-blue-100">
              <AvatarFallback className="text-2xl font-bold text-blue-700 bg-blue-100">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">{currentUser.fullName}</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-slate-100 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </Badge>
                {currentUser.verificationStatus === 'verified' && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t("profile.verified")}</Badge>
                )}
                {currentUser.verificationStatus === 'pending' && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{t("profile.pendingApproval")}</Badge>
                )}
              </div>
            </div>
            <Button variant="outline">{t("profile.editProfile")}</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">{t("profile.contactInfo")}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{currentUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{currentUser.phone || t("profile.noPhone")}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 border-b pb-2">{t("profile.buildingDetails")}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Home className="h-4 w-4 text-slate-400" />
                  <span>
                    {currentUser.building?.name}
                    {currentUser.apartmentNumber && ` • ${t("profile.unit", { n: currentUser.apartmentNumber })}`}
                    {currentUser.floor && ` • ${t("profile.floor", { n: currentUser.floor })}`}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="capitalize">{currentUser.residentType?.replace('_', ' ') || t("profile.residentLabel")}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-100 bg-red-50/30">
        <CardHeader>
          <CardTitle className="text-red-800 text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> {t("profile.dangerZone")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">{t("profile.deleteDesc")}</p>
          <Button variant="destructive">{t("profile.deleteAccount")}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
