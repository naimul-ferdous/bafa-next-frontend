"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Ftw12sqnFlyingType } from "@/libs/types/ftw12sqnFlying";

interface FlyingTypeModalContextType {
  isOpen: boolean;
  editingType: Ftw12sqnFlyingType | null;
  viewingType: Ftw12sqnFlyingType | null;
  isViewMode: boolean;
  openModal: (type?: Ftw12sqnFlyingType) => void;
  openViewModal: (type: Ftw12sqnFlyingType) => void;
  closeModal: () => void;
}

const FlyingTypeModalContext = createContext<FlyingTypeModalContextType | undefined>(undefined);

export function Ftw12sqnFlyingTypeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState<Ftw12sqnFlyingType | null>(null);
  const [viewingType, setViewingType] = useState<Ftw12sqnFlyingType | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const openModal = (type?: Ftw12sqnFlyingType) => {
    setEditingType(type || null);
    setViewingType(null);
    setIsViewMode(false);
    setIsOpen(true);
  };

  const openViewModal = (type: Ftw12sqnFlyingType) => {
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

export function useFtw12sqnFlyingTypeModal() {
  const context = useContext(FlyingTypeModalContext);
  if (context === undefined) {
    throw new Error("useFtw12sqnFlyingTypeModal must be used within a Ftw12sqnFlyingTypeModalProvider");
  }
  return context;
}
