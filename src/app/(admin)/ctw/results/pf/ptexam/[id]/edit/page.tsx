/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ctwPtExamResultService } from "@/libs/services/ctwPtExamResultService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import PtExamResultForm from "@/components/ctw-ptexam/PtExamResultForm";
import { Icon } from "@iconify/react";
import type { CtwPtExamResult } from "@/libs/types/ctwPtExam";

const PT_EXAM_MODULE_CODE = "pt_exam";

export default function EditPtExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<CtwPtExamResult | null>(null);
  const [error, setError] = useState("");
  const [ptExamModuleId, setPtExamModuleId] = useState<number | null>(null);

  useEffect(() => {
    const fetchModuleAndResult = async () => {
      try {
        setLoadingResult(true);
        const modulesRes = await ctwResultsModuleService.getAllModules({ per_page: 100 });
        const ptExamModule = modulesRes.data.find((m: any) => m.code === PT_EXAM_MODULE_CODE);

        if (ptExamModule) {
          setPtExamModuleId(ptExamModule.id);
          const resultData = await ctwPtExamResultService.getResult(ptExamModule.id, parseInt(resultId));
          if (resultData) {
            setResult(resultData);
          } else {
            setError("Result not found");
          }
        } else {
          setError(`Module with code ${PT_EXAM_MODULE_CODE} not found.`);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load result data. Please refresh the page.");
      } finally {
        setLoadingResult(false);
      }
    };

    if (resultId) {
      fetchModuleAndResult();
    }
  }, [resultId]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwPtExamResultService.updateResult(parseInt(resultId), data);
      router.refresh();
      router.push("/ctw/results/pf/ptexam");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/pf/ptexam");
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
          <button onClick={() => router.push("/ctw/results/pf/ptexam")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Results
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit CTW PT Exam Result</h2>
      </div>

      <PtExamResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
