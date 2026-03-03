"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { atwAssessmentPenpictureResultService } from "@/libs/services/atwAssessmentPenpictureResultService";
import FullLogo from "@/components/ui/fulllogo";
import ResultForm from "@/components/atw-assessment-penpicture-results/ResultForm";

export default function CreateResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (Array.isArray(data)) {
        await atwAssessmentPenpictureResultService.bulkCreate(data);
      } else {
        await atwAssessmentPenpictureResultService.createResult(data);
      }
      router.push("/atw/assessments/penpicture/results/view");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/penpicture/results/view");
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
