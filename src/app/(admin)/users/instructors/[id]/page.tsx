"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { InstructorBiodata } from "@/libs/types/user";
import { instructorService } from "@/libs/services/instructorService";
import FullLogo from "@/components/ui/fulllogo";
import InstructorSubjectDetailment from "@/components/instructors/InstructorSubjectDetailment";
import { formatDate, getImageUrl } from "@/libs/utils/formatter";

export default function ViewInstructorPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const instructorId = params.id as string;
    const [instructor, setInstructor] = useState<InstructorBiodata | null>(null);
    const [loading, setLoading] = useState(true);
    const initialTab = searchParams.get("tab") === "subjects" ? "subjects" : "biodata";
    const [activeTab, setActiveTab] = useState<"biodata" | "subjects">(initialTab);

    useEffect(() => {
        const loadInstructor = async () => {
            try {
                setLoading(true);
                const data = await instructorService.getInstructor(Number(instructorId));
                setInstructor(data);
            } catch (error) {
                console.error("Failed to load instructor:", error);
                alert("Failed to load instructor data");
                router.push('/users/instructors');
            } finally {
                setLoading(false);
            }
        };

        loadInstructor();
    }, [instructorId, router]);

    const handleBack = () => {
        router.push('/users/instructors');
    };

    const handleEdit = () => {
        router.push(`/users/instructors/${instructorId}/edit`);
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

    if (!instructor) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-center py-12">
                    <p className="text-gray-500">Instructor not found</p>
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
                        {activeTab === "subjects" ? "Print Detailment" : "Print CV"}
                    </button>
                    {activeTab === "biodata" && (
                        <button
                            onClick={handleEdit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                            Edit Instructor
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="px-8 pt-4 flex gap-0 border-b border-gray-200 no-print">
                <button
                    onClick={() => setActiveTab("biodata")}
                    className={`px-6 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === "biodata"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Biodata
                </button>
                <button
                    onClick={() => setActiveTab("subjects")}
                    className={`px-6 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === "subjects"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Subject Detailment
                </button>
            </div>

            {/* Subject Detailment Tab */}
            <div className={`p-8 ${activeTab !== "subjects" ? "hidden print:hidden" : ""}`} id="print-detailment">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4"><FullLogo /></div>
                    <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Bangladesh Air Force Academy</h1>
                    <p className="font-medium text-gray-900 uppercase tracking-wider pb-2">
                        Subject Detailment - {instructor.user?.name || "Instructor"}
                    </p>
                </div>
                <InstructorSubjectDetailment
                    userId={instructor.user_id}
                    userName={instructor.user?.name}
                />
            </div>

            {/* CV Content */}
            <div className={`p-8 cv-content ${activeTab !== "biodata" ? "hidden print:hidden" : ""}`}>
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
                                Curriculum Vitae of {instructor.user?.name || "Instructor"}
                            </p>
                        </div>
                        <div className="cv-profile absolute right-10 ml-8 flex-shrink-0">
                            {instructor.user?.profile_photo ? (
                                <div className="relative w-32 h-40 border-2 border-black">
                                    <Image
                                        src={instructor.user.profile_photo}
                                        alt={instructor.user?.name || "Profile"}
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
                            <span className="text-gray-900 flex-1">{instructor.user?.name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Bangla Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.name_bangla || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Short Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.short_name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Date of Birth</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(instructor.date_of_birth)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Gender</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 capitalize">{instructor.gender || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Blood Group</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.blood_group || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Religion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 capitalize">{instructor.religion || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Marital Status</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1 capitalize">{instructor.marital_status || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Weight</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.weight ? `${instructor.weight} kg` : "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Height</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.height ? `${instructor.height} cm` : "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Hair Color</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.hair_color || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Eye Color</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.eye_color || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Complexion</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.complexion || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Identification Mark</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.identification_mark || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Contact Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Phone</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.user?.phone || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Email</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.user?.email || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">National ID</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.national_id || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Passport</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.passport || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Driving License</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.driving_license || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">IMO</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.imo || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">WhatsApp</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.whatsapp || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Viber</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.viber || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Facebook ID</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.facebook_id || "N/A"}</span>
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
                            <span className="text-gray-900 flex-1">{instructor.user?.service_number || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Unit</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.unit || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Trade</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.trade || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Employee Type</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.employee_type || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Date of Commission</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(instructor.date_of_commission)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Joining Date</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(instructor.joining_date)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Posting Date</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(instructor.posting_date)}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Legend</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.legend || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Professional Information Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Professional Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Specialization</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.specialization || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Qualification</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.qualification || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Years of Experience</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.years_of_experience ? `${instructor.years_of_experience} years` : "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Instructor Since</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{formatDate(instructor.instructor_since)}</span>
                        </div>
                    </div>
                </div>

                {/* Spouse & Family Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Spouse & Family Information
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        {Boolean(instructor.has_spouse) && (
                            <>
                                <div className="flex">
                                    <span className="w-48 text-gray-900 font-medium">Spouse Name</span>
                                    <span className="mr-4">:</span>
                                    <span className="text-gray-900 flex-1">{instructor.spouse_name || "N/A"}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-48 text-gray-900 font-medium">Relationship</span>
                                    <span className="mr-4">:</span>
                                    <span className="text-gray-900 flex-1 capitalize">{instructor.spouse_gender || "N/A"}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Children Table */}
                    {Boolean(instructor.has_children) && instructor.children && instructor.children.length > 0 && (
                        <div className="mt-4">
                            <table className="w-full border-collapse border border-gray-900">
                                <thead>
                                    <tr className="bg-white">
                                        <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">SL.</th>
                                        <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Name</th>
                                        <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Gender</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {instructor.children.map((child, index) => (
                                        <tr key={child.id}>
                                            <td className="border border-gray-900 px-4 py-2 text-gray-900">{index + 1}</td>
                                            <td className="border border-gray-900 px-4 py-2 text-gray-900">{child.name}</td>
                                            <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{child.gender}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
                                <p><span className="font-medium">Division:</span> {instructor.present_division_data?.name || "N/A"}</p>
                                <p><span className="font-medium">District:</span> {instructor.present_district_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Office:</span> {instructor.present_post_office_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Code:</span> {instructor.present_post_office_data?.post_code || instructor.present_post_code || "N/A"}</p>
                                <p><span className="font-medium">Address:</span> {instructor.present_address || "N/A"}</p>
                            </div>
                        </div>

                        {/* Permanent Address */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 underline">Permanent Address</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Division:</span> {instructor.permanent_division_data?.name || "N/A"}</p>
                                <p><span className="font-medium">District:</span> {instructor.permanent_district_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Office:</span> {instructor.permanent_post_office_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Code:</span> {instructor.permanent_post_office_data?.post_code || instructor.permanent_post_code || "N/A"}</p>
                                <p><span className="font-medium">Address:</span> {instructor.permanent_address || "N/A"}</p>
                            </div>
                        </div>

                        {/* Guardian Address */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 underline">Guardian Address</h3>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Division:</span> {instructor.guardian_division_data?.name || "N/A"}</p>
                                <p><span className="font-medium">District:</span> {instructor.guardian_district_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Office:</span> {instructor.guardian_post_office_data?.name || "N/A"}</p>
                                <p><span className="font-medium">Post Code:</span> {instructor.guardian_post_office_data?.post_code || instructor.guardian_post_code || "N/A"}</p>
                                <p><span className="font-medium">Address:</span> {instructor.guardian_address || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Education/Certifications Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Education / Certifications
                    </h2>
                    {instructor.certifications && instructor.certifications.length > 0 ? (
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Exam Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Short Name</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Year</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Institute</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Grade</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Out Of</th>
                                </tr>
                            </thead>
                            <tbody>
                                {instructor.certifications.map((cert) => (
                                    <tr key={cert.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{cert.exam_full_name}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{cert.exam_short_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{cert.passing_year || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{cert.institute_name || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{cert.grade || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{cert.out_of || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-900">N/A</p>
                    )}
                </div>

                {/* Achievements Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Achievements
                    </h2>
                    {instructor.achievements && instructor.achievements.length > 0 ? (
                        <table className="w-full border-collapse border border-gray-900">
                            <thead>
                                <tr className="bg-white">
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Title</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Description</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Date</th>
                                    <th className="border border-gray-900 px-4 py-2 text-left text-gray-900 font-semibold">Awarded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {instructor.achievements.map((achievement) => (
                                    <tr key={achievement.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{achievement.achievement_title}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{achievement.description || "N/A"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{formatDate(achievement.achievement_date)}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900">{achievement.awarded_by || "N/A"}</td>
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
                    {instructor.languages && instructor.languages.length > 0 ? (
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
                                {instructor.languages.map((lang) => (
                                    <tr key={lang.id}>
                                        <td className="border border-gray-900 px-4 py-2 text-gray-900 capitalize">{lang.language}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{lang.read ? "Yes" : "No"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{lang.write ? "Yes" : "No"}</td>
                                        <td className="border border-gray-900 px-4 py-2 text-center text-gray-900">{lang.speak ? "Yes" : "No"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-900">N/A</p>
                    )}
                </div>

                {/* Emergency Contact Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 pb-1 border-b border-dashed border-gray-400">
                        Emergency Contact
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Contact Name</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.emergency_contact_name || "N/A"}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 text-gray-900 font-medium">Contact Phone</span>
                            <span className="mr-4">:</span>
                            <span className="text-gray-900 flex-1">{instructor.emergency_contact_phone || "N/A"}</span>
                        </div>
                    </div>
                </div>

                {/* Signature Section */}
                <div className="mt-12 flex justify-end">
                    <div className="flex flex-col items-center w-48">
                        {instructor.user?.signature ? (
                            <div className="relative h-16 w-full border-b border-gray-900">
                                <Image
                                    src={instructor.user?.signature}
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
                        <p className="text-center text-gray-900">{instructor.user?.name || "N/A"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
