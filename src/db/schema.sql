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
        foreign key (role_id),
    
    constraint  FK_User_faculty_id
        foreign key (faculty_id),
    
);
