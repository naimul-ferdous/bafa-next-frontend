"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ctwAssessmentPenpictureResultService } from "@/libs/services/ctwAssessmentPenpictureResultService";
import FullLogo from "@/components/ui/fulllogo";
import ResultForm from "@/components/ctw-assessment-penpicture-results/ResultForm";

export default function CreateResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await ctwAssessmentPenpictureResultService.createResult(data);
      if (res) {
        router.push("/ctw/assessments/penpicture/results");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/assessments/penpicture/results");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create Assessment Result</h2>
      </div>

      <ResultForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
