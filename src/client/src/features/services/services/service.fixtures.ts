import type { UniversityServiceDTO } from "@/features/services/types/service.dto";

/** Same starting links as src/db/hub_schema.sql, so mock mode looks like a fresh database. */
export const SERVICE_FIXTURES: UniversityServiceDTO[] = [
  { id: "1", name: "Moodle", url: "https://courses.ctda.hcmus.edu.vn/", description: "Courses, assignments and lecture materials", displayOrder: 1, isActive: true, version: 1 },
  { id: "2", name: "Student Portal", url: "https://student.hcmus.edu.vn/login", description: "Student information, timetable and grades", displayOrder: 2, isActive: true, version: 1 },
  { id: "3", name: "Course Registration Portal", url: "https://new-portal4.hcmus.edu.vn/Login.aspx", description: "Course registration, timetable and results", displayOrder: 3, isActive: true, version: 1 },
  { id: "4", name: "Special Programs Portal", url: "https://portal.ctdb.hcmus.edu.vn/Login", description: "Portal for special training programs", displayOrder: 4, isActive: true, version: 1 },
  { id: "5", name: "Tuition Payment", url: "https://hocphi.hcmus.edu.vn/", description: "Pay tuition and check payment status", displayOrder: 5, isActive: true, version: 1 },
  { id: "6", name: "Student Handbook 2025", url: "https://hcmus.edu.vn/wp-content/uploads/2025/08/STSV2025_ONLINE.pdf", description: "Rules, procedures and student support (PDF)", displayOrder: 6, isActive: true, version: 1 },
  { id: "7", name: "HCMUS", url: "https://hcmus.edu.vn", description: "University website", displayOrder: 7, isActive: false, version: 1 },
];
