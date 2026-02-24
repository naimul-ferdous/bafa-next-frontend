/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import FullLogo from "@/components/ui/fulllogo";
import DatePicker from "@/components/form/input/DatePicker";
import { geoLocationService, type Division, type District, type PostOffice } from "@/libs/services/geoLocationService";
import { courseService } from "@/libs/services/courseService";
import { semesterService } from "@/libs/services/semesterService";
import { programService } from "@/libs/services/programService";
import { branchService } from "@/libs/services/branchService";
import { groupService } from "@/libs/services/groupService";
import { rankService } from "@/libs/services/rankService";
import type { SystemCourse, SystemSemester, SystemProgram, SystemBranch, SystemGroup } from "@/libs/types/system";
import type { CadetProfile, Rank } from "@/libs/types/user";
import { getImageUrl } from "@/libs/utils/formatter";

interface FamilyMember {
  // ... (omitting intermediate interfaces for brevity in thinking, but the tool needs the full match)
  relationship: string;
  status: string;
  name: string;
  mobileNo: string;
  occupation: string;
  age: string;
  address: string;
  politicalInvolvement: string;
  politicalPartyName: string;
  isGuardian: boolean;
}

interface EducationalRecord {
  examType: string;
  withinBafa: boolean;
  inBafa: boolean;
  exam: string;
  institution: string;
  boardName: string;
  yearFrom: string;
  yearTo: string;
  subjectGroup: string;
  totalMarksGpa: string;
  out_of: string;
}

interface ArmyRelation {
  rank: string;
  name: string;
  relationship: string;
  baNo: string;
  presentAddress: string;
}

interface PoliticsRelation {
  name: string;
  politicalPartyName: string;
  appointment: string;
}

interface Language {
  language: string;
  write: boolean;
  read: boolean;
  speak: boolean;
}

interface VisitAbord {
  countryName: string;
  purpose: string;
  name: string;
  fromdate: string;
  todate: string;
}

interface Employment {
  organizationName: string;
  officeAddress: string;
  natureOfResponsibilities: string;
  dateOfAppointment: string;
  grossSalary: string;
  presentState: string;
}

interface BankInfo {
  bankName: string;
  bankBranch: string;
  accountName: string;
  accountNumber: string;
}

interface NextOfKin {
  name: string;
  relationship: string;
  address: string;
  mobileNo: string;
  authorizedBy: string;
}

interface InsuranceInfo {
  policyName: string;
  companyName: string;
  amount: string;
  nextofKin: string;
  nextofKinAddress: string;
  startDate: string;
}

interface NomineeInfo {
  nomineeType: string;
  name: string;
  relationship: string;
  percentage: string;
  address: string;
}

interface CadetFormProps {
  initialData?: CadetProfile | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

export default function CadetForm({ initialData, onSubmit, onCancel, loading: externalLoading, isEdit = false }: CadetFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Profile Picture
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");

  // 1. Health Record & Basic Information
  const [bdNo, setBdNo] = useState("");
  const [cadetName, setCadetName] = useState("");
  const [nameBangla, setNameBangla] = useState("");
  const [shortName, setShortName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [branch, setBranch] = useState("");
  const [course, setCourse] = useState("");

  // 2. Personal Details
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [haveProfessional, setHaveProfessional] = useState(false);
  const [religion, setReligion] = useState("");
  const [caste, setCaste] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [identificationMark, setIdentificationMark] = useState("");
  const [complexion, setComplexion] = useState("");

  // 3. Identity Documents
  const [nidNo, setNidNo] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [drivingLicenseNo, setDrivingLicenseNo] = useState("");

  // 4. Enrollment Data
  const [enrollmentDate, setEnrollmentDate] = useState("");

  // 5. Permanent Address
  const [permanentDivision, setPermanentDivision] = useState("");
  const [permanentDistrict, setPermanentDistrict] = useState("");
  const [permanentPostOffice, setPermanentPostOffice] = useState("");
  const [permanentPostCode, setPermanentPostCode] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  // 6. Present Address
  const [presentDivision, setPresentDivision] = useState("");
  const [presentDistrict, setPresentDistrict] = useState("");
  const [presentPostOffice, setPresentPostOffice] = useState("");
  const [presentPostCode, setPresentPostCode] = useState("");
  const [presentAddress, setPresentAddress] = useState("");

  // 7. Guardian Address
  const [guardianDivision, setGuardianDivision] = useState("");
  const [guardianDistrict, setGuardianDistrict] = useState("");
  const [guardianPostOffice, setGuardianPostOffice] = useState("");
  const [guardianPostCode, setGuardianPostCode] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");

  // 8. Marital Status
  const [maritalStatus, setMaritalStatus] = useState("");

  // 9. Family Information
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { relationship: "", status: "alive", name: "", mobileNo: "", occupation: "", age: "", address: "", politicalInvolvement: "", politicalPartyName: "", isGuardian: false }
  ]);

  // 10. Educational Information
  const [educationalRecords, setEducationalRecords] = useState<EducationalRecord[]>([
    { examType: "", withinBafa: false, inBafa: false, exam: "", institution: "", boardName: "", yearFrom: "", yearTo: "", subjectGroup: "", totalMarksGpa: "", out_of: "" }
  ]);

  // 11. Relation in Army Force
  const [armyRelations, setArmyRelations] = useState<ArmyRelation[]>([
    { rank: "", name: "", relationship: "", baNo: "", presentAddress: "" }
  ]);

  // 12. Politics Involved Relation
  const [politicsRelations, setPoliticsRelations] = useState<PoliticsRelation[]>([
    { name: "", politicalPartyName: "", appointment: "" }
  ]);

  // 13. Languages
  const [languages, setLanguages] = useState<Language[]>([
    { language: "", write: false, read: false, speak: false }
  ]);

  // 14. Visit Abord
  const [visitAbord, setVisitAbord] = useState<VisitAbord[]>([
    { countryName: "", purpose: "", name: "", fromdate: "", todate: "" }
  ]);

  // 15. Employment Before Joining BAFA
  const [employments, setEmployments] = useState<Employment[]>([
    { organizationName: "", officeAddress: "", natureOfResponsibilities: "", dateOfAppointment: "", grossSalary: "", presentState: "" }
  ]);

  // 16. Game & Sports
  const [gameSports, setGameSports] = useState("");
  const [sportsClub, setSportsClub] = useState("");

  // 17. Hobbies
  const [hobbies, setHobbies] = useState("");

  // 18. Special Formal Qualification
  const [specialQualification, setSpecialQualification] = useState("");

  // 19. Social & Cultural Activities
  const [socialActivities, setSocialActivities] = useState("");
  const [culturalActivities, setCulturalActivities] = useState("");

