/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ctwSwimmingResultService } from "@/libs/services/ctwSwimmingResultService";
import FullLogo from "@/components/ui/fulllogo";
import SwimmingResultForm from "@/components/ctw-swimming/SwimmingResultForm";

export default function CreateSwimmingResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwSwimmingResultService.createResult(data);
      router.refresh();
      router.push("/ctw/results/pf/swimming");
    } catch (err: any) {
      console.error("Failed to create result:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/pf/swimming");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create CTW Swimming Result</h2>
      </div>

      <SwimmingResultForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
