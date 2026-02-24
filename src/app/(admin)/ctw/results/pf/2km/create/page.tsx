/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ctw2kmResultService } from "@/libs/services/ctw2kmResultService";
import FullLogo from "@/components/ui/fulllogo";
import TwoKmResultForm from "@/components/ctw-2km/TwoKmResultForm";

export default function Create2kmResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctw2kmResultService.createResult(data);
      router.refresh();
      router.push("/ctw/results/pf/2km");
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/pf/2km");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create CTW 2KM Result</h2>
      </div>

      <TwoKmResultForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
