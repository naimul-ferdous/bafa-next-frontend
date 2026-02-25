"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { cadetService } from "@/libs/services/cadetService";
import FullLogo from "@/components/ui/fulllogo";
import { formatDate, getImageUrl } from "@/libs/utils/formatter";
import type { CadetProfile } from "@/libs/types/user";

export default function ViewCadetPage() {
    const router = useRouter();
    const params = useParams();
    const cadetId = params.id as string;
    const [cadet, setCadet] = useState<CadetProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCadet = async () => {
            try {
                setLoading(true);
                const data = await cadetService.getCadet(Number(cadetId));
                setCadet(data);
            } catch (error) {
                console.error("Failed to load cadet:", error);
                alert("Failed to load cadet data");
                router.push('/users/cadets');
            } finally {
                setLoading(false);
            }
        };

        loadCadet();
    }, [cadetId, router]);

    const handleBack = () => {
        router.push('/users/cadets');
    };

    const handleEdit = () => {
        router.push(`/users/cadets/${cadetId}/edit`);
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

    if (!cadet) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <p className="text-gray-500">Cadet not found</p>
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
                        Print CV
                    </button>
                    <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                        Edit Cadet
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
                                Biodata of Cadet {cadet.name || ""}
                            </p>
                        </div>
                        <div className="cv-profile absolute right-10 ml-8 flex-shrink-0">
                            {cadet.profile_picture ? (
                                <div className="relative w-32 h-40 border-2 border-black">
                                    <Image
                                        src={cadet.profile_picture}
                                        alt={cadet.name || "Profile"}
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
                            <span className="text-gray-900 flex-1">{cadet.name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Bangla Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.name_bangla || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Short Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.short_name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Date of Birth</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.date_of_birth)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Religion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 capitalize">{cadet.religion || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Caste</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.caste || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Blood Group</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.blood_group || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Marital Status</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 capitalize">{cadet.marital_status || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Physical Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Physical Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Height</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.height || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Weight</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.weight ? `${cadet.weight} kg` : "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Eye Color</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.eye_color || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Hair Color</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.hair_color || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Complexion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.complexion || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Identification Mark</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.identification_mark || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Contact & Identity Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Contact & Identity Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Contact No</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.contact_no || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Email</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.email || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">NID No</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.nid_no || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Passport No</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.passport_no || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Driving License No</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.driving_license_no || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Enrollment Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Enrollment Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Cadet Number</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.cadet_number || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">BD No</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.bd_no || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Batch</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.batch || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Enrollment Date</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.enrollment_date)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Course</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.assigned_courses?.[0]?.course?.name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Semester</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.assigned_semesters?.[0]?.semester?.name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Program</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.assigned_programs?.[0]?.program?.name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Group/Section</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.assigned_groups?.[0]?.group?.name || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Promotion Dates Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Promotion Dates
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Arrival Date BMA</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.arrival_date_bma)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Arrival Date BAFA</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.arrival_date_bafa)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">2nd Promotion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.second_promotion_date)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">3rd Promotion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.third_promotion_date)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">4th Promotion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.forth_promotion_date)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">5th Promotion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.five_promotion_date)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">6th Promotion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(cadet.six_promotion_date)}</span>
                        </div>
                    </div>
                </div>

                {/* Address Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Address Information
                    </h2>
                    <div className="grid grid-cols-3 gap-6">
                        {/* Present Address */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 underline">Present Address</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Division:</span> {(cadet as any).present_division_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">District:</span> {(cadet as any).present_district_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Office:</span> {(cadet as any).present_post_office_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Code:</span> {(cadet as any).present_post_office_relation?.post_code || cadet.present_post_code || "N/A"}</p>
                                <p><span className="font-medium">Address:</span> {cadet.present_address || "N/A"}</p>
                            </div>
                        </div>

                        {/* Permanent Address */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 underline">Permanent Address</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Division:</span> {(cadet as any).permanent_division_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">District:</span> {(cadet as any).permanent_district_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Office:</span> {(cadet as any).permanent_post_office_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Code:</span> {(cadet as any).permanent_post_office_relation?.post_code || cadet.permanent_post_code || "N/A"}</p>
                                <p><span className="font-medium">Address:</span> {cadet.permanent_address || "N/A"}</p>
                            </div>
                        </div>

                        {/* Guardian Address */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 underline">Guardian Address</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Division:</span> {(cadet as any).guardian_division_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">District:</span> {(cadet as any).guardian_district_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Office:</span> {(cadet as any).guardian_post_office_relation?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Code:</span> {(cadet as any).guardian_post_office_relation?.post_code || cadet.guardian_post_code || "N/A"}</p>
                                <p><span className="font-medium">Address:</span> {cadet.guardian_address || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Family Members Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Family Members
                    </h2>
                    {cadet.family_members && cadet.family_members.length > 0 ? (
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">SL.</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Relationship</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Status</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Mobile</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Occupation</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Guardian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadet.family_members.map((member, index) => (
                                    <tr key={member.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{index + 1}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{member.relationship}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{member.name}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{member.status}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{member.mobile_no || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{member.occupation || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{(member as any).is_guardian ? "Yes" : "No"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-900">N/A</p>
                    )}
                </div>

                {/* Educational Records Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Educational Records
                    </h2>
                    {cadet.educations && cadet.educations.length > 0 ? (
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Exam</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Institution</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Board</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Year</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Subject/Group</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">GPA/Marks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadet.educations.map((edu) => (
                                    <tr key={edu.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900 uppercase">{edu.exam || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{edu.institution || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{edu.board_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{(edu as any).year_from} - {edu.year_to}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{edu.subject_group || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{edu.total_marks_gpa || "N/A"} / {edu.out_of || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-900">N/A</p>
                    )}
                </div>

                {/* Languages Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Languages
                    </h2>
                    {cadet.languages && cadet.languages.length > 0 ? (
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Language</th>
                                    <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold">Read</th>
                                    <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold">Write</th>
                                    <th className="border border-gray-900 px-4 py-2 text-center text-gray-900 font-semibold">Speak</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadet.languages.map((lang) => (
                                    <tr key={lang.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{lang.language}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{(lang as any).can_read ? "Yes" : "No"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{(lang as any).can_write ? "Yes" : "No"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{(lang as any).can_speak ? "Yes" : "No"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-900">N/A</p>
                    )}
                </div>

                {/* Relations in Armed Forces Section */}
                {(cadet as any).army_relations && (cadet as any).army_relations.length > 0 && (cadet as any).army_relations.some((r: any) => r.name || r.rank) && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Relations in Armed Forces
                        </h2>
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Rank</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Relationship</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">BA No</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(cadet as any).army_relations.map((rel: any) => (
                                    <tr key={rel.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{rel.rank || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{rel.name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{rel.relationship || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{rel.ba_no || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{rel.present_address || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Political Relations Section */}
                {(cadet as any).political_relations && (cadet as any).political_relations.length > 0 && (cadet as any).political_relations.some((r: any) => r.name) && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Political Relations
                        </h2>
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Political Party</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Appointment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(cadet as any).political_relations.map((rel: any) => (
                                    <tr key={rel.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{rel.name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{rel.political_party_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{rel.appointment || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Visits Abroad Section */}
                {(cadet as any).visits_abroad && (cadet as any).visits_abroad.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Visits Abroad
                        </h2>
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">SL.</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Country</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Purpose</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">From Date</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">To Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(cadet as any).visits_abroad.map((visit: any, index: number) => (
                                    <tr key={visit.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{index + 1}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{visit.country_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{visit.purpose || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{formatDate(visit.from_date)}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{formatDate(visit.to_date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Employment Before BAFA Section */}
                {(cadet as any).before_bafa_employees && (cadet as any).before_bafa_employees.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Employment Before BAFA
                        </h2>
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Organization</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Responsibilities</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Appointment Date</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Salary</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(cadet as any).before_bafa_employees.map((emp: any) => (
                                    <tr key={emp.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{emp.organization_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{emp.nature_of_responsibilities || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{formatDate(emp.date_of_appointment)}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{emp.gross_salary || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{emp.present_state || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Extra-Curricular Activities Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Extra-Curricular Activities
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Games/Sports</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.game_sports || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Sports Club</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.sports_club || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Hobbies</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.hobbies || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Special Qualification</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.special_qualification || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Social Activities</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.social_activities || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Cultural Activities</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.cultural_activities || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Bank Information Section */}
                {cadet.banks && cadet.banks.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Bank Information
                        </h2>
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Bank Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Branch</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Account Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Account Number</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadet.banks.map((bank) => (
                                    <tr key={bank.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{bank.bank_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{bank.bank_branch || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{bank.account_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{bank.account_number || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Next of Kin Section */}
                {cadet.next_of_kins && cadet.next_of_kins.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Next of Kin
                        </h2>
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Relationship</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Mobile</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Address</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Authorized By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadet.next_of_kins.map((kin) => (
                                    <tr key={kin.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{kin.name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{kin.relationship || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{kin.mobile_no || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{kin.address || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{kin.authorized_by || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Insurance Information Section */}
                {cadet.insurances && cadet.insurances.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Insurance Information
                        </h2>
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Policy Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Company</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Amount</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Next of Kin</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Start Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadet.insurances.map((ins) => (
                                    <tr key={ins.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{ins.policy_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{ins.company_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{ins.amount || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{ins.next_of_kin || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{formatDate(ins.start_date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Nominees Section */}
                {cadet.nominees && cadet.nominees.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                            Nominees
                        </h2>
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Type</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Relationship</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Percentage</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cadet.nominees.map((nominee) => (
                                    <tr key={nominee.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{nominee.nominee_type || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{nominee.name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{nominee.relationship || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{nominee.percentage || "N/A"}%</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{nominee.address || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Emergency Contact Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Emergency Contact
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Emergency Phone</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.emergency_phone || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Emergency Email</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{cadet.emergency_contact_email || "N/A"}</span>
                        </div>
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
