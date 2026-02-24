/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ctwAssessmentOlqResultService } from "@/libs/services/ctwAssessmentOlqResultService";
import FullLogo from "@/components/ui/fulllogo";
import OlqResultForm from "@/components/ctw-assessment-olq/OlqResultForm";
import type { CtwAssessmentOlqResultCreateData } from "@/libs/types/ctwAssessmentOlq";

export default function CreateOlqResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CtwAssessmentOlqResultCreateData) => {
    setLoading(true);
    try {
      const res = await ctwAssessmentOlqResultService.createResult(data);
      if (res) {
        router.push("/ctw/assessments/olq/results");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/assessments/olq/results");
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
