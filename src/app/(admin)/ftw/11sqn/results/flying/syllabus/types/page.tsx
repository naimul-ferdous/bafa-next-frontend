"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Ftw11sqnFlyingType, Ftw11sqnFlyingPhaseType } from "@/libs/types/ftw11sqnFlying";
import { Icon } from "@iconify/react";
import { ftw11sqnFlyingTypeService } from "@/libs/services/ftw11sqnFlyingTypeService";
import { ftw11sqnFlyingPhaseTypeService } from "@/libs/services/ftw11sqnFlyingPhaseTypeService";
import FullLogo from "@/components/ui/fulllogo";
import DataTable, { Column } from "@/components/ui/DataTable";
import { Ftw11sqnFlyingTypeModalProvider, useFtw11sqnFlyingTypeModal } from "@/context/Ftw11sqnFlyingTypeModalContext";
import FlyingTypeFormModal from "@/components/ftw-11sqn-flying/FlyingTypeFormModal";
import PhaseTypeFormModal from "@/components/ftw-11sqn-flying/PhaseTypeFormModal";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Ftw11sqnFlyingPhaseTypeModalProvider, useFtw11sqnFlyingPhaseTypeModal } from "@/context/Ftw11sqnFlyingPhaseTypeModalContext";

function FlyingTypesPageContent() {
    const { openModal: openFlyingTypeModal, openViewModal: openFlyingTypeViewModal } = useFtw11sqnFlyingTypeModal();
    const { openModal: openPhaseTypeModal, openViewModal: openPhaseTypeViewModal } = useFtw11sqnFlyingPhaseTypeModal();

    // Flying Types State
    const [flyingTypes, setFlyingTypes] = useState<Ftw11sqnFlyingType[]>([]);
    const [flyingTypesLoading, setFlyingTypesLoading] = useState(true);
    const [flyingTypeDeleteModalOpen, setFlyingTypeDeleteModalOpen] = useState(false);
    const [deletingFlyingType, setDeletingFlyingType] = useState<Ftw11sqnFlyingType | null>(null);
    const [flyingTypeDeleteLoading, setFlyingTypeDeleteLoading] = useState(false);
    const [flyingTypePagination, setFlyingTypePagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

    // Phase Types State
    const [phaseTypes, setPhaseTypes] = useState<Ftw11sqnFlyingPhaseType[]>([]);
    const [phaseTypesLoading, setPhaseTypesLoading] = useState(true);
    const [phaseTypeDeleteModalOpen, setPhaseTypeDeleteModalOpen] = useState(false);
    const [deletingPhaseType, setDeletingPhaseType] = useState<Ftw11sqnFlyingPhaseType | null>(null);
    const [phaseTypeDeleteLoading, setPhaseTypeDeleteLoading] = useState(false);
    const [phaseTypePagination, setPhaseTypePagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 });

    // Load Flying Types
    const loadFlyingTypes = useCallback(async () => {
        try {
            setFlyingTypesLoading(true);
            const response = await ftw11sqnFlyingTypeService.getAll({ per_page: 10000 });
            setFlyingTypes(response.data);
            setFlyingTypePagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
        } catch (error) {
            console.error("Failed to load flying types:", error);
        } finally {
            setFlyingTypesLoading(false);
        }
    }, []);

    // Load Phase Types
    const loadPhaseTypes = useCallback(async () => {
        try {
            setPhaseTypesLoading(true);
            const response = await ftw11sqnFlyingPhaseTypeService.getAll({ per_page: 10000 });
            setPhaseTypes(response.data);
            setPhaseTypePagination({ current_page: response.current_page, last_page: response.last_page, per_page: response.per_page, total: response.total, from: response.from, to: response.to });
        } catch (error) {
            console.error("Failed to load phase types:", error);
        } finally {
            setPhaseTypesLoading(false);
        }
    }, []);

    useEffect(() => { loadFlyingTypes(); }, [loadFlyingTypes]);
    useEffect(() => { loadPhaseTypes(); }, [loadPhaseTypes]);

    // Event listeners for updates
    useEffect(() => {
        const handleFlyingTypeUpdate = () => loadFlyingTypes();
        const handlePhaseTypeUpdate = () => loadPhaseTypes();
        window.addEventListener('flyingTypeUpdated', handleFlyingTypeUpdate);
        window.addEventListener('phaseTypeUpdated', handlePhaseTypeUpdate);
        return () => {
            window.removeEventListener('flyingTypeUpdated', handleFlyingTypeUpdate);
            window.removeEventListener('phaseTypeUpdated', handlePhaseTypeUpdate);
        };
    }, [loadFlyingTypes, loadPhaseTypes]);

    // Flying Type Actions
    const handleDeleteFlyingType = (type: Ftw11sqnFlyingType) => { setDeletingFlyingType(type); setFlyingTypeDeleteModalOpen(true); };
    const confirmDeleteFlyingType = async () => {
        if (!deletingFlyingType) return;
        try {
            setFlyingTypeDeleteLoading(true);
            await ftw11sqnFlyingTypeService.delete(deletingFlyingType.id);
            await loadFlyingTypes();
            setFlyingTypeDeleteModalOpen(false);
            setDeletingFlyingType(null);
        } catch (error) {
            console.error("Failed to delete flying type:", error);
            alert("Failed to delete flying type");
        } finally {
            setFlyingTypeDeleteLoading(false);
        }
    };

    // Phase Type Actions
    const handleDeletePhaseType = (type: Ftw11sqnFlyingPhaseType) => { setDeletingPhaseType(type); setPhaseTypeDeleteModalOpen(true); };
    const confirmDeletePhaseType = async () => {
        if (!deletingPhaseType) return;
        try {
            setPhaseTypeDeleteLoading(true);
            await ftw11sqnFlyingPhaseTypeService.delete(deletingPhaseType.id);
            await loadPhaseTypes();
            setPhaseTypeDeleteModalOpen(false);
            setDeletingPhaseType(null);
        } catch (error) {
            console.error("Failed to delete phase type:", error);
            alert("Failed to delete phase type");
        } finally {
            setPhaseTypeDeleteLoading(false);
        }
    };

    const TableLoading = () => (
        <div className="w-full min-h-[15vh] flex items-center justify-center">
            <div><Icon icon="hugeicons:fan-01" className="w-8 h-8 animate-spin mx-auto my-8 text-blue-500" /></div>
        </div>
    );

    // Flying Type Columns
    const flyingTypeColumns: Column<Ftw11sqnFlyingType>[] = [
        { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (_, index) => (flyingTypePagination.from || 0) + (index + 1) },
        { key: "type_name", header: "Type Name", className: "font-medium text-gray-900" },
        { key: "type_code", header: "Code", className: "text-gray-700 font-mono text-sm" },
        {
            key: "is_active", header: "Status", headerAlign: "center", className: "text-center", render: (type) => (
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${type.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {type.is_active ? "Active" : "Inactive"}
                </span>
            )
        },
        { key: "created_at", header: "Created At", className: "text-gray-700 text-sm", render: (type) => type.created_at ? new Date(type.created_at).toLocaleDateString("en-GB") : "—" },
        {
            key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print", render: (type) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openFlyingTypeViewModal(type)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
                    <button onClick={() => openFlyingTypeModal(type)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteFlyingType(type)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
                </div>
            )
        },
    ];

    // Phase Type Columns
    const phaseTypeColumns: Column<Ftw11sqnFlyingPhaseType>[] = [
        { key: "id", header: "SL.", headerAlign: "center", className: "text-center text-gray-900", render: (_, index) => (phaseTypePagination.from || 0) + (index + 1) },
        { key: "type_name", header: "Type Name", className: "font-medium text-gray-900" },
        { key: "type_code", header: "Code", className: "text-gray-700 font-mono text-sm" },
        {
            key: "is_active", header: "Status", headerAlign: "center", className: "text-center", render: (type) => (
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${type.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {type.is_active ? "Active" : "Inactive"}
                </span>
            )
        },
        { key: "created_at", header: "Created At", className: "text-gray-700 text-sm", render: (type) => type.created_at ? new Date(type.created_at).toLocaleDateString("en-GB") : "—" },
        {
            key: "actions", header: "Actions", headerAlign: "center", className: "text-center no-print", render: (type) => (
                <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openPhaseTypeViewModal(type)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Icon icon="hugeicons:view" className="w-4 h-4" /></button>
                    <button onClick={() => openPhaseTypeModal(type)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Edit"><Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" /></button>
                    <button onClick={() => handleDeletePhaseType(type)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Icon icon="hugeicons:delete-02" className="w-4 h-4" /></button>
                </div>
            )
        },
    ];

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-8">
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4"><FullLogo /></div>
                <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
                <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">FTW 11 SQN Flying Types & Phase Types</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Flying Types Section */}
                <div className="">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            Flying Types
                        </h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => openFlyingTypeModal()} className="px-4 py-2 rounded-lg text-white text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4" />Add Flying Type</button>
                            <button onClick={() => console.log('clicked')} className="px-4 py-2 rounded-lg text-white text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4" />Export</button>
                        </div>
                    </div>
                    {flyingTypesLoading ? <TableLoading /> : <DataTable columns={flyingTypeColumns} data={flyingTypes} keyExtractor={(type) => type.id.toString()} emptyMessage="No flying types found" />}
                </div>

                {/* Phase Types Section */}
                <div className="">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Icon icon="hugeicons:layers-01" className="w-5 h-5 text-green-500" />
                            Phase Types
                        </h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => openPhaseTypeModal()} className="px-4 py-2 rounded-lg text-white text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700"><Icon icon="hugeicons:add-circle" className="w-4 h-4" />Add Phase Type</button>
                            <button onClick={() => console.log('clicked')} className="px-4 py-2 rounded-lg text-white text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700"><Icon icon="hugeicons:download-04" className="w-4 h-4" />Export</button>
                        </div>
                    </div>

                    {phaseTypesLoading ? <TableLoading /> : <DataTable columns={phaseTypeColumns} data={phaseTypes} keyExtractor={(type) => type.id.toString()} emptyMessage="No phase types found" />}
                </div>
            </div>

            {/* Modals */}
            <FlyingTypeFormModal />
            <PhaseTypeFormModal />

            <ConfirmationModal
                isOpen={flyingTypeDeleteModalOpen}
                onClose={() => setFlyingTypeDeleteModalOpen(false)}
                onConfirm={confirmDeleteFlyingType}
                title="Delete Flying Type"
                message={`Are you sure you want to delete "${deletingFlyingType?.type_name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                loading={flyingTypeDeleteLoading}
                variant="danger"
            />

            <ConfirmationModal
                isOpen={phaseTypeDeleteModalOpen}
                onClose={() => setPhaseTypeDeleteModalOpen(false)}
                onConfirm={confirmDeletePhaseType}
                title="Delete Phase Type"
                message={`Are you sure you want to delete "${deletingPhaseType?.type_name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                loading={phaseTypeDeleteLoading}
                variant="danger"
            />
        </div>
    );
}

export default function FlyingTypesPage() {
    return (
        <Ftw11sqnFlyingTypeModalProvider>
            <Ftw11sqnFlyingPhaseTypeModalProvider>
                <FlyingTypesPageContent />
            </Ftw11sqnFlyingPhaseTypeModalProvider>
        </Ftw11sqnFlyingTypeModalProvider>
    );
}
