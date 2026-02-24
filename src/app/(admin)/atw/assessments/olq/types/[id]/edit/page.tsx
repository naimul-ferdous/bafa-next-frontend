/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { atwAssessmentOlqTypeService } from "@/libs/services/atwAssessmentOlqTypeService";
import FullLogo from "@/components/ui/fulllogo";
import OlqTypeForm from "@/components/atw-assessment-olq/OlqTypeForm";
import { Icon } from "@iconify/react";
import type { AtwAssessmentOlqType, AtwAssessmentOlqTypeCreateData } from "@/libs/types/atwAssessmentOlq";

export default function EditOlqTypePage() {
  const router = useRouter();
  const params = useParams();
  const typeId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(true);
  const [type, setType] = useState<AtwAssessmentOlqType | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadType = async () => {
      try {
        setLoadingType(true);
        const typeData = await atwAssessmentOlqTypeService.getType(parseInt(typeId));
        if (typeData) {
          setType(typeData);
        } else {
          setError("OLQ Type not found");
        }
      } catch (err) {
        console.error("Failed to load OLQ type:", err);
        setError("Failed to load OLQ type data. Please refresh the page.");
      } finally {
        setLoadingType(false);
      }
    };

    if (typeId) {
      loadType();
    }
  }, [typeId]);

  const handleSubmit = async (data: AtwAssessmentOlqTypeCreateData) => {
    setLoading(true);
    try {
      await atwAssessmentOlqTypeService.updateType(parseInt(typeId), data);
      router.push("/atw/assessments/olq/types");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/atw/assessments/olq/types");
  };

  if (loadingType) {
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
          <button onClick={() => router.push("/atw/assessments/olq/types")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to OLQ Types
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit OLQ Type</h2>
      </div>

      <OlqTypeForm
        initialData={type}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
