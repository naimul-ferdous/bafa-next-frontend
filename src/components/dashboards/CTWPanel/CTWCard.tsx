"use client";
import Link from "next/link";
import React from "react";

export const CTWCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 h-full relative overflow-hidden">
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div>
          <div className="border-[3px] border-gray-400 p-4 rounded-full">
            <div className="i-hugeicons:building-06 w-10 h-10" />
          </div>
        </div>
        <div className="w-full text-center">
          <p className="text-2xl text-dark font-bold">CTW</p>
          <p className="font-bold text-sm text-gray-500">Central Training Wings</p>
          <div className="flex justify-center">
            <Link href="/ctw" className="mt-3 flex justify-center gap-1 text-primary font-bold">
              <span>Explore</span>
              <div className="i-hugeicons:arrow-right-02 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};