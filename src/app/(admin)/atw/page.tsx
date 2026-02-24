/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

// ─── Orbit Circle Node ────────────────────────────────────────────────────────
interface OrbitCircleProps {
  title: string;
  href: string;
  icon: string;
  style?: React.CSSProperties;
  className?: string;
}

const OrbitCircle = ({ title, href, icon, style, className }: OrbitCircleProps) => {
  return (
    <Link
      href={href}
      style={style}
      className={`absolute group w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-white border-2 border-slate-200 shadow-xl flex items-center justify-center transition-all duration-500 hover:shadow-2xl hover:scale-110 hover:border-blue-400 overflow-hidden z-20 ${className || ""}`}
    >
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
        <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" priority />
        <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-md border border-slate-100">
          <Icon icon={icon} className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 group-hover:text-white transition-colors" />
        </div>
        <div className="px-1 py-0.5">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-slate-900 group-hover:text-blue-700 uppercase tracking-widest leading-none">
            {title}
          </span>
        </div>
      </div>
    </Link>
  );
};

// ─── Status Card ──────────────────────────────────────────────────────────────
interface StatusCardProps {
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  accentColor: string;
  bgImage: string;
}

const StatusCard = ({ title, subtitle, href, icon, accentColor, bgImage }: StatusCardProps) => {
  return (
    <Link
      href={href}
      className="group relative bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-6 lg:p-7 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1 overflow-hidden min-h-[160px] sm:min-h-[180px] lg:min-h-[200px]"
    >
      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none transition-transform duration-700 group-hover:scale-110">
        <Image src={`/images/bg/${bgImage}`} alt="" fill className="object-cover object-right" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
      </div>
      <div className="relative z-10">
        <div className={`w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-lg transform transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-110`}>
          <Icon icon={icon} className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
        </div>
        <div className="mt-4 sm:mt-5 lg:mt-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1.5 flex items-center gap-2">
            <span className="w-4 h-[2px] bg-slate-200 group-hover:w-8 group-hover:bg-blue-500 transition-all duration-500" />
            {subtitle}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 mt-3">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">Enter Module</span>
        <Icon icon="hugeicons:arrow-right-02" className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
};

// ─── Notices Panel ────────────────────────────────────────────────────────────
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
  {
    id: 5,
    title: "Results Published",
    body: "ATW examination results have been published. Cadets can view their scores in the Results module.",
    timestamp: "2 days ago",
    tag: "Results",
    tagColor: "bg-emerald-100 text-emerald-600",
    icon: "hugeicons:notebook",
    iconBg: "from-emerald-600 to-teal-700",
  },
];

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

