/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

interface OrbitCircleProps {
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  accentColor: string;
  style?: React.CSSProperties;
  className?: string;
}

const OrbitCircle = ({ title, subtitle, href, icon, accentColor, style, className }: OrbitCircleProps) => {
  return (
    <Link
      href={href}
      style={style}
      className={`absolute group w-40 h-40 md:w-48 md:h-48 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center transition-all duration-500 overflow-hidden z-20 ${className || ""}`}
    >
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
        <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" priority />
        <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2 text-center px-2">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center transition-all duration-300 shadow-md`}>
          <Icon icon={icon} className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </div>
        <div className="px-2 py-0.5 rounded-lg">
          <span className="text-xs md:text-sm font-black text-slate-900 group-hover:text-blue-700 uppercase tracking-widest">{title}</span>
        </div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{subtitle}</span>
      </div>
    </Link>
  );
};

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
      className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-2 overflow-hidden min-h-[220px]"
    >
      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none transition-transform duration-700 group-hover:scale-110">
        <Image src={`/images/bg/${bgImage}`} alt="" fill className="object-cover object-right" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
      </div>
      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-lg transform transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-110`}>
          <Icon icon={icon} className="w-8 h-8 text-white" />
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">{title}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <span className="w-4 h-[2px] bg-slate-200 group-hover:w-8 group-hover:bg-blue-500 transition-all duration-500" />
            {subtitle}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
        <span className="text-[10px] font-black uppercase tracking-tighter">Enter Module</span>
        <Icon icon="hugeicons:arrow-right-02" className="w-4 h-4" />
      </div>
    </Link>
  );
};

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
    title: "Annual Flying Exercise Scheduled",
    body: "All FTW cadets must report to the briefing hall by 0600 hrs on 25 Feb for pre-exercise orientation.",
    timestamp: "2 mins ago",
    tag: "Urgent",
    tagColor: "bg-red-100 text-red-600",
    icon: "hugeicons:airplane-01",
    iconBg: "from-orange-500 to-red-600",
    isNew: true,
  },
  {
    id: 2,
    title: "Academic Assessment Results",
    body: "Term-II results have been uploaded to the ATW portal. All trainees are advised to review their scores.",
    timestamp: "1 hr ago",
    tag: "Academic",
    tagColor: "bg-blue-100 text-blue-600",
    icon: "hugeicons:book-open-01",
    iconBg: "from-blue-600 to-indigo-700",
    isNew: true,
  },
  {
    id: 3,
    title: "Physical Fitness Test — Rescheduled",
    body: "The CPTC fitness assessment originally on 24 Feb has been moved to 28 Feb due to weather conditions.",
    timestamp: "3 hrs ago",
    tag: "CPTC",
    tagColor: "bg-slate-100 text-slate-600",
    icon: "hugeicons:chart-bar-line",
    iconBg: "from-slate-600 to-slate-800",
  },
  {
    id: 4,
    title: "Central Training Wing Parade",
    body: "Mandatory full-dress parade for all CTW personnel at the main ground. Attendance is compulsory.",
    timestamp: "Yesterday",
    tag: "General",
    tagColor: "bg-emerald-100 text-emerald-600",
    icon: "hugeicons:flag-01",
    iconBg: "from-emerald-600 to-teal-700",
  },
  {
    id: 5,
    title: "System Maintenance Window",
    body: "The BAFA portal will undergo scheduled maintenance on 26 Feb from 2200–2400 hrs. Plan accordingly.",
    timestamp: "2 days ago",
    tag: "System",
    tagColor: "bg-violet-100 text-violet-600",
    icon: "hugeicons:settings-01",
    iconBg: "from-violet-600 to-purple-700",
  },
];

const NoticesPanel = () => {
  const newCount = demoNotices.filter((n) => n.isNew).length;

  return (
    <div className="relative bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[700px]">
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Icon icon="hugeicons:notification-02" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Notices</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Official Board</p>
            </div>
          </div>
          {newCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">{newCount} New</span>
            </div>
          )}
        </div>
      </div>

      {/* Notice List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 px-2 py-2">
        {demoNotices.map((notice) => (
          <div
            key={notice.id}
            className="group relative flex gap-3 px-4 py-4 rounded-2xl hover:bg-slate-50 transition-colors duration-300 cursor-pointer"
          >
            {/* New dot */}
            {notice.isNew && (
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
            )}

            {/* Icon */}
            <div className={`shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${notice.iconBg} flex items-center justify-center shadow-sm mt-0.5`}>
              <Icon icon={notice.icon} className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${notice.tagColor}`}>
                  {notice.tag}
                </span>
                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">{notice.timestamp}</span>
              </div>
              <p className="text-xs font-black text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">
                {notice.title}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">
                {notice.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <Link
          href="/notices"
          className="group flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all duration-300"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600 transition-colors">
            View All Notices
          </span>
          <Icon icon="hugeicons:arrow-right-02" className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
};

