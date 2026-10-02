# Hope-Care Backend API Documentation

## 1. Overview

Base URL:

```text
http://localhost:3000
```

Production deployments should replace the base URL with the deployed HTTPS URL.

All protected requests use:

```http
Authorization: Bearer <access-token>
```

JSON requests must include:

```http
Content-Type: application/json
```

The ready-to-import Postman collection is:

[`postman/Hope-Care.postman_collection.json`](./postman/Hope-Care.postman_collection.json)

Interactive OpenAPI UI:

```text
GET /docs
GET /openapi.json
```

## 2. Authentication and roles

Supported roles:

```text
PATIENT
DOCTOR
HOSPITAL
CMO_DISTRICT
CMO_STATE
CMO_NOMINEE_AC
STAFF
ADMIN
NATIONAL_ADMIN
```

Access tokens are JWTs. Access tokens should be sent on every protected request.
Refresh tokens are sent only to `/api/v1/auth/refresh`.

Common error responses:

```json
{ "error": "Unauthorized" }
```

```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "fieldName": ["Invalid value"]
    }
  }
}
```

## 3. Health and documentation

### GET `/health`

Authentication: none.

Response:

```json
{
  "status": "ok",
  "service": "hope-care"
}
```

### GET `/docs`

Authentication: none.

Opens the Swagger UI.

### GET `/openapi.json`

Authentication: none.

Returns the OpenAPI document served by the backend.

## 4. Authentication APIs

All authentication endpoints are rate limited to 20 requests per minute.

### POST `/api/v1/auth/register`

Authentication: none.

#### Register a patient

```json
{
  "email": "patient@example.com",
  "password": "Patient#2026",
  "role": "PATIENT",
  "firstName": "Aarav",
  "lastName": "Sharma",
  "mobile": "+919876543210",
  "aadhaar": "999988887777"
}
```

#### Register a doctor

```json
{
  "email": "doctor@example.com",
  "password": "Doctor#2026",
  "role": "DOCTOR",
  "firstName": "Demo",
  "lastName": "Doctor",
  "mobile": "+919876543211",
  "aadhaar": "888877776666",
  "degree": "MBBS, MD",
  "registrationNumber": "NMC-DEMO-2001"
}
```

#### Register a hospital account

```json
{
  "email": "hospital@example.com",
  "password": "Hospital#2026",
  "role": "HOSPITAL"
}
```

Patient and doctor registration fields are required according to the selected
role. Aadhaar is hashed before persistence and is not returned in the response.

Response: `201 Created`.

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "id": "PAT000001",
    "email": "patient@example.com",
    "role": "PATIENT",
    "patientId": "PAT000001"
  }
}
```

### POST `/api/v1/auth/login`

Authentication: none.

The role is required.

```json
{
  "email": "doctor@example.com",
  "password": "Doctor#2026",
  "role": "DOCTOR"
}
```

Response:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "id": "DOC000001",
    "email": "doctor@example.com",
    "role": "DOCTOR"
  }
}
```

### POST `/api/v1/auth/refresh`

Authentication: none.

```json
{
  "refreshToken": "<refresh-token>"
}
```

Response:

```json
{
  "accessToken": "<new-jwt>"
}
```

## 5. Profiles and roles

### GET `/api/v1/profile/me`

Roles: patient, doctor, hospital, CMO, admin, national admin.

Returns the authenticated account profile.

### PATCH `/api/v1/profile/me`

Roles: patient, doctor, hospital, CMO, admin, national admin.

Patient example:

```json
{
  "displayName": "Aarav Sharma",
  "phone": "+919000000000",
  "alternatePhone": "+919000000001",
  "profileImageKey": "profiles/patient/photo.jpg"
}
```

Doctor example:

```json
{
  "displayName": "Dr. Demo Doctor",
  "phone": "+919876543211",
  "addressLine": "Medical College Road",
  "city": "Kasganj",
  "state": "Uttar Pradesh",
  "postalCode": "207123"
}
```

Hospital example:

