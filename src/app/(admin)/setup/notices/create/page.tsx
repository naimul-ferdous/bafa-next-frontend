/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { aroService } from "@/libs/services/aroService";
import FullLogo from "@/components/ui/fulllogo";
import AroForm from "@/components/notices/AroForm";

export default function CreateNoticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await aroService.create(data);
      router.push("/setup/notices");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Add New Notice / ARO</h2>
      </div>

      <AroForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/setup/notices")}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
