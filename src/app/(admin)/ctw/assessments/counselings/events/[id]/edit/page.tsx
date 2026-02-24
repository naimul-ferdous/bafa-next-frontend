"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ctwAssessmentCounselingTypeService } from "@/libs/services/ctwAssessmentCounselingTypeService";
import FullLogo from "@/components/ui/fulllogo";
import CounselingTypeForm from "@/components/ctw-assessment-counseling/CounselingTypeForm";
import { Icon } from "@iconify/react";
import type { CtwAssessmentCounselingType } from "@/libs/types/ctw";

export default function EditCounselingTypePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const typeId = resolvedParams.id;

  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(true);
  const [type, setType] = useState<CtwAssessmentCounselingType | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadType = async () => {
      try {
        setLoadingType(true);
        const typeData = await ctwAssessmentCounselingTypeService.getType(parseInt(typeId));
        if (typeData) {
          setType(typeData);
        } else {
          setError("Counseling type not found");
        }
      } catch (err) {
        console.error("Failed to load Counseling type:", err);
        setError("Failed to load Counseling type data. Please refresh the page.");
      } finally {
        setLoadingType(false);
      }
    };

    if (typeId) {
      loadType();
    }
  }, [typeId]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwAssessmentCounselingTypeService.updateType(parseInt(typeId), data);
      router.push("/ctw/assessments/counselings/events");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/assessments/counselings/events");
  };

  if (loadingType) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading Counseling type data...</p>
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
          <button onClick={() => router.push("/ctw/assessments/counselings/events")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to List
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Counseling Type</h2>
      </div>

      <CounselingTypeForm
        initialData={type}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
