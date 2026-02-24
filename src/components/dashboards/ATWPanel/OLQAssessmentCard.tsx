"use client";
import React from "react";
import Link from "next/link";

export const OLQAssessmentCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 h-full relative overflow-hidden flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div>
          <div className="border-[3px] border-gray-400 p-4 rounded-full">
            <div className="i-hugeicons:user-star-01 w-10 h-10" />
          </div>
        </div>
        <div className="w-full text-center">
          <p className="text-2xl text-dark font-bold">OLQ Assessment</p>
          <p className="font-bold text-sm text-gray-500">Officer Like Qualities</p>
          <div className="flex justify-center">
            <Link href="/atw/assessments/olq" className="mt-3 flex justify-center gap-1 text-primary font-bold">
              <span>View</span>
              <div className="i-hugeicons:arrow-right-02 w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};