"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

interface DashboardCardProps {
  title: string;
  subtitle: string;
  icon: string;
  href: string;
}

const DashboardCard = ({ title, subtitle, icon, href }: DashboardCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 h-full relative overflow-hidden flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div>
          <div className="border-[3px] border-gray-400 p-4 rounded-full">
            <Icon icon={icon} className="w-10 h-10 text-gray-700" />
          </div>
        </div>
        <div className="w-full text-center">
          <p className="text-2xl text-dark font-bold">{title}</p>
          <p className="font-bold text-sm text-gray-500">{subtitle}</p>
          <div className="flex justify-center">
            <Link href={href} className="mt-3 flex justify-center gap-1 text-primary font-bold">
              <span>View</span>
              <Icon icon="hugeicons:arrow-right-02" className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ATWAssessmentsPage() {
  const cards = [
    {
      title: "OLQ Assessment",
      subtitle: "Officer Like Qualities",
      icon: "hugeicons:star",
      href: "/atw/assessments/olq/results",
    },
    {
      title: "Counseling",
      subtitle: "Cadet counseling records",
      icon: "hugeicons:user-multiple",
      href: "/atw/assessments/counseling/results",
    },
    {
      title: "Pen Picture",
      subtitle: "Character assessments",
      icon: "hugeicons:edit-02",
      href: "/atw/assessments/penpicture/results",
    },
    {
      title: "Cadet Warnings",
      subtitle: "Warning management",
      icon: "hugeicons:alert-02",
      href: "/atw/assessments/warnings",
    },
    {
      title: "Subjects",
      subtitle: "Academic subjects",
      icon: "hugeicons:book-02",
      href: "/atw/subjects",
    },
    {
      title: "Results",
      subtitle: "Exam results",
      icon: "hugeicons:notebook",
      href: "/atw/results",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="border-[3px] border-blue-500 p-3 rounded-full">
          <Icon icon="hugeicons:book-open-01" className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Training Wing</h1>
          <p className="text-gray-500">ATW Dashboard</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <DashboardCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
}
