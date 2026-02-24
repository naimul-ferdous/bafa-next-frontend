"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Ftw12sqnFlyingPhaseType } from "@/libs/types/ftw12sqnFlying";

interface PhaseTypeModalContextType {
  isOpen: boolean;
  editingType: Ftw12sqnFlyingPhaseType | null;
  viewingType: Ftw12sqnFlyingPhaseType | null;
  isViewMode: boolean;
  openModal: (type?: Ftw12sqnFlyingPhaseType) => void;
  openViewModal: (type: Ftw12sqnFlyingPhaseType) => void;
  closeModal: () => void;
}

const PhaseTypeModalContext = createContext<PhaseTypeModalContextType | undefined>(undefined);

export function Ftw12sqnFlyingPhaseTypeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState<Ftw12sqnFlyingPhaseType | null>(null);
  const [viewingType, setViewingType] = useState<Ftw12sqnFlyingPhaseType | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const openModal = (type?: Ftw12sqnFlyingPhaseType) => {
    setEditingType(type || null);
    setViewingType(null);
    setIsViewMode(false);
    setIsOpen(true);
  };

  const openViewModal = (type: Ftw12sqnFlyingPhaseType) => {
    setViewingType(type);
    setEditingType(null);
    setIsViewMode(true);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      setEditingType(null);
      setViewingType(null);
      setIsViewMode(false);
    }, 300);
  };

  return (
    <PhaseTypeModalContext.Provider value={{ isOpen, editingType, viewingType, isViewMode, openModal, openViewModal, closeModal }}>
      {children}
    </PhaseTypeModalContext.Provider>
  );
}

export function useFtw12sqnFlyingPhaseTypeModal() {
  const context = useContext(PhaseTypeModalContext);
  if (context === undefined) {
    throw new Error("useFtw12sqnFlyingPhaseTypeModal must be used within a Ftw12sqnFlyingPhaseTypeModalProvider");
  }
  return context;
}
