/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

import { ATWDashboardView } from "./atw/page";
import { CTWDashboardView } from "./ctw/page";
import { FTWDashboardView } from "./ftw/page";
import { CPTCDashboardView } from "./cptc/page";
import MainDashboard from "./Maindashboard";
import { Sqn11DashboardView } from "./ftw/11sqn/page";
import { Sqn12DashboardView } from "./ftw/12sqn/page";

const getUserWing = (user: any): string | null => {
  if (!user) return null;
  const assignments = user.role_assignments || user.roleAssignments || [];
  for (const a of assignments) {
    if (a.wing?.code) return a.wing.code.toUpperCase();
    if (a.wing?.name) {
      const n = a.wing.name.toUpperCase();
      if (n.includes("ATW") || n.includes("ACADEMIC")) return "ATW";
      if (n.includes("CTW") || n.includes("CENTRAL TRAINING")) return "CTW";
      if (n.includes("FTW") || n.includes("FLYING")) return "FTW";
      if (n.includes("CPTC") || n.includes("PHYSICAL")) return "CPTC";
    }
  }
  return null;
};

const getUserSubwing = (user: any): string | null => {
  if (!user) return null;
  const assignments = user.role_assignments || user.roleAssignments || [];
  for (const a of assignments) {
    if (a.squadron?.code) return a.squadron.code.toLowerCase();
    if (a.squadron?.name) {
      const n = a.squadron.name.toUpperCase();
      if (n.includes("11")) return "11sqn";
      if (n.includes("12")) return "12sqn";
    }
  }
  return null;
};

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  const wing = getUserWing(user);
  const subwing = getUserSubwing(user);

  const renderDashboard = () => {
    if (wing === "ATW") return <ATWDashboardView />;
    if (wing === "CTW") return <CTWDashboardView />;
    if (wing === "FTW") {
      if (subwing === "11sqn") return <Sqn11DashboardView />;
      if (subwing === "12sqn") return <Sqn12DashboardView />;
      return <FTWDashboardView />;
    }
    if (wing === "CPTC") return <CPTCDashboardView />;
    return <MainDashboard />;
  };

  return <div className="mx-auto">{renderDashboard()}</div>;
}