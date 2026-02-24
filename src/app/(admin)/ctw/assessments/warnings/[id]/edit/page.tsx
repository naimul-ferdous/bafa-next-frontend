"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ctwCadetWarningService } from "@/libs/services/ctwCadetWarningService";
import FullLogo from "@/components/ui/fulllogo";
import CtwCadetWarningForm from "@/components/ctw/warnings/CtwCadetWarningForm";
import { CadetWarning } from "@/libs/types/system";
import { Icon } from "@iconify/react";

export default function EditCtwCadetWarningPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = parseInt(resolvedParams.id);
  
  const [loading, setLoading] = useState(false);
  const [loadingWarning, setLoadingWarning] = useState(true);
  const [warning, setWarning] = useState<CadetWarning | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWarning = async () => {
      try {
        setLoadingWarning(true);
        const data = await ctwCadetWarningService.getById(id);
        if (data) {
          setWarning(data);
        } else {
          setError("Warning not found");
        }
      } catch (err) {
        console.error("Failed to fetch warning:", err);
        setError("Failed to load warning details. Please refresh the page.");
      } finally {
        setLoadingWarning(false);
      }
    };

    if (id) fetchWarning();
  }, [id]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwCadetWarningService.update(id, data);
      router.push("/ctw/assessments/warnings");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/assessments/warnings");
  };

  if (loadingWarning) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12">
          <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 font-bold">Loading warning data...</p>
        </div>
      </div>
    );
  }

  if (error || !warning) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="text-center py-12 text-red-600">
          <Icon icon="hugeicons:alert-circle" className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold">{error || "Warning not found"}</h2>
          <button 
            onClick={() => router.push("/ctw/assessments/warnings")} 
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-bold"
          >
            Back to Warnings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase tracking-widest underline decoration-2 underline-offset-4">Edit Cadet Warning (CTW)</h2>
      </div>

      <CtwCadetWarningForm 
        initialData={warning} 
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true} 
      />
    </div>
  );
}
