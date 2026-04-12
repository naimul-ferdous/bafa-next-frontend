"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ctwMedicalDisposalResultService } from "@/libs/services/ctwMedicalDisposalResultService";
import type { CtwMedicalDisposalResultPayload } from "@/libs/types/ctwMedicalDisposal";
import ResultForm from "@/components/ctw-medical-disposal-results/ResultForm";
import FullLogo from "@/components/ui/fulllogo";

export default function CreateCtwMedicalDisposalResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CtwMedicalDisposalResultPayload) => {
    setLoading(true);
    try {
      await ctwMedicalDisposalResultService.create(data);
      router.push("/ctw/assessments/medical-disposal/disposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">Add Medical Disposal Result</h2>
      </div>

      <ResultForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ctw/assessments/medical-disposal/disposal")}
        loading={loading}
      />
    </div>
  );
}
