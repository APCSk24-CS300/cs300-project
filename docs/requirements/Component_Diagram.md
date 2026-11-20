flowchart LR
    Student["Student"]
    Manager["Activity Manager"]
    Admin["University Administrator"]
    Browser["Web Browser"]

    Student --> Browser
    Manager --> Browser
    Admin --> Browser

    subgraph Client["myHCMUS Web Client - Next.js"]
        direction TB
        WebUI["Role-based pages and dashboards"]
        Common["Common UI, profile and authentication"]
        StudentFeatures["Student features<br/>Activity discovery and registration<br/>Calendar and training-score history"]
        ManagerFeatures["Manager features<br/>Activity and registration management<br/>Attendance, results and reports"]
        AdminFeatures["Administration<br/>Roles, criteria, categories and analytics"]
        OtherFeatures["Notifications, requests<br/>University services hub"]
        AssistantUI["AI Student Assistant"]
        FeatureServices["Feature services and data mappers"]
        AuthContext["Auth context and session"]
        DataSource{"Data source"}
        MockServices["Mock services and fixtures"]
        APIClient["HTTP API client"]

        WebUI --> Common
        WebUI --> StudentFeatures
        WebUI --> ManagerFeatures
        WebUI --> AdminFeatures
        WebUI --> OtherFeatures
        WebUI --> AssistantUI
        Common --> AuthContext
        StudentFeatures --> FeatureServices
        ManagerFeatures --> FeatureServices
        AdminFeatures --> FeatureServices
        OtherFeatures --> FeatureServices
        AssistantUI --> FeatureServices
        FeatureServices --> DataSource
        DataSource -->|mock mode| MockServices
        DataSource -->|API mode| APIClient
    end

    Browser --> WebUI

    subgraph Server["myHCMUS Application Server - Express REST API"]
        direction TB
        Routes["REST API routes"]
        Middleware["Request validation and error handling"]
        AuthController["Authentication controller"]
        AuthService["Authentication service"]
        AuthRepository["In-memory authentication repository"]
        DomainServices["Business services<br/>Activities and registrations<br/>Participation and scores<br/>Requests, notifications and administration"]
        AIService["AI assistant integration"]

        Routes --> Middleware
        Middleware --> AuthController
        AuthController --> AuthService
        AuthService --> AuthRepository
        Middleware --> DomainServices
        Middleware --> AIService
    end

    APIClient -->|HTTP/JSON| Routes

    subgraph Persistence["Persistence and file storage"]
        PostgreSQL[("PostgreSQL database<br/>Users, activities, registrations<br/>Participation, scores and requests")]
        FileStorage[("Evidence and profile image storage")]
    end

    DomainServices --> PostgreSQL
    DomainServices --> FileStorage
    AuthService -. "target persistent storage" .-> PostgreSQL

    subgraph External["External services"]
        AIProvider["AI model/service"]
        Email["Email delivery"]
        University["University services<br/>Moodle, Student Portal, Library"]
    end

    AIService --> AIProvider
    DomainServices --> Email
    OtherFeatures -. "external service links" .-> University

    classDef implemented fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    classDef planned fill:#fff8e1,stroke:#ef6c00,color:#6d4c00
    class AuthContext,FeatureServices,MockServices,APIClient,Routes,Middleware,AuthController,AuthService,AuthRepository implemented
    class StudentFeatures,ManagerFeatures,AdminFeatures,OtherFeatures,AssistantUI,DomainServices,AIService,PostgreSQL,FileStorage,AIProvider,Email,University planned

    subgraph Legend
        CurrentLegend["Implemented in current source"]
        PlannedLegend["Target component from vision document"]
    end
    class CurrentLegend implemented
    class PlannedLegend planned
