/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cadetService } from "@/libs/services/cadetService";
import CadetForm from "@/components/cadets/CadetForm";

export default function CreateCadetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      await cadetService.createCadet(formData);
      router.push("/users/cadets");
    } catch (err: any) {
      throw err; // Let CadetForm handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/users/cadets");
  };

  return (
    <div className="mx-auto">
      <CadetForm 
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
        loading={loading} 
        isEdit={false}
      />
    </div>
  );
}