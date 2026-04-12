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
      className={`absolute group w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 xl:w-48 xl:h-48 rounded-full bg-white border-2 border-slate-200 shadow-xl flex items-center justify-center transition-all duration-500 hover:shadow-2xl hover:scale-110 hover:border-emerald-400 overflow-hidden z-20 ${className || ""}`}
    >
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
        <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" priority />
        <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-md border border-slate-100">
          <Icon icon={icon} className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 group-hover:text-white transition-colors" />
        </div>
        <div className="px-1 py-0.5">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-slate-900 group-hover:text-emerald-700 uppercase tracking-widest leading-none">
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
          <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mt-1.5 flex items-center gap-2">
            <span className="w-4 h-[2px] bg-slate-200 group-hover:w-8 group-hover:bg-emerald-500 transition-all duration-500" />
            {subtitle}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 mt-3">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">Enter Module</span>
        <Icon icon="hugeicons:arrow-right-02" className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
};

// ─── Main CTW Dashboard View ──────────────────────────────────────────────────
export function CTWDashboardView() {
  const nodes = [
    { title: "Foot Drill", href: "/ctw/results/dt/footdrill/results", icon: "hugeicons:running", angle: 270 },
    { title: "Sword Drill", href: "/ctw/results/dt/sworddrill/results", icon: "hugeicons:sword-03", angle: 330 },
    { title: "Arms Drill", href: "/ctw/results/dt/armsdrill/results", icon: "hugeicons:target-02", angle: 30 },
    { title: "Leadership", href: "/ctw/results/dt/leadershipskill/results", icon: "hugeicons:crown", angle: 90 },
    { title: "OLQ", href: "/ctw/assessments/olq/results", icon: "hugeicons:star", angle: 150 },
    { title: "Counseling", href: "/ctw/assessments/counseling/results", icon: "hugeicons:user-multiple", angle: 210 },
  ];

  const statusCards: StatusCardProps[] = [
    {
      title: "Pen Picture",
      subtitle: "Observations",
      href: "/ctw/assessments/penpicture/results",
      icon: "hugeicons:edit-02",
      accentColor: "from-emerald-600 to-emerald-800",
      bgImage: "corner-1.png",
    },
    {
      title: "Warnings",
      subtitle: "Conduct Alerts",
      href: "/ctw/assessments/warnings",
      icon: "hugeicons:alert-02",
      accentColor: "from-slate-700 to-slate-900",
      bgImage: "corner-2.png",
    },
    {
      title: "Leadership",
      subtitle: "Command Skills",
      href: "/ctw/results/leadershipskill/results",
      icon: "hugeicons:crown",
      accentColor: "from-emerald-700 to-emerald-900",
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-700">

      {/* ── Radial Orbit Column ── */}
      <div className="lg:col-span-3 flex items-center justify-center overflow-hidden relative">

        {/* Desktop / Tablet Orbit */}
        <div className="hidden sm:flex w-full items-center justify-center py-6">
          <div className="relative flex items-center justify-center" style={{ width: "640px", height: "640px" }}>
            <div className="absolute inset-0 sm:scale-[0.62] md:scale-[0.72] lg:scale-[0.80] xl:scale-100 transition-transform origin-center">

              {/* SVG Rings & Spokes */}
              <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="-320 -320 640 640">
                <circle cx="0" cy="0" r={radius} stroke="#6ee7b7" strokeWidth="2" fill="none" strokeDasharray="8 8" />
                <circle cx="0" cy="0" r={radius * 0.65} stroke="#d1fae5" strokeWidth="1" fill="none" />
                {nodes.map((node, i) => {
                  const pos = getPosition(node.angle);
                  return <line key={i} x1="0" y1="0" x2={pos.x} y2={pos.y} stroke="#6ee7b7" strokeWidth="2" strokeDasharray="4 4" />;
                })}
              </svg>

              {/* Center Hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative z-30 w-52 h-52 rounded-full bg-white border-2 border-emerald-800 shadow-[0_0_60px_rgba(5,150,105,0.15)] flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden">
                  <div className="absolute inset-0">
                    <Image src="/images/bg/corner-2.png" alt="" fill className="object-cover object-right-top" priority />
                  </div>
                  <div className="relative z-10 flex flex-col items-center px-6 py-3">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">CTW</h1>
                    <div className="h-1.5 w-16 bg-emerald-600 rounded-full mt-2" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 text-center leading-tight">
                      Central<br />Training Wing
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
            <h1 className="text-5xl font-black text-slate-900">CTW</h1>
            <div className="h-1.5 w-16 bg-emerald-600 rounded-full mt-2 mx-auto" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">Central Training Wing</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {nodes.map((node, i) => (
              <Link
                key={i}
                href={node.href}
                className="relative flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-200 gap-2 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300"
              >
                <div className="absolute inset-0 -z-10">
                  <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-10" />
                </div>
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <Icon icon={node.icon} className="w-5 h-5 text-emerald-600" />
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

    </div>
  );
}

export default function CTWPage() {
  return (
    <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-0">
      <CTWDashboardView />
    </div>
  );
}