const MainDashboard = () => {
  const nodes = [
    { title: "ATW", subtitle: "Academic Wing", href: "/atw", icon: "hugeicons:book-open-01", accentColor: "from-blue-600 to-indigo-700", angle: 270 },
    { title: "CTW", subtitle: "Central Training", href: "/ctw", icon: "hugeicons:flag-01", accentColor: "from-emerald-600 to-teal-800", angle: 0 },
    { title: "FTW", subtitle: "Flying Training", href: "/ftw", icon: "hugeicons:airplane-01", accentColor: "from-orange-500 to-red-700", angle: 90 },
    { title: "CPTC", subtitle: "Physical Excellence", href: "/cptc", icon: "hugeicons:chart-bar-line", accentColor: "from-slate-700 to-slate-950", angle: 180 },
  ];

  const statusCards: StatusCardProps[] = [
    {
      title: "User Management",
      subtitle: "Accounts & Cadets",
      href: "/admin/users",
      icon: "hugeicons:user-multiple-02",
      accentColor: "from-blue-600 to-indigo-700",
      bgImage: "corner-1.png",
    },
    {
      title: "Settings Management",
      subtitle: "System Configuration",
      href: "/admin/settings",
      icon: "hugeicons:settings-01",
      accentColor: "from-violet-600 to-purple-800",
      bgImage: "corner-2.png",
    },
    {
      title: "Setup Management",
      subtitle: "Initial Deployment",
      href: "/admin/setup",
      icon: "hugeicons:package-01",
      accentColor: "from-emerald-600 to-teal-800",
      bgImage: "corner-1.png",
    },
  ];

  const radius = 260;
  const getPosition = (angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: Math.cos(angleInRadians) * radius,
      y: Math.sin(angleInRadians) * radius,
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-700">
      {/* Radial Dashboard Column */}
      <div className="lg:col-span-2 min-h-[80vh] flex items-center justify-center overflow-hidden relative">
        <div className="relative w-full h-[700px] hidden md:flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="-400 -400 800 800">
            <circle cx="0" cy="0" r="260" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeDasharray="8 8" />
            <circle cx="0" cy="0" r="160" stroke="#e2e8f0" strokeWidth="1" fill="none" />
            {nodes.map((node, i) => {
              const pos = getPosition(node.angle);
              return (
                <line key={i} x1="0" y1="0" x2={pos.x} y2={pos.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
              );
            })}
          </svg>

          {/* Center Hub */}
          <div className="relative z-30 w-72 h-72 rounded-full bg-white border-2 border-slate-900 shadow-[0_0_80px_rgba(0,0,0,0.15)] flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden">
            <div className="absolute inset-0 opacity-100">
              <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" priority />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="px-6 py-4 flex flex-col items-center">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">BAFA</h1>
                <div className="h-2 w-16 bg-blue-600 rounded-full mt-2" />
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

        {/* Mobile View */}
        <div className="md:hidden w-full space-y-8">
          <div className="text-center relative py-10">
            <div className="absolute inset-0 -z-10">
              <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-20" />
            </div>
            <h1 className="text-6xl font-black text-slate-900">BAFA</h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Ecosystem</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {nodes.map((node, i) => (
              <Link
                key={i}
                href={node.href}
                className="relative flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-200 gap-3 overflow-hidden shadow-sm"
              >
                <div className="absolute inset-0 -z-10">
                  <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-10" />
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${node.accentColor} flex items-center justify-center shadow-md`}>
                  <Icon icon={node.icon} className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-black uppercase text-slate-800">{node.title}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{node.subtitle}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Status Panel Column */}
      <div className="relative space-y-4">
        {statusCards.map((card, index) => (
          <StatusCard key={index} {...card} />
        ))}
      </div>

      {/* Notices Panel Column */}
      <div className="relative">
        <NoticesPanel />
      </div>
    </div>
  );
};

export default MainDashboard;