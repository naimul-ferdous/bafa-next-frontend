/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Ftw12SqnAssessmentCommandResultService } from "@/libs/services/ftw12sqnAssessmentCommandResultService";
import FullLogo from "@/components/ui/fulllogo";
import CommandResultForm from "@/components/ftw-12sqn-assessment-command/CommandResultForm";
import type { Ftw12SqnAssessmentCommandResultCreateData } from "@/libs/types/ftw12sqnAssessmentCommand";

export default function CreateCommandResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Ftw12SqnAssessmentCommandResultCreateData) => {
    setLoading(true);
    try {
      await Ftw12SqnAssessmentCommandResultService.createResult(data);
      router.push("/ftw/12sqn/assessments/command/results/");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/assessments/command/results/");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create Command Result</h2>
      </div>

      <CommandResultForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
