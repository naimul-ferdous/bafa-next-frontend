/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ftw12sqnAssessmentCommandTypeService from "@/libs/services/ftw12sqnAssessmentCommandTypeService";
import FullLogo from "@/components/ui/fulllogo";
import CommandTypeForm from "@/components/ftw-12sqn-assessment-command/CommandTypeForm";
import type { Ftw12SqnAssessmentCommandTypeCreateData } from "@/libs/types/ftw12sqnAssessmentCommand";

export default function CreateCommandTypePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Ftw12SqnAssessmentCommandTypeCreateData) => {
    setLoading(true);
    try {
      await ftw12sqnAssessmentCommandTypeService.createType(data);
      router.push("/ftw/12sqn/assessments/command/types");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/assessments/command/types");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create Command Type</h2>
      </div>

      <CommandTypeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
