import type { UniversityServiceDTO } from "@/features/services/types/service.dto";

/** Same starting links as src/db/hub_schema.sql, so mock mode looks like a fresh database. */
export const SERVICE_FIXTURES: UniversityServiceDTO[] = [
  { id: "1", name: "Moodle", url: "https://moodle.hcmus.edu.vn/", description: "Courses, assignments and lecture materials", displayOrder: 1, isActive: true, version: 1 },
  { id: "2", name: "Student Portal", url: "https://portal.hcmus.edu.vn/", description: "Course registration, timetable and grades", displayOrder: 2, isActive: true, version: 1 },
  { id: "3", name: "Tuition Payment", url: "https://hcmus.edu.vn/", description: "Pay tuition and check payment status", displayOrder: 3, isActive: true, version: 1 },
  { id: "4", name: "HCMUS", url: "https://hcmus.edu.vn/", description: "News and announcements from the university", displayOrder: 4, isActive: true, version: 1 },
  { id: "5", name: "HCMUS Library", url: "https://hcmus.edu.vn/", description: "Search the catalogue and borrow books", displayOrder: 5, isActive: false, version: 1 },
  { id: "6", name: "IT Support", url: "https://hcmus.edu.vn/", description: "Accounts, email and network help", displayOrder: 6, isActive: false, version: 1 },
];
