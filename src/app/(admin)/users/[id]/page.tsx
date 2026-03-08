"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { userService } from "@/libs/services/userService";
import FullLogo from "@/components/ui/fulllogo";
import { formatDate, getImageUrl } from "@/libs/utils/formatter";
import type { User } from "@/libs/types/user";
import { useCan, usePageContext } from "@/context/PagePermissionsContext";

export default function ViewUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { menu, permissions } = usePageContext();
    const can = useCan();

    useEffect(() => {
        console.log("Page permissions:", permissions);
    }, [menu, permissions]);

    useEffect(() => {
        const loadUser = async () => {
            try {
                setLoading(true);
                const data = await userService.getUser(Number(userId));
                setUser(data);
            } catch (error) {
                console.error("Failed to load user:", error);
                alert("Failed to load user data");
                router.push('/users');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [userId, router]);

    const handleBack = () => {
        router.push('/users');
    };
    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Icon icon="hugeicons:loading-03" className="w-10 h-10 animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <p className="text-gray-500">User not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            {/* Action Buttons - Hidden on print */}
            <div className="p-4 flex items-center justify-between no-print">
                <button
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:arrow-left-01" className="w-4 h-4" />
                    Back to List
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Icon icon="hugeicons:printer" className="w-4 h-4" />
                        Print Biodata
                    </button>
                </div>
            </div>

            {/* CV Content */}
            <div className="p-8 cv-content">
                {/* Header with Logo and Photo */}
                <div className="relative mb-8">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex justify-center mb-4">
                                <FullLogo />
                            </div>
                            <h1 className="text-center text-xl font-bold text-gray-900 uppercase tracking-wider">
                                Bangladesh Air Force Academy
                            </h1>
                            <p className="text-center font-medium text-gray-900 uppercase tracking-wider pb-2">
                                Biodata of {user.name || ""}
                            </p>
                        </div>
                        <div className="cv-profile absolute right-10 ml-8 flex-shrink-0">
                            {user.profile_photo ? (
                                <div className="relative w-32 h-40 border-2 border-black">
                                    <Image
                                        src={user.profile_photo}
                                        alt={user.name || "Profile"}
                                        fill
                                        className="object-cover"
                                        sizes="128px"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-40 border-2 border-black flex items-center justify-center">
                                    <Icon icon="hugeicons:user" className="w-16 h-16 text-gray-400" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Personal Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Full Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Email Address</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.email || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Phone Number</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.phone || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Date of Birth</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(user.date_of_birth)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Blood Group</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.blood_group || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Address</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.address || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Official Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Official Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">BD Number</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 font-mono uppercase">{user.service_number || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Rank</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.rank ? `${user.rank.name} (${user.rank.short_name})` : "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Joining Date</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(user.date_of_joining)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Account Status</span>
                            <span className="mr-4">:</span>
                            <span className={`text-gray-900 flex-1 ${user.is_active ? 'text-green-600' : 'text-red-600'} font-medium`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Role Assignments Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Role Assignments & Wings
                    </h2>
                    {user.role_assignments && user.role_assignments.length > 0 ? (
                        <div className="space-y-6">
                            {user.role_assignments.map((assignment, index) => (
                                <div key={assignment.id} className="relative">
                                    {index > 0 && <div className="border-t border-gray-100 my-4" />}
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                                        <div className="flex">
                                            <span className="w-48 text-gray-900 font-medium">Role</span>
                                            <span className="mr-4">:</span>
                                            <span className="text-gray-900 flex-1 font-bold">{assignment.role?.name || "N/A"}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-48 text-gray-900 font-medium">Wing</span>
                                            <span className="mr-4">:</span>
                                            <span className="text-gray-900 flex-1">{assignment.wing?.name || "N/A"}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-48 text-gray-900 font-medium">Sub-Wing</span>
                                            <span className="mr-4">:</span>
                                            <span className="text-gray-900 flex-1">{assignment.sub_wing?.name || "—"}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="w-48 text-gray-900 font-medium">Assignment Type</span>
                                            <span className="mr-4">:</span>
                                            <span className="text-gray-900 flex-1">
                                                {assignment.is_primary ? (
                                                    <span className="text-purple-600 font-medium">Primary</span>
                                                ) : "Secondary"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-900 italic">No role assignments found</p>
                    )}
                </div>

                {/* System Information Section */}
                {/* <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        System Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Failed Login Attempts</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.failed_login_attempts ?? 0}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Locked Until</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(user.locked_until) || "Not Locked"}</span>
                        </div>
                    </div>
                </div> */}

                {/* Signature Section */}
                {user.signature && (
                    <div className="mt-12 flex justify-end">
                        <div className="text-center w-48">
                            <div className="relative w-full h-16 mb-2">
                                <Image
                                    src={user.signature}
                                    alt="Signature"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div className="border-t border-black pt-1">
                                <p className="text-sm font-bold uppercase text-gray-900">Signature</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Signature Blocks - Created by + Last Edited by */}
                <div className="mt-16 flex justify-end gap-10">
                  {/* Created by */}
                  <div className="text-left min-w-[180px]">
                    <p className="text-xs text-gray-900 uppercase tracking-wider">Created by</p>
                    <div className="border-b border-gray-400">
                      <p className="text-sm text-gray-900">
                        {(user as any).creator ? (
                          <>
                            {(user as any).creator.rank?.short_name && <>{(user as any).creator.rank.short_name} </>}
                            {(user as any).creator.name}
                          </>
                        ) : "N/A"}
                      </p>
                      {(user as any).creator?.roles?.length > 0 && (
                        <p className="text-xs text-gray-900 mt-0.5">{(user as any).creator.roles[0].name}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-900">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "long", year: "numeric"
                      }) : "N/A"}
                    </p>
                  </div>

                  {/* Last Edited by */}
                  {(user as any).editor && (
                    <div className="text-left min-w-[180px]">
                      <p className="text-xs text-gray-900 uppercase tracking-wider">Last Edited by</p>
                      <div className="border-b border-gray-400">
                        <p className="text-sm text-gray-900">
                          {(user as any).editor.rank?.short_name && <>{(user as any).editor.rank.short_name} </>}
                          {(user as any).editor.name}
                        </p>
                        {(user as any).editor.roles?.length > 0 && (
                          <p className="text-xs text-gray-900 mt-0.5">{(user as any).editor.roles[0].name}</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-900">
                        {user.updated_at ? new Date(user.updated_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "long", year: "numeric"
                        }) : "N/A"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer with date */}
                <div className="mt-12 text-center text-sm text-gray-600">
                    <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
            </div>
        </div>
    );
}
