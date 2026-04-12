/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw11sqnAssessmentOlqTypeService } from "@/libs/services/ftw11sqnAssessmentOlqTypeService";
import FullLogo from "@/components/ui/fulllogo";
import OlqTypeForm from "@/components/ftw-11sqn-assessment-olq/OlqTypeForm";
import type { Ftw11SqnAssessmentOlqTypeCreateData } from "@/libs/types/ftw11sqnAssessmentOlq";

export default function CreateOlqTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Ftw11SqnAssessmentOlqTypeCreateData) => {
    setLoading(true);
    try {
      await ftw11sqnAssessmentOlqTypeService.createType(data);
      router.push("/ftw/11sqn/assessments/olq/types");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/11sqn/assessments/olq/types");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create OLQ Type</h2>
      </div>

      <OlqTypeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
