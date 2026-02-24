"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Ftw11sqnFlyingType } from "@/libs/types/ftw11sqnFlying";

interface FlyingTypeModalContextType {
  isOpen: boolean;
  editingType: Ftw11sqnFlyingType | null;
  viewingType: Ftw11sqnFlyingType | null;
  isViewMode: boolean;
  openModal: (type?: Ftw11sqnFlyingType) => void;
  openViewModal: (type: Ftw11sqnFlyingType) => void;
  closeModal: () => void;
}

const FlyingTypeModalContext = createContext<FlyingTypeModalContextType | undefined>(undefined);

export function Ftw11sqnFlyingTypeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState<Ftw11sqnFlyingType | null>(null);
  const [viewingType, setViewingType] = useState<Ftw11sqnFlyingType | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const openModal = (type?: Ftw11sqnFlyingType) => {
    setEditingType(type || null);
    setViewingType(null);
    setIsViewMode(false);
    setIsOpen(true);
  };

  const openViewModal = (type: Ftw11sqnFlyingType) => {
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
    <FlyingTypeModalContext.Provider value={{ isOpen, editingType, viewingType, isViewMode, openModal, openViewModal, closeModal }}>
      {children}
    </FlyingTypeModalContext.Provider>
  );
}

export function useFtw11sqnFlyingTypeModal() {
  const context = useContext(FlyingTypeModalContext);
  if (context === undefined) {
    throw new Error("useFtw11sqnFlyingTypeModal must be used within a Ftw11sqnFlyingTypeModalProvider");
  }
  return context;
}
