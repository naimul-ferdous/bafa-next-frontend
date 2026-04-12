/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import EstimatedMarkForm from "@/components/ctw-modules/EstimatedMarkForm";

export default function CreateEstimatedMarkPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = parseInt(params?.id as string);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwResultsModuleService.storeEstimatedMark(moduleId, data);
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

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Add New Estimated Mark</h2>
        <p className="text-sm text-gray-500 mt-1">Configure new estimated mark for this module</p>
      </div>

      <EstimatedMarkForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
        moduleId={moduleId}
      />
    </div>
  );
}
