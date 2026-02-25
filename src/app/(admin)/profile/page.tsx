"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useAuth } from "@/libs/hooks/useAuth";
import FullLogo from "@/components/ui/fulllogo";
import { formatDate } from "@/libs/utils/formatter";

export default function Profile() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const handlePrint = () => {
        window.print();
    };

    const handleEdit = () => {
        router.push('/profile/edit');
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

    const bio = user.instructor_biodata;

    return (
        <div className="print-no-border bg-white rounded-lg border border-gray-200">
            {/* Action Buttons - Hidden on print */}
            <div className="p-4 flex items-center justify-end no-print border-b border-gray-100 mb-4 gap-3">
                <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                    Edit Profile
                </button>
                <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <Icon icon="hugeicons:printer" className="w-4 h-4" />
                    Print Profile
                </button>
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

                {/* Personal Profile Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Personal Profile
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Bangla Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{bio?.name_bangla || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Short Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{bio?.short_name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Date of Birth</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(user.date_of_birth || bio?.date_of_birth)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Religion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 capitalize">{bio?.religion || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Blood Group</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.blood_group || bio?.blood_group || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Marital Status</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 capitalize">{bio?.marital_status || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Gender</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 capitalize">{bio?.gender || "N/A"}</span>
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
                            <span className="w-48 text-gray-900 font-medium">Service Number</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 font-bold">{user.service_number || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Rank</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.rank?.name || "N/A"} ({user.rank?.short_name || ""})</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Joining Date</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(user.date_of_joining || bio?.joining_date)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Status</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.is_active ? "Active" : "Inactive"}</span>
                        </div>
                        {bio?.unit && (
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">Unit</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.unit}</span>
                            </div>
                        )}
                        {bio?.trade && (
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">Trade</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.trade}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Contact Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Email</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.email || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Phone</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{user.phone || "N/A"}</span>
                        </div>
                        {bio?.national_id && (
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">NID No</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.national_id}</span>
                            </div>
                        )}
                        {bio?.whatsapp && (
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">WhatsApp</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.whatsapp}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Physical Information Section (If available in bio) */}
                {bio && (bio.height || bio.weight || bio.eye_color || bio.hair_color || bio.complexion || bio.identification_mark) && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Physical Information
                        </h2>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">Height</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.height || "N/A"}</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">Weight</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.weight ? `${bio.weight} kg` : "N/A"}</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">Eye Color</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.eye_color || "N/A"}</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">Hair Color</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.hair_color || "N/A"}</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">Complexion</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.complexion || "N/A"}</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 text-gray-900 font-medium">Identification Mark</span>
                                <span className="mr-4">:</span>
                                <span className="text-gray-900 flex-1">{bio.identification_mark || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Address Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Address Information
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Present Address */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 underline">Present Address</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Division:</span> {bio?.present_division_data?.name || "N/A"}</p>
                                <p><span className="font-medium">District:</span> {bio?.present_district_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Office:</span> {bio?.present_post_office_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Address:</span> {user.address || bio?.present_address || "N/A"}</p>
                            </div>
                        </div>

                        {/* Permanent Address */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 underline">Permanent Address</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Division:</span> {bio?.permanent_division_data?.name || "N/A"}</p>
                                <p><span className="font-medium">District:</span> {bio?.permanent_district_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Office:</span> {bio?.permanent_post_office_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Address:</span> {bio?.permanent_address || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signature Section */}
                <div className="mt-12 flex justify-end">
                    <div className="flex flex-col items-center w-48">
                        {user.signature ? (
                            <div className="relative h-16 w-full border-b border-gray-900">
                                <Image
                                    src={user.signature}
                                    alt="Signature"
                                    fill
                                    className="object-contain"
                                    sizes="192px"
                                />
                            </div>
                        ) : (
                            <div className="h-16 w-full border-b border-gray-900"></div>
                        )}
                        <p className="text-center text-gray-900 font-medium mt-2">Signature</p>
                        <p className="text-center text-gray-900">{user.name || "N/A"}</p>
                    </div>
                </div>

                {/* Footer with date */}
                <div className="mt-12 text-center text-sm text-gray-600">
                    <p>Generated on: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
            </div>
        </div>
    );
}
