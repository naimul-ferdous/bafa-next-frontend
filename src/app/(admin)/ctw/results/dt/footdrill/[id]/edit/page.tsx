/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ctwFootDrillResultService } from "@/libs/services/ctwFootDrillResultService";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import FootDrillResultForm from "@/components/ctw-foot-drill/FootDrillResultForm";
import { Icon } from "@iconify/react";
import type { CtwFootDrillResult } from "@/libs/types/ctwFootDrill";

const FOOT_DRILL_MODULE_CODE = "foot_drill";

export default function EditFootDrillResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<CtwFootDrillResult | null>(null);
  const [error, setError] = useState("");

  // New state for module ID and its loading state
  const [footDrillModuleId, setFootDrillModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  // Fetch footDrillModuleId
  useEffect(() => {
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const modulesRes = await ctwResultsModuleService.getAllModules({ per_page: 100 });
        const footDrillModule = modulesRes.data.find((m: any) => m.code === FOOT_DRILL_MODULE_CODE);
        if (footDrillModule) {
          setFootDrillModuleId(footDrillModule.id);
        } else {
          console.error(`Module with code ${FOOT_DRILL_MODULE_CODE} not found.`);
          setError(`Module with code ${FOOT_DRILL_MODULE_CODE} not found.`);
        }
      } catch (err) {
        console.error("Failed to fetch module ID:", err);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModuleId();
  }, []);

  useEffect(() => {
    const loadResult = async () => {
      if (footDrillModuleId === null || resultId === undefined) {
        return;
      }

      try {
        setLoadingResult(true);
        const resultData = await ctwFootDrillResultService.getResult(footDrillModuleId, parseInt(resultId));
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

    if (!moduleLoading && resultId) {
      loadResult();
    }
  }, [resultId, footDrillModuleId, moduleLoading]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwFootDrillResultService.updateResult(parseInt(resultId), data);
      router.push("/ctw/results/dt/footdrill");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/dt/footdrill");
  };

  if (loadingResult || moduleLoading) {
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
          <button onClick={() => router.push("/ctw/results/dt/footdrill")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit CTW Foot Drill Result</h2>
      </div>

      <FootDrillResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
