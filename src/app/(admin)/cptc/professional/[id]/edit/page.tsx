/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { cptcProfessionalResultService } from "@/libs/services/cptcProfessionalResultService";
import FullLogo from "@/components/ui/fulllogo";
import ProfessionalResultForm from "@/components/cptc-professional/ProfessionalResultForm";
import type { CptcProfessionalResult } from "@/libs/types/cptcProfessionalResult";

export default function EditProfessionalResultPage() {
  const router = useRouter();
  const params = useParams();
  const resultId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CptcProfessionalResult | null>(null);

  // Load existing result
  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const data = await cptcProfessionalResultService.getResult(parseInt(resultId));
        if (data) {
          setResult(data);
        } else {
          setError("Result not found");
        }
      } catch (err) {
        console.error("Failed to load result:", err);
        setError("Failed to load result data");
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  const handleSubmit = async (data: any) => {
    setSubmitLoading(true);
    try {
      await cptcProfessionalResultService.updateResult(parseInt(resultId), data);
      router.push("/cptc/professional");
    } catch (err: any) {
      throw err;
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/cptc/professional");
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:fan-01" className="w-10 h-10 animate-spin mx-auto my-10 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:alert-circle" className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleCancel}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Professional Result</h2>
      </div>

      <ProfessionalResultForm
        initialData={result || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitLoading}
        isEdit={true}
      />
    </div>
  );
}
