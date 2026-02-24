/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ftw12sqnAssessmentOlqResultService } from "@/libs/services/ftw12sqnAssessmentOlqResultService";
import FullLogo from "@/components/ui/fulllogo";
import Ftw12sqnOlqResultForm from "@/components/ftw-12sqn-assessment-olq/Ftw12sqnOlqResultForm";
import { Icon } from "@iconify/react";
import type { Ftw12sqnAssessmentOlqResult, Ftw12sqnAssessmentOlqResultCreateData } from "@/libs/types/ftw12sqnAssessmentOlq";

export default function EditFtw12sqnOlqResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<Ftw12sqnAssessmentOlqResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoadingResult(true);
        const resultData = await ftw12sqnAssessmentOlqResultService.getResult(parseInt(resultId));
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

  const handleSubmit = async (data: Ftw12sqnAssessmentOlqResultCreateData) => {
    setLoading(true);
    try {
      await ftw12sqnAssessmentOlqResultService.updateResult(parseInt(resultId), data);
      router.push("/ftw/12sqn/assessments/olq/results");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/assessments/olq/results");
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
          <button onClick={() => router.push("/ftw/12sqn/assessments/olq/results")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit FTW 12sqn OLQ Result</h2>
      </div>

      <Ftw12sqnOlqResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
