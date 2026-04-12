/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DataTable, { Column } from "@/components/ui/DataTable";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { useCan } from "@/context/PagePermissionsContext";
import type { AtwAdminStats } from "@/libs/services/atwDashboardService";
import type { AtwInstructorStats, AtwInstructorSubjectProgress } from "@/libs/services/atwInstructorStatsService";
import type { CombinedViewShortData } from "@/libs/services/atwCombinedViewShortService";
import activityLogService, { ActivityLogEntry } from "@/libs/services/activityLogService";
import atwDashboardPageService, { AuthoritySubjectStatus, AuthoritySubjectRow } from "@/libs/services/atwDashboardPageService";
import type { AtwInstructorAssignSubject } from "@/libs/types/user";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/60 rounded-2xl ${className ?? ""}`} />
);

// ─── Top Stat Card ────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: string;
  iconBg: string;   // gradient classes e.g. "from-blue-500 to-indigo-600"
  title: string;
  value: string | number;
  trend: number;
  trendUp: boolean;
  isModule?: boolean;
  subtitle?: string;
  description?: string;
  bgImage: string;
  href?: string;
}

const StatCard = ({ icon, iconBg, title, value, trend, trendUp, bgImage, isModule = false, description, subtitle, href }: StatCardProps) => {
  const inner = (
  <div className={`group relative bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm p-5 sm:p-6 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1 overflow-hidden ${href ? 'cursor-pointer' : ''} ${isModule ? 'min-h-[140px] sm:min-h-[140px]' : 'min-h-[150px] sm:min-h-[170px]'}`}>
    <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none transition-transform duration-700 group-hover:scale-110">
      <Image src={`/images/bg/${bgImage}`} alt="" fill className="object-cover object-right" priority />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
    </div>
    <div className="relative z-10">
      <div className="absolute top-0 right-0 flex items-center justify-between mb-4">
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transform transition-transform duration-500`}>
          <Icon icon={icon} className="w-11 h-11 sm:w-12 sm:h-12 text-gray-300" />
        </div>
      </div>
      <div className="text-sm uppercase font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">{title}</div>
      {subtitle && (
        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{subtitle}</div>
      )}
      {isModule && description && (
        <div className="text-xs text-slate-400 mt-1 leading-snug line-clamp-2">{description}</div>
      )}
      {!isModule && (
        <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">{value}</div>
      )}
    </div>
    {!isModule ? (
      <div className="relative z-10 flex items-center gap-2 text-xs mt-3">
        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          <Icon icon={trendUp ? "hugeicons:arrow-up-01" : "hugeicons:arrow-down-01"} className="w-3 h-3" />
          {Math.abs(trend).toFixed(1)}%
        </span>
        <span className="text-slate-400 font-medium">From the Last month:</span>
        {href && <span className="ml-auto text-blue-400 font-semibold flex items-center gap-0.5">View <Icon icon="hugeicons:arrow-right-01" className="w-3 h-3" /></span>}
      </div>
    ) : (
      <div className="relative z-10 flex items-center gap-2 text-xs mt-3">
        <span className="text-blue-500 font-semibold flex items-center gap-1">
          Enter Module <Icon icon="hugeicons:arrow-right-01" className="w-3 h-3" />
        </span>
      </div>
    )}

  </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
};

// ─── Bar Chart — Assessment Insights ─────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const _now = new Date();
const curMonth = _now.getMonth();
const curYear = _now.getFullYear();
const curDay = _now.getDate(); // today's day-of-month (1-based)
const daysInCurMonth = new Date(curYear, curMonth + 1, 0).getDate();

// Yearly: months up to current get demo data, future months get null (no bar)
const buildYearlyData = (total: number): (number | null)[] => {
  const base = [0.40, 0.50, 0.55, 0.60, 0.65, 0.70, 0.90, 0.75, 0.80, 0.85, 0.88, 0.95];
  return base.map((f, i) => {
    if (i > curMonth) return null;
    if (i === curMonth) return Math.max(total, 1);
    return Math.round(Math.max(total, 10) * f * (0.7 + Math.random() * 0.3));
  });
};

// Daily: days up to today get demo data, future days get null (no bar)
const buildDailyData = (total: number): (number | null)[] => {
  const perDay = Math.max(Math.round(total / Math.max(curDay, 1)), 1);
  return Array.from({ length: daysInCurMonth }, (_, i) => {
    const day = i + 1;
    if (day > curDay) return null;
    if (day === curDay) return Math.max(total - perDay * (curDay - 1), 1);
    return Math.round(perDay * (0.6 + Math.random() * 0.8));
  });
};

interface InsightsChartProps {
  data: (number | null)[];
  view: "daily" | "monthly" | "yearly";
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const period = i < 12 ? "AM" : "PM";
  const h = i % 12 === 0 ? 12 : i % 12;
  return `${String(h).padStart(2, "0")}:00${period}`;
});
const curHour = new Date().getHours();

const InsightsChart = ({ data, view }: InsightsChartProps) => {
  const isMonthly = view === "monthly";
  const isDaily = view === "daily";

  // Highlight: daily→current hour, monthly→today, yearly→current month
  const highlightIdx = isDaily ? curHour : isMonthly ? curDay - 1 : curMonth;
  const colors = data.map((_, i) => (i === highlightIdx ? "#3b82f6" : "#e2e8f0"));

  // X-axis labels
  const dayLabels = Array.from({ length: daysInCurMonth }, (_, i) => `${i + 1}`);
  const categories = isDaily ? HOURS : isMonthly ? dayLabels : MONTHS;

  // Label formatter
  const labelFormatter = isDaily
    ? (val: string) => val
    : isMonthly
      ? (val: string) => val
      : (val: string) => val;

  const options: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit", animations: { speed: 400 } },
    plotOptions: {
      bar: {
        columnWidth: isDaily ? "60%" : isMonthly ? "70%" : "55%",
        borderRadius: isDaily ? 2 : isMonthly ? 3 : 6,
        distributed: true,
      },
    },
    colors,
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: isDaily || isMonthly ? "9px" : "10px", colors: "#94a3b8", fontWeight: "600" },
        formatter: labelFormatter,
        rotate: isDaily ? -45 : 0,
        rotateAlways: isDaily,
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#94a3b8" },
        formatter: (v) => `${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`,
      },
    },
    grid: { borderColor: "#f1f5f9", strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    tooltip: {
      y: { formatter: (v) => `${v} actions` },
      marker: { show: false },
    },
    states: { hover: { filter: { type: "none" } } },
  };

  return (
    <ReactApexChart
      options={options}
      series={[{ name: "Actions", data }]}
      type="bar"
      height={220}
    />
  );
};

