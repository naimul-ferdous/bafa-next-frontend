"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useAuth } from "@/context/AuthContext";
import { ctwInstructorStatsService } from "@/libs/services/ctwInstructorStatsService";

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, icon, bgImage, loading,
}: {
  label: string; value: number; icon: string; bgImage: string; loading?: boolean;
}) => (
  <div className="relative bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 overflow-hidden min-h-[130px] flex flex-col justify-between">
    <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none">
      <Image src={`/images/bg/${bgImage}`} alt="" fill className="object-cover object-right" priority />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
    </div>
    <div className="relative z-10">
      <div className="absolute top-0 right-0">
        <Icon icon={icon} className="w-14 h-14 text-slate-100" />
      </div>
      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="mt-3">
        {loading ? (
          <div className="h-9 w-14 bg-slate-100 rounded-xl animate-pulse" />
        ) : (
          <p className="text-4xl font-black text-slate-900 leading-none">{value}</p>
        )}
      </div>
    </div>
  </div>
);

// ─── Ghost (background, non-clickable) node ───────────────────────────────────
const GhostNode = ({ label, icon, diam }: { label: string; icon: string; diam: number }) => (
  <div
    className="rounded-full bg-white/60 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-1 pointer-events-none select-none"
    style={{ width: diam, height: diam }}
  >
    <Icon icon={icon} className={`text-slate-200 ${diam < 100 ? "w-4 h-4" : "w-8 h-8"}`} />
    <span className={`font-black text-slate-200 uppercase tracking-wider text-center leading-none px-2 ${diam < 100 ? "text-[7px]" : "text-[10px]"}`}>
      {label}
    </span>
  </div>
);

// ─── Active placeholder ancestor ──────────────────────────────────────────────
const PlaceholderNode = ({ label, href, icon }: { label: string; href: string; icon: string }) => (
  <Link href={href} className="group block">
    <div className="w-[68px] h-[68px] rounded-full bg-white border-2 border-dashed border-slate-300 group-hover:border-slate-500 shadow-sm group-hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-1">
      <Icon icon={icon} className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
      <span className="text-[8px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-wider text-center leading-none px-1 transition-colors">
        {label}
      </span>
    </div>
  </Link>
);

// ─── Leaf orbit node ──────────────────────────────────────────────────────────
const OrbitCircle = ({ title, href, icon, gradient }: { title: string; href: string; icon: string; gradient: string }) => (
  <Link href={href} className="group block">
    <div className="w-40 h-40 rounded-full bg-white border-2 border-slate-200 group-hover:border-blue-400 shadow-[0_8px_32px_rgba(0,0,0,0.10)] group-hover:shadow-[0_8px_40px_rgba(59,130,246,0.22)] transition-all duration-500 flex flex-col items-center justify-center gap-3 overflow-hidden relative">
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
        <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover object-right-top" priority />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md transition-transform duration-500 group-hover:scale-110`}>
          <Icon icon={icon} className="w-6 h-6 text-white" />
        </div>
        <span className="max-w-[110px] text-xs font-black text-slate-800 group-hover:text-blue-700 uppercase tracking-wide leading-tight text-center px-2 transition-colors">
          {title}
        </span>
      </div>
    </div>
  </Link>
);

// ─── Tree layout constants ────────────────────────────────────────────────────
const W  = 560;
const cx = W / 2; // 280

// Active ancestor placeholders
const phDiam  = 68;
const ph0TopY = 0;   // CTW        — bottom = 68
const ph1TopY = 100; // Assessments — bottom = 168

// Punishments (active root, centered)
const rootDiam = 176;
const rootTopY = 204; // ph1Bottom(168) + 36
const rootBotY = 380; // rootTopY + rootDiam

// Leaf children
const stemGap   = 44;
const branchY   = 424; // rootBotY + stemGap
const childDrop = 24;
const childTopY = 448; // branchY + childDrop
const childDiam = 160;
const H         = 628; // childTopY + childDiam + 20
const childCx   = [cx - 160, cx + 160] as const; // [120, 440]

// Ghost branch fork Y positions
const branchY1 = 84;  // between ph0Bottom(68) and ph1TopY(100)
const branchY2 = 186; // between ph1Bottom(168) and rootTopY(204)

// Ghost level-2 siblings of Assessments (CTW's other children)
const cxResults = cx - 200; // 80
const cxModules = cx + 200; // 480

// Ghost level-3 siblings of Punishment (Assessments' other children)
const sp = 170; // sibling spacing
const cxPer     = cx - sp;     // 110  — visible
const cxCounsel = cx - 2 * sp; // -60  — clipped
const cxOlq     = cx - 3 * sp; // -230 — clipped

// Leaf nodes
const nodes = [
  { title: "Input Punishment", href: "/ctw/assessments/warnings/create", icon: "hugeicons:pencil-edit-01", gradient: "from-orange-500 to-red-600" },
  { title: "View Punishments", href: "/ctw/assessments/warnings/view",   icon: "hugeicons:notebook",       gradient: "from-blue-500 to-indigo-600" },
];

