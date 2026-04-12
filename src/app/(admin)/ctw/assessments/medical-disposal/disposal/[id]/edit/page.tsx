/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwMedicalDisposalResultService } from "@/libs/services/ctwMedicalDisposalResultService";
import type { CtwMedicalDisposalResult, CtwMedicalDisposalResultPayload } from "@/libs/types/ctwMedicalDisposal";
import ResultForm from "@/components/ctw-medical-disposal-results/ResultForm";
import FullLogo from "@/components/ui/fulllogo";

export default function EditCtwMedicalDisposalResultPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params?.id as string);

  const [result, setResult]       = useState<CtwMedicalDisposalResult | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!id || isNaN(id)) { setError("Invalid ID"); setLoadingData(false); return; }
    ctwMedicalDisposalResultService.getOne(id)
      .then((data) => setResult(data))
      .catch(() => setError("Failed to load result data"))
      .finally(() => setLoadingData(false));
  }, [id]);

  const handleSubmit = async (data: CtwMedicalDisposalResultPayload) => {
    setLoading(true);
    try {
      await ctwMedicalDisposalResultService.update(id, data);
      router.push("/ctw/assessments/medical-disposal/disposal");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 flex justify-center py-24">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center py-16">
        <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">{error || "Result not found"}</p>
        <button onClick={() => router.push("/ctw/assessments/medical-disposal/disposal")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-1 uppercase">Edit Medical Disposal Result</h2>
      </div>

      <ResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/ctw/assessments/medical-disposal/disposal")}
        loading={loading}
        isEdit
      />
    </div>
  );
}
