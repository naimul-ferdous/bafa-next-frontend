/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Ftw12SqnAssessmentCommandResultService } from "@/libs/services/ftw12sqnAssessmentCommandResultService";
import FullLogo from "@/components/ui/fulllogo";
import { Icon } from "@iconify/react";
import type { Ftw12SqnAssessmentCommandResult, Ftw12SqnAssessmentCommandResultCreateData } from "@/libs/types/ftw12sqnAssessmentCommand";
import CommandResultForm from "@/components/ftw-12sqn-assessment-command/CommandResultForm";

export default function EditCommandResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<Ftw12SqnAssessmentCommandResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoadingResult(true);
        const resultData = await Ftw12SqnAssessmentCommandResultService.getResult(parseInt(resultId));
        if (resultData) {
          setResult(resultData);
        } else {
          setError("Command Result not found");
        }
      } catch (err) {
        console.error("Failed to load Command result:", err);
        setError("Failed to load Command result data. Please refresh the page.");
      } finally {
        setLoadingResult(false);
      }
    };

    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  const handleSubmit = async (data: Ftw12SqnAssessmentCommandResultCreateData) => {
    setLoading(true);
    try {
      await Ftw12SqnAssessmentCommandResultService.updateResult(parseInt(resultId), data);
      router.push("/Ftw12Sqn/assessments/Command/results");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/Ftw12Sqn/assessments/Command/results");
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
          <button onClick={() => router.push("/Ftw12Sqn/assessments/Command/results")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Command Results
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Command Result</h2>
      </div>

      <CommandResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
