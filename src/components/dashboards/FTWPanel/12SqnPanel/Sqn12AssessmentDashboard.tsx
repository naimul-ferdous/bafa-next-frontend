import type { Metadata } from "next";
import React from "react";
import { PenpictureCard } from "./PenpictureCard";
import { CounselingCard } from "./CounselingCard";
import { OLQAssessmentCard } from "./OLQAssessmentCard";

export const metadata: Metadata = {
  title: "FTW12SqnDashboard",
  description: "Bangladesh Air Force Academy - FTW12SqnDashboard",
};

export default function Sqn12AssessmentDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <PenpictureCard />
      </div>
      <div>
        <CounselingCard />
      </div>
      <div>
        <OLQAssessmentCard />
      </div>
    </div>
  );
}