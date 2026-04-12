/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { Sqn11DashboardView } from "./11sqn/page";
import { Sqn12DashboardView } from "./12sqn/page";

const getUserSubWing = (user: any): { code: string; name: string } | null => {
  if (!user) return null;
  const roleAssignments = user.role_assignments || user.roleAssignments || [];
  for (const assignment of roleAssignments) {
    if (assignment.sub_wing?.code) return { code: assignment.sub_wing.code.toUpperCase(), name: assignment.sub_wing.name || assignment.sub_wing.code };
  }
  return null;
};

interface StatusCardProps {
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  accentColor: string;
  bgImage: string;
}

const StatusCard = ({ title, subtitle, href, icon, accentColor, bgImage }: StatusCardProps) => (
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
        <h3 className="text-base sm:text-lg lg:text-xl font-bold group-hover:text-blue-700 transition-colors">{title}</h3>
        <p className="text-[9px] sm:text-[10px] font-bold uppercase mt-1.5 flex items-center gap-2">
          <span className="w-4 h-[2px] group-hover:w-8 group-hover:bg-blue-500 transition-all duration-500" />
          {subtitle}
        </p>
      </div>
    </div>
    <div className="relative z-10 flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 mt-3">
      <span className="text-[9px] sm:text-[10px] font-bold uppercase">Enter Module</span>
      <Icon icon="hugeicons:arrow-right-02" className="w-3.5 h-3.5" />
    </div>
  </Link>
);

