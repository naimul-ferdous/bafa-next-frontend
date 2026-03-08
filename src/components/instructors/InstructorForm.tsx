/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import FullLogo from "@/components/ui/fulllogo";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { geoLocationService, type Division, type District, type PostOffice } from "@/libs/services/geoLocationService";
import DatePicker from "@/components/form/input/DatePicker";
import type { InstructorBiodata, Role } from "@/libs/types/user";
import { getImageUrl } from "@/libs/utils/formatter";
import userService from "@/libs/services/userService";
import instructorService from "@/libs/services/instructorService";
import { roleService } from "@/libs/services/roleService";

interface Child {
  name: string;
  gender: "son" | "daughter";
}

interface Language {
  language: string;
  write: boolean;
  read: boolean;
  speak: boolean;
}

interface Certification {
  examFullName: string;
  examShortName: string;
  passingYear: string;
  grade: string;
  outOf: string;
  instituteName: string;
  others: string;
}

interface Achievement {
  achievementTitle: string;
  description: string;
  achievementDate: string;
  awardedBy: string;
}

interface InstructorFormProps {
  initialData?: InstructorBiodata | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

export default function InstructorForm({ initialData, onSubmit, onCancel, loading: externalLoading, isEdit: propIsEdit = false }: InstructorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bdNumberSearch, setBdNumberSearch] = useState("");
  const [searchStatus, setSearchStatus] = useState<{
    type: 'idle' | 'loading' | 'found' | 'not_found' | 'already_instructor';
    message: string;
  }>({ type: 'idle', message: '' });

  const [localIsEdit, setLocalIsEdit] = useState(propIsEdit);
  const [instructorId, setInstructorId] = useState<number | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [foundInstructorId, setFoundInstructorId] = useState<number | null>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Basic Information
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [name, setName] = useState("");
  const [nameBangla, setNameBangla] = useState("");
  const [shortName, setShortName] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [religion, setReligion] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [caste, setCaste] = useState("");
  const [complexion, setComplexion] = useState("");
  const [identificationMark, setIdentificationMark] = useState("");
  const [otherInformation, setOtherInformation] = useState("");

  // Contact Information
  const [nationalId, setNationalId] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [imo, setImo] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [viber, setViber] = useState("");
  const [facebookId, setFacebookId] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [passport, setPassport] = useState("");

