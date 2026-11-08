-- Run this file with psql.\connect is a psql command.
CREATE DATABASE "myHCMUS" WITH ENCODING 'UTF8';
\connect "myHCMUS"

-- Reference data and users
CREATE TABLE "Role" (
    role_id INT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE "Faculty" (
    faculty_id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE "Category" (
    category_id INT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE "Semester" (
    semester_id INT PRIMARY KEY,
    academic_year TEXT NOT NULL,
    name TEXT NOT NULL,
    starts_at DATE NOT NULL,
    ends_at DATE NOT NULL,
    UNIQUE (academic_year, name),
    CHECK (ends_at >= starts_at)
);

CREATE TABLE "User" (
    user_id TEXT PRIMARY KEY,
    role_id INT NOT NULL REFERENCES "Role"(role_id),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    student_name TEXT,
    faculty_id TEXT REFERENCES "Faculty"(faculty_id),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserInterest" (
    user_id TEXT NOT NULL REFERENCES "User"(user_id),
    category_id INT NOT NULL REFERENCES "Category"(category_id),
    PRIMARY KEY (user_id, category_id)
);

CREATE TABLE "Activity" (
    activity_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    eligibility_notes TEXT,
    category_id INT REFERENCES "Category"(category_id),
    semester_id INT REFERENCES "Semester"(semester_id),
    faculty_id TEXT REFERENCES "Faculty"(faculty_id),
    location TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    capacity INT CHECK (capacity >= 0),
    registration_opens_at TIMESTAMPTZ,
    registration_closes_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
    creator_id TEXT REFERENCES "User"(user_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at),
    CHECK (registration_closes_at IS NULL OR registration_opens_at IS NULL OR registration_closes_at >= registration_opens_at)
);
