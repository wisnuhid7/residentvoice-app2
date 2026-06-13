import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import type { UserWithBuilding } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  currentUser: UserWithBuilding | null | undefined;
  buildingId: number | null;
  isLoading: boolean;
  logout: () => void;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: currentUser, isLoading, refetch } = useGetMe({
    query: {
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });
  const [_, setLocation] = useLocation();
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        refetch();
        setLocation("/");
      }
    }
  });

  const buildingId = currentUser?.buildingId ?? null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        buildingId,
        isLoading,
        logout: () => logoutMutation.mutate(),
        isLoggingOut: logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