  // 20. Date of Arrival and Promotions
  const [arrivalDateBma, setArrivalDateBma] = useState("");
  const [arrivalDateBafa, setArrivalDateBafa] = useState("");
  const [secondPromotionDate, setSecondPromotionDate] = useState("");
  const [thirdPromotionDate, setThirdPromotionDate] = useState("");
  const [forthPromotionDate, setForthPromotionDate] = useState("");
  const [fivePromotionDate, setFivePromotionDate] = useState("");
  const [sixPromotionDate, setsixPromotionDate] = useState("");

  // 21. Bank Information
  const [bankInfos, setBankInfos] = useState<BankInfo[]>([
    { bankName: "", bankBranch: "", accountName: "", accountNumber: "" }
  ]);

  // 22. Next of Kin
  const [nextOfKins, setNextOfKins] = useState<NextOfKin[]>([
    { name: "", relationship: "", address: "", mobileNo: "", authorizedBy: "" }
  ]);

  // 23. Insurance Information
  const [insuranceInfos, setInsuranceInfos] = useState<InsuranceInfo[]>([
    { policyName: "", companyName: "", amount: "", nextofKin: "", nextofKinAddress: "", startDate: "" }
  ]);

  // 24. Nominee Information
  const [nomineeInfos, setNomineeInfos] = useState<NomineeInfo[]>([
    { nomineeType: "", name: "", relationship: "", percentage: "", address: "" }
  ]);

  // 25. Course & Academic Information
  const [semester, setSemester] = useState("");
  const [examType, setExamType] = useState("");
  const [program, setProgram] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [rank, setRank] = useState("");

