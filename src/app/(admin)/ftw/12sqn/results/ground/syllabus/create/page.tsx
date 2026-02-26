/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import GroundSyllabusForm from "@/components/ftw-12sqn-ground/GroundSyllabusForm";
import type { Ftw12sqnGroundSyllabusCreateData } from "@/libs/types/ftw12sqnFlying";
import { Icon } from "@iconify/react";

export default function CreateGroundSyllabusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Ftw12sqnGroundSyllabusCreateData) => {
    setLoading(true);
    try {
      await ftw12sqnGroundSyllabusService.create(data);
      router.push("/ftw/12sqn/results/ground/syllabus");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ftw/12sqn/results/ground/syllabus");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 flex items-center justify-between no-print">
        <button
          onClick={() => history.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
          Back to List
        </button>
      </div>
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
        <p className="text-center font-medium text-gray-900 uppercase tracking-wider">Create New Ground Syllabus</p>
        <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">FTW 12 SQN</p>
      </div>

      <div className="p-4 mx-auto">
        <GroundSyllabusForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          isEdit={false}
        />
      </div>
    </div>
  );
}
