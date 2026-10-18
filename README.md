# CampusDocs — Cloud-Native Student Document Management Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4+-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)
[![Google Drive API](https://img.shields.io/badge/Google%20Drive-API%20v3-red.svg)](https://developers.google.com/drive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CampusDocs** is a secure, cloud-native student document management ecosystem designed for colleges and universities. It empowers students, faculty mentors, and administrators to upload, verify, organize, search, preview, and share academic records, government identity documents, and certificates in one centralized, high-performance workspace.

---

## 🏛 Core Architectural Principle: Zero Permanent Server Storage

> **Security & Privacy First**: Actual document files are **never permanently stored** on the application server disk or database. 
> - Documents stream directly between the client, the Spring Boot backend, and the user's personal Google Drive via authorized Google Drive API v3 streaming channels.
> - **MongoDB Atlas** stores only user profiles, OAuth connection metadata, Google Drive folder identifiers, and document index metadata.
> - Storage permissions use the least-privilege `https://www.googleapis.com/auth/drive.file` scope — granting CampusDocs access strictly to files created by the application itself.

---

## 🚀 Key Features & Modules

### 🔹 1. Authentication & Google Drive Provisioning
- **Google OAuth 2.0 / OIDC Authentication**: One-click student and faculty login via Google identity (`openid`, `profile`, `email`).
- **User Account Synchronization**: Automatic persistence and profile synchronization in MongoDB Atlas upon authentication.
- **Dedicated `CampusDocs` Folder**: Automated creation and idempotent verification of a private `CampusDocs` root directory in the student's Google Drive.
- **Incremental Consent Flow**: Dedicated endpoints for connecting, validating, and disconnecting Google Drive access.
- **Token Lifecycle Management**: Secure offline storage of OAuth refresh tokens with automated access token renewal.
- **Session Security**: Server-side session management utilizing `HttpOnly`, `SameSite=Lax` cookies (`JSESSIONID`) and CORS credential support.

### 🔹 2. Streaming Document Upload & Compensatory Rollback
- **Direct Drive Streaming**: Multipart files stream directly into the user's dedicated Google Drive folder using `InputStreamContent`.
- **Deep File Validation**:
  - Allowed extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.docx`.
  - MIME type checking and **Magic Byte (file signature)** inspection (`%PDF`, `FF D8 FF`, `89 50 4E 47`) to prevent extension spoofing.
  - Server-enforced file size limits (default 10 MB, configurable via properties).
- **Categorization**: `Academic Records`, `Identity Documents`, `Certificates`, and `Others`.
- **Compensatory Rollback Pattern**: If MongoDB metadata persistence fails after a successful Google Drive file upload, the orphaned Google Drive file is immediately rolled back and purged to maintain strict consistency.

### 🔹 3. Document Library & Interactive Viewer
- **Document Library Listing**: Paginated retrieval with user-level isolation (students can only view their own documents).
- **Real-Time Search, Filtering & Sorting**:
  - Debounced search across user-defined titles and original filenames.
  - Instant category filtering.
  - Multi-field sorting by date (`newest`/`oldest`), title (`A → Z`/`Z → A`), or file size (`largest`/`smallest`).
- **In-Browser Secure Preview**:
  - Direct blob-stream preview for PDFs and images without exposing OAuth credentials or internal Drive file IDs.
- **Streaming Downloads with Loading Feedback**:
  - Direct file streaming from Google Drive with sanitized `Content-Disposition` attachments.
- **Metadata Editing & Deletion**:
  - In-place renaming and category updates (`PATCH`/`PUT`).
  - Synchronized deletion: Idempotent file deletion from Google Drive followed by metadata cleanup in MongoDB Atlas.

### 🔹 4. Student-Faculty Mentorship & Verification Workflow
- **Faculty Mentor Workspace**: Mentors have a dedicated dashboard to review mentee profiles, inspect uploaded student records, and verify documents.
- **Verification Lifecycle**: Documents support real-time status transitions: `Pending` ➔ `In Review` ➔ `Verified` or `Rejected` with reviewer notes.
- **1-to-1 Mentor Assignment**: Students can connect with their assigned faculty mentor or request mentor reassignment.

### 🔹 5. Campus Peer Network (Friends Directory)
- **Department Peer Discovery**: Explore real classmates and batchmates across departments (e.g. AI & DS, Computer Science, IT).
- **Shared College Contacts**: Direct connections to peer profiles with roll numbers, registration IDs, and mentor associations.

### 🔹 6. Real-Time Notifications & Campus Announcements
- **Dynamic Live Notifications**: Real unread notification count badge in navigation bar; automatically hides the badge when unread count is `0`.
- **Activity Alerts**: Instant notifications on document verification, mentor feedback, and Drive connections.
- **Campus Announcements**: Administrative bulletin board with category filters (`CAMPUS_EVENT`, `EXAM_SCHEDULE`, `ACADEMIC_ALERT`, `GENERAL`), priority markers (`URGENT`, `HIGH`, `NORMAL`), and pinned posts.

### 🔹 7. Role-Based Access Control & Admin Console
- **Multi-Role Architecture**: Supported roles: `STUDENT`, `MENTOR`, `ADMIN`.
- **Admin Console**:
  - Platform-wide statistics: total active users, registered students, faculty mentors, verified documents.
  - Mentor-mentee allocation manager: assign or reassign faculty advisors to students.
  - User role provisioning and management.
- **Route Guards & Backend Security**: Endpoint authorization guards and method-level security ensuring strict role isolation.

### 🔹 8. Modular Frontend Architecture
- **Decoupled Component Styling**: Every component and page has its own dedicated `.jsx` and corresponding `.css` stylesheet (`AdminWorkspace`, `MentorWorkspace`, `FriendsView`, `NotificationsView`, `DocumentLibrary`, `TopHeader`, `Sidebar`, etc.).
- **Feathered Hero Illustration**: Responsive dissolved banner with smooth multi-stop gradient and alpha masking.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 with Vite 6
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios with configured base URLs, interceptors, and credentials
- **Icons & Assets**: Custom SVG icon system with optimized lightweight assets
- **Styling**: Modular CSS architecture (1-to-1 `.jsx` + `.css` pairing) with responsive flex/grid layouts

### Backend
- **Framework**: Spring Boot 3.4+ / Java 21+ (Java 25 verified)
- **Security**: Spring Security 6 with OAuth 2.0 Client & OpenID Connect
- **Persistence**: Spring Data MongoDB with MongoDB Atlas
- **Cloud Storage**: Google Drive API Client Library (`google-api-services-drive:v3`)
- **Testing**: JUnit 5, Mockito, Spring Boot Test
- **Build Tool**: Maven Wrapper (`./mvnw`)

---

## 📡 API Endpoints Specification

### Authentication & User (`/api/auth`, `/api/users`)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/auth/me` | Retrieve current authenticated user profile | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate session and clear session cookie | Authenticated |
| `GET` | `/api/users/profile` | Get full user profile including mentor details | Authenticated |
| `PUT` | `/api/users/profile` | Update profile information (phone, dept, year) | Authenticated |
| `POST` | `/api/users/onboarding`| Complete initial student onboarding flow | Authenticated |

### Google Drive Integration (`/api/drive`)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/drive/status` | Retrieve Drive connection status and folder ID | Authenticated |
| `POST` | `/api/drive/connect` | Initiate OAuth incremental consent for `drive.file` | Authenticated |
| `POST` | `/api/drive/folder/ensure`| Verify or initialize user's `CampusDocs` folder | Authenticated |
| `POST` | `/api/drive/disconnect` | Revoke stored Drive tokens and unlink folder | Authenticated |

### Document Management (`/api/documents`)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/api/documents/upload` | Upload document to Google Drive with metadata | Authenticated |
| `GET` | `/api/documents` | List documents with query, category, sort & pagination | Authenticated |
| `GET` | `/api/documents/recent` | Retrieve recent uploaded documents | Authenticated |
| `GET` | `/api/documents/{id}/preview`| Stream document content inline for preview | Owner / Mentor / Admin |
| `GET` | `/api/documents/{id}/download`| Stream document content as file attachment | Owner / Mentor / Admin |
| `PATCH/PUT`| `/api/documents/{id}` | Update document title and category metadata | Owner / Admin |
| `DELETE` | `/api/documents/{id}` | Permanently delete file from Drive and database | Owner / Admin |
| `PUT` | `/api/documents/{id}/status`| Update verification status (`Verified`, `Rejected`)| Mentor / Admin |

### Mentorship & Peer Directory (`/api/mentorship`, `/api/friends`)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/mentorship/my-mentor` | Retrieve assigned faculty mentor details | Student |
| `GET` | `/api/mentorship/mentees` | Retrieve list of assigned student mentees | Mentor / Admin |
| `POST` | `/api/mentorship/connect` | Connect student to a mentor by email | Student |
| `GET` | `/api/friends` | Retrieve real student peers by department & year | Authenticated |

### Notifications & Announcements (`/api/notifications`, `/api/announcements`)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/notifications` | Get user notifications | Authenticated |
| `GET` | `/api/notifications/unread-count`| Get unread notifications count | Authenticated |
| `PUT` | `/api/notifications/{id}/read`| Mark single notification as read | Authenticated |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | Authenticated |
| `DELETE` | `/api/notifications/{id}` | Delete notification | Authenticated |
| `GET` | `/api/announcements` | Retrieve public campus announcements | Public / Authenticated |
| `POST` | `/api/announcements` | Create campus announcement | Admin / Mentor |
| `DELETE` | `/api/announcements/{id}` | Delete campus announcement | Admin |

### Admin Console (`/api/admin`)
| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Retrieve platform-wide metrics & counts | Admin |
| `GET` | `/api/admin/users` | List all users across the institution | Admin |
| `POST` | `/api/admin/users` | Create new user account | Admin |
| `PUT` | `/api/admin/users/{id}/role`| Update user role (`STUDENT`, `MENTOR`, `ADMIN`)| Admin |
| `POST` | `/api/admin/assign-mentor`| Assign mentor to student | Admin |

---

## 📂 Project Directory Structure

```text
CampusDocs/
├── .env.example                               # Global environment configuration template
├── .gitignore                                 # Root Git ignore rules (builds, secrets, temp)
├── README.md                                  # Comprehensive platform documentation
│
├── Backend/CampusDocus/                       # Spring Boot 3 Backend
│   ├── pom.xml                                # Maven dependencies & plugins
│   ├── mvnw / mvnw.cmd                        # Maven wrapper scripts
│   └── src/
│       ├── main/
│       │   ├── java/com/muthu/CampusDocus/
│       │   │   ├── config/                    # SecurityConfig, MongoIndexConfig, GoogleDriveConfig, WebConfig
│       │   │   ├── controller/                # Auth, Document, Drive, User, Mentorship, Notification, Announcement, Admin
│       │   │   ├── dto/                       # Request/Response DTO records
│       │   │   ├── exception/                 # GlobalExceptionHandler & custom exceptions
│       │   │   ├── model/                     # User, Document, Notification, Announcement, UserRole
│       │   │   ├── repository/                # UserRepository, DocumentRepository, NotificationRepository, AnnouncementRepository
│       │   │   ├── security/                  # OAuth2User, SuccessHandler, Authorization filters
│       │   │   └── service/                   # DocumentService, GoogleDriveService, UserService, MentorshipService, NotificationService, AnnouncementService
│       │   └── resources/
│       │       └── application.properties     # Spring properties, MongoDB URI, OAuth credentials
│       └── test/                              # Automated JUnit5 & Mockito test suites
│
└── Frontend/CampusDocs--/                     # React 19 + Vite Frontend
    ├── package.json                           # Frontend dependencies & scripts
    ├── vite.config.js                         # Vite build configuration
    └── src/
        ├── assets/                            # Optimized platform graphics & icons
        ├── components/                        # Modular React components with paired CSS:
        │   ├── AdminWorkspace.jsx / .css
        │   ├── MentorWorkspace.jsx / .css
        │   ├── StudentMentorSection.jsx / .css
        │   ├── FriendsView.jsx / .css
        │   ├── NotificationsView.jsx / .css
        │   ├── DocumentLibrary.jsx / .css
        │   ├── DocumentThumbnail.jsx / .css
        │   ├── DocumentPreviewModal.jsx / .css
        │   ├── DocumentEditModal.jsx / .css
        │   ├── DeleteConfirmModal.jsx / .css
        │   ├── ExploreFeaturesModal.jsx / .css
        │   ├── MobileBottomNav.jsx / .css
        │   ├── Navbar.jsx / .css
        │   ├── ProfileView.jsx / .css
        │   ├── SettingsModal.jsx / .css
        │   ├── SettingsView.jsx / .css
        │   ├── Sidebar.jsx / .css
        │   ├── SupportView.jsx / .css
        │   ├── TopHeader.jsx / .css
        │   ├── UploadModal.jsx / .css
        │   └── VerificationModal.jsx / .css
        ├── context/                           # AuthContext & useAuth hook
        ├── pages/                             # DashboardPage (.jsx/.css), LoginPage (.jsx/.css), OnboardingPage (.jsx/.css)
        ├── services/                          # Axios API client (auth, drive, document, announcement, notification, mentor, admin)
        ├── utils/                             # Formatting and validation utilities
        ├── App.jsx / App.css                  # Core routing and modal layout
        └── main.jsx                           # Application entry point
```

---

## ⚙️ Getting Started & Setup Guide

### 1. Prerequisites
- **Java**: JDK 21 or higher installed (Tested on Java 25).
- **Node.js**: Node 18 or higher with npm.
- **MongoDB Atlas**: An active MongoDB Atlas cluster connection URI.
- **Google Cloud Console**: An OAuth 2.0 Client ID configured with:
  - Authorized Redirect URI: `http://localhost:8080/login/oauth2/code/google`
  - Authorized Redirect URI: `http://localhost:8080/login/oauth2/code/google-drive`
  - Authorized JavaScript Origin: `http://localhost:5173`

### 2. Environment Variables Configuration

Create a `.env` file in the root directory (or in `Backend/CampusDocus/`) using `.env.example`:

```bash
# MongoDB Atlas Connection
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application URLs
FRONTEND_URL=http://localhost:5173
```

### 3. Running the Backend (Spring Boot)

```bash
cd Backend/CampusDocus
./mvnw clean spring-boot:run
```
*The Spring Boot backend will start on `http://localhost:8080`.*

### 4. Running the Frontend (React + Vite)

```bash
cd Frontend/CampusDocs--
npm install
npm run dev
```
*The React client will launch on `http://localhost:5173`.*

---

## 🧪 Testing & Verification

Execute the backend automated test suite:

```bash
cd Backend/CampusDocus
./mvnw test
```
*Runs all unit and integration tests (DocumentServiceTest, MentorshipServiceTest, ApplicationContext test).*

Verify the frontend production build:

```bash
cd Frontend/CampusDocs--
npm run build
```

---

## 🔒 Security Best Practices Implemented

1. **Principle of Least Privilege**: Requests only the restricted `https://www.googleapis.com/auth/drive.file` scope instead of broad Google Drive access.
2. **SameSite & HttpOnly Cookies**: Protects user sessions from Cross-Site Scripting (XSS) and unauthorized token harvesting.
3. **MIME & File Signature Enforcement**: Multi-layer inspection blocks masqueraded or executable binaries from entering user Drive folders.
4. **Strict Document Ownership Validation**: Database query filters and service-layer verification prevent horizontal privilege escalation between students.
5. **Role-Based Authorization**: Secure endpoints protected with `@PreAuthorize` and Spring Security role hierarchy.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
