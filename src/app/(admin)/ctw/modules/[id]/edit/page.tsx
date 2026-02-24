/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { ctwResultsModuleService } from "@/libs/services/ctwResultsModuleService";
import FullLogo from "@/components/ui/fulllogo";
import CtwModuleForm from "@/components/ctw-modules/CtwModuleForm";
import type { CtwResultsModule } from "@/libs/types/ctw";

export default function EditCtwModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = parseInt(params?.id as string);

  const [loading, setLoading] = useState(false);
  const [loadingModule, setLoadingModule] = useState(true);
  const [moduleData, setModuleData] = useState<CtwResultsModule | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadModule = async () => {
      try {
        setLoadingModule(true);
        const data = await ctwResultsModuleService.getModule(moduleId);
        if (data) {
          setModuleData(data);
        } else {
          setError("Module not found");
        }
      } catch (err) {
        console.error("Failed to load module:", err);
        setError("Failed to load module data. Please refresh the page.");
      } finally {
        setLoadingModule(false);
      }
    };

    if (moduleId) {
      loadModule();
    }
  }, [moduleId]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwResultsModuleService.updateModule(moduleId, data);
      router.push("/ctw/modules");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/modules");
  };

  if (loadingModule) {
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
          <button onClick={() => router.push("/ctw/modules")} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
            Back to Modules
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
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Edit CTW Module</h2>
        <p className="text-sm text-gray-500 mt-1">Update module details</p>
      </div>

      <CtwModuleForm
        initialData={moduleData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </div>
  );
}
