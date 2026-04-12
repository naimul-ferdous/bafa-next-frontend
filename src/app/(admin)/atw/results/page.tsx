"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { atwInstructorStatsService } from "@/libs/services/atwInstructorStatsService";
import { Modal } from "@/components/ui/modal";
import FullLogo from "@/components/ui/fulllogo";

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  accentColor: string;
  bgImage: string;
  loading?: boolean;
  href?: string;
}


// ─── Circle Node ──────────────────────────────────────────────────────────────
const OrbitCircle = ({ title, href, icon, onClick }: { title: string; href?: string; icon: string; onClick?: (e: React.MouseEvent) => void }) => {
  const content = (
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
  );

  if (onClick && !href) {
    return (
      <button type="button" onClick={onClick} className="group block cursor-pointer outline-none border-none bg-transparent p-0 m-0">
        {content}
      </button>
    );
  }

  return (
    <Link href={href || "#"} onClick={onClick} className="group block">
      {content}
    </Link>
  );
};

const StatCard = ({ label, value, icon, accentColor, bgImage, loading, href }: StatCardProps) => {
  const content = (
    <div className={`relative bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-6 overflow-hidden min-h-[160px] sm:min-h-[180px] flex flex-col justify-between h-full transition-all duration-300 ${href ? 'hover:border-blue-400 hover:shadow-md cursor-pointer group' : ''}`}>
      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none">
        <Image src={`/images/bg/${bgImage}`} alt="" fill className="object-cover object-right" priority />
      </div>
      <div className="relative z-10">
        <p className={`font-semibold mt-2 flex items-center gap-2 ${href ? 'group-hover:text-blue-600 transition-colors' : ''}`}>{label}</p>
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

  if (href) return <Link href={href}>{content}</Link>;
  return content;
};

// ─── Tree layout constants (px) ───────────────────────────────────────────────
const W = 560;
const rootDiam = 176;   // w-44
const rootCx = W / 2;  // 280
const stemGap = 48;
const branchY = rootDiam + stemGap;         // 224 — horizontal branch line y
const childDropGap = 28;
const childTopY = branchY + childDropGap;   // 252 — child circle top y
const childDiam = 144;  // w-36
const H = childTopY + childDiam + 16;       // ~412
const childCx = [rootCx - 160, rootCx + 160] as const; // 120, 440

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AtwResultsPage() {
  const { user, userIsInstructor } = useAuth();

  const isInstructor = userIsInstructor;
  const instructorId = user?.id;

  const [stats, setStats] = useState({ subjects: 0, courses: 0, cadets: 0, results: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (!isInstructor || !instructorId) return;
    setStatsLoading(true);
    atwInstructorStatsService.getStats(instructorId)
      .then((data) => {
        setStats({
          subjects: data.total_subjects,
          courses: data.total_courses,
          cadets: data.total_cadets,
          results: data.total_results,
        });
      }).catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [isInstructor, instructorId]);

  // Logic to determine if user can input marks
  const roles = user?.roles || [];
  const primaryRole = roles.find((r: any) => r.pivot?.is_primary) || roles[0] || user?.role;
  const isInstructorActive = primaryRole?.slug === 'instructor';
  
  const assignWings = user?.assign_wings || [];
  const hasPendingInstructorWings = assignWings.some((aw: any) => aw.status === "pending");

  const canInputMarks = isInstructorActive && !hasPendingInstructorWings;

  const handleInputResultClick = (e: React.MouseEvent) => {
    if (!canInputMarks) {
      e.preventDefault();
      setShowRoleModal(true);
    }
  };

  const dynamicNodes = [
    { 
      title: "Input Result", 
      href: canInputMarks ? "/atw/results/create" : undefined, 
      icon: "hugeicons:pencil-edit-01",
      onClick: canInputMarks ? undefined : handleInputResultClick
    },
    { 
      title: "View Result", 
      href: "/atw/results/view", 
      icon: "hugeicons:notebook" 
    },
  ];

  return (
    <>
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
        {/* Stat Cards Row */}
        {isInstructor && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <StatCard
              label="My Subjects"
              value={stats.subjects}
              icon="solar:book-2-broken"
              accentColor="from-blue-600 to-indigo-700"
              bgImage="corner-1.png"
              loading={statsLoading}
              href="/atw/subjects"
            />
            <StatCard
              label="My Courses"
              value={stats.courses}
              icon="hugeicons:user-group"
              accentColor="from-violet-600 to-purple-700"
              bgImage="corner-2.png"
              loading={statsLoading}
              href="/atw/course"
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
              <circle cx={rootCx} cy={branchY} r="5" fill="#64748b" />
              <circle cx={childCx[0]} cy={branchY} r="4" fill="#94a3b8" />
              <circle cx={childCx[1]} cy={branchY} r="4" fill="#94a3b8" />
              <circle cx={childCx[0]} cy={childTopY} r="3" fill="#cbd5e1" />
              <circle cx={childCx[1]} cy={childTopY} r="3" fill="#cbd5e1" />
            </svg>

            {/* Root Hub */}
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
                    Result Management
                  </p>
                </div>
              </div>
            </div>

            {/* Child Nodes */}
            {dynamicNodes.map((node, i) => (
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
            <h1 className="text-5xl font-black text-slate-900">RESULT</h1>
            <div className="h-1.5 w-16 bg-blue-600 rounded-full mt-2 mx-auto" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">ATW Result Management</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dynamicNodes.map((node, i) => (
              <div key={i}>
                {node.onClick && !node.href ? (
                  <button
                    type="button"
                    onClick={node.onClick}
                    className="w-full relative flex flex-col items-center p-5 bg-white rounded-2xl border border-slate-200 gap-2 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300"
                  >
                    <div className="absolute inset-0 -z-10">
                      <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover opacity-10" />
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      <Icon icon={node.icon} className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider leading-none text-center">{node.title}</span>
                  </button>
                ) : (
                  <Link
                    href={node.href || "#"}
                    onClick={node.onClick}
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
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        className="max-w-md mx-4 p-6"
        showCloseButton={true}
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="flex justify-center mb-2"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          
          <div className="mt-2">
            <h2 className="text-md font-semibold text-red-600 uppercase flex items-center justify-center gap-2">
              <Icon icon="hugeicons:alert-square" className="w-5 h-5" />
              Access Denied
            </h2>
            <p className="text-sm text-gray-600 mt-3">
              {hasPendingInstructorWings 
                ? "Your Instructor assignment is currently pending admin approval. You will be able to input marks once approved."
                : "To input marks, please switch your active role to Instructor from the top-right menu."}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => setShowRoleModal(false)}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
