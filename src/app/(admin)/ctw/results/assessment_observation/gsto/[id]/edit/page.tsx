/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ctwGstoAssessmentResultService } from "@/libs/services/ctwGstoAssessmentResultService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import GstoAssessmentResultForm from "@/components/ctw-gsto-assessment/GstoAssessmentResultForm";
import { Icon } from "@iconify/react";

const GSTO_ASSESSMENT_MODULE_CODE = "gsto_assessment";

export default function EditGstoAssessmentResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const resultId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getGstoAssessmentFormOptions(user?.id || 0);
        if (options?.module) {
          setModuleId(options.module.id);
        } else {
          setModuleId(null);
          setLoading(false);
          setError("Module not found.");
        }
      } catch (err) {
        setModuleId(null);
        setLoading(false);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModuleId();
  }, [user?.id]);

  useEffect(() => {
    if (moduleId === null || !resultId) { setLoading(false); return; }

    const loadResult = async () => {
      try {
        setLoadingResult(true);
        const resultData = await ctwGstoAssessmentResultService.getResult(moduleId, parseInt(resultId));
        if (resultData) {
          setResult(resultData);
        } else {
          setError("Result not found");
        }
      } catch (err) {
        console.error("Failed to load result:", err);
        setError("Failed to load result data. Please refresh the page.");
      } finally {
        setLoadingResult(false);
      }
    };

    loadResult();
  }, [moduleId, resultId]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwGstoAssessmentResultService.updateResult(parseInt(resultId), data);
      router.push("/ctw/results/assessment_observation/gsto");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/assessment_observation/gsto");
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
          <button onClick={() => router.push("/ctw/results/assessment_observation/gsto")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold">
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit CTW GSTO Assessment Observation</h2>
      </div>

      <GstoAssessmentResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
