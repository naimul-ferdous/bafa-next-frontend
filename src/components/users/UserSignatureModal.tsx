"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import FullLogo from "../ui/fulllogo";
import { Modal } from "@/components/ui/modal";
import { userService } from "@/libs/services/userService";
import type { User } from "@/libs/types/user";
import Image from "next/image";

interface UserSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

export default function UserSignatureModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UserSignatureModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setBase64Image(result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !base64Image) return;

    setLoading(true);
    setError(null);

    try {
      await userService.updateUser(user.id, {
        signature: base64Image,
      });
      
      setPreview(null);
      setBase64Image(null);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update signature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton className="max-w-md">
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">
            Update User Signature
          </h2>
          <p className="text-sm text-gray-500">
            Upload signature for {user?.name || "User"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            {preview ? (
              <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center p-2">
                <Image
                  src={preview}
                  alt="Signature Preview"
                  fill
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={() => { setPreview(null); setBase64Image(null); }}
                  className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                >
                  <Icon icon="hugeicons:cancel-01" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer flex flex-col items-center justify-center transition-colors">
                <Icon icon="hugeicons:image-upload" className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Click to upload signature image</span>
                <span className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 2MB (Transparent PNG preferred)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !base64Image}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Icon icon="hugeicons:fan-01" className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="hugeicons:checkmark-circle-02" className="w-4 h-4" />
                  Save Signature
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
