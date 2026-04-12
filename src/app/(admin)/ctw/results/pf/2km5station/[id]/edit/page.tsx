/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ctwOneMileResultService } from "@/libs/services/ctwOneMileResultService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import TwoKmFiveStationResultForm from "@/components/ctw-2km5station/TwoKmFiveStationResultForm";
import { Icon } from "@iconify/react";
import type { CtwOneMileResult } from "@/libs/types/ctwOneMile";

const TWO_KM_5_STATION_MODULE_CODE = "2km_5_station";

export default function EditTwoKmFiveStationResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<CtwOneMileResult | null>(null);
  const [error, setError] = useState("");
  const [twoKmModuleId, setTwoKmModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getTwoKmFiveStationFormOptions(user?.id || 0);
        if (options?.module) {
          setTwoKmModuleId(options.module.id);
        } else {
          setTwoKmModuleId(null);
          setLoading(false);
          setError("Module not found.");
        }
      } catch (err) {
        setTwoKmModuleId(null);
        setLoading(false);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModuleId();
  }, [user?.id]);

  useEffect(() => {
    const fetchModuleAndResult = async () => {
      try {
        setLoadingResult(true);
        const options = await ctwCommonService.getTwoKmFiveStationFormOptions(user?.id || 0);

        if (options?.module) {
          setTwoKmModuleId(options.module.id);
          const resultData = await ctwOneMileResultService.getResult(options.module.id, parseInt(resultId));
          if (resultData) {
            setResult(resultData);
          } else {
            setError("Result not found");
          }
        } else {
          setError(`Module with code ${TWO_KM_5_STATION_MODULE_CODE} not found.`);
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
      await ctwOneMileResultService.updateResult(parseInt(resultId), data);
      router.refresh();
      router.push("/ctw/results/pf/2km5station");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/pf/2km5station");
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
          <button onClick={() => router.push("/ctw/results/pf/2km5station")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit CTW 2KM 5 Station Result</h2>
      </div>

      <TwoKmFiveStationResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
