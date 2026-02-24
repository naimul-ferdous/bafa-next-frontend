/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ftw12sqnAssessmentCounselingTypeService } from "@/libs/services/ftw12sqnAssessmentCounselingTypeService";
import FullLogo from "@/components/ui/fulllogo";
import CounselingTypeForm from "@/components/ftw-12sqn-assessment-counseling/CounselingTypeForm";
import type { Ftw12sqnAssessmentCounselingType } from "@/libs/types/system";
import { Icon } from "@iconify/react";

export default function Ftw12sqnEditCounselingTypePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = parseInt(resolvedParams.id);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialData, setInitialData] = useState<Ftw12sqnAssessmentCounselingType | null>(null);

  useEffect(() => {
    const fetchType = async () => {
      try {
        setFetching(true);
        const data = await ftw12sqnAssessmentCounselingTypeService.getType(id);
        if (data) {
          setInitialData(data);
        } else {
          router.push("/ftw/12sqn/assessments/counselings/events");
        }
      } catch (error) {
        console.error("Failed to fetch Counseling type:", error);
        router.push("/ftw/12sqn/assessments/counselings/events");
      } finally {
        setFetching(false);
      }
    };
    fetchType();
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ftw12sqnAssessmentCounselingTypeService.updateType(id, data);
      router.push("/ftw/12sqn/assessments/counselings/events");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/assessments/counselings/events");
  };

  if (fetching) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 12 SQN Edit Counseling Type</h2>
      </div>

      <CounselingTypeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
