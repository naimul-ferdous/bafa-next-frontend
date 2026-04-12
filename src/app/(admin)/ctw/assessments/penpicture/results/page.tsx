"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { ctwInstructorStatsService } from "@/libs/services/ctwInstructorStatsService";

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  accentColor: string;
  bgImage: string;
  loading?: boolean;
}

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
  { title: "Input Result", href: "/ctw/assessments/penpicture/results/create", icon: "hugeicons:pencil-edit-01" },
  { title: "View Result",  href: "/ctw/assessments/penpicture/results/view",   icon: "hugeicons:notebook" },
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CtwAssessmentPenpictureResultsPage() {
  const { user, userIsInstructor } = useAuth();

  const isInstructor = userIsInstructor;
  const instructorId = user?.id;

  const [stats, setStats] = useState({ subjects: 0, cadets: 0, results: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isInstructor || !instructorId) return;
    setStatsLoading(true);
    ctwInstructorStatsService.getStats(instructorId)
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
    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
      {/* Stat Cards Row */}
      {isInstructor && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <StatCard label="Total Subjects" value={stats.subjects} icon="solar:book-2-broken" accentColor="from-blue-600 to-indigo-700" bgImage="corner-1.png" loading={statsLoading} />
          <StatCard label="Total Cadets" value={stats.cadets} icon="hugeicons:user-group" accentColor="from-violet-600 to-purple-700" bgImage="corner-2.png" loading={statsLoading} />
          <StatCard label="Results Inputted" value={stats.results} icon="hugeicons:notebook" accentColor="from-emerald-500 to-teal-700" bgImage="corner-1.png" loading={statsLoading} />
        </div>
      )}

      {/* Desktop / Tablet — Binary Tree */}
      <div className="hidden sm:flex w-full items-center justify-center py-8">
            <div
              className="relative sm:scale-[0.68] md:scale-[0.82] lg:scale-[0.92] xl:scale-100 transition-transform origin-top"
              style={{ width: `${W}px`, height: `${H}px` }}
            >
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${W} ${H}`}
              >
                <line x1={rootCx} y1={rootDiam} x2={rootCx} y2={branchY} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5" />
                <line x1={childCx[0]} y1={branchY} x2={childCx[1]} y2={branchY} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5" />
                <line x1={childCx[0]} y1={branchY} x2={childCx[0]} y2={childTopY} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5" />
                <line x1={childCx[1]} y1={branchY} x2={childCx[1]} y2={childTopY} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 5" />
                <circle cx={rootCx}     cy={branchY}   r="5" fill="#64748b" />
                <circle cx={childCx[0]} cy={branchY}   r="4" fill="#94a3b8" />
                <circle cx={childCx[1]} cy={branchY}   r="4" fill="#94a3b8" />
                <circle cx={childCx[0]} cy={childTopY} r="3" fill="#cbd5e1" />
                <circle cx={childCx[1]} cy={childTopY} r="3" fill="#cbd5e1" />
              </svg>

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
                      ATW <br /> PER Management
                    </p>
                  </div>
                </div>
              </div>

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
      <div className="sm:hidden w-full space-y-5 py-4 px-3">
        <div className="text-center relative py-8 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-20" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 leading-tight">PEN PICTURE</h1>
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
  );
}
