"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Ftw11sqnFlyingPhaseType } from "@/libs/types/ftw11sqnFlying";

interface PhaseTypeModalContextType {
  isOpen: boolean;
  editingType: Ftw11sqnFlyingPhaseType | null;
  viewingType: Ftw11sqnFlyingPhaseType | null;
  isViewMode: boolean;
  openModal: (type?: Ftw11sqnFlyingPhaseType) => void;
  openViewModal: (type: Ftw11sqnFlyingPhaseType) => void;
  closeModal: () => void;
}

const PhaseTypeModalContext = createContext<PhaseTypeModalContextType | undefined>(undefined);

export function Ftw11sqnFlyingPhaseTypeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState<Ftw11sqnFlyingPhaseType | null>(null);
  const [viewingType, setViewingType] = useState<Ftw11sqnFlyingPhaseType | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const openModal = (type?: Ftw11sqnFlyingPhaseType) => {
    setEditingType(type || null);
    setViewingType(null);
    setIsViewMode(false);
    setIsOpen(true);
  };

  const openViewModal = (type: Ftw11sqnFlyingPhaseType) => {
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

export function useFtw11sqnFlyingPhaseTypeModal() {
  const context = useContext(PhaseTypeModalContext);
  if (context === undefined) {
    throw new Error("useFtw11sqnFlyingPhaseTypeModal must be used within a Ftw11sqnFlyingPhaseTypeModalProvider");
  }
  return context;
}
