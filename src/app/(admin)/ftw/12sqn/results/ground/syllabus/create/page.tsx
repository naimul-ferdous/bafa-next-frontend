/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ftw12sqnGroundSyllabusService } from "@/libs/services/ftw12sqnGroundSyllabusService";
import FullLogo from "@/components/ui/fulllogo";
import GroundSyllabusForm from "@/components/ftw-12sqn-ground/GroundSyllabusForm";
import type { Ftw12sqnGroundSyllabusCreateData } from "@/libs/types/ftw12sqnFlying";

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
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create Ground Syllabus</h2>
      </div>

      <GroundSyllabusForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