  // Spouse Information
  const [hasSpouse, setHasSpouse] = useState(false);
  const [spouseName, setSpouseName] = useState("");
  const [spouseGender, setSpouseGender] = useState<"husband" | "wife">("wife");
  const [hasChildren, setHasChildren] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);

  // Languages
  const [languages, setLanguages] = useState<Language[]>([
    { language: "", write: false, read: false, speak: false }
  ]);

  // Office Information
  const [unit, setUnit] = useState("");
  const [trade, setTrade] = useState("");
  const [dateOfCommission, setDateOfCommission] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [legend, setLegend] = useState("");
  const [postingDate, setPostingDate] = useState("");

  // Present Address
  const [presentDivision, setPresentDivision] = useState("");
  const [presentDistrict, setPresentDistrict] = useState("");
  const [presentPostOffice, setPresentPostOffice] = useState("");
  const [presentPostCode, setPresentPostCode] = useState("");
  const [presentAddress, setPresentAddress] = useState("");

  // Permanent Address
  const [permanentDivision, setPermanentDivision] = useState("");
  const [permanentDistrict, setPermanentDistrict] = useState("");
  const [permanentPostOffice, setPermanentPostOffice] = useState("");
  const [permanentPostCode, setPermanentPostCode] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  // Guardian Address
  const [guardianDivision, setGuardianDivision] = useState("");
  const [guardianDistrict, setGuardianDistrict] = useState("");
  const [guardianPostOffice, setGuardianPostOffice] = useState("");
  const [guardianPostCode, setGuardianPostCode] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");

  // Certifications/Education
  const [certifications, setCertifications] = useState<Certification[]>([
    { examFullName: "", examShortName: "", passingYear: "", grade: "", outOf: "", instituteName: "", others: "" }
  ]);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    { achievementTitle: "", description: "", achievementDate: "", awardedBy: "" }
  ]);

  // Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Professional Information
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [instructorSince, setInstructorSince] = useState("");

  // Role Assignment
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // Bangladesh Geo Data
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [presentDistricts, setPresentDistricts] = useState<District[]>([]);
  const [permanentDistricts, setPermanentDistricts] = useState<District[]>([]);
  const [guardianDistricts, setGuardianDistricts] = useState<District[]>([]);
  const [presentPostOffices, setPresentPostOffices] = useState<PostOffice[]>([]);
  const [permanentPostOffices, setPermanentPostOffices] = useState<PostOffice[]>([]);
  const [guardianPostOffices, setGuardianPostOffices] = useState<PostOffice[]>([]);

  // Format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDateForDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const resetForm = useCallback(() => {
    setInstructorId(null);
    setLocalIsEdit(propIsEdit);
    setIsExistingUser(false);
    setChangePassword(false);
    setAutoFilledFields(new Set());
    setProfilePicture("");
    setProfilePicturePreview("");
    setSignature("");
    setSignaturePreview("");
    setName("");
    setNameBangla("");
    setShortName("");
    setGender("");
    setMaritalStatus("");
    setReligion("");
    setDateOfBirth("");
    setWeight("");
    setHeight("");
    setBloodGroup("");
    setHairColor("");
    setEyeColor("");
    setCaste("");
    setComplexion("");
    setIdentificationMark("");
    setOtherInformation("");
    setNationalId("");
    setMobile("");
    setPassword("");
    setImo("");
    setEmail("");
    setWhatsapp("");
    setViber("");
    setFacebookId("");
    setDrivingLicense("");
    setPassport("");
    setHasSpouse(false);
    setSpouseName("");
    setSpouseGender("wife");
    setHasChildren(false);
    setChildren([]);
    setLanguages([{ language: "", write: false, read: false, speak: false }]);
    setUnit("");
    setTrade("");
    setDateOfCommission("");
    setJoiningDate("");
    setEmployeeType("");
    setLegend("");
    setPostingDate("");
    setPresentDivision("");
    setPresentDistrict("");
    setPresentPostOffice("");
    setPresentPostCode("");
    setPresentAddress("");
    setPermanentDivision("");
    setPermanentDistrict("");
    setPermanentPostOffice("");
    setPermanentPostCode("");
    setPermanentAddress("");
    setGuardianDivision("");
    setGuardianDistrict("");
    setGuardianPostOffice("");
    setGuardianPostCode("");
    setGuardianAddress("");
    setCertifications([{ examFullName: "", examShortName: "", passingYear: "", grade: "", outOf: "", instituteName: "", others: "" }]);
    setAchievements([{ achievementTitle: "", description: "", achievementDate: "", awardedBy: "" }]);
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setSpecialization("");
    setQualification("");
    setYearsOfExperience("");
    setInstructorSince("");
    setSelectedRoleIds([]);
  }, [propIsEdit]);

  const populateForm = useCallback((data: InstructorBiodata, preserveBdNumber = false) => {
    const u = data.user;
    setInstructorId(data.id);
    setIsExistingUser(true);
    setChangePassword(false);
    if (!preserveBdNumber) setBdNumberSearch(u?.service_number || "");
    setName(u?.name || "");
    setEmail(u?.email || "");
    setMobile(u?.phone || "");

    setNameBangla(data.name_bangla || "");
    setShortName(data.short_name || "");
    setGender(data.gender || "");
    setMaritalStatus(data.marital_status || "");
    setReligion(data.religion || "");
    setDateOfBirth(formatDateForDisplay(data.date_of_birth));
    setWeight(data.weight || "");
    setHeight(data.height || "");
    setBloodGroup(data.blood_group || "");
    setHairColor(data.hair_color || "");
    setEyeColor(data.eye_color || "");
    setCaste(data.caste || "");
    setComplexion(data.complexion || "");
    setIdentificationMark(data.identification_mark || "");
    setOtherInformation(data.other_information || "");

    setNationalId(data.national_id || "");
    setImo(data.imo || "");
    setWhatsapp(data.whatsapp || "");
    setViber(data.viber || "");
    setFacebookId(data.facebook_id || "");
    setDrivingLicense(data.driving_license || "");
    setPassport(data.passport || "");

    setHasSpouse(data.has_spouse || false);
    setSpouseName(data.spouse_name || "");
    setSpouseGender((data.spouse_gender as any) || "wife");
    setHasChildren(data.has_children || false);
    if (data.children && data.children.length > 0) {
      setChildren(data.children.map(c => ({ name: c.name, gender: c.gender as any })));
    } else {
      setChildren([]);
    }

    if (data.languages && data.languages.length > 0) {
      setLanguages(data.languages.map(l => ({
        language: l.language,
        write: l.write,
        read: l.read,
        speak: l.speak
      })));
    } else {
      setLanguages([{ language: "", write: false, read: false, speak: false }]);
    }

    setUnit(data.unit || "");
    setTrade(data.trade || "");
    setDateOfCommission(formatDateForDisplay(data.date_of_commission));
    setJoiningDate(formatDateForDisplay(data.joining_date));
    setEmployeeType(data.employee_type || "");
    setLegend(data.legend || "");
    setPostingDate(formatDateForDisplay(data.posting_date));

    setPresentDivision(data.present_division || "");
    setPresentDistrict(data.present_district || "");
    setPresentPostOffice(data.present_post_office || "");
    setPresentPostCode(data.present_post_code || "");
    setPresentAddress(data.present_address || "");

    setPermanentDivision(data.permanent_division || "");
    setPermanentDistrict(data.permanent_district || "");
    setPermanentPostOffice(data.permanent_post_office || "");
    setPermanentPostCode(data.permanent_post_code || "");
    setPermanentAddress(data.permanent_address || "");

    setGuardianDivision(data.guardian_division || "");
    setGuardianDistrict(data.guardian_district || "");
    setGuardianPostOffice(data.guardian_post_office || "");
    setGuardianPostCode(data.guardian_post_code || "");
    setGuardianAddress(data.guardian_address || "");

    if (data.certifications && data.certifications.length > 0) {
      setCertifications(data.certifications.map(c => ({
        examFullName: c.exam_full_name,
        examShortName: c.exam_short_name || "",
        passingYear: c.passing_year || "",
        grade: c.grade || "",
        outOf: c.out_of || "",
        instituteName: c.institute_name || "",
        others: c.others || ""
      })));
    } else {
      setCertifications([{ examFullName: "", examShortName: "", passingYear: "", grade: "", outOf: "", instituteName: "", others: "" }]);
    }

    if (data.achievements && data.achievements.length > 0) {
      setAchievements(data.achievements.map(a => ({
        achievementTitle: a.achievement_title,
        description: a.description || "",
        achievementDate: formatDateForDisplay(a.achievement_date),
        awardedBy: a.awarded_by || ""
      })));
    } else {
      setAchievements([{ achievementTitle: "", description: "", achievementDate: "", awardedBy: "" }]);
    }

    setEmergencyContactName(data.emergency_contact_name || "");
    setEmergencyContactPhone(data.emergency_contact_phone || "");

    setSpecialization(data.specialization || "");
    setQualification(data.qualification || "");
    setYearsOfExperience(data.years_of_experience?.toString() || "");
    setInstructorSince(formatDateForDisplay(data.instructor_since));

    // Pre-select existing user roles (Instructor role merge handled in roles useEffect)
    const userRoles = u?.roles || [];
    if (userRoles.length > 0) {
      setSelectedRoleIds(userRoles.map(r => r.id));
    }

    if (u?.profile_photo) setProfilePicturePreview(getImageUrl(u.profile_photo));
    if (u?.signature) setSignaturePreview(getImageUrl(u.signature));
  }, []);

  useEffect(() => {
    if (initialData) {
      populateForm(initialData);
    }
  }, [initialData, populateForm]);

  // Fetch all available roles on mount; auto-select "Instructor" role
  useEffect(() => {
    roleService.getAllRoles({ per_page: 100 }).then(res => {
      setAvailableRoles(res.data);
      const instructorRole = res.data.find(r => r.name.toLowerCase().includes('instructor'));
      if (instructorRole) {
        if (propIsEdit && initialData?.user?.roles) {
          // Edit mode: merge existing user roles + Instructor role
          const existingRoleIds = initialData.user.roles.map(r => r.id);
          const merged = [...new Set([...existingRoleIds, instructorRole.id])];
          setSelectedRoleIds(merged);
        } else {
          // Add mode: ensure Instructor role is selected
          setSelectedRoleIds(prev =>
            prev.includes(instructorRole.id) ? prev : [...prev, instructorRole.id]
          );
        }
      }
    });
  }, [propIsEdit, initialData]);

  const handleSearchBdNumber = async (searchValue?: string) => {
    const query = searchValue ?? bdNumberSearch;
    if (!query || query.length < 2) {
      if (!query) {
        resetForm();
        const instrRole = availableRoles.find(r => r.name.toLowerCase().includes('instructor'));
        if (instrRole) setSelectedRoleIds([instrRole.id]);
        setSearchStatus({ type: 'idle', message: '' });
      }
      return;
    }

    // Clear the form first before searching
    resetForm();
    // Re-select Instructor role after reset
    const instrRole = availableRoles.find(r => r.name.toLowerCase().includes('instructor'));
    if (instrRole) setSelectedRoleIds([instrRole.id]);

    setSearchStatus({ type: 'loading', message: 'Searching...' });
    setError("");

    try {
      // 1. Check if already an instructor
      const existingInstructor = await instructorService.findInstructorByServiceNumber(query);
      if (existingInstructor) {
        setFoundInstructorId(existingInstructor.id);
        setSearchStatus({
          type: 'already_instructor',
          message: `Instructor "${existingInstructor.user?.name || query}" already exists with BD No ${query}.`
        });
        return;
      }

      // 2. Search in users table
      const user = await userService.findUserByServiceNumber(query);
      if (user) {
        // Auto-fill basic user data & track which fields were auto-filled
        const filled = new Set<string>();
        if (user.name) { setName(user.name); filled.add('name'); }
        if (user.email) { setEmail(user.email); filled.add('email'); }
        if (user.phone) { setMobile(user.phone); filled.add('mobile'); }
        if (user.date_of_birth) { setDateOfBirth(formatDateForDisplay(user.date_of_birth.toString())); filled.add('dateOfBirth'); }
        if (user.blood_group) { setBloodGroup(user.blood_group); filled.add('bloodGroup'); }
        if (user.profile_photo) setProfilePicturePreview(getImageUrl(user.profile_photo));
        if (user.signature) setSignaturePreview(getImageUrl(user.signature));

        // Auto-select existing user roles + Instructor role
        const existingRoleIds = user.roles?.map(r => r.id) || [];
        const instructorRole = availableRoles.find(r => r.name.toLowerCase().includes('instructor'));
        const mergedRoleIds = [...new Set([...existingRoleIds, ...(instructorRole ? [instructorRole.id] : [])])];
        setSelectedRoleIds(mergedRoleIds);

        setAutoFilledFields(filled);
        setLocalIsEdit(false);
        setInstructorId(null);
        setIsExistingUser(true);
        setSearchStatus({
          type: 'found',
          message: `User ${user.name} found and basic data auto-filled.`
        });
      } else {
        setAutoFilledFields(new Set());
        setFoundInstructorId(null);
        setLocalIsEdit(false);
        setInstructorId(null);
        setIsExistingUser(false);
        setSearchStatus({
          type: 'not_found',
          message: `No user found with BD No ${query}. You can fill the form manually.`
        });
      }
    } catch (err: any) {
      setSearchStatus({ type: 'idle', message: '' });
      setError("Search failed: " + (err.message || "Unknown error"));
    }
  };

  // Real-time debounced search when BD number changes
  const handleBdNumberChange = (value: string) => {
    setBdNumberSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value || value.length < 2) {
      if (!value) {
        resetForm();
        const instrRole = availableRoles.find(r => r.name.toLowerCase().includes('instructor'));
        if (instrRole) setSelectedRoleIds([instrRole.id]);
        setSearchStatus({ type: 'idle', message: '' });
      }
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchBdNumber(value);
    }, 600);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, []);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { setError("Profile picture size must be less than 1MB"); return; }
      try {
        const base64 = await convertToBase64(file);
        setProfilePicture(base64);
        setProfilePicturePreview(URL.createObjectURL(file));
      } catch { setError("Failed to process profile picture"); }
    }
  };

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { setError("Signature size must be less than 1MB"); return; }
      try {
        const base64 = await convertToBase64(file);
        setSignature(base64);
        setSignaturePreview(URL.createObjectURL(file));
      } catch { setError("Failed to process signature"); }
    }
  };

  useEffect(() => {
    const fetchDivisions = async () => {
      const data = await geoLocationService.getDivisions();
      setDivisions(data);
    };
    fetchDivisions();
  }, []);

  const handleGeoData = async (type: string, divisionId?: string, districtId?: string) => {
    if (divisionId) {
      const data = await geoLocationService.getDistricts(Number(divisionId));
      if (type === 'present') setPresentDistricts(data);
      else if (type === 'permanent') setPermanentDistricts(data);
      else if (type === 'guardian') setGuardianDistricts(data);
    }
    if (districtId) {
      const data = await geoLocationService.getPostOffices(Number(districtId));
      if (type === 'present') setPresentPostOffices(data);
      else if (type === 'permanent') setPermanentPostOffices(data);
      else if (type === 'guardian') setGuardianPostOffices(data);
    }
  };

  useEffect(() => { if (presentDivision) handleGeoData('present', presentDivision); else { setPresentDistricts([]); setPresentDistrict(""); } }, [presentDivision]);
  useEffect(() => { if (permanentDivision) handleGeoData('permanent', permanentDivision); else { setPermanentDistricts([]); setPermanentDistrict(""); } }, [permanentDivision]);
  useEffect(() => { if (guardianDivision) handleGeoData('guardian', guardianDivision); else { setGuardianDistricts([]); setGuardianDistrict(""); } }, [guardianDivision]);
  useEffect(() => { if (presentDistrict) handleGeoData('present', undefined, presentDistrict); else { setPresentPostOffices([]); setPresentPostOffice(""); } }, [presentDistrict]);
  useEffect(() => { if (permanentDistrict) handleGeoData('permanent', undefined, permanentDistrict); else { setPermanentPostOffices([]); setPermanentPostOffice(""); } }, [permanentDistrict]);
  useEffect(() => { if (guardianDistrict) handleGeoData('guardian', undefined, guardianDistrict); else { setGuardianPostOffices([]); setGuardianPostOffice(""); } }, [guardianDistrict]);

  const addChild = () => setChildren([...children, { name: "", gender: "son" }]);
  const removeChild = (index: number) => setChildren(children.filter((_, i) => i !== index));
  const updateChild = (index: number, field: keyof Child, value: string) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value } as any;
    setChildren(updated);
  };

  const addLanguage = () => setLanguages([...languages, { language: "", write: false, read: false, speak: false }]);
  const removeLanguage = (index: number) => setLanguages(languages.filter((_, i) => i !== index));
  const updateLanguage = (index: number, field: keyof Language, value: string | boolean) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value } as any;
    setLanguages(updated);
  };

  const toggleRole = (roleId: number) => {
    const role = availableRoles.find(r => r.id === roleId);
    // Instructor role is always locked in add mode
    if (!localIsEdit && role?.name.toLowerCase().includes('instructor')) return;
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const addCertification = () => setCertifications([...certifications, { examFullName: "", examShortName: "", passingYear: "", grade: "", outOf: "", instituteName: "", others: "" }]);
  const removeCertification = (index: number) => setCertifications(certifications.filter((_, i) => i !== index));
  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const addAchievement = () => setAchievements([...achievements, { achievementTitle: "", description: "", achievementDate: "", awardedBy: "" }]);
  const removeAchievement = (index: number) => setAchievements(achievements.filter((_, i) => i !== index));
  const updateAchievement = (index: number, field: keyof Achievement, value: string) => {
    const updated = [...achievements];
    updated[index] = { ...updated[index], [field]: value };
    setAchievements(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!bdNumberSearch.trim()) {
      setError("BD/Service Number is required.");
      setLoading(false);
      return;
    }

    if (selectedRoleIds.length === 0) {
      setError("Please select at least one role before saving.");
      setLoading(false);
      document.getElementById("role-assignment-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      const formData = {
        id: instructorId,
        isEdit: localIsEdit,
        serviceNumber: bdNumberSearch,
        profilePicture,
        signature,
        name,
        nameBangla,
        shortName,
        gender,
        maritalStatus,
        religion,
        dateOfBirth,
        weight,
        height,
        bloodGroup,
        hairColor,
        eyeColor,
        caste,
        complexion,
        identificationMark,
        otherInformation,
        nationalId,
        mobile,
        password: (isExistingUser && !changePassword) ? "" : password,
        imo,
        email,
        whatsapp,
        viber,
        facebookId,
        drivingLicense,
        passport,
        hasSpouse,
        spouseName: hasSpouse ? spouseName : "",
        spouseGender: hasSpouse ? spouseGender : "",
        hasChildren,
        children: hasChildren ? children : [],
        languages,
        unit,
        trade,
        dateOfCommission,
        joiningDate,
        employeeType,
        legend,
        postingDate,
        presentDivision,
        presentDistrict,
        presentPostOffice,
        presentPostCode,
        presentAddress,
        permanentDivision,
        permanentDistrict,
        permanentPostOffice,
        permanentPostCode,
        permanentAddress,
        guardianDivision,
        guardianDistrict,
        guardianPostOffice,
        guardianPostCode,
        guardianAddress,
        certifications,
        achievements,
        emergencyContactName,
        emergencyContactPhone,
        specialization,
        qualification,
        yearsOfExperience,
        instructorSince,
        roleIds: selectedRoleIds,
      };

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save instructor");
    } finally {
      setLoading(false);
    }
  };

  const isFormLoading = loading || externalLoading;

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200">
      <form onSubmit={handleFormSubmit}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><FullLogo /></div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">{localIsEdit ? "Edit Instructor" : "Add New Instructor"}</h2>
        </div>

        {error && <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600">{error}</div>}

        {!propIsEdit && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label className="mb-2">BD/service Number <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={bdNumberSearch}
                      onChange={(e) => handleBdNumberChange(e.target.value)}
                      placeholder="Enter BD Number"
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSearchBdNumber()}
                    disabled={searchStatus.type === 'loading'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-shrink-0 h-[42px] flex items-center justify-center min-w-[42px]"
                  >
                    {searchStatus.type === 'loading' ? (
                      <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon icon="hugeicons:search-01" className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="col-span-3">
                {searchStatus.type !== 'idle' && searchStatus.type !== 'already_instructor' && (
                  <div className={`p-2.5 text-sm flex items-center gap-2 ${searchStatus.type === 'found' ? 'text-green-700' :
                      searchStatus.type === 'not_found' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                    {searchStatus.type === 'found' && <Icon icon="hugeicons:checkmark-circle-01" className="w-5 h-5" />}
                    {searchStatus.type === 'not_found' && <Icon icon="hugeicons:information-circle" className="w-5 h-5" />}
                    <span>{searchStatus.message}</span>
                  </div>
                )}
                {searchStatus.type === 'already_instructor' && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-orange-700 text-sm">
                      <Icon icon="hugeicons:alert-02" className="w-5 h-5 flex-shrink-0" />
                      <span>{searchStatus.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/users/instructors/${foundInstructorId}/edit`)}
                      className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Icon icon="hugeicons:pencil-edit-01" className="w-4 h-4" />
                      Edit Instructor
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">1. Basic Information</h2>
          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <Label>Profile Picture</Label>
              <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden">
                {profilePicturePreview ? <Image src={profilePicturePreview} alt="Profile Preview" fill className="object-cover" /> : <><Icon icon="hugeicons:user-circle" className="w-12 h-12 text-blue-400 mb-2" /><p className="text-xs text-red-500">No file selected</p><p className="text-xs text-gray-500">Max file size 1 MB</p></>}
                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
              </label>
            </div>
            <div>
              <Label>Signature</Label>
              <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden">
                {signaturePreview ? <Image src={signaturePreview} alt="Signature Preview" fill className="object-cover" /> : <><Icon icon="hugeicons:pen-tool-01" className="w-12 h-12 text-blue-400 mb-2" /><p className="text-xs text-red-500">No file selected</p><p className="text-xs text-gray-500">Max file size 1 MB</p></>}
                <input type="file" className="hidden" accept="image/*" onChange={handleSignatureChange} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div><Label>Name <span className="text-red-500">*</span></Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" required disabled={autoFilledFields.has('name')} className={autoFilledFields.has('name') ? 'bg-gray-100 cursor-not-allowed' : ''} />{autoFilledFields.has('name') && <p className="text-xs text-green-600 mt-1">Auto-filled from user data</p>}</div>
            <div><Label>নাম (Bangla) <span className="text-red-500">*</span></Label><Input value={nameBangla} onChange={(e) => setNameBangla(e.target.value)} placeholder="নাম বাংলায় লিখুন" required /></div>
            <div><Label>Short Name</Label><Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="Enter short name" /></div>
            <div><Label>Gender <span className="text-red-500">*</span></Label><select value={gender} onChange={(e) => setGender(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            <div><Label>Marital Status <span className="text-red-500">*</span></Label><select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select Status</option><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option></select></div>
            <div><Label>Religion <span className="text-red-500">*</span></Label><select value={religion} onChange={(e) => setReligion(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select Religion</option><option value="islam">Islam</option><option value="hinduism">Hinduism</option><option value="buddhism">Buddhism</option><option value="christianity">Christianity</option><option value="other">Other</option></select></div>
            <div><Label>Date of Birth <span className="text-red-500">*</span></Label><DatePicker value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} placeholder="dd/mm/yyyy" required disabled={autoFilledFields.has('dateOfBirth')} />{autoFilledFields.has('dateOfBirth') ? <p className="text-xs text-green-600 mt-1">Auto-filled from user data</p> : <p className="text-xs text-gray-500 mt-1">Birth date is required</p>}</div>
            <div><Label>Weight</Label><Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight (kg)" /></div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            <div><Label>Height</Label><Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height (ft)" /></div>
            <div><Label>Blood Group <span className="text-red-500">*</span></Label><select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required disabled={autoFilledFields.has('bloodGroup')} className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${autoFilledFields.has('bloodGroup') ? 'bg-gray-100 cursor-not-allowed' : ''}`}><option value="">Select Blood Group</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option></select>{autoFilledFields.has('bloodGroup') && <p className="text-xs text-green-600 mt-1">Auto-filled from user data</p>}</div>
            <div><Label>Hair Color</Label><Input value={hairColor} onChange={(e) => setHairColor(e.target.value)} placeholder="Hair color" /></div>
            <div><Label>Eye Color</Label><Input value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} placeholder="Eye color" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><Label>Caste</Label><Input value={caste} onChange={(e) => setCaste(e.target.value)} placeholder="Enter caste" /></div>
            <div><Label>Complexion</Label><Input value={complexion} onChange={(e) => setComplexion(e.target.value)} placeholder="Complexion" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><Label>Identification Mark</Label><textarea value={identificationMark} onChange={(e) => setIdentificationMark(e.target.value)} placeholder="Any identification marks" rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><Label>Other Information</Label><textarea value={otherInformation} onChange={(e) => setOtherInformation(e.target.value)} placeholder="Any other relevant information" rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">2. Contact Information</h2>
          <div className="grid grid-cols-4 gap-4">
            <div><Label>Email <span className="text-red-500">*</span></Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required disabled={autoFilledFields.has('email')} className={autoFilledFields.has('email') ? 'bg-gray-100 cursor-not-allowed' : ''} />{autoFilledFields.has('email') && <p className="text-xs text-green-600 mt-1">Auto-filled from user data</p>}</div>

            <div className="col-span-1">
              {!isExistingUser ? (
                <>
                  <Label>Password <span className="text-red-500">*</span></Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mt-7">
                    <input
                      type="checkbox"
                      id="changePassword"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="changePassword" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Do you change password?
                    </label>
                  </div>
                  {changePassword && (
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  )}
                </div>
              )}
            </div>

            <div><Label>Mobile No <span className="text-red-500">*</span></Label><Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile number" required disabled={autoFilledFields.has('mobile')} className={autoFilledFields.has('mobile') ? 'bg-gray-100 cursor-not-allowed' : ''} />{autoFilledFields.has('mobile') && <p className="text-xs text-green-600 mt-1">Auto-filled from user data</p>}</div>
            <div><Label>National ID Number</Label><Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="National ID Number" /></div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div><Label>IMO</Label><Input value={imo} onChange={(e) => setImo(e.target.value)} placeholder="IMO number" /></div>
            <div><Label>WhatsApp</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" /></div>
            <div><Label>Viber</Label><Input value={viber} onChange={(e) => setViber(e.target.value)} placeholder="Viber number" /></div>
            <div><Label>Facebook ID</Label><Input value={facebookId} onChange={(e) => setFacebookId(e.target.value)} placeholder="Facebook profile ID" /></div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div><Label>Driving License No</Label><Input value={drivingLicense} onChange={(e) => setDrivingLicense(e.target.value)} placeholder="Driving license number" /></div>
            <div><Label>Passport No</Label><Input value={passport} onChange={(e) => setPassport(e.target.value)} placeholder="Passport number" /></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">3. Spouse Information</h2>
          <div className="mb-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasSpouse} onChange={(e) => setHasSpouse(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" /><span className="font-medium text-gray-700">Do you have spouse?</span></label></div>
          {hasSpouse && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Spouse Name</Label><Input value={spouseName} onChange={(e) => setSpouseName(e.target.value)} placeholder="Spouse's full name" /></div>
                <div><Label>Relationship</Label><div className="flex items-center gap-4 mt-2"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={spouseGender === "wife"} onChange={() => setSpouseGender("wife")} className="w-4 h-4" /><span>Wife</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={spouseGender === "husband"} onChange={() => setSpouseGender("husband")} className="w-4 h-4" /><span>Husband</span></label></div></div>
                <div className="mt-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasChildren} onChange={(e) => { const checked = e.target.checked; setHasChildren(checked); if (checked && children.length === 0) setChildren([{ name: "", gender: "son" }]); }} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" /><span className="font-medium text-gray-700">Do you have children?</span></label></div>
              </div>
              {hasChildren && (
                <div className="mt-4">
                  {children.map((child, index) => (
                    <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900">Child #{index + 1}</h3><div className="flex gap-2 items-center"><button type="button" onClick={addChild} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"><Icon icon="hugeicons:add-circle" className="w-4 h-4" />Add Child</button>{index !== 0 && <button type="button" onClick={() => removeChild(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"><Icon icon="hugeicons:delete-02" className="w-4 h-4" />Remove</button>}</div></div>
                      <div className="grid grid-cols-2 gap-4"><div><Label>Child Name</Label><Input value={child.name} onChange={(e) => updateChild(index, "name", e.target.value)} placeholder="Enter child's name" /></div><div><Label>Gender</Label><div className="flex items-center gap-4 mt-2"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={child.gender === "son"} onChange={() => updateChild(index, "gender", "son")} className="w-4 h-4" /><span>Son</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={child.gender === "daughter"} onChange={() => updateChild(index, "gender", "daughter")} className="w-4 h-4" /><span>Daughter</span></label></div></div></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300 flex-1">4. Languages</h2>
          {languages.map((lang, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-900">Language #{index + 1}</h3><div className="flex gap-2 items-center"><button type="button" onClick={addLanguage} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"><Icon icon="hugeicons:add-circle" className="w-4 h-4" />Add Language</button>{index !== 0 && <button type="button" onClick={() => removeLanguage(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"><Icon icon="hugeicons:delete-02" className="w-4 h-4" />Remove</button>}</div></div>
              <div className="grid grid-cols-2 gap-4"><div><Label>Language Name</Label><select value={lang.language} onChange={(e) => updateLanguage(index, "language", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select language</option><option value="bengali">Bengali</option><option value="english">English</option><option value="arabic">Arabic</option><option value="hindi">Hindi</option><option value="urdu">Urdu</option><option value="french">French</option><option value="german">German</option><option value="spanish">Spanish</option><option value="chinese">Chinese</option></select></div><div><Label>Language Skill</Label><div className="flex items-center gap-6 mt-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={lang.write} onChange={(e) => updateLanguage(index, "write", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" /><span className="text-gray-700">Write</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={lang.read} onChange={(e) => updateLanguage(index, "read", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" /><span className="text-gray-700">Read</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={lang.speak} onChange={(e) => updateLanguage(index, "speak", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" /><span className="text-gray-700">Speak</span></label></div></div></div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">5. Office Information</h2>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div><Label>Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" /></div>
            <div><Label>Trade</Label><Input value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="Trade" /></div>
            <div><Label>Date of Commission</Label><DatePicker value={dateOfCommission} onChange={(e) => setDateOfCommission(e.target.value)} placeholder="dd/mm/yyyy" /></div>
            <div><Label>Joining Date</Label><DatePicker value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} placeholder="dd/mm/yyyy" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div><Label>Employee Type</Label><select value={employeeType} onChange={(e) => setEmployeeType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select Type</option><option value="permanent">Permanent</option><option value="temporary">Temporary</option><option value="contract">Contract</option></select></div>
            <div><Label>Legend</Label><Input value={legend} onChange={(e) => setLegend(e.target.value)} placeholder="Legend" /></div>
            <div><Label>Posting Date</Label><DatePicker value={postingDate} onChange={(e) => setPostingDate(e.target.value)} placeholder="dd/mm/yyyy" /></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">6. Present Address <span className="text-red-500">*</span></h2>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Division <span className="text-red-500">*</span></Label><select value={presentDivision} onChange={(e) => setPresentDivision(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select division</option>{divisions.map((division) => (<option key={division.id} value={division.id}>{division.name}</option>))}</select></div>
            <div><Label>District <span className="text-red-500">*</span></Label><select value={presentDistrict} onChange={(e) => setPresentDistrict(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!presentDivision}><option value="">Select district</option>{presentDistricts.map((district) => (<option key={district.id} value={district.id}>{district.name}</option>))}</select></div>
            <div><Label>Post Office/Thana <span className="text-red-500">*</span></Label><select value={presentPostOffice} onChange={(e) => setPresentPostOffice(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!presentDistrict}><option value="">Select post office</option>{presentPostOffices.map((postOffice) => (<option key={postOffice.id} value={postOffice.id}>{postOffice.name}</option>))}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><Label>Post Code <span className="text-red-500">*</span></Label><Input value={presentPostCode} onChange={(e) => setPresentPostCode(e.target.value)} placeholder="Enter post code" required /></div>
            <div><Label>Address <span className="text-red-500">*</span></Label><Input value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} placeholder="Enter your present address" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">7. Permanent Address</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Division</Label><select value={permanentDivision} onChange={(e) => setPermanentDivision(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select division</option>{divisions.map((division) => (<option key={division.id} value={division.id}>{division.name}</option>))}</select></div>
            <div><Label>District</Label><select value={permanentDistrict} onChange={(e) => setPermanentDistrict(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!permanentDivision}><option value="">Select district</option>{permanentDistricts.map((district) => (<option key={district.id} value={district.id}>{district.name}</option>))}</select></div>
            <div><Label>Post Office</Label><select value={permanentPostOffice} onChange={(e) => setPermanentPostOffice(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!permanentDistrict}><option value="">Select post office</option>{permanentPostOffices.map((postOffice) => (<option key={postOffice.id} value={postOffice.id}>{postOffice.name}</option>))}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><Label>Post Code</Label><Input value={permanentPostCode} onChange={(e) => setPermanentPostCode(e.target.value)} placeholder="Enter post code" /></div>
            <div><Label>Address</Label><Input value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} placeholder="Enter your permanent address" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">8. Guardian Address</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Division</Label><select value={guardianDivision} onChange={(e) => setGuardianDivision(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select division</option>{divisions.map((division) => (<option key={division.id} value={division.id}>{division.name}</option>))}</select></div>
            <div><Label>District</Label><select value={guardianDistrict} onChange={(e) => setGuardianDistrict(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!guardianDivision}><option value="">Select district</option>{guardianDistricts.map((district) => (<option key={district.id} value={district.id}>{district.name}</option>))}</select></div>
            <div><Label>Post Office/Thana</Label><select value={guardianPostOffice} onChange={(e) => setGuardianPostOffice(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!guardianDistrict}><option value="">Select post office</option>{guardianPostOffices.map((postOffice) => (<option key={postOffice.id} value={postOffice.id}>{postOffice.name}</option>))}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><Label>Post Code</Label><Input value={guardianPostCode} onChange={(e) => setGuardianPostCode(e.target.value)} placeholder="Enter post code" /></div>
            <div><Label>Address</Label><Input value={guardianAddress} onChange={(e) => setGuardianAddress(e.target.value)} placeholder="Enter guardian address" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">9. Education/Certifications</h2>
          {certifications.map((cert, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-3"><span className="font-medium text-gray-700">Certification #{index + 1}</span>{certifications.length > 1 && <button type="button" onClick={() => removeCertification(index)} className="text-red-500 hover:text-red-700"><Icon icon="hugeicons:delete-02" className="w-5 h-5" /></button>}</div>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Exam Full Name <span className="text-red-500">*</span></Label><Input value={cert.examFullName} onChange={(e) => updateCertification(index, "examFullName", e.target.value)} placeholder="e.g., Secondary School Certificate" /></div>
                <div><Label>Exam Short Name</Label><Input value={cert.examShortName} onChange={(e) => updateCertification(index, "examShortName", e.target.value)} placeholder="e.g., SSC" /></div>
                <div><Label>Passing Year</Label><Input value={cert.passingYear} onChange={(e) => updateCertification(index, "passingYear", e.target.value)} placeholder="e.g., 2015" /></div>
                <div><Label>Grade/GPA</Label><Input value={cert.grade} onChange={(e) => updateCertification(index, "grade", e.target.value)} placeholder="e.g., 5.00" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div><Label>Out Of</Label><Input value={cert.outOf} onChange={(e) => updateCertification(index, "outOf", e.target.value)} placeholder="e.g., 5.00" /></div>
                <div><Label>Institute Name</Label><Input value={cert.instituteName} onChange={(e) => updateCertification(index, "instituteName", e.target.value)} placeholder="Enter institute name" /></div>
                <div><Label>Others/Remarks</Label><Input value={cert.others} onChange={(e) => updateCertification(index, "others", e.target.value)} placeholder="Any other information" /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addCertification} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"><Icon icon="hugeicons:plus-sign-circle" className="w-5 h-5" />Add Another Certification</button>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">10. Achievements</h2>
          {achievements.map((achievement, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-center mb-3"><span className="font-medium text-gray-700">Achievement #{index + 1}</span>{achievements.length > 1 && <button type="button" onClick={() => removeAchievement(index)} className="text-red-500 hover:text-red-700"><Icon icon="hugeicons:delete-02" className="w-5 h-5" /></button>}</div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Achievement Title <span className="text-red-500">*</span></Label><Input value={achievement.achievementTitle} onChange={(e) => updateAchievement(index, "achievementTitle", e.target.value)} placeholder="Enter achievement title" /></div>
                <div><Label>Awarded By</Label><Input value={achievement.awardedBy} onChange={(e) => updateAchievement(index, "awardedBy", e.target.value)} placeholder="Enter awarding organization" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div><Label>Achievement Date</Label><DatePicker value={achievement.achievementDate} onChange={(e) => updateAchievement(index, "achievementDate", e.target.value)} placeholder="Select date" /></div>
                <div><Label>Description</Label><Input value={achievement.description} onChange={(e) => updateAchievement(index, "description", e.target.value)} placeholder="Brief description" /></div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addAchievement} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"><Icon icon="hugeicons:plus-sign-circle" className="w-5 h-5" />Add Another Achievement</button>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">11. Professional Information</h2>
          <div className="grid grid-cols-4 gap-4">
            <div><Label>Specialization</Label><Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Enter specialization" /></div>
            <div><Label>Qualification</Label><Input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="Enter qualification" /></div>
            <div><Label>Years of Experience</Label><Input type="number" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="e.g., 5" /></div>
            <div><Label>Instructor Since</Label><DatePicker value={instructorSince} onChange={(e) => setInstructorSince(e.target.value)} placeholder="Select date" /></div>
          </div>
        </div>

        <div className="mb-8" id="role-assignment-section">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            12. Role Assignment <span className="text-red-500">*</span>
          </h2>
          {availableRoles.length === 0 ? (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Icon icon="hugeicons:loading-03" className="w-4 h-4 animate-spin" />
              Loading roles...
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableRoles.map(role => {
                const isSelected = selectedRoleIds.includes(role.id);
                // All roles are always disabled - auto-selected based on user data
                const isDisabled = true;
                return (
                  <label
                    key={role.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all select-none ${
                      isDisabled && !isSelected
                        ? 'cursor-not-allowed opacity-50'
                        : isDisabled && isSelected
                          ? 'cursor-not-allowed'
                          : 'cursor-pointer'
                    } ${
                      isSelected
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isDisabled && toggleRole(role.id)}
                      disabled={isDisabled}
                      className={`w-4 h-4 rounded focus:ring-blue-500 ${isSelected && isDisabled ? 'text-green-600 border-green-400 cursor-not-allowed' : 'text-blue-600 border-gray-300 disabled:cursor-not-allowed'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                        {role.name}
                      </p>
                      {isSelected && isDisabled && (
                        <p className="text-xs text-green-600 truncate">Auto-selected</p>
                      )}
                      {role.description && !isSelected && (
                        <p className="text-xs text-gray-500 truncate">{role.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <Icon icon="hugeicons:checkmark-circle-02" className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </label>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <Icon icon="hugeicons:information-circle" className="w-3.5 h-3.5 flex-shrink-0" />
            {localIsEdit
              ? <>Roles are locked in edit mode. Use the <strong className="mx-1">Assign Role</strong> button on the instructors list to manage roles.</>
              : isExistingUser
                ? <>{selectedRoleIds.length} role{selectedRoleIds.length > 1 ? 's' : ''} auto-selected (Instructor + existing roles). Manage roles from the instructors list after saving.</>
                : <>Instructor role is auto-assigned. Additional roles can be managed after creation.</>
            }
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">13. Emergency Contact</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Contact Name</Label><Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="Enter emergency contact name" /></div>
            <div><Label>Contact Phone</Label><Input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} placeholder="Enter emergency contact phone" /></div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800"><Icon icon="hugeicons:information-circle" className="w-4 h-4 inline mr-2" />All fields marked with <span className="text-red-500">*</span> are required</p>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-300">
          <button type="button" onClick={onCancel} disabled={isFormLoading} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isFormLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">{isFormLoading ? <><Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />Saving...</> : localIsEdit ? "Update Instructor" : "Save Instructor"}</button>
        </div>
      </form>
    </div>
  );
}
