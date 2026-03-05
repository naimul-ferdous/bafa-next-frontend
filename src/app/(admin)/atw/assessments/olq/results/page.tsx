"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { atwInstructorStatsService } from "@/libs/services/atwInstructorStatsService";

interface NoticeItem {
  id: number;
  title: string;
  body: string;
  timestamp: string;
  tag: string;
  tagColor: string;
  icon: string;
  iconBg: string;
  isNew?: boolean;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  accentColor: string;
  bgImage: string;
  loading?: boolean;
}

const demoNotices: NoticeItem[] = [
  {
    id: 1,
    title: "OLQ Assessment Scheduled",
    body: "All cadets are required to appear for OLQ evaluation on 26 Feb at 0800 hrs. Dress: Service uniform.",
    timestamp: "5 mins ago",
    tag: "Urgent",
    tagColor: "bg-red-100 text-red-600",
    icon: "hugeicons:star",
    iconBg: "from-orange-500 to-red-600",
    isNew: true,
  },
  {
    id: 2,
    title: "Subject Marks Updated",
    body: "Term-II subject marks for all cadets have been updated. Please verify entries before final consolidation.",
    timestamp: "1 hr ago",
    tag: "Subjects",
    tagColor: "bg-blue-100 text-blue-600",
    icon: "hugeicons:book-02",
    iconBg: "from-blue-500 to-indigo-600",
    isNew: true,
  },
  {
    id: 3,
    title: "Counseling Records Due",
    body: "Counseling entries for the current term must be submitted by EOD Friday to the ATW admin.",
    timestamp: "3 hrs ago",
    tag: "Counseling",
    tagColor: "bg-violet-100 text-violet-600",
    icon: "hugeicons:user-multiple",
    iconBg: "from-violet-600 to-purple-700",
  },
  {
    id: 4,
    title: "Pen Picture Submissions Open",
    body: "Instructors can now submit pen pictures for their assigned cadets via the Pen Picture module.",
    timestamp: "Yesterday",
    tag: "Pen Picture",
    tagColor: "bg-indigo-100 text-indigo-600",
    icon: "hugeicons:edit-02",
    iconBg: "from-indigo-500 to-violet-700",
  },
];

// ─── Circle Node ──────────────────────────────────────────────────────────────
const OrbitCircle = ({ title, href, icon }: { title: string; href: string; icon: string }) => (
  <Link href={href} className="group block">
    <div className="w-38 h-38 rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-400 shadow-[0_8px_32px_rgba(0,0,0,0.10)] group-hover:shadow-[0_8px_40px_rgba(59,130,246,0.20)] transition-all duration-500 flex flex-col items-center justify-center gap-2 overflow-hidden relative">
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
        <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" priority />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-11 h-11 transition-all duration-300 flex items-center justify-center">
          <Icon icon={icon} className="w-8 h-8 text-blue-600 transition-colors" />
        </div>
        <span className="max-w-[100px] text-sm text-slate-900 group-hover:text-blue-700 font-semibold leading-none text-center px-3">
          {title}
        </span>
      </div>
    </div>
  </Link>
);

const StatCard = ({ label, value, icon, accentColor, bgImage, loading }: StatCardProps) => (
  <div className="relative bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-6 overflow-hidden min-h-[160px] sm:min-h-[180px] flex flex-col justify-between">
    <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none">
      <Image src={`/images/bg/${bgImage}`} alt="" fill className="object-cover object-right" priority />
    </div>
    <div className="relative z-10">
      <p className="font-semibold mt-2 flex items-center gap-2">{label}</p>
      <div className="absolute top-0 right-0">
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl flex items-center justify-center shadow-lg opacity-10">
          <Icon icon={icon} className="relative z-16 w-16 h-16" />
        </div>
      </div>
      <div className="mt-4 sm:mt-5">
        {loading ? (
          <div className="h-10 w-16 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          <p className="text-4xl font-black text-slate-900 leading-none">{value}</p>
        )}
      </div>
    </div>
  </div>
);

// ─── Nodes config ─────────────────────────────────────────────────────────────
const nodes = [
  { title: "Input Result", href: "/atw/assessments/olq/results/create", icon: "hugeicons:pencil-edit-01" },
  { title: "View Result", href: "/atw/assessments/olq/results/view", icon: "hugeicons:notebook" },
];

// ─── Tree layout constants (px) ───────────────────────────────────────────────
const W = 560;
const rootDiam = 176;
const rootCx = W / 2;
const stemGap = 48;
const branchY = rootDiam + stemGap;
const childDropGap = 28;
const childTopY = branchY + childDropGap;
const childDiam = 144;
const H = childTopY + childDiam + 16;
const childCx = [rootCx - 160, rootCx + 160] as const;

