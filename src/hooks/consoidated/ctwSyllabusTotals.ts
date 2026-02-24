import { useMemo } from "react";

export function calculateCtwSyllabusTotals(
    modules: any[] | undefined,
    activeSemesterId: number | null,
    branchId: number | null = null
) {
    if (!modules || !activeSemesterId) {
        return {
            mseModules: [],
            midByAssessment: {},
            eseGroups: {},
            examTypes: [],
            mseFull: 0,
            eseFull: 0,
            grandFull: 0
        };
    }

    // 1. Filter modules by Semester
    const currentModules = modules.filter((m: any) => {
        return m.estimated_marks?.some((em: any) => em.semester_id === activeSemesterId);
    });

    // 2. Build Structure (MSE, ESE, etc.)
    const mseModules: any[] = [];
    const eseGroups: Record<string, any[]> = {};
    const examTypesMap = new Map<number, any>();

    currentModules.forEach((mod: any) => {
        mod.estimated_marks?.forEach((em: any) => {
            if (em.semester_id !== activeSemesterId) return;

            // Branch Filtering if branchId is provided
            if (branchId !== null) {
                // if config has a branch_id and it doesn't match, skip
                if (em.branch_id && em.branch_id != branchId) return;
            }

            if (!examTypesMap.has(em.exam_type_id)) examTypesMap.set(em.exam_type_id, em.exam_type);

            const item = { ...mod, config: em };
            if (em.exam_type?.code === "MID") {
                mseModules.push(item);
            } else if (em.exam_type?.code === "END") {
                const assessKey = mod.assessment || "ao";
                if (!eseGroups[assessKey]) eseGroups[assessKey] = [];
                eseGroups[assessKey].push(item);
            }
        });
    });

    // Apply specific filtering for 'ao' assessment in END exams (keep only gsto_assessment)
    if (eseGroups["ao"]) {
        const gstoOnly = eseGroups["ao"].filter((m: any) => m.code === "gsto_assessment");
        if (gstoOnly.length > 0) {
            eseGroups["ao"] = gstoOnly;
        } else {
            // If no gsto_assessment, assume other ao items are valid or clear it?
            // The reference code does: if (gstoOnly.length > 0) all["ao"] = gstoOnly; else delete all["ao"];
            // This means if 'ao' exists but has no gsto_assessment, it removes the whole group.
            delete eseGroups["ao"];
        }
    }

    const midByAssessment: Record<string, any[]> = {};
    mseModules.forEach(m => {
        const k = m.assessment || "ao";
        if (!midByAssessment[k]) midByAssessment[k] = [];
        midByAssessment[k].push(m);
    });

    // 3. Calculate Totals
    const mseFull = mseModules.reduce((sum, m) => sum + (parseFloat(m.config?.conversation_mark) || 0), 0);
    const eseFull = Object.values(eseGroups).flat().reduce((sum: number, m: any) => sum + (parseFloat(m.config?.conversation_mark) || 0), 0);
    const grandFull = mseFull + eseFull;

    return { 
        mseModules, 
        midByAssessment,
        eseGroups, 
        examTypes: Array.from(examTypesMap.values()),
        mseFull,
        eseFull,
        grandFull
    };
}

export function useCtwSyllabusTotals(
    modules: any[] | undefined,
    activeSemesterId: number | null,
    branchId: number | null = null
) {
    return useMemo(() => {
        return calculateCtwSyllabusTotals(modules, activeSemesterId, branchId);
    }, [modules, activeSemesterId, branchId]);
}
