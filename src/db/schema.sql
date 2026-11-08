CREATE database "myHCMUS";


-------------------------------
--------- ENTITIES ------------
-------------------------------

--------- USER AND INTEREST ---------
create table "User" (
    user_id text not null,
    role_id int not null,
    email text unique not null,
    password_hash text not null, 
    full_name text,

    student_name text,
    faculty_id text,
    avatar_url text,
    is_active boolean,
    created_at timestamp,

    constraint PK_User_user_id
        primary key (user_id),
    
    constraint FK_User_role_id
        foreign key (role_id) references Role(role_id),
    
    constraint  FK_User_faculty_id
        foreign key (faculty_id) references Faculty(faculty_id),
    
);

create table "UserInterest" (
    user_id text, 
    category_id int,

    constraint FK_UserInterest_user_id
        foreign key (user_id) references "User"(user_id),
    
    constraint FK_UserInterest_category_id 
        foreign key (category_id) references Category(category_id),

);

--------- Activity and Participation ---------

create table "Activity"(
    activity_id text, 
    title text,
    "description" text,
    eligibility_notes text,
    category_id int,
    semester_id int,
    capacity int,
    registration_opens_at timestamp,
    registration_closes_at timestamp,
    "status" int, 
    creator_id text,
    created_at timestamp,

    constraint PK_Activity_activity_id
        primary key (activity_id),

    constraint FK_Activity_category_id
        foreign key (category_id) references "Category"(category_id),

    constraint FK_Activity_semester_id
        foreign key (semster_id)
        references "Semester"(semester_id),
    
    constraint FK_Activity_creator_id
        foreign key (creator_id)
        references "User"(user_id)

);