function FTWLandingView() {
  const statusCards: StatusCardProps[] = [
    { title: "Results", subtitle: "Wing Overview", href: "/ftw/results", icon: "hugeicons:notebook", accentColor: "from-blue-600 to-indigo-700", bgImage: "corner-1.png" },
    { title: "Instructors", subtitle: "Staff Directory", href: "/ftw/instructors", icon: "hugeicons:teacher", accentColor: "from-slate-600 to-slate-800", bgImage: "corner-2.png" },
    { title: "Cadets", subtitle: "Trainee Roster", href: "/ftw/cadets", icon: "hugeicons:user-multiple", accentColor: "from-indigo-500 to-violet-700", bgImage: "corner-1.png" },
  ];
  const W = 560; const H = 520;
  const hub = { x: 280, y: 130 };
  const sqn11 = { x: 110, y: 370 };
  const sqn12 = { x: 450, y: 370 };
  const hubR = 130;
  const nodeR = 100;

  return (
    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
      {/* ── Status Cards Row ── */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {statusCards.map((card, i) => <StatusCard key={i} {...card} />)}
      </div>

      {/* Orbit Diagram */}
      <div className="flex items-center justify-center overflow-hidden">
        <div className="hidden sm:flex w-full items-center justify-center py-4">
          <div
            className="relative w-full"
            style={{ maxWidth: `${W}px`, aspectRatio: `${W}/${H}` }}
          >
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${W} ${H}`}
            >
              <line x1={hub.x} y1={hub.y} x2={sqn11.x} y2={sqn11.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
              <line x1={hub.x} y1={hub.y} x2={sqn12.x} y2={sqn12.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
              <line x1={sqn11.x} y1={sqn11.y} x2={sqn12.x} y2={sqn12.y} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 6" />
            </svg>
            <div
              className="absolute z-30 rounded-full bg-white border-2 border-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.10)] flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden"
              style={{
                width: `${hubR * 2}px`,
                height: `${hubR * 2}px`,
                left: `${(hub.x / W) * 100}%`,
                top: `${(hub.y / H) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="absolute inset-0">
                <Image src="/images/bg/corner-2.png" alt="" fill className="object-cover object-right-top" priority />
              </div>
              <div className="relative z-10 flex flex-col items-center px-4">
                <h1 className="text-xl font-bold">FTW</h1>
                <p className="font-bold uppercase text-center leading-tight">
                  Flying<br />Training Wing
                </p>
              </div>
            </div>
            <Link
              href="/ftw/11sqn"
              className="absolute z-20 rounded-full bg-white border-2 border-slate-200 shadow-xl flex items-center justify-center transition-all duration-500 hover:shadow-2xl hover:scale-110 hover:border-orange-400 overflow-hidden group"
              style={{
                width: `${nodeR * 2}px`,
                height: `${nodeR * 2}px`,
                left: `${(sqn11.x / W) * 100}%`,
                top: `${(sqn11.y / H) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" priority />
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-1.5 text-center px-2">
                <Icon icon="hugeicons:airplane-01" className="w-8 h-8 text-orange-600 transition-colors" />
                <div>
                  <h1 className="text-lg font-bold group-hover:text-orange-700 transition-colors">11 SQN</h1>
                  <p className="text-xs font-semibold uppercase text-center">11 Squadron</p>
                </div>
                <div className="flex items-center gap-1 text-orange-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                  <span className="text-[8px] font-bold uppercase">Enter</span>
                  <Icon icon="hugeicons:arrow-right-02" className="w-3 h-3" />
                </div>
              </div>
            </Link>
            <Link
              href="/ftw/12sqn"
              className="absolute z-20 rounded-full bg-white border-2 border-slate-200 shadow-xl flex items-center justify-center transition-all duration-500 hover:shadow-2xl hover:scale-110 hover:border-rose-400 overflow-hidden group"
              style={{
                width: `${nodeR * 2}px`,
                height: `${nodeR * 2}px`,
                left: `${(sqn12.x / W) * 100}%`,
                top: `${(sqn12.y / H) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                <Image src="/images/bg/corner-2.png" alt="" fill className="object-cover object-right-top" priority />
                <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-1.5 text-center px-2">
                <Icon icon="hugeicons:airplane-02" className="w-8 h-8 text-rose-600 transition-colors" />
                <div>
                  <h1 className="text-lg font-bold group-hover:text-orange-700 transition-colors">12 SQN</h1>
                  <p className="text-xs font-semibold uppercase text-center">12 Squadron</p>
                </div>
                <div className="flex items-center gap-1 text-orange-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                  <span className="text-[8px] font-bold uppercase">Enter</span>
                  <Icon icon="hugeicons:arrow-right-02" className="w-3 h-3" />
                </div>
              </div>
            </Link>
          </div>
        </div>
        <div className="sm:hidden w-full space-y-5 py-4">
          <div className="text-center relative py-8 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-20" />
            </div>
            <h1 className="text-5xl font-black text-slate-900">FTW</h1>
            <div className="h-1.5 w-16 bg-slate-800 rounded-full mt-2 mx-auto" />
            <p className="text-[9px] font-bold uppercase mt-2">Flying Training Wing</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { href: "/ftw/11sqn", icon: "hugeicons:airplane-01", label: "11 SQN", color: "text-orange-600", hover: "hover:border-orange-300", bg: "corner-1.png" },
              { href: "/ftw/12sqn", icon: "hugeicons:airplane-02", label: "12 SQN", color: "text-rose-600", hover: "hover:border-rose-300", bg: "corner-2.png" },
            ].map((sqn) => (
              <Link key={sqn.label} href={sqn.href} className={`relative flex flex-col items-center p-6 bg-white rounded-3xl border border-slate-200 gap-3 overflow-hidden shadow-sm hover:shadow-md ${sqn.hover} transition-all duration-300`}>
                <div className="absolute inset-0 -z-10">
                  <Image src={`/images/bg/${sqn.bg}`} alt="" fill className="object-cover opacity-10" />
                </div>
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                  <Icon icon={sqn.icon} className={`w-7 h-7 ${sqn.color}`} />
                </div>
                <span className="text-sm font-black uppercase text-slate-800 tracking-wider">{sqn.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function FTWDashboardView() {
  const { user } = useAuth();
  const subWing = getUserSubWing(user);

  if (subWing?.code === "11SQN") return <Sqn11DashboardView />;
  if (subWing?.code === "12SQN") return <Sqn12DashboardView />;

  return <FTWLandingView />;
}

export default function FTWPage() {
  return (
    <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-0">
      <FTWDashboardView />
    </div>
  );
}