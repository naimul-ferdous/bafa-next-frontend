/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import FullLogo from "@/components/ui/fulllogo";
import OlqTypeForm from "@/components/ctw-assessment-olq/OlqTypeForm";
import type { CtwAssessmentOlqTypeCreateData } from "@/libs/types/ctwAssessmentOlq";
import ctwAssessmentOlqTypeService from "@/libs/services/ctwAssessmentOlqTypeService";

export default function CreateOlqTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CtwAssessmentOlqTypeCreateData) => {
    setLoading(true);
    try {
      await ctwAssessmentOlqTypeService.createType(data);
      router.push("/ctw/assessments/olq/types");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/assessments/olq/types");
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
