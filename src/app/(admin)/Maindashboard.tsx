/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";

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
        <Icon icon={icon} className="w-6 h-6 md:w-7 md:h-7 text-black" />
        <div className="px-2 rounded-lg">
          <span className="text-xs md:text-sm font-bold group-hover:text-blue-700 uppercase">{title}</span>
        </div>
        <span className="text-[9px] font-bold uppercase">{subtitle}</span>
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
          <h3 className="text-xl font-bold group-hover:text-blue-700 transition-colors">{title}</h3>
          <p className="text-[11px] font-bold uppercase mt-2 flex items-center gap-2">
            <span className="w-4 h-[2px] group-hover:w-8 group-hover:bg-blue-500 transition-all duration-500" />
            {subtitle}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
        <span className="text-[10px] font-bold uppercase">Enter Module</span>
        <Icon icon="hugeicons:arrow-right-02" className="w-4 h-4" />
      </div>
    </Link>
  );
};

const MainDashboard = () => {
  const nodes = [
    { title: "ATW", subtitle: "Academic Training Wing", href: "/atw", icon: "hugeicons:book-open-01", accentColor: "from-blue-600 to-indigo-700", angle: 270 },
    { title: "CTW", subtitle: "Cadet's Training Wing", href: "/ctw", icon: "hugeicons:flag-01", accentColor: "from-emerald-600 to-teal-800", angle: 0 },
    { title: "FTW", subtitle: "Flying Training Wing", href: "/ftw", icon: "hugeicons:airplane-01", accentColor: "from-orange-500 to-red-700", angle: 90 },
    { title: "CPTC", subtitle: "Central Progress Training Center", href: "/cptc", icon: "hugeicons:chart-bar-line", accentColor: "from-slate-700 to-slate-950", angle: 180 },
  ];

  const statusCards: StatusCardProps[] = [
    {
      title: "User Management",
      subtitle: "Accounts & Users",
      href: "/users",
      icon: "hugeicons:user-multiple-02",
      accentColor: "from-blue-600 to-indigo-700",
      bgImage: "corner-1.png",
    },
    {
      title: "Role's Management",
      subtitle: "Role Configuration",
      href: "/settings/roles",
      icon: "hugeicons:settings-01",
      accentColor: "from-violet-600 to-purple-800",
      bgImage: "corner-2.png",
    },
    {
      title: "Course Management",
      subtitle: "Course Setup",
      href: "/setup/courses",
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
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
              <Image src="/images/bg/corner-2.png" alt="" fill className="object-cover object-right-top" priority />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="px-6 py-4 flex flex-col items-center">
              <div className="flex justify-center"><FullLogo /></div>
                <h1 className="text-xl font-bold">BAFA</h1>
                <p className="font-bold uppercase text-center leading-tight">
                  Bangladesh Air Force Academy
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

    </div>
  );
};

export default MainDashboard;