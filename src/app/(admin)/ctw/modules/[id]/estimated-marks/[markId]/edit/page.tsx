/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import EstimatedMarkForm from "@/components/ctw-modules/EstimatedMarkForm";
import type { CtwResultsModuleEstimatedMark } from "@/libs/types/ctw";

export default function EditEstimatedMarkPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = parseInt(params?.id as string);
  const markId = parseInt(params?.markId as string);

  const [loading, setLoading] = useState(false);
  const [loadingMark, setLoadingMark] = useState(true);
  const [markData, setMarkData] = useState<CtwResultsModuleEstimatedMark | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMark = async () => {
      try {
        setLoadingMark(true);
        const marks = await ctwResultsModuleService.getEstimatedMarks(moduleId);
        const found = marks.find((m: any) => m.id === markId);
        if (found) {
          setMarkData(found);
        } else {
          setError("Estimated mark not found");
        }
      } catch (err) {
        console.error("Failed to load estimated mark:", err);
        setError("Failed to load estimated mark data. Please refresh the page.");
      } finally {
        setLoadingMark(false);
      }
    };

    if (moduleId && markId) {
      loadMark();
    }
  }, [moduleId, markId]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwResultsModuleService.updateEstimatedMark(moduleId, markId, data);
      router.push(`/ctw/modules/${moduleId}`);
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/ctw/modules/${moduleId}`);
  };

  if (loadingMark) {
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
          <button onClick={() => router.push(`/ctw/modules/${moduleId}`)} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Module
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit Estimated Mark</h2>
        <p className="text-sm text-gray-500 mt-1">Update estimated mark configuration</p>
      </div>

      <EstimatedMarkForm
        initialData={markData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