// ─── Gauge Chart — Approval Overview ─────────────────────────────────────────
interface GaugeChartProps {
  rate: number;         // 0–100
  approved: number;
  total: number;
}

const GaugeChart = ({ rate, approved, total }: GaugeChartProps) => {
  const options: ApexOptions = {
    chart: { type: "radialBar", fontFamily: "inherit", sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: "60%" },
        track: { background: "#e2e8f0", strokeWidth: "100%" },
        dataLabels: {
          name: { offsetY: 20, fontSize: "11px", color: "#94a3b8", fontWeight: "600" },
          value: { offsetY: -15, fontSize: "26px", fontWeight: "900", color: "#1e293b", formatter: (v) => `${v.toFixed(1)}%` },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: { shade: "dark", type: "horizontal", gradientToColors: ["#60a5fa"], stops: [0, 100] },
    },
    colors: ["#3b82f6"],
    labels: ["Approval Rate"],
    stroke: { lineCap: "round" },
  };

  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <ReactApexChart options={options} series={[rate]} type="radialBar" height={200} width={200} />
      <div className="w-full mt-1 space-y-3 px-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Approved</span>
          <span className="font-black text-slate-800">{approved.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Target (Total)</span>
          <span className="font-black text-slate-800">{total.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
};

// ─── 3-Segment Radial Progress Chart ─────────────────────────────────────────
interface ProgressRadialChartProps {
  approved: number;
  entered: number;
  notEntered: number;
  total: number;
}

const ProgressRadialChart = ({ approved, entered, notEntered, total }: ProgressRadialChartProps) => {
  const safe = Math.max(total, 1);
  const approvedPct = Math.min(Math.round((approved / safe) * 100), 100);
  const enteredPct = Math.min(Math.round((entered / safe) * 100), 100);
  const notEnteredPct = Math.min(Math.round((notEntered / safe) * 100), 100);

  const options: ApexOptions = {
    chart: { type: "radialBar", fontFamily: "inherit", sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: -135,
        endAngle: 135,
        hollow: { size: "45%" },
        track: { background: "#f1f5f9", strokeWidth: "100%", margin: 4 },
        dataLabels: {
          name: { fontSize: "10px", color: "#94a3b8", fontWeight: "600", offsetY: 5 },
          value: { show: false },
          total: {
            show: true,
            label: "Assigned",
            fontSize: "10px",
            fontWeight: "600",
            color: "#94a3b8",
            formatter: () => String(total),
          },
        },
      },
    },
    colors: ["#10b981", "#f59e0b", "#cbd5e1"],
    labels: ["Approved", "Entered", "Not Entered"],
    stroke: { lineCap: "round" },
    legend: { show: false },
  };

  return (
    <div className="flex flex-col items-center">
      <ReactApexChart options={options} series={[approvedPct, enteredPct, notEnteredPct]} type="radialBar" height={220} width={220} />
      <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 mt-1">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div className="text-xl font-black text-emerald-600 leading-none">{approved}</div>
          <div className="text-[10px] text-slate-400 font-medium">Approved</div>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="text-xl font-black text-amber-500 leading-none">{entered}</div>
          <div className="text-[10px] text-slate-400 font-medium">Entered</div>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="text-xl font-black text-slate-400 leading-none">{notEntered}</div>
          <div className="text-[10px] text-slate-400 font-medium">Not Entered</div>
        </div>
      </div>
    </div>
  );
};

// ─── Donut Progress Chart ─────────────────────────────────────────────────────
interface DonutProgressChartProps {
  approved: number;
  entered: number;
  notEntered: number;
  total: number;
  // optional 4-segment mode (authority view)
  waiting?: number;
  pending?: number;
}

const DonutProgressChart = ({ approved, entered, notEntered, total, waiting, pending }: DonutProgressChartProps) => {
  const fourSegment = waiting !== undefined && pending !== undefined;

  const series = fourSegment
    ? [approved, pending!, waiting!, notEntered]
    : [approved, entered, notEntered];

  const labels = fourSegment
    ? ["Approved", "Pending", "Waiting", "Not Entered"]
    : ["Approved", "Entered", "Not Entered"];

  const colors = fourSegment
    ? ["#10b981", "#3b82f6", "#f59e0b", "#fca5a5"]
    : ["#10b981", "#f59e0b", "#fca5a5"];

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit", sparkline: { enabled: false } },
    labels,
    colors,
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { width: 2, colors: ["#fff"] },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              fontSize: "11px",
              fontWeight: "600",
              color: "#94a3b8",
              formatter: () => String(total),
            },
            value: { fontSize: "22px", fontWeight: "900", color: "#1e293b", offsetY: 4 },
            name: { fontSize: "11px", fontWeight: "600", color: "#94a3b8", offsetY: -4 },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => `${v} subject(s)` } },
  };

  return (
    <div className="flex flex-col items-center">
      <ReactApexChart options={options} series={series} type="donut" height={200} width={200} />
      {fourSegment ? (
        <div className="w-full grid grid-cols-4 gap-2 border-t border-slate-100 pt-3 mt-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-xl font-black text-emerald-600 leading-none">{approved}</div>
            <div className="text-[10px] text-slate-400 font-medium">Approved</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <div className="text-xl font-black text-blue-600 leading-none">{pending}</div>
            <div className="text-[10px] text-slate-400 font-medium">Pending</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="text-xl font-black text-amber-500 leading-none">{waiting}</div>
            <div className="text-[10px] text-slate-400 font-medium">Waiting</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="text-xl font-black text-slate-500 leading-none">{notEntered}</div>
            <div className="text-[10px] text-slate-400 font-medium">Not Entered</div>
          </div>
        </div>
      ) : (
        <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 mt-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-xl font-black text-emerald-600 leading-none">{approved}</div>
            <div className="text-[10px] text-slate-400 font-medium">Approved</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="text-xl font-black text-amber-500 leading-none">{entered}</div>
            <div className="text-[10px] text-slate-400 font-medium">Entered</div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="text-xl font-black text-slate-500 leading-none">{notEntered}</div>
            <div className="text-[10px] text-slate-400 font-medium">Not Entered</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Status Card (exact design from user spec) ───────────────────────────────
interface StatusCardProps {
  title: string;
  subtitle: string;
  description?: string;
  href: string;
  icon: string;
  accentColor: string;
  bgImage: string;
}

// ─── All ATW module cards config ──────────────────────────────────────────────
const ALL_MODULE_CARDS: (StatusCardProps & { href: string })[] = [
  { title: "Subjects", subtitle: "Academic Setup", description: "Manage academic subjects and their configurations.", href: "/atw/subjects", icon: "hugeicons:book-02", accentColor: "from-blue-500 to-indigo-600", bgImage: "corner-1.png" },
  { title: "Subject Modules", subtitle: "Module Config", description: "Configure modules and units within each subject.", href: "/atw/subjects/modules", icon: "hugeicons:layers-01", accentColor: "from-indigo-500 to-violet-600", bgImage: "corner-2.png" },
  { title: "Marksheets", subtitle: "Mark Schema", description: "Define mark schemas, grading criteria and weights.", href: "/atw/subjects/modules/marksheets", icon: "hugeicons:notebook", accentColor: "from-violet-500 to-purple-700", bgImage: "corner-4.png" },
  // { title: "Result Entry",       subtitle: "Exam Results",      description: "Enter and manage cadet exam results.",                      href: "/atw/results",                               icon: "hugeicons:chart-bar-line", accentColor: "from-emerald-500 to-teal-600",  bgImage: "corner-5.png" },
  { title: "OLQ Assessment", subtitle: "Officer Qualities", description: "Record and review officer-like qualities for cadets.", href: "/atw/assessments/olq/results", icon: "hugeicons:star", accentColor: "from-amber-400 to-orange-500", bgImage: "corner-1.png" },
  { title: "Counseling", subtitle: "Cadet Support", description: "Log and track cadet counseling sessions.", href: "/atw/assessments/counselings/results", icon: "hugeicons:user-multiple", accentColor: "from-sky-500 to-blue-600", bgImage: "corner-2.png" },
  { title: "Pen Picture", subtitle: "Character Logs", description: "Document character assessments and behaviour records.", href: "/atw/assessments/penpicture/results", icon: "hugeicons:edit-02", accentColor: "from-rose-500 to-pink-600", bgImage: "corner-4.png" },
  { title: "Warnings", subtitle: "Cadet Warnings", description: "Issue, review and track formal cadet warnings.", href: "/atw/assessments/warnings", icon: "hugeicons:alert-02", accentColor: "from-red-500 to-rose-600", bgImage: "corner-5.png" },
  { title: "Medical Disposal", subtitle: "Health Evaluation", description: "Record health evaluations and medical disposal outcomes.", href: "/atw/assessments/medical-disposal/disposal", icon: "hugeicons:stethoscope", accentColor: "from-teal-500 to-cyan-600", bgImage: "corner-1.png" },
  { title: "Instructor Detailment", subtitle: "Detailment Board", description: "Manage and assign instructor detailment schedules.", href: "/atw/instructor-detailment", icon: "hugeicons:teacher", accentColor: "from-slate-500 to-slate-700", bgImage: "corner-2.png" },
  { title: "Universities", subtitle: "Departments", description: "Manage university departments and their affiliations.", href: "/atw/universities-departments", icon: "hugeicons:mortarboard-01", accentColor: "from-cyan-500 to-sky-600", bgImage: "corner-4.png" },
  { title: "Approval Authorities", subtitle: "Approval Setup", description: "Configure authorities and approval workflows.", href: "/atw/results/authorities", icon: "hugeicons:shield-user", accentColor: "from-slate-600 to-slate-800", bgImage: "corner-5.png" },
];

const ModulesGrid = ({ hasAccess, isInstructor }: { hasAccess: (h: string) => boolean; isInstructor: boolean }) => {
  const cards = ALL_MODULE_CARDS.filter((c) => c.href && hasAccess(c.href));
  return (
    <div>
      <div className={`grid grid-cols-1 ${!isInstructor ? "xl:grid-cols-4" : ""} gap-4 items-start`}>
        {cards.map((card) => (
          <StatCard iconBg={""} value={""} trend={0} trendUp={false} isModule={true} key={card.href} {...card} />
        ))}
      </div>
    </div>
  );
};


// ─── Latest Activity demo data ────────────────────────────────────────────────
interface ActivityRow {
  type: string;
  icon: string;
  iconColor: string;
  description: string;
  time: string;
  status: "success" | "pending" | "rejected";
}

const DEMO_ACTIVITIES: ActivityRow[] = [
  { type: "Result", icon: "hugeicons:chart-bar-line", iconColor: "text-emerald-500", description: "Result entry submitted", time: "2 min ago", status: "success" },
  { type: "Approval", icon: "hugeicons:shield-user", iconColor: "text-blue-500", description: "Approval request raised", time: "15 min ago", status: "pending" },
  { type: "OLQ", icon: "hugeicons:star", iconColor: "text-amber-500", description: "OLQ assessment recorded", time: "1 hr ago", status: "success" },
  { type: "Warning", icon: "hugeicons:alert-02", iconColor: "text-red-500", description: "Cadet warning issued", time: "2 hr ago", status: "rejected" },
  { type: "Counseling", icon: "hugeicons:user-multiple", iconColor: "text-sky-500", description: "Counseling session logged", time: "3 hr ago", status: "success" },
  { type: "Medical", icon: "hugeicons:stethoscope", iconColor: "text-teal-500", description: "Medical disposal recorded", time: "5 hr ago", status: "success" },
  { type: "Approval", icon: "hugeicons:shield-user", iconColor: "text-blue-500", description: "Mark approval rejected", time: "6 hr ago", status: "rejected" },
  { type: "Pen Picture", icon: "hugeicons:edit-02", iconColor: "text-rose-500", description: "Pen picture assessment added", time: "Yesterday", status: "success" },
];

const STATUS_BADGE: Record<ActivityRow["status"], string> = {
  success: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  rejected: "bg-red-50 text-red-500",
};

const ACTIVITY_COLUMNS: Column<ActivityRow>[] = [
  {
    key: "type",
    header: "Type",
    render: (row) => (
      <div className="flex items-center gap-2">
        <Icon icon={row.icon} className={`w-4 h-4 shrink-0 ${row.iconColor}`} />
        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{row.type}</span>
      </div>
    ),
  },
  {
    key: "description",
    header: "Activity",
    render: (row) => <span className="text-xs text-slate-500">{row.description}</span>,
  },
  {
    key: "status",
    header: "Status",
    headerAlign: "center",
    render: (row) => (
      <div className="flex justify-center">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_BADGE[row.status]}`}>
          {row.status}
        </span>
      </div>
    ),
  },
  {
    key: "time",
    header: "Time",
    headerAlign: "right",
    render: (row) => <span className="text-[10px] text-slate-400 whitespace-nowrap float-right">{row.time}</span>,
  },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function ATWDashboardView() {
  const { user, menus, userIsSuperAdmin, userIsSystemAdmin, userIsInstructor } = useAuth();
  const isAdmin = userIsSuperAdmin || userIsSystemAdmin;
  const canOlq = useCan("/atw/assessments/olq/results");
  const canCounseling = useCan("/atw/assessments/counselings/results");
  const canResults = useCan("/atw/results");

  const [adminStats, setAdminStats] = useState<AtwAdminStats | null>(null);
  const [instructorStats, setInstructorStats] = useState<AtwInstructorStats | null>(null);
  const [subjectProgress, setSubjectProgress] = useState<AtwInstructorSubjectProgress | null>(null);
  const [combinedShort, setCombinedShort] = useState<CombinedViewShortData | null>(null);
  const [olqCombinedShort, setOlqCombinedShort] = useState<CombinedViewShortData | null>(null);
  const [counselingCombinedShort, setCounselingCombinedShort] = useState<CombinedViewShortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadSuccess, setLoadSuccess] = useState(false);
  const [chartView, setChartView] = useState<"daily" | "monthly" | "yearly">("yearly");
  const [chartData, setChartData] = useState<(number | null)[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<AtwInstructorAssignSubject[]>([]);
  const [authorityStatus, setAuthorityStatus] = useState<AuthoritySubjectStatus | null>(null);
  const [authorityFilter, setAuthorityFilter] = useState<'all' | 'not_entered' | 'waiting' | 'pending' | 'approved'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await atwDashboardPageService.get({
          chartView,
          userId: user?.id,
          isInstructor: userIsInstructor && !isAdmin,
        });
        if (!cancelled) {
          setChartData(data.chart_data);
          setRecentActivity(data.recent_activity);
          if (data.admin_stats) setAdminStats(data.admin_stats);
          if (data.combined_short) setCombinedShort(data.combined_short);
          if (data.olq_combined_short) setOlqCombinedShort(data.olq_combined_short);
          if (data.counseling_combined_short) setCounselingCombinedShort(data.counseling_combined_short);
          if (data.instructor_stats) setInstructorStats(data.instructor_stats);
          if (data.subject_progress) setSubjectProgress(data.subject_progress);
          if (data.assigned_subjects) setAssignedSubjects(data.assigned_subjects);
          if (data.authority_subject_status) setAuthorityStatus(data.authority_subject_status);
          setLoadSuccess(true);
          setTimeout(() => setLoadSuccess(false), 3000);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAdmin, userIsInstructor, user?.id]);

  // Reload chart when view changes
  useEffect(() => {
    activityLogService.getChartData(chartView).then(setChartData).catch(() => { });
  }, [chartView]);

  const accessibleRoutes = new Set<string>();
  const collect = (list: any[]) => {
    for (const m of list) {
      if (m.route) accessibleRoutes.add(m.route.replace(/\/+$/, ""));
      if (m.children?.length) collect(m.children);
    }
  };
  collect(menus);
  const hasAccess = (href: string) => menus.length === 0 || accessibleRoutes.has(href.replace(/\/+$/, ""));

  // Greeting
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return { text: "Good Morning", icon: "hugeicons:sun-03", color: "text-amber-500" };
    if (h >= 12 && h < 17) return { text: "Good Afternoon", icon: "hugeicons:sun-01", color: "text-orange-500" };
    if (h >= 17 && h < 21) return { text: "Good Evening", icon: "hugeicons:sunset", color: "text-indigo-500" };
    return { text: "Good Night", icon: "hugeicons:owl", color: "text-violet-500" };
  };
  const greeting = getGreeting();

  // Result approval table grouping
  const cvRows = combinedShort?.rows ?? [];
  const olqCvRows = olqCombinedShort?.rows ?? [];
  const counselingCvRows = counselingCombinedShort?.rows ?? [];

  interface CvGroup { courseKey: string; semKey: string; course_name: string; semester_name: string; rows: typeof cvRows }
  const cvGroups: CvGroup[] = [];
  cvRows.forEach((row) => {
    const cKey = String(row.course_id);
    const sKey = `${row.course_id}-${row.semester_id}`;
    let g = cvGroups.find(x => x.semKey === sKey);
    if (!g) { g = { courseKey: cKey, semKey: sKey, course_name: row.course_name, semester_name: row.semester_name, rows: [] }; cvGroups.push(g); }
    g.rows.push(row);
  });
  const cvCourseSpan: Record<string, number> = {};
  cvGroups.forEach(g => { cvCourseSpan[g.courseKey] = (cvCourseSpan[g.courseKey] ?? 0) + g.rows.length; });
  const STATUS_CFG: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-600", forwarded: "bg-blue-50 text-blue-600",
    pending: "bg-amber-50 text-amber-600", rejected: "bg-red-50 text-red-500",
    backwarded: "bg-orange-50 text-orange-600",
    not_reached: "bg-slate-100 text-slate-400",
  };
  const STATUS_LABEL: Record<string, string> = {
    approved: "Approved", forwarded: "Forwarded", pending: "Pending", rejected: "Rejected", 
    backwarded: "Backwarded", not_reached: "Waiting",
  };

  // Derived
  const approvalTotal = adminStats?.approvals.total ?? 0;
  const approvalApproved = adminStats?.approvals.approved ?? 0;
  const approvalPending = adminStats?.approvals.pending ?? 0;
  const approvalRate = approvalTotal > 0 ? (approvalApproved / approvalTotal) * 100 : 0;
  const totalAssessments = (adminStats?.assessments.olq ?? 0) + (adminStats?.assessments.counseling ?? 0) + (adminStats?.assessments.penpicture ?? 0) + (adminStats?.assessments.warnings ?? 0) + (adminStats?.assessments.medical ?? 0);

  return (
    <div className="">
      <div className="mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 p-6 sm:p-7">
            {/* Welcome text */}
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {greeting.text}, {user?.name ?? "User"}
              </h2>
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-6">
              {isAdmin
                ? "Here's your ATW system overview. Keep the training pipeline running strong!"
                : "Your progress this week looks great. Keep it up and inspire your cadets!"}
            </p>

            {/* 3 mini stat items */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-10">
              {isAdmin ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon icon="hugeicons:book-02" className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Subjects</div>
                      <div className="text-lg font-black text-teal-500 leading-none">{loading ? "—" : adminStats?.subjects ?? 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Icon icon="hugeicons:chart-bar-line" className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assessments</div>
                      <div className="text-lg font-black text-teal-500 leading-none">{loading ? "—" : totalAssessments}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Results</div>
                      <div className="text-lg font-black text-teal-500 leading-none">{loading ? "—" : adminStats?.results ?? 0}</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon icon="hugeicons:book-02" className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Subjects</div>
                      <div className="text-lg font-black text-teal-500 leading-none">{loading ? "—" : userIsInstructor ? (instructorStats?.total_subjects ?? 0) : (authorityStatus?.total_subjects ?? adminStats?.assigned_subjects ?? 0)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <Icon icon="hugeicons:user-multiple" className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cadets</div>
                      <div className="text-lg font-black text-teal-500 leading-none">{loading ? "—" : userIsInstructor ? (instructorStats?.total_cadets ?? 0) : (authorityStatus?.total_cadets ?? adminStats?.cadets_in_results ?? 0)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Icon icon="hugeicons:chart-bar-line" className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Results</div>
                      <div className="text-lg font-black text-teal-500 leading-none">
                        {loading ? "—" : userIsInstructor ? (instructorStats?.total_results ?? 0) : (
                          authorityStatus ? (
                            authorityStatus.my_authority 
                              ? `${authorityStatus.summary.approved}/${authorityStatus.total_subjects}`
                              : `${authorityStatus.total_subjects - authorityStatus.summary.not_entered}/${authorityStatus.total_subjects}`
                          ) : (adminStats?.results ?? 0)
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isAdmin && !userIsInstructor && (
        <div className="space-y-4">
          {/* ── Top 4 Stat Cards ── */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-32" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="hugeicons:book-02" iconBg="from-blue-500 to-indigo-600" bgImage="corner-1.png" title="Total Subjects" value={(authorityStatus?.total_subjects ?? 0).toLocaleString()} trend={4.9} trendUp href="/atw/subjects" />
              <StatCard icon="hugeicons:user-multiple" iconBg="from-violet-500 to-purple-700" bgImage="corner-2.png" title="Total Cadets" value={(authorityStatus?.total_cadets ?? 0).toLocaleString()} trend={2.7} trendUp href="/users/cadets" />
              <StatCard
                icon="hugeicons:layers-01"
                iconBg="from-indigo-500 to-violet-600"
                bgImage="corner-4.png"
                title="Running Courses"
                value={(authorityStatus?.total_running_courses ?? 0).toLocaleString()}
                trend={3.4}
                trendUp
                href="/atw/course"
              />
              <StatCard
                icon="hugeicons:chart-bar-line"
                iconBg="from-emerald-500 to-teal-600"
                bgImage="corner-5.png"
                title={authorityStatus?.my_authority ? "Approved Subjects" : "Inputted Subjects"}
                value={
                  authorityStatus?.my_authority
                    ? `${authorityStatus?.summary.approved ?? 0}/${authorityStatus?.total_subjects ?? 0}`
                    : `${authorityStatus ? authorityStatus.total_subjects - authorityStatus.summary.not_entered : 0}/${authorityStatus?.total_subjects ?? 0}`
                }
                trend={1.8}
                trendUp
                href="/atw/results/view"
              />
            </div>
          )}

          {/* ── Result Overview ── */}
          {(() => {
            const showRight = canOlq("view") || canCounseling("view");
            return (
              <div className={`grid grid-cols-1 ${showRight ? "lg:grid-cols-2" : ""} gap-4`}>
                {!loading && canResults("view") && cvRows.length > 0 && (
                  <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-800">Result Overview</div>
                      </div>
                      <Link href="/atw/results/view" className="text-[10px] font-semibold text-blue-500 hover:underline">View All</Link>
                    </div>
                    <div className="flex flex-col divide-y space-y-2 divide-slate-100">
                      {cvRows.map((row) => {
                        const myStatus = row.authority_statuses.find((a: any) => a.is_me)?.status ?? 'not_reached';
                        const approvedCount = row.subjects_approved ?? 0;
                        const totalCount = row.subjects_total ?? 0;
                        const pct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
                        const barColor =
                          pct === 100 ? 'bg-emerald-500' :
                            myStatus === 'rejected' ? 'bg-red-400' :
                              pct === 0 ? 'bg-slate-300' : 'bg-amber-400';

                        return (
                          <Link href={'/atw/results/view'} key={`${row.course_id}-${row.semester_id}-${row.program_id}`} className="flex justify-between items-center gap-3 py-3 px-3 border border-gray-200 rounded-xl hover:bg-slate-50/60 transition-colors">
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-800 truncate">
                                {row.changeable_program_name ?? row.program_name}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 truncate">{row.course_name} · {row.semester_name}</div>
                            </div>
                            {row.university_name && !(canOlq("view") && canCounseling("view")) && (
                              <div className="text-sm text-slate-500 truncate">{row.university_name}</div>
                            )}
                            {row.departments && row.departments.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {row.departments.map((dept, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-semibold border border-indigo-100">
                                    {dept}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="w-28 shrink-0 hidden sm:block">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-slate-600">{pct}%</span>
                                {(() => {
                                  const myAuth = row.authority_statuses.find((a: any) => a.is_me);
                                  if (myAuth) {
                                    return (
                                      <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[9px] ${STATUS_CFG[myAuth.status] ?? STATUS_CFG.not_reached}`}>
                                        {STATUS_LABEL[myAuth.status] ?? "—"}
                                      </span>
                                    );
                                  }
                                  const curStage = row.authority_statuses.find((as: any) => as.status !== 'approved');
                                  if (!curStage) return <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[9px] ${STATUS_CFG.approved}`}>Approved</span>;
                                  if (row.subjects_approved === 0 && curStage.status === 'not_reached') {
                                    return <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[9px] bg-slate-100 text-slate-400`}>Not Inputted</span>;
                                  }
                                  return (
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[8px] whitespace-nowrap ${STATUS_CFG[curStage.status] ?? STATUS_CFG.not_reached}`}>
                                      {curStage.authority_name}: {STATUS_LABEL[curStage.status] ?? curStage.status}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100">
                                <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5">{approvedCount}/{totalCount} Complete</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  {!loading && canOlq("view") && olqCvRows.length > 0 && (
                    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-slate-800">OLQ Overview</div>
                        </div>
                        <Link href="/atw/assessments/olq/results/view" className="text-[10px] font-semibold text-blue-500 hover:underline">View All</Link>
                      </div>
                      <div className="flex flex-col divide-y space-y-2 divide-slate-100">
                        {olqCvRows.map((row, index) => {
                          const myStatus = row.authority_statuses.find((a: any) => a.is_me)?.status ?? 'not_reached';
                          const approvedCount = row.authority_statuses.filter((a: any) => a.status === 'approved').length;
                          const totalCount = row.authority_statuses.length || 1;
                          const pct = Math.round((approvedCount / totalCount) * 100);
                          const barColor = pct === 100 ? 'bg-emerald-500' : myStatus === 'rejected' ? 'bg-red-400' : pct === 0 ? 'bg-slate-300' : 'bg-amber-400';
                          return (
                            <Link key={`olq-${row.course_id}-${row.semester_id}-${index}`} href={`/atw/assessments/olq/results/course/${row.course_id}/semester/${row.semester_id}`} className="flex justify-between items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-slate-50/60 transition-colors cursor-pointer">
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-800 truncate">{row.course_name}</div>
                                <div className="text-xs text-slate-400 mt-0.5 truncate">{row.semester_name}</div>
                              </div>
                              <div className="w-28 shrink-0 hidden sm:block">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold text-slate-600">{pct}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100">
                                  <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{approvedCount}/{totalCount} Complete</div>
                              </div>
                              <div>
                                {(() => {
                                  const myAuth = row.authority_statuses.find((a: any) => a.is_me);
                                  if (myAuth) {
                                    return (
                                      <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[9px] ${STATUS_CFG[myAuth.status] ?? STATUS_CFG.not_reached}`}>
                                        {STATUS_LABEL[myAuth.status] ?? "—"}
                                      </span>
                                    );
                                  }
                                  const curStage = row.authority_statuses.find((as: any) => as.status !== 'approved');
                                  if (!curStage) return <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[9px] ${STATUS_CFG.approved}`}>Approved</span>;
                                  if (row.subjects_approved === 0 && curStage.status === 'not_reached') {
                                    return <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[9px] bg-slate-100 text-slate-400`}>Not Inputted</span>;
                                  }
                                  return (
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[8px] whitespace-nowrap ${STATUS_CFG[curStage.status] ?? STATUS_CFG.not_reached}`}>
                                      {curStage.authority_name}: {STATUS_LABEL[curStage.status] ?? curStage.status}
                                    </span>
                                  );
                                })()}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!loading && canCounseling("view") && (
                    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-slate-800">Counseling Overview</div>
                        </div>
                        <Link href="/atw/assessments/counselings/results/view" className="text-[10px] font-semibold text-blue-500 hover:underline">View All</Link>
                      </div>
                      <div className="flex flex-col divide-y space-y-2 divide-slate-100">
                        {counselingCvRows.length === 0 && (
                          <div className="py-8 text-center text-sm text-slate-400 italic">No counseling results entered yet.</div>
                        )}
                        {counselingCvRows.map((row, index) => {
                          const myAuth = row.authority_statuses.find((a: any) => a.is_me);
                          const totalCadets = row.total_cadets || 0;

                          // Progress: if I have authority → my approved cadets / total cadets
                          //           else → approved authority steps / total authority steps
                          const progressNum = myAuth
                            ? (myAuth.approved_count ?? 0)
                            : row.authority_statuses.filter((a: any) => a.status === 'approved').length;
                          const progressDen = myAuth
                            ? totalCadets
                            : (row.authority_statuses.length || 1);
                          const pct = progressDen > 0 ? Math.round((progressNum / progressDen) * 100) : 0;

                          const myStatus = myAuth?.status ?? 'not_reached';
                          const barColor = pct === 100 ? 'bg-emerald-500' : myStatus === 'rejected' ? 'bg-red-400' : pct === 0 ? 'bg-slate-300' : 'bg-amber-400';

                          // Status badge
                          const curPendingStep = row.authority_statuses.find((a: any) => a.status !== 'approved');
                          const statusBadge = (() => {
                            if (myAuth) {
                              return (
                                <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[9px] ${STATUS_CFG[myAuth.status] ?? STATUS_CFG.not_reached}`}>
                                  {STATUS_LABEL[myAuth.status] ?? "—"}
                                </span>
                              );
                            }
                            if (!curPendingStep) {
                              return <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[9px] ${STATUS_CFG.approved}`}>Fully Approved</span>;
                            }
                            return (
                              <span className={`shrink-0 px-2 py-0.5 rounded-full font-bold text-[8px] whitespace-nowrap ${STATUS_CFG[curPendingStep.status] ?? STATUS_CFG.not_reached}`}>
                                {curPendingStep.authority_name}: {STATUS_LABEL[curPendingStep.status] ?? curPendingStep.status}
                              </span>
                            );
                          })();

                          return (
                            <Link key={`counseling-${row.course_id}-${row.semester_id}-${index}`} href={`/atw/assessments/counselings/results/course/${row.course_id}/semester/${row.semester_id}`} className="flex justify-between items-center border border-gray-200 gap-3 p-3 rounded-xl hover:bg-slate-50/60 transition-colors cursor-pointer">
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-slate-800 truncate">{row.course_name}</div>
                                <div className="text-xs text-slate-400 mt-0.5 truncate">{row.semester_name}</div>
                              </div>
                              <div className="w-28 shrink-0 hidden sm:block">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-bold text-slate-600">{pct}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100">
                                  <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{progressNum}/{progressDen} {myAuth ? "Approved" : "Complete"}</div>
                              </div>
                              <div>{statusBadge}</div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Main Charts Row ── */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Sk className="lg:col-span-2 h-80" />
              <Sk className="h-80" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Left — Activity Insights (bar chart) */}
              <div className="lg:col-span-2 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Activity Insights</h2>
                    <p className="text-xs text-slate-400 mt-0.5">User actions over time</p>
                  </div>
                  <div className="flex items-center bg-slate-100 rounded-full p-1">
                    <button onClick={() => setChartView("daily")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chartView === "daily" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Daily</button>
                    <button onClick={() => setChartView("monthly")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chartView === "monthly" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Monthly</button>
                    <button onClick={() => setChartView("yearly")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chartView === "yearly" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Yearly</button>
                  </div>
                </div>
                <InsightsChart data={chartData} view={chartView} />
              </div>

              {/* Right — Subject Result Overview */}
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col">
                <h2 className="text-base font-bold text-slate-800 mb-4">Subject Result Overview</h2>
                {authorityStatus ? (() => {
                  const approved = authorityStatus.summary.approved;
                  const pending = authorityStatus.summary.pending;
                  const waiting = authorityStatus.summary.waiting;
                  const notEntered = authorityStatus.summary.not_entered;
                  const total = approved + pending + waiting + notEntered;
                  return <DonutProgressChart approved={approved} entered={0} notEntered={notEntered} total={total} waiting={waiting} pending={pending} />;
                })() : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Icon icon="hugeicons:book-02" className="w-8 h-8" />
                    <p className="text-xs font-medium">No authority assigned.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Bottom: Modules ── */}
          {loading ? <Sk className="h-64" /> : (
            <div className="gap-4 items-start">
              <div className="xl:col-span-2">
                <ModulesGrid hasAccess={hasAccess} isInstructor={userIsInstructor} />
              </div>
            </div>
          )}
        </div>
      )}

      {!isAdmin && userIsInstructor && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-32" />)}
            </div>
          ) : userIsInstructor ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="hugeicons:book-02" iconBg="from-blue-500 to-indigo-600" bgImage="corner-1.png" title="Total Subjects" value={instructorStats?.total_subjects ?? 0} trend={4.9} trendUp href="/atw/subjects" />
              <StatCard icon="hugeicons:layers-01" iconBg="from-indigo-500 to-violet-600" bgImage="corner-2.png" title="Courses" value={instructorStats?.total_courses ?? 0} trend={2.7} trendUp href="/atw/course" />
              <StatCard icon="hugeicons:user-multiple" iconBg="from-violet-500 to-purple-700" bgImage="corner-4.png" title="Total Cadets" value={instructorStats?.total_cadets ?? 0} trend={3.4} trendUp href="/users/cadets" />
              <StatCard icon="hugeicons:chart-bar-line" iconBg="from-emerald-500 to-teal-600" bgImage="corner-5.png" title="Results" value={`${instructorStats?.total_results ?? 0}/${instructorStats?.total_subjects ?? 0}`} trend={1.8} trendUp href="/atw/results/view" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="hugeicons:layers-01" iconBg="from-indigo-500 to-violet-600" bgImage="corner-2.png" title="Courses" value={adminStats?.courses ?? 0} trend={2.7} trendUp href="/atw/course" />
              <StatCard icon="hugeicons:book-02" iconBg="from-blue-500 to-indigo-600" bgImage="corner-1.png" title="Subjects" value={adminStats?.assigned_subjects ?? 0} trend={4.9} trendUp href="/atw/subjects" />
              <StatCard icon="hugeicons:user-multiple" iconBg="from-violet-500 to-purple-700" bgImage="corner-4.png" title="Cadets" value={adminStats?.cadets_in_results ?? 0} trend={3.4} trendUp href="/users/cadets" />
              <StatCard icon="hugeicons:chart-bar-line" iconBg="from-emerald-500 to-teal-600" bgImage="corner-5.png" title="Results" value={adminStats?.results ?? 0} trend={1.8} trendUp href="/atw/results/view" />
            </div>
          )}

          {/* Chart + gauge (demo data for instructor) */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Activity Insights</h2>
                    <p className="text-xs text-slate-400 mt-0.5">User actions over time</p>
                  </div>
                  <div className="flex items-center bg-slate-100 rounded-full p-1">
                    <button onClick={() => setChartView("daily")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chartView === "daily" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500"}`}>Daily</button>
                    <button onClick={() => setChartView("monthly")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chartView === "monthly" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500"}`}>Monthly</button>
                    <button onClick={() => setChartView("yearly")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${chartView === "yearly" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500"}`}>Yearly</button>
                  </div>
                </div>
                <InsightsChart data={chartData} view={chartView} />
              </div>
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col">
                <h2 className="text-base font-bold text-slate-800 mb-4">{userIsInstructor ? "My Progress" : "Result Overview"}</h2>
                {userIsInstructor ? (() => {
                  const approved = subjectProgress?.total_approved ?? 0;
                  const enteredNotApproved = subjectProgress?.total_entered_not_approved ?? 0;
                  const notEntered = subjectProgress?.total_not_entered ?? (assignedSubjects.length);
                  const totalAssigned = subjectProgress?.total_assigned ?? assignedSubjects.length;
                  return <DonutProgressChart approved={approved} entered={enteredNotApproved} notEntered={notEntered} total={totalAssigned} />;
                })() : (
                  <GaugeChart
                    rate={adminStats?.cadets_in_results ? Math.min(((adminStats?.results ?? 0) / Math.max(adminStats.cadets_in_results, 1)) * 100, 100) : 0}
                    approved={adminStats?.results ?? 0}
                    total={adminStats?.cadets_in_results ?? 0}
                  />
                )}
              </div>
            </div>
          )}
          {!loading && (
            <div className={`grid grid-cols-1 ${userIsInstructor ? "xl:grid-cols-4" : ""} gap-4 items-start`}>
              <div>
                <ModulesGrid hasAccess={hasAccess} isInstructor={userIsInstructor} />
              </div>
              {userIsInstructor && (
                <div className="xl:col-span-3 bg-white shadow-sm rounded-[1.5rem] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-800">Assigned Subjects</div>
                    </div>
                    <Link href="/atw/subjects" className="text-sm font-semibold text-blue-500 hover:underline">View All</Link>
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-10">
                      <Icon icon="hugeicons:fan-01" className="w-6 h-6 animate-spin text-blue-400" />
                    </div>
                  ) : assignedSubjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                      <Icon icon="hugeicons:book-02" className="w-8 h-8" />
                      <p className="text-xs font-medium">No subjects assigned yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-center font-semibold text-slate-500 border border-gray-200 whitespace-nowrap">Course</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-500 border border-gray-200 whitespace-nowrap">Semester</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-500 border border-gray-200 whitespace-nowrap">Program</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-500 border border-gray-200 w-8">SL</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-500 border border-gray-200">Subject</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-500 border border-gray-200 whitespace-nowrap">Period</th>
                            <th className="px-3 py-2 text-center font-semibold text-slate-500 border border-gray-200 whitespace-nowrap">Total Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignedSubjects.map((row, index) => {
                            const isFirstCourse = index === 0 || assignedSubjects[index - 1].course_id !== row.course_id;
                            let courseSpan = 0;
                            if (isFirstCourse) {
                              for (let i = index; i < assignedSubjects.length; i++) {
                                if (assignedSubjects[i].course_id === row.course_id) courseSpan++;
                                else break;
                              }
                            }
                            const isFirstSemester = index === 0 || assignedSubjects[index - 1].course_id !== row.course_id || assignedSubjects[index - 1].semester_id !== row.semester_id;
                            let semSpan = 0;
                            if (isFirstSemester) {
                              for (let i = index; i < assignedSubjects.length; i++) {
                                if (assignedSubjects[i].course_id === row.course_id && assignedSubjects[i].semester_id === row.semester_id) semSpan++;
                                else break;
                              }
                            }
                            const isFirstProgram = index === 0 || assignedSubjects[index - 1].course_id !== row.course_id || assignedSubjects[index - 1].semester_id !== row.semester_id || assignedSubjects[index - 1].program_id !== row.program_id;
                            let progSpan = 0;
                            if (isFirstProgram) {
                              for (let i = index; i < assignedSubjects.length; i++) {
                                if (assignedSubjects[i].course_id === row.course_id && assignedSubjects[i].semester_id === row.semester_id && assignedSubjects[i].program_id === row.program_id) progSpan++;
                                else break;
                              }
                            }
                            return (
                              <tr key={`as-${row.id}`} className="hover:bg-slate-50 transition-colors">
                                {isFirstCourse && (
                                  <td rowSpan={courseSpan} className="px-3 py-2 font-semibold text-center text-slate-800 whitespace-nowrap border border-gray-200 align-middle">{row.course?.name ?? `Course ${row.course_id}`}</td>
                                )}
                                {isFirstSemester && (
                                  <td rowSpan={semSpan} className="px-3 py-2 text-center text-slate-600 whitespace-nowrap border border-gray-200 align-middle">{row.semester?.name ?? `Sem ${row.semester_id}`}</td>
                                )}
                                {isFirstProgram && (
                                  <td rowSpan={progSpan} className="px-3 py-2 text-center text-slate-600 whitespace-nowrap border border-gray-200 align-middle">{row.changeable_program?.name ?? row.program?.name ?? `Prog ${row.program_id}`}</td>
                                )}
                                <td className="px-3 py-2 text-center text-slate-400 border border-gray-200">{index + 1}</td>
                                <td className="px-3 py-2 text-slate-700 border border-gray-200">{row.subject?.subject_name ?? `Subject #${row.subject_id}`}</td>
                                <td className="px-3 py-2 text-center text-slate-600 border border-gray-200">{row.subject?.subject_period ?? "—"}</td>
                                <td className="px-3 py-2 text-center font-semibold text-slate-800 border border-gray-200">{row.subject?.subjects_full_mark ?? "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function ATWPage() {
  return <ATWDashboardView />;
}