const NoticesPanel = () => {
  const newCount = demoNotices.filter((n) => n.isNew).length;

  return (
    <div className="relative bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="relative px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-100 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Icon icon="hugeicons:notification-02" className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Notices</h2>
              <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Official Board</p>
            </div>
          </div>
          {newCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-2 sm:px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-black text-red-500 uppercase tracking-wider">{newCount} New</span>
            </div>
          )}
        </div>
      </div>

      {/* Notice List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 px-1.5 sm:px-2 py-1.5 sm:py-2">
        {demoNotices.map((notice) => (
          <div
            key={notice.id}
            className="group relative flex gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-slate-50 transition-colors duration-300 cursor-pointer"
          >
            {notice.isNew && (
              <span className="absolute top-3 sm:top-4 right-3 sm:right-4 w-2 h-2 rounded-full bg-blue-500" />
            )}
            <div className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br ${notice.iconBg} flex items-center justify-center shadow-sm mt-0.5`}>
              <Icon icon={notice.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full ${notice.tagColor}`}>
                  {notice.tag}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-300 font-bold uppercase tracking-wider">{notice.timestamp}</span>
              </div>
              <p className="text-[11px] sm:text-xs font-black text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">
                {notice.title}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5 sm:mt-1 line-clamp-2">
                {notice.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100">
        <Link
          href="/notices"
          className="group flex items-center justify-center gap-2 w-full py-2 sm:py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all duration-300"
        >
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">
            View All Notices
          </span>
          <Icon icon="hugeicons:arrow-right-02" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
};


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AtwAssessmentOlqResultsPage() {
  const { user, userIsInstructor } = useAuth();

  const isInstructor = userIsInstructor;
  const instructorId = user?.id;

  const [stats, setStats] = useState({ subjects: 0, cadets: 0, results: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isInstructor || !instructorId) return;
    setStatsLoading(true);
    atwInstructorStatsService.getStats(instructorId)
      .then((data) => {
        setStats({
          subjects: data.total_subjects,
          cadets: data.total_cadets,
          results: data.total_results,
        });
      }).catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [isInstructor, instructorId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 animate-in fade-in duration-700">
      <div className="lg:col-span-3 flex justify-center items-center mx-auto px-3 sm:px-4 md:px-6 lg:px-0 animate-in fade-in duration-700">
        <div className="flex items-center justify-center overflow-hidden relative">

          {/* Desktop / Tablet — Binary Tree */}
          <div className="hidden sm:flex w-full items-center justify-center py-8">
            <div
              className="relative sm:scale-[0.68] md:scale-[0.82] lg:scale-[0.92] xl:scale-100 transition-transform origin-top"
              style={{ width: `${W}px`, height: `${H}px` }}
            >
              {/* SVG tree connectors */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${W} ${H}`}
              >
                {/* Vertical stem: root bottom → branch */}
                <line
                  x1={rootCx} y1={rootDiam}
                  x2={rootCx} y2={branchY}
                  stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"
                />
                {/* Horizontal branch bar */}
                <line
                  x1={childCx[0]} y1={branchY}
                  x2={childCx[1]} y2={branchY}
                  stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"
                />
                {/* Drop to left child */}
                <line
                  x1={childCx[0]} y1={branchY}
                  x2={childCx[0]} y2={childTopY}
                  stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"
                />
                {/* Drop to right child */}
                <line
                  x1={childCx[1]} y1={branchY}
                  x2={childCx[1]} y2={childTopY}
                  stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5"
                />
                {/* Junction dots */}
                <circle cx={rootCx} cy={branchY} r="5" fill="#64748b" />
                <circle cx={childCx[0]} cy={branchY} r="4" fill="#94a3b8" />
                <circle cx={childCx[1]} cy={branchY} r="4" fill="#94a3b8" />
                {/* Child top dots */}
                <circle cx={childCx[0]} cy={childTopY} r="3" fill="#cbd5e1" />
                <circle cx={childCx[1]} cy={childTopY} r="3" fill="#cbd5e1" />
              </svg>

              {/* Root Hub — top center */}
              <div
                className="absolute"
                style={{ left: `${rootCx}px`, top: "0", transform: "translateX(-50%)" }}
              >
                <div className="relative w-44 h-44 rounded-full bg-white border-2 border-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.12)] flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden">
                  <div className="absolute inset-0">
                    <Image src="/images/bg/corner-2.png" alt="" fill className="object-cover object-right-top" priority />
                  </div>
                  <div className="relative z-10 flex flex-col items-center px-6 py-3">
                    <p className="font-black text-slate-500 uppercase tracking-widest mt-2 text-center leading-tight">
                      OLQ <br /> Result Management
                    </p>
                  </div>
                </div>
              </div>

              {/* Child Nodes */}
              {nodes.map((node, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{ left: `${childCx[i]}px`, top: `${childTopY}px`, transform: "translateX(-50%)" }}
                >
                  <OrbitCircle {...node} />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Grid */}
          <div className="sm:hidden w-full space-y-5 py-4">
            <div className="text-center relative py-8 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 -z-10">
                <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-20" />
              </div>
              <h1 className="text-5xl font-black text-slate-900">OLQ</h1>
              <div className="h-1.5 w-16 bg-blue-600 rounded-full mt-2 mx-auto" />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">ATW Result Management</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {nodes.map((node, i) => (
                <Link
                  key={i}
                  href={node.href}
                  className="relative flex flex-col items-center p-5 bg-white rounded-2xl border border-slate-200 gap-2 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300"
                >
                  <div className="absolute inset-0 -z-10">
                    <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-10" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                    <Icon icon={node.icon} className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider leading-none text-center">{node.title}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
      <div className="lg:col-span-1 xl:col-span-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            {isInstructor && (
              <div className="hidden lg:flex flex-col gap-4">
                <StatCard
                  label="Total Subjects"
                  value={stats.subjects}
                  icon="solar:book-2-broken"
                  accentColor="from-blue-600 to-indigo-700"
                  bgImage="corner-1.png"
                  loading={statsLoading}
                />
                <StatCard
                  label="Total Cadets"
                  value={stats.cadets}
                  icon="hugeicons:user-group"
                  accentColor="from-violet-600 to-purple-700"
                  bgImage="corner-2.png"
                  loading={statsLoading}
                />
                <StatCard
                  label="Results Inputted"
                  value={stats.results}
                  icon="hugeicons:notebook"
                  accentColor="from-emerald-500 to-teal-700"
                  bgImage="corner-1.png"
                  loading={statsLoading}
                />
              </div>
            )}
          </div>
          <div>
            <NoticesPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
