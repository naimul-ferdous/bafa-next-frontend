import type { Metadata } from "next";
import React from "react";
import { Sqn12SyllabusCard } from "./Sqn12SyllabusCard";
import { Sqn12ResultsCard } from "./Sqn12ResultsCard";
import { Sqn12AssessmentCard } from "./Sqn12AssessmentCard";

export const metadata: Metadata = {
  title: "FTW12SqnDashboard",
  description: "Bangladesh Air Force Academy - FTW12SqnDashboard",
};

export default function Sqn12Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Sqn12SyllabusCard />
      </div>
      <div>
        <Sqn12ResultsCard />
      </div>
      <div>
        <Sqn12AssessmentCard />
      </div>
    </div>
  );
}