/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw11sqnGroundExaminationMarkService } from "@/libs/services/ftw11sqnGroundExaminationMarkService";
import FullLogo from "@/components/ui/fulllogo";
import Ftw11sqnGroundExaminationMarkForm from "@/components/ftw-11sqn-ground-examination/Ftw11sqnGroundExaminationMarkForm";

export default function CreateFtw11sqnGroundExaminationMarkPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Submit all marks to API
      await ftw11sqnGroundExaminationMarkService.createBulkMark(data);
      router.push("/ftw/11sqn/results/ground/results");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/11sqn/results/Ground/results");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11SQN Ground Examination Marks - Bulk Entry</h2>
      </div>

      <Ftw11sqnGroundExaminationMarkForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}