// Active ancestor nodes
const ancestors = [
  { label: "CTW",         href: "/ctw",            icon: "hugeicons:home-01",   topY: ph0TopY },
  { label: "Assessments", href: "/ctw/assessments", icon: "hugeicons:layers-01", topY: ph1TopY },
];

// Ghost level-2 nodes (CTW → Results, Modules)
const ghostL2 = [
  { label: "Results",  icon: "hugeicons:chart-bar-01",  topY: ph1TopY, x: cxResults },
  { label: "Modules",  icon: "hugeicons:book-open-01",  topY: ph1TopY, x: cxModules },
];

// Ghost level-3 nodes (Assessments → OLQ, Counseling, PER)
const ghostL3 = [
  { label: "OLQ",        icon: "hugeicons:star-01",        topY: rootTopY, x: cxOlq     },
  { label: "Counseling", icon: "hugeicons:comment-01",      topY: rootTopY, x: cxCounsel },
  { label: "PER",        icon: "hugeicons:file-01",         topY: rootTopY, x: cxPer     },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CtwCadetWarningsPage() {
  const { user, userIsInstructor } = useAuth();
  const isInstructor = userIsInstructor;
  const instructorId = user?.id;

  const [stats, setStats]               = useState({ subjects: 0, cadets: 0, results: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isInstructor || !instructorId) return;
    setStatsLoading(true);
    ctwInstructorStatsService
      .getStats(instructorId)
      .then((d) => setStats({ subjects: d.total_subjects, cadets: d.total_cadets, results: d.total_results }))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [isInstructor, instructorId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* ── Tree — Desktop ── */}
      <div className="hidden sm:flex w-full items-center justify-center py-4">
        <div
          className="relative transition-transform origin-top sm:scale-[0.65] md:scale-[0.82] lg:scale-[0.95] xl:scale-100"
          style={{ width: `${W}px`, height: `${H}px` }}
        >
          {/* ── SVG: all connectors ── */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${W} ${H}`}
            style={{ overflow: "visible" }}
          >
            {/* ── Ghost lines (background, very faint) ── */}
            {/* CTW → branchY1 (vertical stem) */}
            <line x1={cx} y1={ph0TopY + phDiam} x2={cx} y2={branchY1} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            {/* branchY1 horizontal: cxResults ↔ cxModules */}
            <line x1={cxResults} y1={branchY1} x2={cxModules} y2={branchY1} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            {/* drops from branchY1 to each level-2 node */}
            <line x1={cxResults} y1={branchY1} x2={cxResults} y2={ph1TopY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={cx}        y1={branchY1} x2={cx}        y2={ph1TopY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={cxModules} y1={branchY1} x2={cxModules} y2={ph1TopY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

            {/* Assessments → branchY2 (vertical stem) */}
            <line x1={cx} y1={ph1TopY + phDiam} x2={cx} y2={branchY2} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            {/* branchY2 horizontal: cxOlq ↔ cx */}
            <line x1={cxOlq} y1={branchY2} x2={cx} y2={branchY2} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            {/* drops from branchY2 to each level-3 node */}
            <line x1={cxOlq}     y1={branchY2} x2={cxOlq}     y2={rootTopY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={cxCounsel} y1={branchY2} x2={cxCounsel} y2={rootTopY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={cxPer}     y1={branchY2} x2={cxPer}     y2={rootTopY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <line x1={cx}        y1={branchY2} x2={cx}        y2={rootTopY} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

            {/* Ghost junction dots */}
            <circle cx={cx}        cy={branchY1} r="3" fill="#e2e8f0" />
            <circle cx={cxResults} cy={branchY1} r="2" fill="#e2e8f0" />
            <circle cx={cxModules} cy={branchY1} r="2" fill="#e2e8f0" />
            <circle cx={cx}        cy={branchY2} r="3" fill="#e2e8f0" />
            <circle cx={cxPer}     cy={branchY2} r="2" fill="#e2e8f0" />
            <circle cx={cxCounsel} cy={branchY2} r="2" fill="#e2e8f0" />
            <circle cx={cxOlq}     cy={branchY2} r="2" fill="#e2e8f0" />

            {/* ── Active path lines (brighter, on top of ghosts) ── */}
            {/* Root bottom → branch below Punishments */}
            <line x1={cx} y1={rootBotY} x2={cx} y2={branchY} stroke="#64748b" strokeWidth="2" strokeDasharray="6 5" />
            {/* Horizontal branch */}
            <line x1={childCx[0]} y1={branchY} x2={childCx[1]} y2={branchY} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 5" />
            {/* Drops to leaves */}
            <line x1={childCx[0]} y1={branchY} x2={childCx[0]} y2={childTopY} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 5" />
            <line x1={childCx[1]} y1={branchY} x2={childCx[1]} y2={childTopY} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 5" />
            {/* Active junction dots */}
            <circle cx={cx}         cy={branchY}   r="5" fill="#94a3b8" />
            <circle cx={childCx[0]} cy={branchY}   r="4" fill="#cbd5e1" />
            <circle cx={childCx[1]} cy={branchY}   r="4" fill="#cbd5e1" />
            <circle cx={childCx[0]} cy={childTopY} r="3" fill="#e2e8f0" />
            <circle cx={childCx[1]} cy={childTopY} r="3" fill="#e2e8f0" />
          </svg>

          {/* ── Ghost level-2 nodes: Results, Modules ── */}
          {ghostL2.map((n) => (
            <div key={n.label} className="absolute" style={{ left: n.x, top: n.topY, transform: "translateX(-50%)" }}>
              <GhostNode label={n.label} icon={n.icon} diam={phDiam} />
            </div>
          ))}

          {/* ── Ghost level-3 nodes: OLQ, Counseling, PER ── */}
          {ghostL3.map((n) => (
            <div key={n.label} className="absolute" style={{ left: n.x, top: n.topY, transform: "translateX(-50%)" }}>
              <GhostNode label={n.label} icon={n.icon} diam={rootDiam} />
            </div>
          ))}

          {/* ── Active ancestor placeholders: CTW, Assessments ── */}
          {ancestors.map((a) => (
            <div key={a.href} className="absolute" style={{ left: cx, top: a.topY, transform: "translateX(-50%)" }}>
              <PlaceholderNode label={a.label} href={a.href} icon={a.icon} />
            </div>
          ))}

          {/* ── Active root: Punishments (centered) ── */}
          <div className="absolute" style={{ left: cx, top: rootTopY, transform: "translateX(-50%)" }}>
            <div className="relative w-44 h-44 rounded-full bg-white border-2 border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.14)] flex items-center justify-center overflow-hidden group hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0">
                <Image src="/images/bg/corner-2.png" alt="" fill className="object-cover object-right-top" priority />
                <div className="absolute inset-0 bg-white/60" />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-2 px-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                  <Icon icon="hugeicons:alert-02" className="w-6 h-6 text-white" />
                </div>
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-tight">
                  CTW<br />Punishment
                </p>
              </div>
            </div>
          </div>

          {/* ── Leaf nodes: Input, View ── */}
          {nodes.map((node, i) => (
            <div key={i} className="absolute" style={{ left: childCx[i], top: childTopY, transform: "translateX(-50%)" }}>
              <OrbitCircle {...node} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile ── */}
      <div className="sm:hidden space-y-4 py-2">
        {/* Breadcrumb path */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {ancestors.map((a) => (
            <React.Fragment key={a.href}>
              <Link href={a.href} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-dashed border-slate-300 rounded-full shadow-sm hover:border-slate-500 transition-colors">
                <Icon icon={a.icon} className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{a.label}</span>
              </Link>
              <Icon icon="hugeicons:arrow-right-01" className="w-3 h-3 text-slate-300" />
            </React.Fragment>
          ))}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 rounded-full shadow-sm">
            <Icon icon="hugeicons:alert-02" className="w-3.5 h-3.5 text-white" />
            <span className="text-[9px] font-black text-white uppercase tracking-wider">Punishments</span>
          </div>
        </div>

        {/* Root card */}
        <div className="text-center relative py-8 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <Image src="/images/bg/corner-2.png" alt="" fill className="object-cover" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
              <Icon icon="hugeicons:alert-02" className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">Punishments</h1>
              <div className="h-1 w-12 bg-slate-800 rounded-full mt-1.5 mx-auto" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">CTW Management</p>
            </div>
          </div>
        </div>

        {/* Action grid */}
        <div className="grid grid-cols-2 gap-3">
          {nodes.map((node, i) => (
            <Link key={i} href={node.href} className="group relative flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <Image src="/images/bg/corner-1.png" alt="" fill className="object-cover" />
              </div>
              <div className={`relative z-10 w-11 h-11 rounded-2xl bg-gradient-to-br ${node.gradient} flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110`}>
                <Icon icon={node.icon} className="w-5 h-5 text-white" />
              </div>
              <span className="relative z-10 text-[10px] font-black uppercase tracking-wide text-slate-800 group-hover:text-blue-700 text-center leading-tight transition-colors">
                {node.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Instructor Stats ── */}
      {isInstructor && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Your Statistics</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Subjects"   value={stats.subjects} icon="solar:book-2-broken"  bgImage="corner-1.png" loading={statsLoading} />
            <StatCard label="Total Cadets"     value={stats.cadets}   icon="hugeicons:user-group" bgImage="corner-2.png" loading={statsLoading} />
            <StatCard label="Results Inputted" value={stats.results}  icon="hugeicons:notebook"   bgImage="corner-1.png" loading={statsLoading} />
          </div>
        </div>
      )}

    </div>
  );
}
