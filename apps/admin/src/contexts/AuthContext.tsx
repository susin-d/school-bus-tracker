import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import {
  clearStoredToken,
  createAdminResource,
  deleteAdminResource,
  getCurrentUser,
  getStoredToken,
  listAdminResource,
  loginWithEmail,
  logoutSession,
  sendAdminAnnouncement,
  storeToken,
  type ApiRole,
  type ApiUserProfile,
  updateAdminResource
} from "@/lib/api";

export type UserRole = ApiRole;

export interface School {
  id: string;
  name: string;
  address: string;
  email: string;
  contact: string;
  adminUsername: string;
  adminPassword: string;
  createdAt: string;
}

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  photo?: string;
  class: string;
  section: string;
  admissionNumber: string;
  parentName: string;
  parentContact: string;
  assignedBus?: string;
  assignedStop?: string;
  bloodGroup: string;
  pickupPoint: string;
}

export interface Driver {
  id: string;
  schoolId: string;
  name: string;
  photo?: string;
  age: number;
  gender: string;
  mobile: string;
  licenseDetails: string;
}

export interface Vehicle {
  id: string;
  schoolId: string;
  type: "car" | "van" | "bus";
  vehicleNumber: string;
  numberPlate: string;
  assignedDriverId?: string;
  assignedStudentIds: string[];
}

export interface Announcement {
  id: string;
  schoolId?: string;
  message: string;
  target: "parents" | "drivers" | "everyone" | "admins";
  createdAt: string;
  author: string;
}

export interface User {
  username: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  schools: School[];
  addSchool: (school: Omit<School, "id" | "adminUsername" | "adminPassword" | "createdAt">) => Promise<void>;
  removeSchool: (id: string) => Promise<void>;
  students: Student[];
  addStudent: (student: Omit<Student, "id">) => Promise<void>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, "id">) => Promise<void>;
  updateDriver: (id: string, data: Partial<Driver>) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, "id" | "assignedDriverId" | "assignedStudentIds">) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
  announcements: Announcement[];
  addAnnouncement: (a: Omit<Announcement, "id" | "createdAt">) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

const generateAdminCredentials = (schoolName: string) => {
  const clean = schoolName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return { username: `admin@${clean}`, password: `admin@${clean}` };
};

type RecordMap = Record<string, unknown>;

interface Assignment {
  id: string;
  student_id: string;
  bus_id: string;
  school_id?: string;
}

function mapRole(role: string | undefined): UserRole {
  return role === "super_admin" ? "super_admin" : "admin";
}

function mapUser(profile: ApiUserProfile, schools: School[]): User {
  const school = schools.find((item) => item.id === profile.schoolId);
  return {
    username: profile.email || profile.fullName,
    role: mapRole(profile.role),
    schoolId: profile.schoolId,
    schoolName: school?.name
  };
}

function mapSchool(row: RecordMap): School {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    address: String(row.address ?? ""),
    email: String(row.email ?? ""),
    contact: String(row.phone_number ?? row.contact ?? ""),
    adminUsername: String(row.admin_username ?? ""),
    adminPassword: "",
    createdAt: String(row.created_at ?? "")
  };
}

function mapDriver(row: RecordMap): Driver {
  return {
    id: String(row.id ?? ""),
    schoolId: String(row.school_id ?? ""),
    name: String(row.full_name ?? row.name ?? ""),
    age: Number(row.age ?? 0),
    gender: String(row.gender ?? ""),
    mobile: String(row.phone_number ?? row.mobile ?? ""),
    licenseDetails: String(row.license_number ?? row.license_details ?? ""),
    photo: row.photo_url ? String(row.photo_url) : undefined
  };
}

function toStudentName(row: RecordMap) {
  const firstName = String(row.first_name ?? "").trim();
  const lastName = String(row.last_name ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName.length > 0) {
    return fullName;
  }
  return String(row.full_name ?? row.name ?? "");
}

function mapStudent(row: RecordMap): Student {
  return {
    id: String(row.id ?? ""),
    schoolId: String(row.school_id ?? ""),
    name: toStudentName(row),
    photo: row.photo_url ? String(row.photo_url) : undefined,
    class: String(row.class ?? row.grade ?? ""),
    section: String(row.section ?? ""),
    admissionNumber: String(row.roll_number ?? row.admission_number ?? ""),
    parentName: String(row.parent_name ?? ""),
    parentContact: String(row.parent_phone ?? ""),
    bloodGroup: String(row.blood_group ?? ""),
    pickupPoint: String(row.home_address ?? row.address_text ?? "")
  };
}

function inferVehicleType(value: string | undefined): Vehicle["type"] {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("car")) {
    return "car";
  }
  if (normalized.includes("van")) {
    return "van";
  }
  return "bus";
}

