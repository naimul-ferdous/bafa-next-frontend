/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { atwAssessmentOlqResultService } from "@/libs/services/atwAssessmentOlqResultService";
import FullLogo from "@/components/ui/fulllogo";
import OlqResultForm from "@/components/atw-assessment-olq/OlqResultForm";
import { Icon } from "@iconify/react";
import type { AtwAssessmentOlqResult, AtwAssessmentOlqResultCreateData } from "@/libs/types/atwAssessmentOlq";

export default function EditOlqResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<AtwAssessmentOlqResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoadingResult(true);
        const resultData = await atwAssessmentOlqResultService.getResult(parseInt(resultId));
        if (resultData) {
          setResult(resultData);
        } else {
          setError("OLQ Result not found");
        }
      } catch (err) {
        console.error("Failed to load OLQ result:", err);
        setError("Failed to load OLQ result data. Please refresh the page.");
      } finally {
        setLoadingResult(false);
      }
    };

    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  const handleSubmit = async (data: AtwAssessmentOlqResultCreateData) => {
    setLoading(true);
    try {
      await atwAssessmentOlqResultService.updateResult(parseInt(resultId), data);
      router.push("/atw/assessments/olq/results/view");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/olq/results/view");
  };

  if (loadingResult) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error}</p>
          <button onClick={() => router.push("/atw/assessments/olq/results")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to OLQ Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit OLQ Result</h2>
      </div>

      <OlqResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
