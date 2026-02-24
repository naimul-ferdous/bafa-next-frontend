/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ctwGamesResultService } from "@/libs/services/ctwGamesResultService";
import FullLogo from "@/components/ui/fulllogo";
import GamesResultForm from "@/components/ctw-games/GamesResultForm";

export default function CreateGamesResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await ctwGamesResultService.createResult(data);
      router.refresh();
      router.push("/ctw/results/pf/games");
    } catch (err: any) {
      console.error("Failed to create result:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/ctw/results/pf/games");
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><FullLogo /></div>
        <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
        <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">Create CTW Games Result</h2>
      </div>

      <GamesResultForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
}