```json
{
  "displayName": "Hope-Care City Hospital",
  "phone": "+919876543210",
  "officeAddress": "Hospital Road, Kasganj, Uttar Pradesh 207123"
}
```

### GET `/api/v1/profile/me/roles`

Authentication: any authenticated role.

Returns the roles assigned to the authenticated user.

## 6. Patient APIs

### GET `/api/v1/patient/me`

Roles: `PATIENT`, `DOCTOR`.

Returns the patient profile associated with the authenticated account.

### PATCH `/api/v1/patient/me`

Roles: `PATIENT`, `DOCTOR`.

```json
{
  "firstName": "Aarav",
  "lastName": "Sharma",
  "preferredName": "Aarav",
  "sexAtBirth": "MALE",
  "bloodGroup": "O_POSITIVE",
  "emergencyContact": {
    "name": "Meera Sharma",
    "phone": "+919000000001",
    "relation": "MOTHER"
  }
}
```

### GET `/api/v1/patient/me/medical-records`

Roles: `PATIENT`, `DOCTOR`.

Returns the authenticated patient's medical records.

### POST `/api/v1/patient/me/medical-records`

Roles: `PATIENT`, `DOCTOR`.

```json
{
  "recordType": "FOLLOW_UP",
  "title": "Blood pressure follow-up",
  "clinicalData": {
    "bloodPressure": "128/82",
    "notes": "Continue monitoring"
  }
}
```

### GET `/api/v1/patients/me/medical-history`

Role: `PATIENT`.

### POST `/api/v1/patients/me/medical-history`

Role: `PATIENT`.

```json
{
  "condition": "Hypertension",
  "details": "Controlled with medication",
  "diagnosedOn": "2026-09-01"
}
```

## 7. Document APIs

Roles for all document endpoints: `PATIENT`, `DOCTOR`, `HOSPITAL`, `STAFF`,
`ADMIN`, `NATIONAL_ADMIN`.

Supported document types:

```text
MEDICAL_REPORT
PRESCRIPTION
LAB_REPORT
DISCHARGE_SUMMARY
AADHAAR
ADDRESS_PROOF
PROFILE_PHOTO
DOCTOR_CERTIFICATE
OTHER
```

### POST `/api/v1/documents/upload`

Content type: `multipart/form-data`.

Form fields:

| Field | Type | Required |
|---|---|---|
| `file` | file | yes |
| `documentType` | string | yes |

Accepted MIME types:

```text
image/jpeg
image/png
image/webp
application/pdf
```

Maximum file size: 10 MB.

Example cURL:

```bash
curl --request POST "{{baseUrl}}/api/v1/documents/upload" \
  --header "Authorization: Bearer {{accessToken}}" \
  --form "documentType=ADDRESS_PROOF" \
  --form "file=@./address-proof.pdf"
```

Response:

```json
{
  "success": true,
  "document": {
    "documentId": "doc-public-id",
    "fileName": "address-proof.pdf",
    "mimeType": "application/pdf",
    "size": 245123,
    "status": "TEMPORARY",
    "expiresAt": "2026-10-02T18:30:00.000Z"
  }
}
```

Unattached documents expire after 30 minutes. The scheduled cleanup worker
deletes the private S3 object and soft-deletes the database row.

### GET `/api/v1/documents/:documentId`

Returns metadata for a document owned by the authenticated user.

### GET `/api/v1/documents/:documentId/url`

Returns a short-lived signed URL. S3 objects are private.

### DELETE `/api/v1/documents/:documentId`

Deletes a temporary document owned by the authenticated user. Attached
documents cannot be deleted through this endpoint.

## 8. Patient address APIs

All address endpoints require role `PATIENT`.

Address types:

```text
CURRENT
PERMANENT
```

### POST `/api/v1/patients/me/addresses`

Creates a new address version. The address proof must first be uploaded as an
`ADDRESS_PROOF` document.

