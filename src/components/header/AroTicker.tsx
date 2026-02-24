"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tiro_Bangla } from "next/font/google";
import { aroService } from "@/libs/services/aroService";
import type { Aro } from "@/libs/types/aro";

const tiroBangla = Tiro_Bangla({ weight: "400", subsets: ["latin"] });

export default function AroTicker() {
  const [aros, setAros] = useState<Aro[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    aroService
      .getAll({ status: "running", per_page: 50 })
      .then((res) => {
        setAros(res.data);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready || aros.length === 0) return null;

  // Duplicate the array so the second copy picks up exactly where the first ends
  const doubled = [...aros, ...aros];

  // Speed: ~6s per notice so longer lists don't fly too fast
  const durationSec = aros.length * 6;

  return (
    <div className="flex items-center w-[100vh] xl:w-[100vh] overflow-hidden rounded-md">
      {/* Static badge */}
      <span className="flex-shrink-0 self-stretch flex items-center px-3 bg-blue-500 text-white font-semibold select-none">
        Recents
      </span>

      {/* Scrolling area */}
      <div className="relative overflow-hidden flex-1 py-1.5">
        <div
          className={`aro-ticker-track inline-flex items-center whitespace-nowrap ${tiroBangla.className}`}
          style={{ animationDuration: `${durationSec}s` }}
        >
          {doubled.map((aro, i) => (
            <span key={i} className="inline-flex items-center">
              <span className="mx-6 select-none pointer-events-none">◆</span>
              <Link
                href={`/setup/notices/${aro.id}`}
                className="font-medium hover:underline hover:text-blue-600 transition-colors"
              >
                {aro.title ?? ""}
              </Link>
            </span>
          ))}
        </div>

        {/* Right-to-left fade overlay: white → transparent */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent" />
      </div>

      <style>{`
        .aro-ticker-track {
          animation: aroTicker linear infinite;
        }
        .aro-ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes aroTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
