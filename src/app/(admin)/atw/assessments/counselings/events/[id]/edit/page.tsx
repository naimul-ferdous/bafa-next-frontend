/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { atwAssessmentCounselingTypeService } from "@/libs/services/atwAssessmentCounselingTypeService";
import FullLogo from "@/components/ui/fulllogo";
import CounselingTypeForm from "@/components/atw-assessment-counseling/CounselingTypeForm";
import type { AtwAssessmentCounselingType, AtwAssessmentCounselingTypeCreateData } from "@/libs/types/atwAssessmentCounseling";
import { Icon } from "@iconify/react";

export default function EditCounselingTypePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = parseInt(resolvedParams.id);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialData, setInitialData] = useState<AtwAssessmentCounselingType | null>(null);

  useEffect(() => {
    const fetchType = async () => {
      try {
        setFetching(true);
        const data = await atwAssessmentCounselingTypeService.getType(id);
        if (data) {
          setInitialData(data);
        } else {
          router.push("/atw/assessments/counselings/events");
        }
      } catch (error) {
        console.error("Failed to fetch Counseling type:", error);
        router.push("/atw/assessments/counselings/events");
      } finally {
        setFetching(false);
      }
    };
    fetchType();
  }, [id, router]);

  const handleSubmit = async (data: AtwAssessmentCounselingTypeCreateData) => {
    setLoading(true);
    try {
      await atwAssessmentCounselingTypeService.updateType(id, data);
      router.push("/atw/assessments/counselings/events");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/counselings/events");
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Counseling Type</h2>
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
