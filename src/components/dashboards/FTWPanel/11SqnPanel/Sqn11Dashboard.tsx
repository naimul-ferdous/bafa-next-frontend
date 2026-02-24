import type { Metadata } from "next";
import React from "react";
import { Sqn11SyllabusCard } from "./Sqn11SyllabusCard";
import { Sqn11ResultsCard } from "./Sqn11ResultsCard";
import { Sqn11AssessmentCard } from "./Sqn11AssessmentCard";

export const metadata: Metadata = {
  title: "FTW11SqnDashboard",
  description: "Bangladesh Air Force Academy - FTW11SqnDashboard",
};

export default function Sqn11Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Sqn11SyllabusCard />
      </div>
      <div>
        <Sqn11ResultsCard />
      </div>
      <div>
        <Sqn11AssessmentCard />
      </div>
    </div>
  );
}