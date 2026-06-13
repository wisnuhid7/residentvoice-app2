import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import RegisterBuilding from "@/pages/RegisterBuilding";
import RegisterResident from "@/pages/RegisterResident";
import Pricing from "@/pages/Pricing";

import ResidentDashboard from "@/pages/ResidentDashboard";
import ResidentIssues from "@/pages/ResidentIssues";
import ResidentIssueNew from "@/pages/ResidentIssueNew";
import ResidentIssueDetail from "@/pages/ResidentIssueDetail";
import ResidentResolutions from "@/pages/ResidentResolutions";
import ResidentResolutionNew from "@/pages/ResidentResolutionNew";
import ResidentResolutionDetail from "@/pages/ResidentResolutionDetail";
import ResidentAnnouncements from "@/pages/ResidentAnnouncements";
import ResidentNotifications from "@/pages/ResidentNotifications";
import Profile from "@/pages/Profile";

import AdminDashboard from "@/pages/AdminDashboard";
import AdminResidents from "@/pages/AdminResidents";
import AdminIssues from "@/pages/AdminIssues";
import AdminResolutions from "@/pages/AdminResolutions";
import AdminAnnouncements from "@/pages/AdminAnnouncements";
import AdminSettings from "@/pages/AdminSettings";

import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SuperAdminBuildings from "@/pages/SuperAdminBuildings";

const queryClient = new QueryClient();

// Protected route wrappers
function ResidentRoute({ component: Component }: { component: React.ComponentType }) {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!currentUser) return <Redirect to="/login" />;
  if (['building_admin', 'super_admin'].includes(currentUser.role)) return <Redirect to="/" />;

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!currentUser) return <Redirect to="/login" />;
  if (currentUser.role !== 'building_admin') return <Redirect to="/" />;

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function SuperAdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!currentUser) return <Redirect to="/login" />;
  if (currentUser.role !== 'super_admin') return <Redirect to="/" />;

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <PublicLayout><Landing /></PublicLayout>
      </Route>
      <Route path="/login">
        <PublicLayout><Login /></PublicLayout>
      </Route>
      <Route path="/register-building">
        <PublicLayout><RegisterBuilding /></PublicLayout>
      </Route>
      <Route path="/register/:buildingSlug">
        <PublicLayout><RegisterResident /></PublicLayout>
      </Route>
      <Route path="/pricing">
        <PublicLayout><Pricing /></PublicLayout>
      </Route>
      
      {/* Shared routes */}
      <Route path="/profile">
        <DashboardLayout><Profile /></DashboardLayout>
      </Route>

      {/* Resident routes */}
      <Route path="/b/:slug">
        <ResidentRoute component={ResidentDashboard} />
      </Route>
      <Route path="/b/:slug/issues">
        <ResidentRoute component={ResidentIssues} />
      </Route>
      <Route path="/b/:slug/issues/new">
        <ResidentRoute component={ResidentIssueNew} />
      </Route>
      <Route path="/b/:slug/issues/:id">
        <ResidentRoute component={ResidentIssueDetail} />
      </Route>
      <Route path="/b/:slug/resolutions">
        <ResidentRoute component={ResidentResolutions} />
      </Route>
      <Route path="/b/:slug/resolutions/new">
        <ResidentRoute component={ResidentResolutionNew} />
      </Route>
      <Route path="/b/:slug/resolutions/:id">
        <ResidentRoute component={ResidentResolutionDetail} />
      </Route>
      <Route path="/b/:slug/announcements">
        <ResidentRoute component={ResidentAnnouncements} />
      </Route>
      <Route path="/b/:slug/notifications">
        <ResidentRoute component={ResidentNotifications} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <AdminRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/residents">
        <AdminRoute component={AdminResidents} />
      </Route>
      <Route path="/admin/issues">
        <AdminRoute component={AdminIssues} />
      </Route>
      <Route path="/admin/resolutions">
        <AdminRoute component={AdminResolutions} />
      </Route>
      <Route path="/admin/announcements">
        <AdminRoute component={AdminAnnouncements} />
      </Route>
      <Route path="/admin/settings">
        <AdminRoute component={AdminSettings} />
      </Route>

      {/* Super admin routes */}
      <Route path="/superadmin">
        <SuperAdminRoute component={SuperAdminDashboard} />
      </Route>
      <Route path="/superadmin/buildings">
        <SuperAdminRoute component={SuperAdminBuildings} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
