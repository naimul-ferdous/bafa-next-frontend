/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/libs/services/userService";
import UserForm from "@/components/users/UserForm";

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any, selectedRoles: number[]) => {
    setLoading(true);
    try {
      const newUser = await userService.createUser(formData);
      if (newUser && selectedRoles.length > 0) {
        await userService.syncRoles(newUser.id, selectedRoles);
      }
      router.push("/users");
    } catch (err: any) {
      throw err; // Form will handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/users");
  };

  return (
    <div className="mx-auto">
      <UserForm 
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
        loading={loading} 
      />
    </div>
  );
}
