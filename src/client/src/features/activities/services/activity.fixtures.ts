import type {
  ActivityDTO,
  GroupedLandingActivitiesDTO,
  LandingActivitiesDTO,
  ListLandingActivitiesDTO,
} from "@/features/activities/types";

const FEATURED: ActivityDTO[] = [
  {
    id: "act-001",
    title:
      "HỘI THẢO ĐỊNH HƯỚNG KIẾN THỨC VÀ KỸ NĂNG THIẾT KẾ VI MẠCH NĂM 2026",
    image_url: "/images/landing/highlight-activities.png",
    categories: ["Academic", "Science"],
    start_time: "2026-10-17T08:00:00+07:00",
    end_time: "2026-10-17T10:00:00+07:00",
    location: "I.32, HCMUS",
    registration_status: "open",
  },
  {
    id: "act-002",
    title: "CAMPUS VOLUNTEER DAY 2026",
    image_url: "/images/landing/highlight-journey.png",
    categories: ["Community"],
    start_time: "2026-10-20T07:30:00+07:00",
    end_time: "2026-10-20T11:30:00+07:00",
    location: "HCMUS Campus",
    registration_status: "upcoming",
  },
];

const UPCOMING: ActivityDTO[] = [
  {
    id: "act-003",
    title: "THÔNG BÁO CUỘC THI SÁNG TẠO VIDEO NGẮN VỀ HCMUS NĂM 2026",
    image_url: "/images/landing/activity-placeholder.png",
    categories: ["Media"],
    start_time: "2026-10-29T08:00:00+07:00",
    end_time: "2026-10-29T10:00:00+07:00",
    location: "Online",
    registration_status: "open",
  },
  {
    id: "act-004",
    title: "WORKSHOP KỸ NĂNG THUYẾT TRÌNH",
    image_url: null,
    categories: ["Soft Skills"],
    start_time: "2026-11-02T13:30:00+07:00",
    end_time: "2026-11-02T16:00:00+07:00",
    location: "Room 203, HCMUS",
    registration_status: "closed",
  },
  {
    id: "act-005",
    title: "STUDENT RESEARCH SHOWCASE",
    image_url: "/images/landing/highlight-campus.png",
    categories: ["Research", "Science"],
    start_time: "2026-11-08T08:00:00+07:00",
    end_time: "2026-11-08T17:00:00+07:00",
    location: "Main Hall, HCMUS",
    registration_status: "upcoming",
  },
];

const PARTIAL_FEATURED: ActivityDTO[] = [
  FEATURED[0],
  {
    ...FEATURED[1],
    id: "",
  },
];

const LONG_CONTENT_FEATURED: ActivityDTO[] = [
  {
    ...FEATURED[0],
    id: "act-long-1",
    title:
      "HỘI THẢO QUỐC TẾ VỀ CÔNG NGHỆ BÁN DẪN, TRÍ TUỆ NHÂN TẠO VÀ CÁC GIẢI PHÁP BỀN VỮNG CHO TƯƠNG LAI",
    image_url: "/images/landing/does-not-exist.png",
    categories: ["Academic", "Science", "Technology"],
    start_time: "2026-12-17T08:00:00+07:00",
    end_time: "2026-12-18T17:30:00+07:00",
    location: null,
  },
  {
    ...FEATURED[1],
    id: "act-long-2",
    title:
      "CHƯƠNG TRÌNH TRẢI NGHIỆM VĂN HÓA VÀ KẾT NỐI SINH VIÊN QUỐC TẾ TẠI HCMUS",
    image_url: null,
    categories: [],
    location: null,
    registration_status: "open",
  },
];

const INVALID_ITEMS: ActivityDTO[] = [
  {
    ...FEATURED[0],
    id: "",
  },
  {
    ...FEATURED[1],
    start_time: "not-a-date",
  },
];

export const ACTIVITY_FIXTURES: Record<
  "success" | "partial" | "empty" | "delay" | "single-list" | "all-invalid" | "long-content",
  LandingActivitiesDTO
> = {
  success: {
    featured: FEATURED,
    upcoming: UPCOMING,
  } satisfies GroupedLandingActivitiesDTO,
  partial: {
    featured: PARTIAL_FEATURED,
    upcoming: UPCOMING,
  } satisfies GroupedLandingActivitiesDTO,
  empty: {
    featured: [],
    upcoming: [],
  } satisfies GroupedLandingActivitiesDTO,
  delay: {
    featured: FEATURED,
    upcoming: UPCOMING,
  } satisfies GroupedLandingActivitiesDTO,
  "single-list": {
    activities: [FEATURED[0], FEATURED[1], UPCOMING[0], UPCOMING[1], UPCOMING[2]],
  } satisfies ListLandingActivitiesDTO,
  "all-invalid": {
    featured: INVALID_ITEMS,
    upcoming: [],
  } satisfies GroupedLandingActivitiesDTO,
  "long-content": {
    featured: LONG_CONTENT_FEATURED,
    upcoming: [UPCOMING[0], UPCOMING[1], UPCOMING[2]],
  } satisfies GroupedLandingActivitiesDTO,
};

export type MockActivityScenario = keyof typeof ACTIVITY_FIXTURES | "error";
