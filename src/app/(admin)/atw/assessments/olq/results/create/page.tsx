/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { atwAssessmentOlqResultService } from "@/libs/services/atwAssessmentOlqResultService";
import FullLogo from "@/components/ui/fulllogo";
import OlqResultForm from "@/components/atw-assessment-olq/OlqResultForm";
import type { AtwAssessmentOlqResultCreateData } from "@/libs/types/atwAssessmentOlq";

export default function CreateOlqResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: AtwAssessmentOlqResultCreateData) => {
    setLoading(true);
    try {
      await atwAssessmentOlqResultService.createResult(data);
      router.push("/atw/assessments/olq/results");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/olq/results");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create OLQ Result</h2>
      </div>

      <OlqResultForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
