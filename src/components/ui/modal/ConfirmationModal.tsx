"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "warning" | "info" | "success";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "danger",
}: ConfirmationModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "hugeicons:alert-02",
          iconColor: "text-red-600",
          iconBg: "bg-red-100",
          buttonClass: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: "hugeicons:alert-02",
          iconColor: "text-yellow-600",
          iconBg: "bg-yellow-100",
          buttonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      case "info":
        return {
          icon: "hugeicons:information-circle",
          iconColor: "text-blue-600",
          iconBg: "bg-blue-100",
          buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      case "success":
        return {
          icon: "hugeicons:checkmark-circle-02",
          iconColor: "text-green-600",
          iconBg: "bg-green-100",
          buttonClass: "bg-green-600 hover:bg-green-700 text-white",
        };
      default:
        return {
          icon: "hugeicons:alert-circle",
          iconColor: "text-red-600",
          iconBg: "bg-red-100",
          buttonClass: "bg-red-600 hover:bg-red-700 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-xl p-0">
      <div className="p-8">
        {/* Centered Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
            <Icon icon={styles.icon} className={`w-8 h-8 ${styles.iconColor}`} />
          </div>
        </div>

        {/* Centered Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
          {title}
        </h3>

        {/* Centered Message */}
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          {message}
        </p>

        {/* Centered Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.buttonClass}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-6 py-2 border border-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
