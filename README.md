# CampusDocs — Student Document Management System

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4+-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)
[![Google Drive API](https://img.shields.io/badge/Google%20Drive-API%20v3-red.svg)](https://developers.google.com/drive)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CampusDocs** is a secure, cloud-native student document management web application that allows students to upload, organize, search, preview, download, and manage their academic records, certificates, and identity documents.

---

## 🏛 Core Architectural Principle: Zero Permanent Server Storage

> **Security & Privacy First**: Actual document contents are **never permanently stored** on the application server disk or database. 
> - Documents stream directly between the client, the Spring Boot backend, and the user's personal Google Drive via authorized Google Drive API v3 streaming channels.
> - **MongoDB Atlas** stores only user profiles, OAuth connection metadata, Google Drive folder identifiers, and document index metadata.
> - Storage permissions use the least-privilege `drive.file` scope — granting CampusDocs access strictly to files created by the application itself.

---

## 🚀 Implemented Modules Overview

### 🔹 Module 1: Authentication & Dedicated Google Drive Provisioning
- **Google OAuth 2.0 / OIDC Authentication**: One-click student login via Google identity (`openid`, `profile`, `email`).
- **User Account Synchronization**: Automatic persistence and profile synchronization in MongoDB Atlas.
- **Dedicated `CampusDocs` Folder**: Automated creation and idempotent verification of a private `CampusDocs` root directory in the student's Google Drive.
- **Incremental Consent Flow**: Dedicated endpoints for connecting, validating, and disconnecting Google Drive access.
- **Token Lifecycle Management**: Secure offline storage of OAuth refresh tokens with automated access token renewal.
- **Session Security**: Server-side session management utilizing `HttpOnly`, `SameSite=Lax` cookies (`JSESSIONID`) and CORS credential support.

### 🔹 Module 2: Streaming Document Upload & Compensatory Rollback
- **Direct Drive Streaming**: Multipart files stream directly into the user's dedicated Google Drive folder using `InputStreamContent`.
- **Deep File Validation**:
  - Allowed extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`.
  - MIME type checking and **Magic Byte (file signature)** inspection (`%PDF`, `FF D8 FF`, `89 50 4E 47`) to prevent extension spoofing.
  - Server-enforced file size limits (default 10 MB, configurable via properties).
- **Document Categorization**:
  - `Academic Records`
  - `Certificates`
  - `Identification Documents`
  - `Personal Documents`
  - `Other`
- **Compensatory Rollback Pattern**: If MongoDB metadata persistence fails after a successful Google Drive file upload, the orphaned Google Drive file is immediately rolled back and purged to maintain strict consistency.

### 🔹 Module 3: Complete Document Management
- **Document Library Listing**: Paginated retrieval with user-level isolation (students can only view their own documents).
- **Real-Time Search, Filtering & Sorting**:
  - Debounced search across user-defined titles and original filenames.
  - Instant category filtering.
  - Multi-field sorting by date (`newest`/`oldest`), title (`A → Z`/`Z → A`), or file size (`largest`/`smallest`).
- **In-Browser Secure Preview**:
  - Direct blob-stream preview for PDFs and images without exposing OAuth credentials or internal Drive file IDs.
- **Streaming Downloads with Loading Feedback**:
  - Direct file streaming from Google Drive with sanitized `Content-Disposition` attachments.
  - Dynamic loading animation and spinner feedback on row download actions.
- **Metadata Editing**:
  - In-place renaming and category updates with support for both `PATCH` and `PUT` HTTP methods.
- **Synchronized Deletion**:
  - Idempotent file deletion from Google Drive followed by metadata cleanup in MongoDB Atlas.
  - Graceful synchronization for stale metadata if a file was deleted externally in Google Drive.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios with configured base URLs and credentials
- **Styling**: Modern vanilla CSS with responsive grid/flexbox layouts and dark/light system adaptation

### Backend
- **Framework**: Spring Boot 3.4+ / Java 21+ (Java 25 compatible)
- **Security**: Spring Security 6 with OAuth 2.0 Client & OpenID Connect
- **Persistence**: Spring Data MongoDB with MongoDB Atlas
- **Cloud Storage**: Google Drive API Client Library (`com.google.apis:google-api-services-drive:v3-rev20240123-2.0.0`)
- **Build Tool**: Maven Wrapper (`./mvnw`)

---

## 📡 API Endpoints

### Authentication & User (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/auth/me` | Retrieve current authenticated user profile | No (Returns null if guest) |
| `POST` | `/api/auth/logout` | Invalidate session and clear session cookie | Yes |

### Google Drive Integration (`/api/drive`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/drive/status` | Retrieve Drive connection status and folder ID | Yes |
| `POST` | `/api/drive/connect` | Initiate OAuth incremental consent for `drive.file` | Yes |
| `POST` | `/api/drive/folder/ensure`| Verify or initialize user's `CampusDocs` folder | Yes |
| `POST` | `/api/drive/disconnect` | Revoke stored Drive tokens and unlink folder | Yes |

### Document Management (`/api/documents`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/documents/upload` | Upload document to Google Drive with metadata | Yes |
| `GET` | `/api/documents` | List documents with query, category, sort & pagination | Yes |
| `GET` | `/api/documents/recent` | Retrieve recent 5 uploaded documents | Yes |
| `GET` | `/api/documents/{id}/preview`| Stream document content inline for preview | Yes |
| `GET` | `/api/documents/{id}/download`| Stream document content as file attachment | Yes |
| `PATCH/PUT`| `/api/documents/{id}` | Update document title and category metadata | Yes |
| `DELETE` | `/api/documents/{id}` | Permanently delete file from Drive and database | Yes |

---

## 📂 Project Directory Structure

```text
CampusDocs/
├── .env.example                               # Global environment configuration template
├── .gitignore                                 # Root Git ignore rules (builds, secrets, temp)
├── README.md                                  # Comprehensive project documentation
│
├── Backend/CampusDocus/                       # Spring Boot Backend
│   ├── mvnw / mvnw.cmd                        # Maven wrapper scripts
│   ├── pom.xml                                # Backend dependencies & build setup
│   └── src/
│       ├── main/
│       │   ├── java/com/muthu/CampusDocus/
│       │   │   ├── config/                    # SecurityConfig, GoogleDriveConfig, WebConfig
│       │   │   ├── controller/                # AuthController, DriveController, DocumentController
│       │   │   ├── dto/                       # Request & Response Data Transfer Objects
│       │   │   ├── exception/                 # GlobalExceptionHandler & custom exceptions
│       │   │   ├── model/                     # MongoDB models (User, Document, Credential)
│       │   │   ├── repository/                # Spring Data MongoDB repositories
│       │   │   ├── security/                  # OAuth2 user services, resolvers, success handlers
│       │   │   └── service/                   # DocumentService, GoogleDriveService, UserService
│       │   └── resources/
│       │       └── application.properties     # Spring properties & OAuth credentials
│       └── test/                              # Automated unit & integration test suites
│
└── Frontend/CampusDocs--/                     # React + Vite Frontend
    ├── package.json                           # Frontend scripts & dependencies
    ├── vite.config.js                         # Vite development & build configuration
    └── src/
        ├── components/                        # DocumentLibrary, Modals (Upload, Edit, Preview, Delete)
        ├── context/                           # AuthContext & useAuth hook
        ├── pages/                             # DashboardPage, LoginPage
        ├── services/                          # Axios API client (auth, drive, document)
        ├── App.css                            # Modern component and layout styling
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

### 2. Environment Variables

Create `.env` in the root or set these environment variables:

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
*The backend server will start on `http://localhost:8080`.*

### 4. Running the Frontend (React + Vite)

```bash
cd Frontend/CampusDocs--
npm install
npm run dev
```
*The client application will start on `http://localhost:5173`.*

---

## 🧪 Testing

Execute backend automated test suites with the Maven wrapper:

```bash
cd Backend/CampusDocus
./mvnw test -Dtest=DocumentServiceTest
```

Verify frontend production build:

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
