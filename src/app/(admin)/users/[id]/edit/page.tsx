/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userService } from "@/libs/services/userService";
import UserForm from "@/components/users/UserForm";
import type { User } from "@/libs/types/user";
import { Icon } from "@iconify/react";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await userService.getUser(parseInt(id));
        if (data) {
          setUser(data);
        } else {
          setError("User not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleSubmit = async (formData: any, selectedRoles: number[]) => {
    setSaving(true);
    try {
      await userService.updateUser(parseInt(id), formData);
      if (selectedRoles.length > 0) {
        await userService.syncRoles(parseInt(id), selectedRoles, formData.wing_id, formData.sub_wing_id);
      }
      router.push("/users");
    } catch (err: any) {
      throw err; // Form will handle the error display
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/users");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
        <button 
          onClick={handleCancel}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <UserForm 
        initialData={user}
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
        loading={saving} 
        isEdit={true}
      />
    </div>
  );
}