// ─── Main ATW Dashboard View ──────────────────────────────────────────────────
export function ATWDashboardView() {
  const nodes = [
    { title: "Subjects", href: "/atw/subjects", icon: "hugeicons:star", angle: 270 },
    { title: "Results", href: "/atw/results", icon: "hugeicons:user-multiple", angle: 330 },
    { title: "Pen Picture", href: "/atw/assessments/penpicture/results", icon: "hugeicons:edit-02", angle: 30 },
    { title: "Counseling", href: "/atw/assessments/counseling/results", icon: "hugeicons:notebook", angle: 90 },
    { title: "OLQ", href: "/atw/assessments/olq/results", icon: "hugeicons:book-02", angle: 150 },
    { title: "Warnings", href: "/atw/assessments/warnings", icon: "hugeicons:alert-02", angle: 210 },
  ];

  const statusCards: StatusCardProps[] = [
    {
      title: "OLQ Assessment",
      subtitle: "Officer Qualities",
      href: "/atw/assessments/olq/results",
      icon: "hugeicons:star",
      accentColor: "from-blue-600 to-indigo-700",
      bgImage: "corner-1.png",
    },
    {
      title: "Counseling",
      subtitle: "Cadet Support",
      href: "/atw/assessments/counseling/results",
      icon: "hugeicons:user-multiple",
      accentColor: "from-blue-500 to-blue-700",
      bgImage: "corner-2.png",
    },
    {
      title: "Pen Picture",
      subtitle: "Character Logs",
      href: "/atw/assessments/penpicture/results",
      icon: "hugeicons:edit-02",
      accentColor: "from-indigo-600 to-violet-800",
      bgImage: "corner-1.png",
    },
  ];

  const radius = 220;
  const getPosition = (angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: Math.cos(angleInRadians) * radius,
      y: Math.sin(angleInRadians) * radius,
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 animate-in fade-in duration-700">

      {/* ── Radial Orbit Column ── */}
      <div className="lg:col-span-3 flex items-center justify-center overflow-hidden relative">

        {/* Desktop/Tablet Orbit */}
        <div className="hidden sm:flex w-full items-center justify-center py-6">
          <div className="relative flex items-center justify-center" style={{ width: "640px", height: "640px" }}>
            <div className="absolute inset-0 sm:scale-[0.62] md:scale-[0.72] lg:scale-[0.80] xl:scale-100 transition-transform origin-center">

              {/* SVG Rings & Spokes */}
              <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="-320 -320 640 640">
                <circle cx="0" cy="0" r={radius} stroke="#cbd5e1" strokeWidth="2" fill="none" strokeDasharray="8 8" />
                <circle cx="0" cy="0" r={radius * 0.65} stroke="#e2e8f0" strokeWidth="1" fill="none" />
                {nodes.map((node, i) => {
                  const pos = getPosition(node.angle);
                  return <line key={i} x1="0" y1="0" x2={pos.x} y2={pos.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />;
                })}
              </svg>

              {/* Center Hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative z-30 w-52 h-52 rounded-full bg-white border-2 border-slate-900 shadow-[0_0_60px_rgba(0,0,0,0.12)] flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden">
                  <div className="absolute inset-0">
                    <Image src="/images/bg/corner-2.png" alt="" fill className="object-cover object-right-top" priority />
                  </div>
                  <div className="relative z-10 flex flex-col items-center px-6 py-3">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">ATW</h1>
                    <div className="h-1.5 w-16 bg-blue-600 rounded-full mt-2" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 text-center leading-tight">
                      Academic<br />Training Wing
                    </p>
                  </div>
                </div>
              </div>

              {/* Orbit Nodes */}
              {nodes.map((node, index) => {
                const pos = getPosition(node.angle);
                return (
                  <OrbitCircle
                    key={index}
                    {...node}
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Grid View */}
        <div className="sm:hidden w-full space-y-5 py-4">
          <div className="text-center relative py-8 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-20" />
            </div>
            <h1 className="text-5xl font-black text-slate-900">ATW</h1>
            <div className="h-1.5 w-16 bg-blue-600 rounded-full mt-2 mx-auto" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Academic Training Wing</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {nodes.map((node, i) => (
              <Link
                key={i}
                href={node.href}
                className="relative flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-200 gap-2 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300"
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

      {/* ── Status Cards Column ── */}
      <div className="lg:col-span-1 xl:col-span-1">
        {/* Mobile/Tablet: horizontal scroll */}
        <div className="flex lg:hidden gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none">
          {statusCards.map((card, index) => (
            <div key={index} className="snap-start shrink-0 w-[240px] sm:w-[260px]">
              <StatusCard {...card} />
            </div>
          ))}
        </div>
        {/* Desktop: vertical stack */}
        <div className="hidden lg:flex flex-col gap-4">
          {statusCards.map((card, index) => (
            <StatusCard key={index} {...card} />
          ))}
        </div>
      </div>

      {/* ── Notices Panel ── */}
      <div className="lg:col-span-1 xl:col-span-1">
        <NoticesPanel />
      </div>
    </div>
  );
}

export default function ATWPage() {
  return (
    <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-0">
      <ATWDashboardView />
    </div>
  );
}