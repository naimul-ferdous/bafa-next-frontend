import type { Metadata } from "next";
import React from "react";
import { Sqn11Card } from "./11SqnPanel/Sqn11Card";
import { Sqn12Card } from "./12SqnPanel/Sqn12Card";

export const metadata: Metadata = {
  title: "FTWDashboard",
  description: "Bangladesh Air Force Academy - FTWDashboard",
};

export default function FTWDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <div>
        <Sqn11Card />
      </div>
      <div>
        <Sqn12Card />
      </div>
    </div>
  );
}