/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@iconify/react";

import { ATWDashboardView } from "./atw/page";
import { CTWDashboardView } from "./ctw/page";
import { FTWDashboardView } from "./ftw/page";
import { CPTCDashboardView } from "./cptc/page";
import MainDashboard from "./Maindashboard";
import { Sqn11DashboardView } from "./ftw/11sqn/page";
import { Sqn12DashboardView } from "./ftw/12sqn/page";

const getUserWings = (user: any): string[] => {
  if (!user) return [];
  
  const assignments = [
    ...(user.role_assignments || []),
    ...(user.roleAssignments || []),
    ...(user.assign_wings || [])
  ];

  const wings = new Set<string>();

  for (const a of assignments) {
    if (a.wing?.code) {
      wings.add(a.wing.code.toUpperCase());
    } else if (a.wing?.name) {
      const n = a.wing.name.toUpperCase();
      if (n.includes("ATW") || n.includes("ACADEMIC")) wings.add("ATW");
      else if (n.includes("CTW") || n.includes("CENTRAL TRAINING")) wings.add("CTW");
      else if (n.includes("FTW") || n.includes("FLYING")) wings.add("FTW");
      else if (n.includes("CPTC") || n.includes("PHYSICAL")) wings.add("CPTC");
    }
  }
  
  return Array.from(wings);
};

const getUserSubwings = (user: any, activeWing: string): string[] => {
  if (!user || !activeWing) return [];

  const assignments = [
    ...(user.role_assignments || []),
    ...(user.roleAssignments || []),
    ...(user.assign_wings || [])
  ];

  const subwings = new Set<string>();

  for (const a of assignments) {
    const wingCode = a.wing?.code?.toUpperCase() || "";
    const wingName = a.wing?.name?.toUpperCase() || "";
    
    // Only grab subwings belonging to the currently active wing
    if (wingCode === activeWing || wingName.includes(activeWing) || (activeWing === "FTW" && wingName.includes("FLYING"))) {
      const subwing = a.squadron || a.sub_wing || a.subwing;
      
      if (subwing?.code) {
        subwings.add(subwing.code.toLowerCase());
      } else if (subwing?.name) {
        const n = subwing.name.toUpperCase();
        if (n.includes("11")) subwings.add("11sqn");
        else if (n.includes("12")) subwings.add("12sqn");
      }
    }
  }
  
  return Array.from(subwings);
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [activeWing, setActiveWing] = useState<string | null>(null);
  const [activeSubwing, setActiveSubwing] = useState<string | null>(null);

  const wings = getUserWings(user);

  useEffect(() => {
    if (user && !activeWing && wings.length > 0) {
      setActiveWing(wings[0]);
    }
  }, [user, activeWing, wings]);

  useEffect(() => {
    if (user && activeWing) {
      const subwings = getUserSubwings(user, activeWing);
      if (subwings.length > 0) {
        // If the current subwing is not in the list for this wing, switch it
        if (!activeSubwing || !subwings.includes(activeSubwing)) {
          setActiveSubwing(subwings[0]);
        }
      } else {
        setActiveSubwing(null);
      }
    }
  }, [user, activeWing, activeSubwing]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  // Check if any of the assigned wings are in "pending" status
  const hasPendingInstructorWings = user?.assign_wings?.some((aw: any) => aw.status === "pending") ?? false;

  const renderDashboard = () => {
    if (hasPendingInstructorWings) {
      const pendingWing = user?.assign_wings?.find((aw: any) => aw.status === "pending");
      const wingCode = pendingWing?.wing?.code?.toUpperCase() || "Account";
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Icon icon="hugeicons:time-quarter-pass" className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{wingCode} Panel Pending</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Your instructor wing assignment is currently pending admin approval. You will gain access to your dashboard and specific modules once your assignment has been reviewed and approved.
          </p>
        </div>
      );
    }

    if (!activeWing && wings.length === 0) return <MainDashboard />;

    if (activeWing === "ATW") return <ATWDashboardView />;
    if (activeWing === "CTW") return <CTWDashboardView />;
    if (activeWing === "FTW") {
      if (activeSubwing === "11sqn") return <Sqn11DashboardView />;
      if (activeSubwing === "12sqn") return <Sqn12DashboardView />;
      return <FTWDashboardView />;
    }
    if (activeWing === "CPTC") return <CPTCDashboardView />;
    
    return <MainDashboard />;
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Multiple Wings Tab Selector */}
      {wings.length > 1 && !hasPendingInstructorWings && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2 flex flex-wrap gap-2 shadow-sm">
          {wings.map((w) => (
            <button
              key={w}
              onClick={() => setActiveWing(w)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeWing === w
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              }`}
            >
              {w} Dashboard
            </button>
          ))}
        </div>
      )}

      {/* Multiple Subwings Tab Selector (Specifically useful for FTW 11sqn / 12sqn) */}
      {activeWing && getUserSubwings(user, activeWing).length > 1 && !hasPendingInstructorWings && (
        <div className="flex flex-wrap gap-2 mb-4">
          {getUserSubwings(user, activeWing).map((sw) => (
            <button
              key={sw}
              onClick={() => setActiveSubwing(sw)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeSubwing === sw
                  ? "bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
              }`}
            >
              {sw.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div className="animate-in fade-in duration-300">
        {renderDashboard()}
      </div>
    </div>
  );
}