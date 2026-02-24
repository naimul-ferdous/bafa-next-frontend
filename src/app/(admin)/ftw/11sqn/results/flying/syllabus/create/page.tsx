/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw11sqnFlyingSyllabusService } from "@/libs/services/ftw11sqnFlyingSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import SyllabusForm from "@/components/ftw-11sqn-flying/SyllabusForm";
import type { Ftw11sqnFlyingSyllabusCreateData } from "@/libs/types/ftw11sqnFlying";

export default function CreateFlyingSyllabusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Single API call - no loop needed
  const handleSubmit = async (data: Ftw11sqnFlyingSyllabusCreateData) => {
    setLoading(true);
    try {
      await ftw11sqnFlyingSyllabusService.create(data);
      router.push("/ftw/11sqn/results/flying/syllabus");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/11sqn/results/flying/syllabus");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create Flying Syllabus</h2>
      </div>

      <SyllabusForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
