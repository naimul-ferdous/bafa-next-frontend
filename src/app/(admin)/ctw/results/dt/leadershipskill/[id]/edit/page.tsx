/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ctwLeadershipSkillResultService } from "@/libs/services/ctwLeadershipSkillResultService";
import { ctwCommonService } from "@/libs/services/ctwCommonService";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import LeadershipSkillResultForm from "@/components/ctw-leadership-skill/LeadershipSkillResultForm";
import { Icon } from "@iconify/react";
import type { CtwLeadershipSkillResult } from "@/libs/types/ctwLeadershipSkill";

const LEADERSHIP_SKILL_MODULE_CODE = "leadership_skill";

export default function EditLeadershipSkillResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const resultId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState<CtwLeadershipSkillResult | null>(null);
  const [error, setError] = useState("");

  const [leadershipSkillModuleId, setLeadershipSkillModuleId] = useState<number | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchModuleId = async () => {
      try {
        setModuleLoading(true);
        const options = await ctwCommonService.getLeadershipSkillFormOptions(user?.id || 0);
        if (options?.module) {
          setLeadershipSkillModuleId(options.module.id);
        } else {
          setLeadershipSkillModuleId(null);
          setError("Module not found.");
        }
      } catch (err) {
        setLeadershipSkillModuleId(null);
        setError("Failed to fetch module ID.");
      } finally {
        setModuleLoading(false);
      }
    };
    if (user?.id) fetchModuleId();
  }, [user?.id]);

  useEffect(() => {
    const loadResult = async () => {
      if (leadershipSkillModuleId === null) return;
      try {
        setLoadingResult(true);
        const resultData = await ctwLeadershipSkillResultService.getResult(leadershipSkillModuleId, parseInt(resultId));
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
  }, [resultId, leadershipSkillModuleId, moduleLoading]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwLeadershipSkillResultService.updateResult(parseInt(resultId), data);
      router.push("/ctw/results/dt/leadershipskill");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/dt/leadershipskill");
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
          <button onClick={() => router.push("/ctw/results/dt/leadershipskill")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit CTW Leadership Skill Result</h2>
      </div>

      <LeadershipSkillResultForm
        initialData={result}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
