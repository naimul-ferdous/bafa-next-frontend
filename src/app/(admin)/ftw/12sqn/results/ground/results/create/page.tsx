/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw12sqnGroundExaminationMarkService } from "@/libs/services/ftw12sqnGroundExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import Ftw12sqnGroundExaminationMarkForm from "@/components/ftw-12sqn-ground-examination/Ftw12sqnGroundExaminationMarkForm";

export default function CreateFtw12sqnGroundExaminationMarkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await ftw12sqnGroundExaminationMarkService.createBulkMark(data);
      
      if (res) {
        router.push("/ftw/12sqn/results/ground/results");
      }
    } catch (err: any) {
      console.error("Error creating marks:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/results/ground/results");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">
          Bangladesh Air Force Academy
        </h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
          FTW 12SQN Ground Examination Marks - Bulk Entry
        </h2>
      </div>

      <Ftw12sqnGroundExaminationMarkForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
