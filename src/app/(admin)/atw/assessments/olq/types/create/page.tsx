/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { atwAssessmentOlqTypeService } from "@/libs/services/atwAssessmentOlqTypeService";
import FullLogo from "@/components/ui/fulllogo";
import OlqTypeForm from "@/components/atw-assessment-olq/OlqTypeForm";
import type { AtwAssessmentOlqTypeCreateData } from "@/libs/types/atwAssessmentOlq";

export default function CreateOlqTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: AtwAssessmentOlqTypeCreateData) => {
    setLoading(true);
    try {
      await atwAssessmentOlqTypeService.createType(data);
      router.push("/atw/assessments/olq/types");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/olq/types");
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
