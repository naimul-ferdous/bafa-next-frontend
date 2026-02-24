/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { atwAssessmentCounselingTypeService } from "@/libs/services/atwAssessmentCounselingTypeService";
import FullLogo from "@/components/ui/fulllogo";
import CounselingTypeForm from "@/components/atw-assessment-counseling/CounselingTypeForm";
import type { AtwAssessmentCounselingTypeCreateData } from "@/libs/types/atwAssessmentCounseling";

export default function CreateCounselingTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: AtwAssessmentCounselingTypeCreateData) => {
    setLoading(true);
    try {
      await atwAssessmentCounselingTypeService.createType(data);
      router.push("/atw/assessments/counselings/events");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/counselings/events");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create Counseling Type</h2>
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