```json
{
  "addressType": "CURRENT",
  "addressLine1": "123 Main Road",
  "addressLine2": "Near City Hospital",
  "landmark": "City Hospital",
  "country": "India",
  "state": "Uttar Pradesh",
  "district": "Kasganj",
  "city": "Kasganj",
  "tehsil": "Kasganj",
  "village": "Kasganj",
  "pincode": "207123",
  "latitude": 27.8082,
  "longitude": 78.6461,
  "documentId": "<address-proof-document-id>"
}
```

The transaction:

1. Validates document ownership and type.
2. Deactivates the existing address of the same type.
3. Inserts a new version.
4. Attaches the document.
5. Creates status and audit history.

### GET `/api/v1/patients/me/addresses`

Returns only active addresses:

```json
{
  "success": true,
  "data": {
    "current": {
      "addressId": "ADDR000002",
      "addressType": "CURRENT",
      "version": 2,
      "status": "PENDING_VERIFICATION",
      "isActive": true
    },
    "permanent": null
  }
}
```

### GET `/api/v1/patients/me/addresses/history`

Returns active and inactive address versions in descending version order.

### GET `/api/v1/patients/me/addresses/:addressId`

Returns one address version owned by the patient.

### PUT `/api/v1/patients/me/addresses/:addressId`

Creates a new version. It does not modify the existing row.

The request uses the same address fields as creation and requires a new
`documentId`.

### GET `/api/v1/patients/me/addresses/:addressId/status-history`

Returns status transitions such as `PENDING_VERIFICATION`, `VERIFIED`, and
`INACTIVE`.

### PUT `/api/v1/patients/me/profile`

Attaches a previously uploaded profile-photo document.

```json
{
  "profileDocumentId": "<profile-photo-document-id>"
}
```

## 9. Departments and hospitals

### GET `/api/v1/departments`

Roles: patient, doctor, hospital, staff, admin, national admin.

Returns all departments:

```json
{
  "data": [
    {
      "public_id": "department-public-id",
      "name": "Cardiology",
      "description": "Heart care"
    }
  ]
}
```

### POST `/api/v1/departments`

Roles: `ADMIN`, `NATIONAL_ADMIN`, `STAFF`.

```json
{
  "name": "Neurology",
  "description": "Brain and nervous system care"
}
```

### GET `/api/v1/hospitals`

Roles: patient, doctor, hospital, staff, admin, national admin.

Returns all hospitals, structured address/contact information, verification
status, and active departments associated with each hospital.

```json
{
  "data": [
    {
      "public_id": "HOS000000B",
      "name": "Hope-Care Kasganj District Hospital",
      "address": "District Hospital Road, Kasganj, Uttar Pradesh 207123",
      "addressDetails": {
        "line1": "District Hospital Road",
        "line2": null,
        "landmark": null,
        "district": "Kasganj",
        "state": "Uttar Pradesh",
        "pincode": "207123",
        "country": "India",
        "cityId": null,
        "latitude": null,
        "longitude": null
      },
      "phone": "+919876543210",
      "email": "contact@hospital.example",
      "website": null,
      "emergency_phone": "108",
      "description": "24-hour secondary care hospital",
      "verification_status": "VERIFIED",
      "departments": [
        {
          "departmentId": "department-public-id",
          "name": "Cardiology",
          "description": "Heart care"
        }
      ]
    }
  ]
}
```

### POST `/api/v1/hospitals`

Roles: `HOSPITAL`, `ADMIN`, `NATIONAL_ADMIN`.

```json
{
  "name": "Hope-Care City Hospital",
  "addressLine1": "Hospital Road",
  "addressLine2": "Near Central Bus Stand",
  "landmark": "Central Bus Stand",
  "district": "Kasganj",
  "state": "Uttar Pradesh",
  "pincode": "207123",
  "country": "India",
  "phone": "+919876543210",
  "email": "contact@hospital.example",
  "website": "https://hospital.example",
  "emergencyPhone": "108",
  "description": "24-hour secondary care hospital",
  "latitude": 27.8082,
  "longitude": 78.6461
}
```

The legacy `address` field remains supported.

### POST `/api/v1/hospitals/doctors`

