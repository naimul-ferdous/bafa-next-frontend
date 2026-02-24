/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw11sqnAssessmentCounselingTypeService } from "@/libs/services/ftw11sqnAssessmentCounselingTypeService";
import FullLogo from "@/components/ui/fulllogo";
import CounselingTypeForm from "@/components/ftw-11sqn-assessment-counseling/CounselingTypeForm";

export default function Ftw11sqnCreateCounselingTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await ftw11sqnAssessmentCounselingTypeService.createType(data);
      if (res) {
        router.push("/ftw/11sqn/assessments/counselings/events");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/11sqn/assessments/counselings/events");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11 SQN Create Counseling Type</h2>
      </div>

      <CounselingTypeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