  // 26. Emergency Contact Information
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyContactEmail, setEmergencyContactEmail] = useState("");

  // Bangladesh Geo Data
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [permanentDistricts, setPermanentDistricts] = useState<District[]>([]);
  const [presentDistricts, setPresentDistricts] = useState<District[]>([]);
  const [guardianDistricts, setGuardianDistricts] = useState<District[]>([]);
  const [permanentPostOffices, setPermanentPostOffices] = useState<PostOffice[]>([]);
  const [presentPostOffices, setPresentPostOffices] = useState<PostOffice[]>([]);
  const [guardianPostOffices, setGuardianPostOffices] = useState<PostOffice[]>([]);

  // System Data for Dropdowns
  const [courses, setCourses] = useState<SystemCourse[]>([]);
  const [semesters, setSemesters] = useState<SystemSemester[]>([]);
  const [programs, setPrograms] = useState<SystemProgram[]>([]);
  const [branches, setBranches] = useState<SystemBranch[]>([]);
  const [groups, setGroups] = useState<SystemGroup[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);

  // Format date helper
  const formatDateForDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  // Fetch divisions on component mount
  useEffect(() => {
    const fetchDivisions = async () => {
      const data = await geoLocationService.getDivisions();
      setDivisions(data);
    };
    fetchDivisions();
  }, []);

  // Fetch courses, semesters, programs, branches, exams, groups on component mount
  useEffect(() => {
    const fetchSystemData = async () => {
      const [coursesData, semestersData, programsData, branchesData, groupsData, ranksData] = await Promise.all([
        courseService.getAllCourses({ per_page: 100 }),
        semesterService.getAllSemesters({ per_page: 100 }),
        programService.getAllPrograms({ per_page: 100 }),
        branchService.getAllBranches({ per_page: 100 }),
        groupService.getAllGroups({ per_page: 100 }),
        rankService.getAllRanks({ per_page: 100 }),
      ]);
      setCourses(coursesData.data);
      setSemesters(semestersData.data);
      setPrograms(programsData.data);
      setBranches(branchesData.data);
      setGroups(groupsData.data);
      setRanks(ranksData.data);
    };
    fetchSystemData();
  }, []);

  // Fetch districts for Permanent Address
  useEffect(() => {
    if (permanentDivision) {
      const fetchDistricts = async () => {
        const data = await geoLocationService.getDistricts(Number(permanentDivision));
        setPermanentDistricts(data);
      };
      fetchDistricts();
    } else {
      setPermanentDistricts([]);
      setPermanentDistrict("");
    }
  }, [permanentDivision]);

  // Fetch districts for Present Address
  useEffect(() => {
    if (presentDivision) {
      const fetchDistricts = async () => {
        const data = await geoLocationService.getDistricts(Number(presentDivision));
        setPresentDistricts(data);
      };
      fetchDistricts();
    } else {
      setPresentDistricts([]);
      setPresentDistrict("");
    }
  }, [presentDivision]);

  // Fetch districts for Guardian Address
  useEffect(() => {
    if (guardianDivision) {
      const fetchDistricts = async () => {
        const data = await geoLocationService.getDistricts(Number(guardianDivision));
        setGuardianDistricts(data);
      };
      fetchDistricts();
    } else {
      setGuardianDistricts([]);
      setGuardianDistrict("");
    }
  }, [guardianDivision]);

  // Fetch post offices for Permanent Address
  useEffect(() => {
    if (permanentDistrict) {
      const fetchPostOffices = async () => {
        const data = await geoLocationService.getPostOffices(Number(permanentDistrict));
        setPermanentPostOffices(data);
      };
      fetchPostOffices();
    } else {
      setPermanentPostOffices([]);
      setPermanentPostOffice("");
    }
  }, [permanentDistrict]);

  // Fetch post offices for Present Address
  useEffect(() => {
    if (presentDistrict) {
      const fetchPostOffices = async () => {
        const data = await geoLocationService.getPostOffices(Number(presentDistrict));
        setPresentPostOffices(data);
      };
      fetchPostOffices();
    } else {
      setPresentPostOffices([]);
      setPresentPostOffice("");
    }
  }, [presentDistrict]);

  // Fetch post offices for Guardian Address
  useEffect(() => {
    if (guardianDistrict) {
      const fetchPostOffices = async () => {
        const data = await geoLocationService.getPostOffices(Number(guardianDistrict));
        setGuardianPostOffices(data);
      };
      fetchPostOffices();
    } else {
      setGuardianPostOffices([]);
      setGuardianPostOffice("");
    }
  }, [guardianDistrict]);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      // Basic Information
      setBdNo(initialData.cadet_number || "");
      setCadetName(initialData.name || "");
      setNameBangla(initialData.name_bangla || "");
      setShortName(initialData.short_name || "");
      setEmail(initialData.email || "");
      setContactNo(initialData.contact_no || "");

      if (initialData.profile_photo) {
        setProfilePicturePreview(getImageUrl(initialData.profile_photo));
      }

      // Assignments
      setBranch((initialData as any).assign_branch_id?.toString() || "");
      setCourse((initialData as any).assign_course_id?.toString() || "");
      setSemester((initialData as any).assign_semester_id?.toString() || "");
      setExamType((initialData as any).assign_exam_type_id?.toString() || "");
      setProgram((initialData as any).assign_program_id?.toString() || "");
      setYearGroup((initialData as any).assign_year_group_id?.toString() || "");
      setRank(initialData.rank_id?.toString() || "");

      // Personal Details
      setGender((initialData.gender as any) || "");
      setHaveProfessional(initialData.have_professional || false);
      setReligion(initialData.religion || "");
      setCaste(initialData.caste || "");
      setBloodGroup(initialData.blood_group || "");
      setDateOfBirth(formatDateForDisplay(initialData.date_of_birth));
      setWeight(initialData.weight || "");
      setHeight(initialData.height || "");
      setEyeColor(initialData.eye_color || "");
      setHairColor(initialData.hair_color || "");
      setIdentificationMark(initialData.identification_mark || "");
      setComplexion(initialData.complexion || "");

      // Identity Documents
      setNidNo(initialData.nid_no || "");
      setPassportNo(initialData.passport_no || "");
      setDrivingLicenseNo(initialData.driving_license_no || "");

      // Enrollment Data
      setEnrollmentDate(formatDateForDisplay(initialData.enrollment_date));

      // Addresses
      setPermanentDivision(initialData.permanent_division?.toString() || "");
      setPermanentDistrict(initialData.permanent_district?.toString() || "");
      setPermanentPostOffice(initialData.permanent_post_office?.toString() || "");
      setPermanentPostCode(initialData.permanent_post_code || "");
      setPermanentAddress(initialData.permanent_address || "");

      setPresentDivision(initialData.present_division?.toString() || "");
      setPresentDistrict(initialData.present_district?.toString() || "");
      setPresentPostOffice(initialData.present_post_office?.toString() || "");
      setPresentPostCode(initialData.present_post_code || "");
      setPresentAddress(initialData.present_address || "");

      setGuardianDivision(initialData.guardian_division?.toString() || "");
      setGuardianDistrict(initialData.guardian_district?.toString() || "");
      setGuardianPostOffice(initialData.guardian_post_office?.toString() || "");
      setGuardianPostCode(initialData.guardian_post_code || "");
      setGuardianAddress(initialData.guardian_address || "");

      setMaritalStatus(initialData.marital_status || "");

      // Lists
      if (initialData.family_members && initialData.family_members.length > 0) setFamilyMembers(initialData.family_members);
      if (initialData.educational_records && initialData.educational_records.length > 0) setEducationalRecords(initialData.educational_records);
      if (initialData.educations && initialData.educations.length > 0 && (!initialData.educational_records || initialData.educational_records.length === 0)) setEducationalRecords(initialData.educations);
      
      if (initialData.army_relations && initialData.army_relations.length > 0) setArmyRelations(initialData.army_relations);
      
      if (initialData.politics_relations && initialData.politics_relations.length > 0) setPoliticsRelations(initialData.politics_relations);
      if (initialData.political_relations && initialData.political_relations.length > 0 && (!initialData.politics_relations || initialData.politics_relations.length === 0)) setPoliticsRelations(initialData.political_relations);
      
      if (initialData.languages && initialData.languages.length > 0) setLanguages(initialData.languages);
      
      if (initialData.visitAbord && initialData.visitAbord.length > 0) setVisitAbord(initialData.visitAbord);
      if (initialData.visits_abroad && initialData.visits_abroad.length > 0 && (!initialData.visitAbord || initialData.visitAbord.length === 0)) setVisitAbord(initialData.visits_abroad);
      
      if (initialData.employments && initialData.employments.length > 0) setEmployments(initialData.employments);
      if (initialData.before_bafa_employees && initialData.before_bafa_employees.length > 0 && (!initialData.employments || initialData.employments.length === 0)) setEmployments(initialData.before_bafa_employees);

      setGameSports(initialData.game_sports || "");
      setSportsClub(initialData.sports_club || "");
      setHobbies(initialData.hobbies || "");
      setSpecialQualification(initialData.special_qualification || "");
      setSocialActivities(initialData.social_activities || "");
      setCulturalActivities(initialData.cultural_activities || "");

      setArrivalDateBma(formatDateForDisplay(initialData.arrival_date_bma));
      setArrivalDateBafa(formatDateForDisplay(initialData.arrival_date_bafa));
      setSecondPromotionDate(formatDateForDisplay(initialData.second_promotion_date));
      setThirdPromotionDate(formatDateForDisplay(initialData.third_promotion_date));
      setForthPromotionDate(formatDateForDisplay(initialData.forth_promotion_date));
      setFivePromotionDate(formatDateForDisplay(initialData.five_promotion_date));
      setsixPromotionDate(formatDateForDisplay(initialData.six_promotion_date));

      if (initialData.bank_infos && initialData.bank_infos.length > 0) setBankInfos(initialData.bank_infos);
      if (initialData.banks && initialData.banks.length > 0 && (!initialData.bank_infos || initialData.bank_infos.length === 0)) setBankInfos(initialData.banks);
      
      if (initialData.next_of_kins && initialData.next_of_kins.length > 0) setNextOfKins(initialData.next_of_kins);
      
      if (initialData.insurance_infos && initialData.insurance_infos.length > 0) setInsuranceInfos(initialData.insurance_infos);
      if (initialData.insurances && initialData.insurances.length > 0 && (!initialData.insurance_infos || initialData.insurance_infos.length === 0)) setInsuranceInfos(initialData.insurances);
      
      if (initialData.nominee_infos && initialData.nominee_infos.length > 0) setNomineeInfos(initialData.nominee_infos);
      if (initialData.nominees && initialData.nominees.length > 0 && (!initialData.nominee_infos || initialData.nominee_infos.length === 0)) setNomineeInfos(initialData.nominees);

      setEmergencyPhone(initialData.emergency_phone || "");
      setEmergencyContactEmail(initialData.emergency_contact_email || "");
    }
  }, [initialData]);

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError("Profile picture size must be less than 1MB");
        return;
      }
      try {
        const base64 = await convertToBase64(file);
        setProfilePicture(base64);
        setProfilePicturePreview(URL.createObjectURL(file));
      } catch {
        setError("Failed to process profile picture");
      }
    }
  };

  // Handlers for dynamic lists
  const addFamilyMember = () => setFamilyMembers([...familyMembers, { relationship: "", status: "alive", name: "", mobileNo: "", occupation: "", age: "", address: "", politicalInvolvement: "", politicalPartyName: "", isGuardian: false }]);
  const removeFamilyMember = (index: number) => setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string | boolean) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const addEducationalRecord = () => setEducationalRecords([...educationalRecords, { examType: "", withinBafa: false, inBafa: false, exam: "", institution: "", boardName: "", yearFrom: "", yearTo: "", subjectGroup: "", totalMarksGpa: "", out_of: "" }]);
  const removeEducationalRecord = (index: number) => setEducationalRecords(educationalRecords.filter((_, i) => i !== index));
  const updateEducationalRecord = (index: number, field: keyof EducationalRecord, value: string | boolean) => {
    const updated = [...educationalRecords];
    updated[index] = { ...updated[index], [field]: value };
    setEducationalRecords(updated);
  };

  const addArmyRelation = () => setArmyRelations([...armyRelations, { rank: "", name: "", relationship: "", baNo: "", presentAddress: "" }]);
  const removeArmyRelation = (index: number) => setArmyRelations(armyRelations.filter((_, i) => i !== index));
  const updateArmyRelation = (index: number, field: keyof ArmyRelation, value: string) => {
    const updated = [...armyRelations];
    updated[index] = { ...updated[index], [field]: value };
    setArmyRelations(updated);
  };

  const addPoliticsRelation = () => setPoliticsRelations([...politicsRelations, { name: "", politicalPartyName: "", appointment: "" }]);
  const removePoliticsRelation = (index: number) => setPoliticsRelations(politicsRelations.filter((_, i) => i !== index));
  const updatePoliticsRelation = (index: number, field: keyof PoliticsRelation, value: string) => {
    const updated = [...politicsRelations];
    updated[index] = { ...updated[index], [field]: value };
    setPoliticsRelations(updated);
  };

  const addLanguage = () => setLanguages([...languages, { language: "", write: false, read: false, speak: false }]);
  const removeLanguage = (index: number) => setLanguages(languages.filter((_, i) => i !== index));
  const updateLanguage = (index: number, field: keyof Language, value: string | boolean) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    setLanguages(updated);
  };

  const addVisitAbord = () => setVisitAbord([...visitAbord, { countryName: "", purpose: "", name: "", fromdate: "", todate: "" }]);
  const removeVisitAbord = (index: number) => setVisitAbord(visitAbord.filter((_, i) => i !== index));
  const updateVisitAbord = (index: number, field: keyof VisitAbord, value: string) => {
    const updated = [...visitAbord];
    updated[index] = { ...updated[index], [field]: value };
    setVisitAbord(updated);
  };

  const addEmployment = () => setEmployments([...employments, { organizationName: "", officeAddress: "", natureOfResponsibilities: "", dateOfAppointment: "", grossSalary: "", presentState: "" }]);
  const removeEmployment = (index: number) => setEmployments(employments.filter((_, i) => i !== index));
  const updateEmployment = (index: number, field: keyof Employment, value: string) => {
    const updated = [...employments];
    updated[index] = { ...updated[index], [field]: value };
    setEmployments(updated);
  };

  const addBankInfo = () => setBankInfos([...bankInfos, { bankName: "", bankBranch: "", accountName: "", accountNumber: "" }]);
  const removeBankInfo = (index: number) => setBankInfos(bankInfos.filter((_, i) => i !== index));
  const updateBankInfo = (index: number, field: keyof BankInfo, value: string) => {
    const updated = [...bankInfos];
    updated[index] = { ...updated[index], [field]: value };
    setBankInfos(updated);
  };

  const addNextOfKin = () => setNextOfKins([...nextOfKins, { name: "", relationship: "", address: "", mobileNo: "", authorizedBy: "" }]);
  const removeNextOfKin = (index: number) => setNextOfKins(nextOfKins.filter((_, i) => i !== index));
  const updateNextOfKin = (index: number, field: keyof NextOfKin, value: string) => {
    const updated = [...nextOfKins];
    updated[index] = { ...updated[index], [field]: value };
    setNextOfKins(updated);
  };

  const addInsuranceInfo = () => setInsuranceInfos([...insuranceInfos, { policyName: "", companyName: "", amount: "", nextofKin: "", nextofKinAddress: "", startDate: "" }]);
  const removeInsuranceInfo = (index: number) => setInsuranceInfos(insuranceInfos.filter((_, i) => i !== index));
  const updateInsuranceInfo = (index: number, field: keyof InsuranceInfo, value: string) => {
    const updated = [...insuranceInfos];
    updated[index] = { ...updated[index], [field]: value };
    setInsuranceInfos(updated);
  };

  const addNomineeInfo = () => setNomineeInfos([...nomineeInfos, { nomineeType: "", name: "", relationship: "", percentage: "", address: "" }]);
  const removeNomineeInfo = (index: number) => setNomineeInfos(nomineeInfos.filter((_, i) => i !== index));
  const updateNomineeInfo = (index: number, field: keyof NomineeInfo, value: string) => {
    const updated = [...nomineeInfos];
    updated[index] = { ...updated[index], [field]: value };
    setNomineeInfos(updated);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = {
        // Basic Information
        cadet_number: bdNo,
        name: cadetName,
        name_bangla: nameBangla,
        short_name: shortName,
        email,
        contact_no: contactNo,
        profile_photo: profilePicture || undefined,
        rank_id: rank || undefined,

        // Assignments
        assign_branch_id: branch,
        assign_course_id: course,

        // Personal Details
        gender: gender || undefined,
        have_professional: haveProfessional,
        religion,
        caste,
        blood_group: bloodGroup,
        date_of_birth: dateOfBirth,
        weight,
        height,
        eye_color: eyeColor,
        hair_color: hairColor,
        identification_mark: identificationMark,
        complexion: complexion,

        // Identity Documents
        nid_no: nidNo,
        passport_no: passportNo,
        driving_license_no: drivingLicenseNo,

        // Enrollment Data
        enrollment_date: enrollmentDate,

        // Permanent Address
        permanent_division: permanentDivision,
        permanent_district: permanentDistrict,
        permanent_post_office: permanentPostOffice,
        permanent_post_code: permanentPostCode,
        permanent_address: permanentAddress,

        // Present Address
        present_division: presentDivision,
        present_district: presentDistrict,
        present_post_office: presentPostOffice,
        present_post_code: presentPostCode,
        present_address: presentAddress,

        // Guardian Address
        guardian_division: guardianDivision,
        guardian_district: guardianDistrict,
        guardian_post_office: guardianPostOffice,
        guardian_post_code: guardianPostCode,
        guardian_address: guardianAddress,

        // Marital Status
        marital_status: maritalStatus,

        // Family Information
        family_members: familyMembers,

        // Educational Information
        educational_records: educationalRecords,

        // Army Relations
        army_relations: armyRelations,

        // Politics Relations
        politics_relations: politicsRelations,

        // Languages
        languages,

        // Visit Abroad
        visitAbord,

        // Employments
        employments,

        // Game & Sports
        game_sports: gameSports,
        sports_club: sportsClub,

        // Hobbies
        hobbies,

        // Special Qualification
        special_qualification: specialQualification,

        // Social & Cultural Activities
        social_activities: socialActivities,
        cultural_activities: culturalActivities,

        // BAFA Dates & Promotions
        arrival_date_bma: arrivalDateBma,
        arrival_date_bafa: arrivalDateBafa,
        second_promotion_date: secondPromotionDate,
        third_promotion_date: thirdPromotionDate,
        forth_promotion_date: forthPromotionDate,
        five_promotion_date: fivePromotionDate,
        six_promotion_date: sixPromotionDate,

        // Bank Information
        bank_infos: bankInfos,

        // Next of Kin
        next_of_kins: nextOfKins,

        // Insurance Information
        insurance_infos: insuranceInfos,

        // Nominee Information
        nominee_infos: nomineeInfos,

        // Course & Academic Assignments
        assign_semester_id: semester,
        assign_exam_type_id: examType,
        assign_program_id: program,
        assign_year_group_id: yearGroup,

        // Emergency Contact Information
        emergency_phone: emergencyPhone,
        emergency_contact_email: emergencyContactEmail,
      };

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save cadet");
    } finally {
      setLoading(false);
    }
  };

  const isFormLoading = loading || externalLoading;

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200">
      <form onSubmit={handleFormSubmit}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FullLogo />
          </div>
          <h1 className="text-xl font-bold text-gray-900 uppercase">Bangladesh Air Force Academy</h1>
          <h2 className="text-md font-semibold text-gray-700 mt-2 uppercase">{isEdit ? "Edit Cadet" : "Add New Cadet"}</h2>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 1. Basic Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
            {/* Profile Picture */}
            <div className="col-span-1">
              <Label>Photo</Label>
              <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden">
                {profilePicturePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePicturePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Icon icon="hugeicons:user-circle" className="w-10 h-10 text-blue-400 mb-1" />
                    <p className="text-xs text-gray-500">No file selected</p>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureChange} />
              </label>
            </div>
            <div className="col-span-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>BD No. <span className="text-red-500">*</span></Label>
                <Input value={bdNo} onChange={(e) => setBdNo(e.target.value)} placeholder="Enter BD No." required />
              </div>
              <div>
                <Label>Full Name (English) <span className="text-red-500">*</span></Label>
                <Input value={cadetName} onChange={(e) => setCadetName(e.target.value)} placeholder="Enter cadet name" required />
              </div>
              <div>
                <Label>Full Name (Bangla)</Label>
                <Input value={nameBangla} onChange={(e) => setNameBangla(e.target.value)} placeholder="নাম বাংলায় লিখুন" />
              </div>
              <div>
                <Label>Short Name</Label>
                <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="Enter Short Name." />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
              </div>
              <div>
                <Label>Contact No</Label>
                <Input value={contactNo} onChange={(e) => setContactNo(e.target.value)} placeholder="Enter contact no" />
              </div>

              <div>
                <Label>Gender <span className="text-red-500">*</span></Label>
                <select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female" | "other" | "")} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Blood Group <span className="text-red-500">*</span></Label>
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select your blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Personal Details */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            2. Personal Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Have Professional</Label>
              <div className="flex items-center h-[42px]">
                <input
                  type="checkbox"
                  checked={haveProfessional}
                  onChange={(e) => setHaveProfessional(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">{haveProfessional ? "Yes" : "No"}</span>
              </div>
            </div>
            <div>
              <Label>Religion</Label>
              <select value={religion} onChange={(e) => setReligion(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select your religion</option>
                <option value="islam">Islam</option>
                <option value="hinduism">Hinduism</option>
                <option value="buddhism">Buddhism</option>
                <option value="christianity">Christianity</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Caste</Label>
              <Input value={caste} onChange={(e) => setCaste(e.target.value)} placeholder="Select your caste" />
            </div>
            <div>
              <Label>Date of Birth <span className="text-red-500">*</span></Label>
              <DatePicker value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} placeholder="dd/mm/yyyy" required />
            </div>
            <div>
              <Label>Weight</Label>
              <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Enter your weight" />
            </div>
            <div>
              <Label>Height</Label>
              <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder={"e.g. 5'8\""} />
            </div>
            <div>
              <Label>Eye Color</Label>
              <Input value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} placeholder="Enter eye color" />
            </div>
            <div>
              <Label>Hair Color</Label>
              <Input value={hairColor} onChange={(e) => setHairColor(e.target.value)} placeholder="Enter hair color" />
            </div>
            <div>
              <Label>Identification Mark/Mole</Label>
              <Input value={identificationMark} onChange={(e) => setIdentificationMark(e.target.value)} placeholder="Enter birth mark" />
            </div>
            <div>
              <Label>Complexion</Label>
              <Input value={complexion} onChange={(e) => setComplexion(e.target.value)} placeholder="Complexion" />
            </div>
          </div>
        </div>

        {/* 3. Identity Documents */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            3. Identity Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>NID No.</Label>
              <Input value={nidNo} onChange={(e) => setNidNo(e.target.value)} placeholder="Enter your NID number" />
            </div>
            <div>
              <Label>Passport No.</Label>
              <Input value={passportNo} onChange={(e) => setPassportNo(e.target.value)} placeholder="Enter passport number" />
            </div>
            <div>
              <Label>Driving License No.</Label>
              <Input value={drivingLicenseNo} onChange={(e) => setDrivingLicenseNo(e.target.value)} placeholder="Enter driving license number" />
            </div>
          </div>
        </div>

        {/* 4. Enrollment Data */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            4. Enrollment Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Date of Enrollment <span className="text-red-500">*</span></Label>
              <DatePicker value={enrollmentDate} onChange={(e) => setEnrollmentDate(e.target.value)} placeholder="dd/mm/yyyy" required />
            </div>
          </div>
        </div>

        {/* 5. Permanent Address */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            5. Permanent Address
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Division <span className="text-red-500">*</span></Label>
              <select value={permanentDivision} onChange={(e) => setPermanentDivision(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select division</option>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>District <span className="text-red-500">*</span></Label>
              <select value={permanentDistrict} onChange={(e) => setPermanentDistrict(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!permanentDivision}>
                <option value="">Select district</option>
                {permanentDistricts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Post Office/Thana <span className="text-red-500">*</span></Label>
              <select value={permanentPostOffice} onChange={(e) => setPermanentPostOffice(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!permanentDistrict}>
                <option value="">Select post office</option>
                {permanentPostOffices.map((postOffice) => (
                  <option key={postOffice.id} value={postOffice.id}>{postOffice.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Post Code</Label>
              <Input value={permanentPostCode} onChange={(e) => setPermanentPostCode(e.target.value)} placeholder="Enter post code" />
            </div>
          </div>
          <div className="mt-4">
            <Label>Enter your permanent address</Label>
            <textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} placeholder="Enter your permanent address" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* 6. Present Address */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            6. Present Address
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Division <span className="text-red-500">*</span></Label>
              <select value={presentDivision} onChange={(e) => setPresentDivision(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select division</option>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>District <span className="text-red-500">*</span></Label>
              <select value={presentDistrict} onChange={(e) => setPresentDistrict(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!presentDivision}>
                <option value="">Select district</option>
                {presentDistricts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Post Office/Thana <span className="text-red-500">*</span></Label>
              <select value={presentPostOffice} onChange={(e) => setPresentPostOffice(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!presentDistrict}>
                <option value="">Select post office</option>
                {presentPostOffices.map((postOffice) => (
                  <option key={postOffice.id} value={postOffice.id}>{postOffice.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Post Code</Label>
              <Input value={presentPostCode} onChange={(e) => setPresentPostCode(e.target.value)} placeholder="Enter post code" />
            </div>
          </div>
          <div className="mt-4">
            <Label>Enter your present address</Label>
            <textarea value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} placeholder="Enter your present address" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* 7. Guardian Address */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            7. Guardian Address
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Division</Label>
              <select value={guardianDivision} onChange={(e) => setGuardianDivision(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select division</option>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>District</Label>
              <select value={guardianDistrict} onChange={(e) => setGuardianDistrict(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!guardianDivision}>
                <option value="">Select district</option>
                {guardianDistricts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Post Office/Thana</Label>
              <select value={guardianPostOffice} onChange={(e) => setGuardianPostOffice(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={!guardianDistrict}>
                <option value="">Select post office</option>
                {guardianPostOffices.map((postOffice) => (
                  <option key={postOffice.id} value={postOffice.id}>{postOffice.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Post Code</Label>
              <Input value={guardianPostCode} onChange={(e) => setGuardianPostCode(e.target.value)} placeholder="Enter post code" />
            </div>
          </div>
          <div className="mt-4">
            <Label>Enter guardian&apos;s address</Label>
            <textarea value={guardianAddress} onChange={(e) => setGuardianAddress(e.target.value)} placeholder="Enter guardian's address" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* 8. Marital Status */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            8. Marital Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Select marital status</Label>
              <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select marital status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
        </div>

        {/* 9. Family Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            9. Family Information
          </h2>

          {familyMembers.map((member, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Family Member #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addFamilyMember} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Family
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeFamilyMember(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label>Relationship</Label>
                  <select value={member.relationship} onChange={(e) => updateFamilyMember(index, "relationship", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select relationship</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="spouse">Spouse</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                    <option value="uncle">Uncle</option>
                    <option value="aunt">Aunt</option>
                    <option value="grandfather">Grandfather</option>
                    <option value="grandmother">Grandmother</option>
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select value={member.status} onChange={(e) => updateFamilyMember(index, "status", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="alive">Alive</option>
                    <option value="dead">Dead</option>
                  </select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={member.name} onChange={(e) => updateFamilyMember(index, "name", e.target.value)} placeholder="Enter name" />
                </div>
                <div>
                  <Label>Mobile No</Label>
                  <Input value={member.mobileNo} onChange={(e) => updateFamilyMember(index, "mobileNo", e.target.value)} placeholder="Enter mobile no" />
                </div>
                <div>
                  <Label>Occupation</Label>
                  <Input value={member.occupation} onChange={(e) => updateFamilyMember(index, "occupation", e.target.value)} placeholder="Occupation" />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input value={member.age} onChange={(e) => updateFamilyMember(index, "age", e.target.value)} placeholder="Age" />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={member.address} onChange={(e) => updateFamilyMember(index, "address", e.target.value)} placeholder="Address" />
                </div>
                <div>
                  <Label>Political Involvement</Label>
                  <select value={member.politicalInvolvement} onChange={(e) => updateFamilyMember(index, "politicalInvolvement", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <Label>Political Party Name</Label>
                  <Input value={member.politicalPartyName} onChange={(e) => updateFamilyMember(index, "politicalPartyName", e.target.value)} placeholder="Party name" />
                </div>
                <div>
                  <Label>Guardian</Label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={member.isGuardian} onChange={(e) => updateFamilyMember(index, "isGuardian", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                    <span className="text-gray-700">Is Guardian</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 10. Educational Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            10. Educational Information
          </h2>

          {educationalRecords.map((record, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Educational Record #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addEducationalRecord} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Record
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeEducationalRecord(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <Label>Exam Type</Label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={record.withinBafa} onChange={(e) => updateEducationalRecord(index, "withinBafa", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                    <span className="text-gray-700">Within BAFA</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={record.inBafa} onChange={(e) => updateEducationalRecord(index, "inBafa", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                    <span className="text-gray-700">In BAFA</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Exam <span className="text-red-500">*</span></Label>
                  <select value={record.exam} onChange={(e) => updateEducationalRecord(index, "exam", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Exam</option>
                    <option value="ssc">SSC</option>
                    <option value="hsc">HSC</option>
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master</option>
                    <option value="phd">PhD</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Institution <span className="text-red-500">*</span></Label>
                  <Input value={record.institution} onChange={(e) => updateEducationalRecord(index, "institution", e.target.value)} placeholder="Select institution" />
                </div>
                <div>
                  <Label>Board Name</Label>
                  <Input value={record.boardName} onChange={(e) => updateEducationalRecord(index, "boardName", e.target.value)} placeholder="Board name" />
                </div>
                <div>
                  <Label>Year Type</Label>
                  <Input value={record.yearFrom} onChange={(e) => updateEducationalRecord(index, "yearFrom", e.target.value)} placeholder="From year" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-3">
                <div>
                  <Label>To Year</Label>
                  <Input value={record.yearTo} onChange={(e) => updateEducationalRecord(index, "yearTo", e.target.value)} placeholder="To year" />
                </div>
                <div>
                  <Label>Subject/Group</Label>
                  <Input value={record.subjectGroup} onChange={(e) => updateEducationalRecord(index, "subjectGroup", e.target.value)} placeholder="Subject group" />
                </div>
                <div>
                  <Label>Marks/GPA</Label>
                  <Input value={record.totalMarksGpa} onChange={(e) => updateEducationalRecord(index, "totalMarksGpa", e.target.value)} placeholder="5.00" />
                </div>
                <div>
                  <Label>Out of</Label>
                  <Input value={record.out_of} onChange={(e) => updateEducationalRecord(index, "out_of", e.target.value)} placeholder="5.00" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 11. Relation in Army Force */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            11. Relation in Army Force
          </h2>

          {armyRelations.map((relation, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Relation in Army Force #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addArmyRelation} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Relation
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeArmyRelation(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Rank</Label>
                  <select value={relation.rank} onChange={(e) => updateArmyRelation(index, "rank", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select rank</option>
                  </select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={relation.name} onChange={(e) => updateArmyRelation(index, "name", e.target.value)} placeholder="Enter name" />
                </div>
                <div>
                  <Label>BA No</Label>
                  <Input value={relation.baNo} onChange={(e) => updateArmyRelation(index, "baNo", e.target.value)} placeholder="Enter BA no" />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <select value={relation.relationship} onChange={(e) => updateArmyRelation(index, "relationship", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select your relationship</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="uncle">Uncle</option>
                    <option value="aunt">Aunt</option>
                    <option value="cousin">Cousin</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <Label>Present Address</Label>
                <textarea value={relation.presentAddress} onChange={(e) => updateArmyRelation(index, "presentAddress", e.target.value)} placeholder="Present address" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          ))}
        </div>

        {/* 12. Politics Involved Relation */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            12. Politics Involved Relation
          </h2>

          {politicsRelations.map((relation, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Politics Involved Relation #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addPoliticsRelation} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Relation
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removePoliticsRelation(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={relation.name} onChange={(e) => updatePoliticsRelation(index, "name", e.target.value)} placeholder="Enter name" />
                </div>
                <div>
                  <Label>Political Party Name</Label>
                  <Input value={relation.politicalPartyName} onChange={(e) => updatePoliticsRelation(index, "politicalPartyName", e.target.value)} placeholder="Enter party name" />
                </div>
                <div>
                  <Label>Appointment</Label>
                  <Input value={relation.appointment} onChange={(e) => updatePoliticsRelation(index, "appointment", e.target.value)} placeholder="Enter appointment" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 13. Languages */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            13. Languages
          </h2>

          {languages.map((lang, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Language #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addLanguage} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Language
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeLanguage(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Language Name</Label>
                  <select value={lang.language} onChange={(e) => updateLanguage(index, "language", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select language</option>
                    <option value="bengali">Bengali</option>
                    <option value="english">English</option>
                    <option value="arabic">Arabic</option>
                    <option value="hindi">Hindi</option>
                    <option value="urdu">Urdu</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="spanish">Spanish</option>
                    <option value="chinese">Chinese</option>
                  </select>
                </div>
                <div>
                  <Label>Language Skill</Label>
                  <div className="flex items-center gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={lang.write} onChange={(e) => updateLanguage(index, "write", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                      <span className="text-gray-700">Write</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={lang.read} onChange={(e) => updateLanguage(index, "read", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                      <span className="text-gray-700">Read</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={lang.speak} onChange={(e) => updateLanguage(index, "speak", e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                      <span className="text-gray-700">Speak</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 14. Visit Abroad */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            14. Visit Abroad
          </h2>

          {visitAbord.map((visit, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Country Information #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addVisitAbord} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Info
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeVisitAbord(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Country Name</Label>
                  <Input value={visit.countryName} onChange={(e) => updateVisitAbord(index, "countryName", e.target.value)} placeholder="Enter country name" />
                </div>
                <div>
                  <Label>Purpose of Visit</Label>
                  <Input value={visit.purpose} onChange={(e) => updateVisitAbord(index, "purpose", e.target.value)} placeholder="Enter purpose of visit" />
                </div>
                <div>
                  <Label>From Date <span className="text-red-500">*</span></Label>
                  <DatePicker value={visit.fromdate} onChange={(e) => updateVisitAbord(index, "fromdate", e.target.value)} placeholder="dd/mm/yyyy" />
                </div>
                <div>
                  <Label>To Date <span className="text-red-500">*</span></Label>
                  <DatePicker value={visit.todate} onChange={(e) => updateVisitAbord(index, "todate", e.target.value)} placeholder="dd/mm/yyyy" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 15. Employment Before Joining BAFA */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            15. Employment Before Joining BAFA
          </h2>

          {employments.map((emp, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Employee Information #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addEmployment} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Employment
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeEmployment(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Name of Organization</Label>
                  <Input value={emp.organizationName} onChange={(e) => updateEmployment(index, "organizationName", e.target.value)} placeholder="Enter Name of Organization" />
                </div>
                <div>
                  <Label>Nature of Responsibilities</Label>
                  <Input value={emp.natureOfResponsibilities} onChange={(e) => updateEmployment(index, "natureOfResponsibilities", e.target.value)} placeholder="Enter nature of responsibilities" />
                </div>
                <div>
                  <Label>Date of Appointment</Label>
                  <DatePicker value={emp.dateOfAppointment} onChange={(e) => updateEmployment(index, "dateOfAppointment", e.target.value)} placeholder="Enter appointment date" />
                </div>
                <div>
                  <Label>Gross Salary</Label>
                  <Input value={emp.grossSalary} onChange={(e) => updateEmployment(index, "grossSalary", e.target.value)} placeholder="Gross salary" />
                </div>
                <div>
                  <Label>Present State</Label>
                  <select value={emp.presentState} onChange={(e) => updateEmployment(index, "presentState", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Present state</option>
                    <option value="active">Active</option>
                    <option value="resigned">Resigned</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 16. Game & Sports interested & took  place */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            16. Game & Sports interested & took place
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Games & Sports Interested</Label>
              <textarea value={gameSports} onChange={(e) => setGameSports(e.target.value)} placeholder="Enter the game & their certificate (description)" rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <Label>Achievement Sports & Athletic</Label>
              <textarea value={sportsClub} onChange={(e) => setSportsClub(e.target.value)} placeholder="Enter details if present member of any sports club & duration" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* 17. Hobbies */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            17. Hobbies
          </h2>
          <div>
            <Label>Enter your hobbies</Label>
            <textarea value={hobbies} onChange={(e) => setHobbies(e.target.value)} placeholder="Enter your hobbies" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* 18. Special Pursuit/Qualification */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            18. Special Pursuit/Qualification
          </h2>
          <div>
            <Label>Enter qualification</Label>
            <textarea value={specialQualification} onChange={(e) => setSpecialQualification(e.target.value)} placeholder="Enter qualification" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* 19. Social & Cultural Activities */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            19. Social & Cultural Activities
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Social Activities</Label>
              <textarea value={socialActivities} onChange={(e) => setSocialActivities(e.target.value)} placeholder="Enter social activities" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <Label>Cultural Activities</Label>
              <textarea value={culturalActivities} onChange={(e) => setCulturalActivities(e.target.value)} placeholder="Enter cultural activities" rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* 20. Date of Arrival and Vacancies at BAFA/BAA */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            20. Date of Arrival and Vacancies at BAFA/BAA
          </h2>
          <div className="grid grid1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Date of Arrival at BMA</Label>
              <DatePicker value={arrivalDateBma} onChange={(e) => setArrivalDateBma(e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <Label>Date of Arrival at BAFA</Label>
              <DatePicker value={arrivalDateBafa} onChange={(e) => setArrivalDateBafa(e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <Label>2nd Sem. Date</Label>
              <DatePicker value={secondPromotionDate} onChange={(e) => setSecondPromotionDate(e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <Label>3rd Sem. Date</Label>
              <DatePicker value={thirdPromotionDate} onChange={(e) => setThirdPromotionDate(e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <Label>4th Sem. Date</Label>
              <DatePicker value={forthPromotionDate} onChange={(e) => setForthPromotionDate(e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <Label>5th Sem. Date</Label>
              <DatePicker value={fivePromotionDate} onChange={(e) => setFivePromotionDate(e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
            <div>
              <Label>6th Sem. Date</Label>
              <DatePicker value={sixPromotionDate} onChange={(e) => setsixPromotionDate(e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
          </div>
        </div>

        {/* 21. Bank Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            21. Bank Information
          </h2>

          {bankInfos.map((bank, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Bank Information #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addBankInfo} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Bank
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeBankInfo(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input value={bank.bankName} onChange={(e) => updateBankInfo(index, "bankName", e.target.value)} placeholder="Enter bank name" />
                </div>
                <div>
                  <Label>Bank Branch</Label>
                  <Input value={bank.bankBranch} onChange={(e) => updateBankInfo(index, "bankBranch", e.target.value)} placeholder="Enter bank branch" />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input value={bank.accountName} onChange={(e) => updateBankInfo(index, "accountName", e.target.value)} placeholder="Enter account name" />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input value={bank.accountNumber} onChange={(e) => updateBankInfo(index, "accountNumber", e.target.value)} placeholder="Enter account number" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 22. Next of Kin */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            22. Next of Kin
          </h2>

          {nextOfKins.map((kin, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Next of Kin Information #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addNextOfKin} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Kin
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeNextOfKin(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={kin.name} onChange={(e) => updateNextOfKin(index, "name", e.target.value)} placeholder="Enter your name" />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <select value={kin.relationship} onChange={(e) => updateNextOfKin(index, "relationship", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select your relationship</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="spouse">Spouse</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={kin.address} onChange={(e) => updateNextOfKin(index, "address", e.target.value)} placeholder="Enter address" />
                </div>
                <div>
                  <Label>Mobile No</Label>
                  <Input value={kin.mobileNo} onChange={(e) => updateNextOfKin(index, "mobileNo", e.target.value)} placeholder="Enter mobile number" />
                </div>
                <div>
                  <Label>Authorized By</Label>
                  <Input value={kin.authorizedBy} onChange={(e) => updateNextOfKin(index, "authorizedBy", e.target.value)} placeholder="Authorized by admin" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 23. Insurance Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            23. Insurance Information
          </h2>

          {insuranceInfos.map((ins, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Insurance Information #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addInsuranceInfo} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Insurance
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeInsuranceInfo(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Policy Name</Label>
                  <Input value={ins.policyName} onChange={(e) => updateInsuranceInfo(index, "policyName", e.target.value)} placeholder="Enter Policy Name" />
                </div>
                <div>
                  <Label>Name of Insurance Company</Label>
                  <Input value={ins.companyName} onChange={(e) => updateInsuranceInfo(index, "companyName", e.target.value)} placeholder="Enter insurance company" />
                </div>
                <div>
                  <Label>Insurance Amount</Label>
                  <Input value={ins.amount} onChange={(e) => updateInsuranceInfo(index, "amount", e.target.value)} placeholder="Enter insurance amount" />
                </div>
                <div>
                  <Label>Next of Kin</Label>
                  <Input value={ins.nextofKin} onChange={(e) => updateInsuranceInfo(index, "nextofKin", e.target.value)} placeholder="Type Next of Kin" />
                </div>
                <div>
                  <Label>Next of Kin Address</Label>
                  <Input value={ins.nextofKinAddress} onChange={(e) => updateInsuranceInfo(index, "nextofKinAddress", e.target.value)} placeholder="Next of Kin Address" />
                </div>
                <div>
                  <Label>Date Start of the Life Insurance</Label>
                  <DatePicker value={ins.startDate} onChange={(e) => updateInsuranceInfo(index, "startDate", e.target.value)} placeholder="Date start" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 24. Nominee Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            24. Nominee Information
          </h2>

          {nomineeInfos.map((nom, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Nominee Information #{index + 1}</h3>
                <div className="flex gap-2 items-center">
                  <button type="button" onClick={addNomineeInfo} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <Icon icon="hugeicons:add-circle" className="w-4 h-4" />
                    Add Nominee
                  </button>
                  {index !== 0 && (
                    <button type="button" onClick={() => removeNomineeInfo(index)} className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1">
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Select Nominee Type</Label>
                  <select value={nom.nomineeType} onChange={(e) => updateNomineeInfo(index, "nomineeType", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Nominee Type</option>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                  </select>
                </div>
                <div>
                  <Label>Nominee Name</Label>
                  <Input value={nom.name} onChange={(e) => updateNomineeInfo(index, "name", e.target.value)} placeholder="Enter Nominee Name" />
                </div>
                <div>
                  <Label>Nominee Relationship</Label>
                  <Input value={nom.relationship} onChange={(e) => updateNomineeInfo(index, "relationship", e.target.value)} placeholder="Enter Nominee Relationship" />
                </div>
                <div>
                  <Label>Nominee Percentage</Label>
                  <Input value={nom.percentage} onChange={(e) => updateNomineeInfo(index, "percentage", e.target.value)} placeholder="Enter Nominee Percentage" />
                </div>
                <div>
                  <Label>Nominee Address</Label>
                  <Input value={nom.address} onChange={(e) => updateNomineeInfo(index, "address", e.target.value)} placeholder="Enter Nominee Address" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 25. Course & Academic Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            25. Course & Academic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Select Course</Label>
              <select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Semester</Label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Semester</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id.toString()}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Choose Program</Label>
              <select value={program} onChange={(e) => setProgram(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Choose Program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id.toString()}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Select Branch</Label>
              <select value={branch} onChange={(e) => setBranch(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id.toString()}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Choose Year Group</Label>
              <select value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Choose Year Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id.toString()}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Rank</Label>
              <select value={rank} onChange={(e) => setRank(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Rank</option>
                {ranks.map((r) => (
                  <option key={r.id} value={r.id.toString()}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 26. Contact Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-dashed border-gray-300">
            26. Emergency Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="Enter your phone number" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={emergencyContactEmail} onChange={(e) => setEmergencyContactEmail(e.target.value)} placeholder="Enter your email address" />
            </div>
          </div>
        </div>

        {/* Required Fields Note */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <Icon icon="hugeicons:information-circle" className="w-4 h-4 inline mr-2" />
            All fields marked with <span className="text-red-500">*</span> are required
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-300">
          <button
            type="button"
            onClick={onCancel}
            disabled={isFormLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isFormLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isFormLoading ? (
              <>
                <Icon icon="hugeicons:loading-03" className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              isEdit ? "Update Cadet" : "Save Cadet"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}