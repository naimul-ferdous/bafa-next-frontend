/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw12sqnFlyingExaminationMarkService } from "@/libs/services/ftw12sqnFlyingExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import Ftw12sqnFlyingExaminationMarkForm from "@/components/ftw-12sqn-flying-examination/Ftw12sqnFlyingExaminationMarkForm";

export default function CreateFtw12sqnFlyingExaminationMarkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Submit all marks to API (backend will auto-create submission)
      const res = await ftw12sqnFlyingExaminationMarkService.createBulkMark(data);
      
      // Navigate to results page on success
      if (res) {
        router.push("/ftw/12sqn/results/flying/results");
      }
    } catch (err: any) {
      console.error("Error creating marks:", err);
      throw err; // Re-throw to be caught by form's error handler
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/results/flying/results");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          FTW 12SQN Flying Examination Marks - Bulk Entry
        </h2>
      </div>

      <Ftw12sqnFlyingExaminationMarkForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}