function mapVehicle(row: RecordMap, studentIds: string[]): Vehicle {
  const vehicleNumber = String(row.vehicle_number ?? row.bus_number ?? "");
  return {
    id: String(row.id ?? ""),
    schoolId: String(row.school_id ?? ""),
    type: inferVehicleType(String(row.vehicle_type ?? vehicleNumber)),
    vehicleNumber,
    numberPlate: String(row.plate ?? row.number_plate ?? ""),
    assignedDriverId: row.driver_id ? String(row.driver_id) : undefined,
    assignedStudentIds: studentIds
  };
}

function splitName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }
  const [firstName, ...rest] = trimmed.split(" ");
  return {
    firstName,
    lastName: rest.join(" ") || firstName
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const refreshData = useCallback(
    async (currentToken: string, currentProfile: ApiUserProfile) => {
      const [schoolRows, studentRows, driverRows, vehicleRows, assignmentRows] = await Promise.all([
        listAdminResource<RecordMap>("schools", currentToken),
        listAdminResource<RecordMap>("students", currentToken),
        listAdminResource<RecordMap>("drivers", currentToken),
        listAdminResource<RecordMap>("buses", currentToken),
        listAdminResource<RecordMap>("assignments", currentToken)
      ]);

      const mappedSchools = schoolRows.map(mapSchool);
      const role = mapRole(currentProfile.role);
      const filteredSchools =
        role === "super_admin"
          ? mappedSchools
          : mappedSchools.filter((school) => school.id === currentProfile.schoolId);

      const schoolFilter = (row: RecordMap) =>
        role === "super_admin" || String(row.school_id ?? "") === currentProfile.schoolId;

      const filteredStudents = studentRows.filter(schoolFilter).map(mapStudent);
      const filteredDrivers = driverRows.filter(schoolFilter).map(mapDriver);
      const filteredAssignments = assignmentRows
        .filter((row) => schoolFilter(row) && row.id && row.student_id && row.bus_id)
        .map((row) => ({
          id: String(row.id),
          student_id: String(row.student_id),
          bus_id: String(row.bus_id),
          school_id: row.school_id ? String(row.school_id) : undefined
        }));

      const assignmentByBus = new Map<string, string[]>();
      for (const assignment of filteredAssignments) {
        const existing = assignmentByBus.get(assignment.bus_id) ?? [];
        existing.push(assignment.student_id);
        assignmentByBus.set(assignment.bus_id, existing);
      }

      const filteredVehicles = vehicleRows
        .filter(schoolFilter)
        .map((row) => mapVehicle(row, assignmentByBus.get(String(row.id ?? "")) ?? []));

      setSchools(filteredSchools);
      setStudents(filteredStudents);
      setDrivers(filteredDrivers);
      setVehicles(filteredVehicles);
      setAssignments(filteredAssignments);
      setUser(mapUser(currentProfile, mappedSchools));
    },
    []
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const profile = await getCurrentUser(token);
        if (!mounted) {
          return;
        }
        await refreshData(token, profile);
      } catch {
        if (!mounted) {
          return;
        }
        clearStoredToken();
        setToken(null);
        setUser(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, refreshData]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const session = await loginWithEmail(email, password);
    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      throw new Error("This account does not have admin access.");
    }

    storeToken(session.token);
    setToken(session.token);
    await refreshData(session.token, session.user);
    return true;
  };

  const logout = () => {
    if (token) {
      void logoutSession(token);
    }
    clearStoredToken();
    setToken(null);
    setUser(null);
    setSchools([]);
    setStudents([]);
    setDrivers([]);
    setVehicles([]);
    setAssignments([]);
    setAnnouncements([]);
  };

  const ensureSession = () => {
    if (!token || !user) {
      throw new Error("Not authenticated");
    }
    return { token, user };
  };

  const addSchool = async (data: Omit<School, "id" | "adminUsername" | "adminPassword" | "createdAt">) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    const credentials = generateAdminCredentials(data.name);
    await createAdminResource("schools", activeToken, {
      name: data.name,
      address: data.address,
      email: data.email,
      password: credentials.password
    });
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const removeSchool = async (id: string) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    await deleteAdminResource("schools", id, activeToken);
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const addStudent = async (data: Omit<Student, "id">) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    const { firstName, lastName } = splitName(data.name);
    await createAdminResource("students", activeToken, {
      school_id: data.schoolId,
      first_name: firstName,
      last_name: lastName,
      class: data.class,
      section: data.section,
      roll_number: data.admissionNumber,
      home_address: data.pickupPoint,
      is_active: true
    });
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const updateStudent = async (id: string, data: Partial<Student>) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    const payload: Record<string, unknown> = {};
    if (data.name) {
      const { firstName, lastName } = splitName(data.name);
      payload.first_name = firstName;
      payload.last_name = lastName;
    }
    if (data.class !== undefined) payload.class = data.class;
    if (data.section !== undefined) payload.section = data.section;
    if (data.admissionNumber !== undefined) payload.roll_number = data.admissionNumber;
    if (data.pickupPoint !== undefined) payload.home_address = data.pickupPoint;
    await updateAdminResource("students", id, activeToken, payload);
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const removeStudent = async (id: string) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    const studentAssignments = assignments.filter((item) => item.student_id === id);
    await Promise.all(
      studentAssignments.map((item) => deleteAdminResource("assignments", item.id, activeToken))
    );
    await deleteAdminResource("students", id, activeToken);
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const addDriver = async (data: Omit<Driver, "id">) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    await createAdminResource("drivers", activeToken, {
      school_id: data.schoolId,
      full_name: data.name,
      phone_number: data.mobile,
      license_number: data.licenseDetails,
      is_active: true
    });
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const updateDriver = async (id: string, data: Partial<Driver>) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.full_name = data.name;
    if (data.mobile !== undefined) payload.phone_number = data.mobile;
    if (data.licenseDetails !== undefined) payload.license_number = data.licenseDetails;
    await updateAdminResource("drivers", id, activeToken, payload);
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const removeDriver = async (id: string) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    await deleteAdminResource("drivers", id, activeToken);
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const addVehicle = async (data: Omit<Vehicle, "id" | "assignedDriverId" | "assignedStudentIds">) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    await createAdminResource("buses", activeToken, {
      school_id: data.schoolId,
      vehicle_number: data.vehicleNumber,
      plate: data.numberPlate,
      status: "active",
      is_active: true
    });
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    const payload: Record<string, unknown> = {};

    if (data.vehicleNumber !== undefined) payload.vehicle_number = data.vehicleNumber;
    if (data.numberPlate !== undefined) payload.plate = data.numberPlate;
    if (data.assignedDriverId !== undefined) payload.driver_id = data.assignedDriverId || null;

    if (Object.keys(payload).length > 0) {
      await updateAdminResource("buses", id, activeToken, payload);
    }

    if (data.assignedStudentIds) {
      const currentAssignments = assignments.filter((item) => item.bus_id === id);
      const currentStudentIds = new Set(currentAssignments.map((item) => item.student_id));
      const nextStudentIds = new Set(data.assignedStudentIds);

      const toRemove = currentAssignments.filter((item) => !nextStudentIds.has(item.student_id));
      await Promise.all(
        toRemove.map((item) => deleteAdminResource("assignments", item.id, activeToken))
      );

      // Find the selected bus (vehicle) to get route_id
      const bus = vehicles.find(v => v.id === id);
      const route_id = bus && (bus as any).route_id ? (bus as any).route_id : undefined;
      for (const studentId of data.assignedStudentIds) {
        if (currentStudentIds.has(studentId)) {
          continue;
        }

        const existingForStudent = assignments.find((item) => item.student_id === studentId);
        if (existingForStudent) {
          await deleteAdminResource("assignments", existingForStudent.id, activeToken);
        }

        // Find the student to get stop_id (if available)
        const student = students.find(s => s.id === studentId);
        // Try to use assignedStop, pickupPoint, or fallback to undefined
        const stop_id = (student && (student as any).assignedStop) || undefined;

        if (!route_id || !stop_id) {
          // If either is missing, skip assignment and log a warning
          console.warn(`Skipping assignment for student ${studentId}: missing route_id or stop_id`);
          continue;
        }

        await createAdminResource("assignments", activeToken, {
          student_id: studentId,
          bus_id: id,
          route_id,
          stop_id,
          school_id: activeUser.schoolId,
          status: "active"
        });
      }
    }

    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const removeVehicle = async (id: string) => {
    const { token: activeToken, user: activeUser } = ensureSession();
    const linkedAssignments = assignments.filter((item) => item.bus_id === id);
    await Promise.all(
      linkedAssignments.map((item) => deleteAdminResource("assignments", item.id, activeToken))
    );
    await deleteAdminResource("buses", id, activeToken);
    await refreshData(activeToken, {
      id: activeUser.username,
      schoolId: activeUser.schoolId ?? "",
      role: activeUser.role,
      fullName: activeUser.username,
      email: activeUser.username
    });
  };

  const addAnnouncement = async (data: Omit<Announcement, "id" | "createdAt">) => {
    const { token: activeToken } = ensureSession();
    await sendAdminAnnouncement(activeToken, {
      mode: "all_students",
      schoolId: data.schoolId,
      subject: `Announcement from ${data.author}`,
      message: data.message
    });

    setAnnouncements((prev) => [
      { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...prev
    ]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      schools,
      addSchool,
      removeSchool,
      students,
      addStudent,
      updateStudent,
      removeStudent,
      drivers,
      addDriver,
      updateDriver,
      removeDriver,
      vehicles,
      addVehicle,
      updateVehicle,
      removeVehicle,
      announcements,
      addAnnouncement,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
