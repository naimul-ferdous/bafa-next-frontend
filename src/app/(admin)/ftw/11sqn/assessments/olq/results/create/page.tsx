/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw11sqnAssessmentOlqResultService } from "@/libs/services/ftw11sqnAssessmentOlqResultService";
import FullLogo from "@/components/ui/fulllogo";
import Ftw11sqnOlqResultForm from "@/components/ftw-11sqn-assessment-olq/Ftw11sqnOlqResultForm";
import type { Ftw11sqnAssessmentOlqResultCreateData } from "@/libs/types/ftw11sqnAssessmentOlq";

export default function CreateFtw11sqnOlqResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Ftw11sqnAssessmentOlqResultCreateData) => {
    setLoading(true);
    try {
      await ftw11sqnAssessmentOlqResultService.createResult(data);
      router.push("/ftw/11sqn/assessments/olq/results");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/11sqn/assessments/olq/results");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create FTW 11SQN OLQ Result</h2>
      </div>

      <Ftw11sqnOlqResultForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