Roles: `HOSPITAL`, `ADMIN`, `NATIONAL_ADMIN`.

Associates a doctor with the authenticated hospital and an optional
department:

```json
{
  "doctorId": "DOC000001",
  "departmentId": "<department-public-id>"
}
```

The doctor must be verified before association:

```text
doctors.verification_status = VERIFIED
```

## 10. Appointment APIs

### POST `/api/v1/appointments`

Role: `PATIENT`.

```json
{
  "hospitalId": "<hospital-public-id>",
  "doctorId": "<doctor-id>",
  "departmentId": "<department-public-id>",
  "scheduledAt": "2026-10-15T10:00:00+05:30",
  "reason": "Routine cardiac check-up"
}
```

### GET `/api/v1/appointments`

Roles: patient, doctor, hospital, staff, admin, national admin.

Returns appointments visible to the authenticated role.

### POST `/api/v1/appointments/:id/route`

Roles: `HOSPITAL`, `ADMIN`, `NATIONAL_ADMIN`.

```json
{
  "doctorId": "<doctor-user-id>",
  "departmentId": "<department-public-id>",
  "note": "Assigned by hospital"
}
```

### PATCH `/api/v1/appointments/:id/status`

Roles: patient, doctor, hospital, admin, national admin.

```json
{
  "status": "CONFIRMED",
  "note": "Appointment confirmed"
}
```

Supported transitions are controlled by the appointment state machine:

```text
REQUESTED -> CANCELLED
ROUTED -> CONFIRMED | REJECTED | CANCELLED
CONFIRMED -> IN_PROGRESS | CANCELLED
IN_PROGRESS -> COMPLETED
```

## 11. Legacy file and listing endpoints

### POST `/api/v1/files/presign`

Roles: patient, doctor, hospital, staff, admin, national admin.

```json
{
  "key": "profiles/demo/patient.jpg",
  "contentType": "image/jpeg"
}
```

Returns an S3 presigned upload URL. For persisted documents and attachment
ownership, use `/api/v1/documents/upload` instead.

### GET `/api/v1/patients/me`

Roles: `PATIENT`, `ADMIN`, `NATIONAL_ADMIN`.

Returns the authenticated patient user ID. Jurisdiction middleware applies to
this route.

### GET `/api/v1/doctors`

Roles: `DOCTOR`, `ADMIN`, `NATIONAL_ADMIN`, `STAFF`.

This route currently returns an empty list placeholder:

```json
{
  "data": []
}
```

### GET `/api/v1/hospitals` legacy route

The clinical hospital route at `GET /api/v1/hospitals` is the implemented
hospital listing and returns hospital details and departments. The placeholder
route declaration is shadowed by the clinical route registration.

## 12. Postman workflow

Recommended order:

1. Register a doctor and hospital account.
2. Login and copy each role's access token into the active collection variable.
3. Login as an admin/staff account to create departments.
4. List departments and copy a department public ID.
5. Complete the authorized doctor verification workflow.
6. Login as the hospital.
7. Create/update the hospital profile.
8. Associate the verified doctor with a department.
9. Call `GET /api/v1/hospitals` to confirm the department appears.

The collection includes request groups for authentication, profiles, patient
features, documents, addresses, hospitals, departments, and appointments.

## 13. Environment and database setup

Required environment values include:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET
```

Apply all migrations before using the APIs:

```powershell
cd D:\project\hope-care\backend
npm install
npm run db:migrate
npm run dev
```

The migration runner applies all SQL files, including:

```text
018_address_documents.sql
019_hospital_details.sql
```

## 14. cURL conventions

Set variables in a shell before using the examples:

```powershell
$baseUrl = "http://localhost:3000"
$accessToken = "<jwt>"
```

PowerShell example:

```powershell
Invoke-RestMethod -Method Get `
  -Uri "$baseUrl/api/v1/hospitals" `
  -Headers @{ Authorization = "Bearer $accessToken" }
```

The Postman collection is the preferred executable reference for multipart
uploads and token capture.
