/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ctwGamesResultService } from "@/libs/services/ctwGamesResultService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import GamesResultForm from "@/components/ctw-games/GamesResultForm";
import { Icon } from "@iconify/react";
import type { CtwGamesResult } from "@/libs/types/ctwGames";

const GAMES_MODULE_CODE = "games";

export default function EditGamesResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<CtwGamesResult | null>(null);
  const [error, setError] = useState("");
  const [gamesModuleId, setGamesModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getGamesFormOptions(user?.id || 0);
        if (options?.module) {
          setGamesModuleId(options.module.id);
        } else {
          setGamesModuleId(null);
          setLoading(false);
          setError("Module not found.");
        }
      } catch (err) {
        setGamesModuleId(null);
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
        const options = await ctwCommonService.getGamesFormOptions(user?.id || 0);

        if (options?.module) {
          const resultData = await ctwGamesResultService.getResult(options.module.id, parseInt(resultId));
          if (resultData) {
            setResult(resultData);
          } else {
            setError("Result not found");
          }
        } else {
          setError(`Module with code ${GAMES_MODULE_CODE} not found.`);
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
      await ctwGamesResultService.updateResult(parseInt(resultId), data);
      router.refresh();
      router.push("/ctw/results/pf/games");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/pf/games");
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
          <button onClick={() => router.push("/ctw/results/pf/games")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit CTW Games Result</h2>
      </div>

      <GamesResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
