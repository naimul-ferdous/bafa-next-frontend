/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { atwMarksheetService } from "@/libs/services/atwMarksheetService";
import FullLogo from "@/components/ui/fulllogo";
import MarksheetForm from "@/components/atw-subjects/MarksheetForm";

export default function CreateMarksheetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await atwMarksheetService.createMarksheet(data);
      router.push("/atw/subjects/modules/marksheets");
    } catch (error) {
      console.error("Failed to create marksheet:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create Subject Module Marksheet</h2>
      </div>

      <MarksheetForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/atw/subjects/modules/marksheets")}
        loading={loading}
      />
    </div>
  );
}
