/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw12sqnFlyingSyllabusService } from "@/libs/services/ftw12sqnFlyingSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import SyllabusForm from "@/components/ftw-12sqn-flying/SyllabusForm";
import type { Ftw12sqnFlyingSyllabusCreateData } from "@/libs/types/ftw12sqnFlying";

export default function CreateFlyingSyllabusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Ftw12sqnFlyingSyllabusCreateData) => {
    setLoading(true);
    try {
      await ftw12sqnFlyingSyllabusService.create(data);
      router.push("/ftw/12sqn/results/flying/syllabus");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/results/flying/syllabus");
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 uppercase">Create New Flying Syllabus</h2>
        <h2 className="text-md font-semibold text-gray-700 mb-2 uppercase">FTW 12 SQN</h2>
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
