# Resumable File Uploader

## This backend service manages **cases** , where each case contains **logs (Refired as documents)** , and each log acts as a folder holding **uploaded files** .

It supports **resumable (multipart) file uploads** to handle unreliable network conditions and pause/resume features.

## Features

- Create and retrieve cases
- Each case can have multiple **documents**
- Each document can store multiple **files**
- Persistent storage using **MinIO** (via S3 SDK)
- Handles **resumable file uploads** for large files

---

## Tech Stack

- **Language / Framework:** TypeScript / NestJS
- **Database:** MySQL (via Prisma)
- **Other:** Docker, MinIO (via S3 SDK)

---

## Getting Started & Deployment

### Option 1: Using Pre-built Docker Image (Recommended)

1. Download the Docker image from this link:
   https://drive.google.com/file/d/1ygi-asJdpu6bzCoBuqbKhjSwIdpZ3kFp/view?usp=sharing
2. Load the Docker image:

   ```bash
   docker load -i resumable-uploader-image.tar
   ```

3. Run the container:

   ```bash
   docker run -p 3000:3000 --name resumable-uploader resumable-uploader:latest
   ```

   The application will be available at `http://localhost:3000`

### Option 2: Build from Source

#### Prerequisites

- **Node.js** v20+
- **MySQL** running locally
- **MinIO** running via Docker (with a bucket named `resumable`)

#### Installation

```bash
git clone https://github.com/Ahmedsam199/Resumable_Uploader.git
cd Resumable_Uploader
npm install
```

#### Environment Setup

Create new **.env** file with this value

```
DATABASE_URL=mysql://root:Eq11223344@localhost:3306/test
```

#### Running The App

You can run the app using Docker Compose, which sets up MySQL, MinIO, and the backend service automatically.

1. Clone your project if you haven't already:

```bash
git clone https://github.com/Ahmedsam199/Resumable_Uploader.git
cd Resumable_Uploader
```

2. Start all services using Docker Compose:
   ```
   docker-compose up --build
   ```
3. This will start:
   - **MySQL** at port `3306`
   - **MinIO** at ports `9000` (API) and `9001` (console)
   - **Backend app** at port `3000`
4. Open the MinIO console at `http://localhost:9001` and create a bucket named `resumable` if it doesn't exist.

---

## Database Schema

The application uses three main entities:

```prisma
model Case {
  id       Int        @id @default(autoincrement())
  name     String
  Document Document[]
}

model Document {
  id          Int      @id @default(autoincrement())
  name        String
  postingDate DateTime @default(now())
  caseId      Int
  Case        Case     @relation(fields: [caseId], references: [id])
  File        File[]
}

model File {
  id         Int      @id @default(autoincrement())
  name       String
  path       String
  documentId Int
  Document   Document @relation(fields: [documentId], references: [id])
}
```

**Relationships:**

- One Case can have multiple Documents
- One Document can have multiple Files
- Each Document belongs to a Case
- Each File belongs to a Document

---

## API Documentation

### Cases Controller

Base URL: `/cases`

#### Get All Cases

```http
GET /cases
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Case Name"
  }
]
```

#### Create New Case

```http
POST /cases
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "New Case Name"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "New Case Name"
}
```

#### Get Case by ID

```http
GET /cases/:id
```

**Response:**

```json
{
  "id": 1,
  "name": "Case Name",
  "Document": [
    {
      "id": 1,
      "name": "Document Name",
      "postingDate": "2024-01-01T00:00:00.000Z",
      "caseId": 1
    }
  ]
}
```

### Documents Controller

Base URL: `/documents`

#### Get All Documents

```http
GET /documents
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Document Name",
    "postingDate": "2024-01-01T00:00:00.000Z",
    "caseId": 1
  }
]
```

#### Create New Document

```http
POST /documents
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Document Name",
  "caseId": 1
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "Document Name",
  "postingDate": "2024-01-01T00:00:00.000Z",
  "caseId": 1
}
```

#### Get Document by ID

```http
GET /documents/:id
```

**Response:**

```json
{
  "id": 1,
  "name": "Document Name",
  "postingDate": "2024-01-01T00:00:00.000Z",
  "caseId": 1,
  "File": [
    {
      "id": 1,
      "name": "file.pdf",
      "path": "/path/to/file.pdf",
      "documentId": 1
    }
  ]
}
```

### Files Controller (Resumable Upload)

Base URL: `/files`

#### Start Upload

```http
POST /files/start-upload
Content-Type: application/json
```

**Request Body:**

```json
{
  "fileName": "document.pdf",
  "documentId": 1
}
```

**Response:**

```json
{
  "id": "unique-upload-id",
  "key": "object-key-for-minio"
}
```

#### Upload File Chunk

```http
POST /files/upload
Content-Type: multipart/form-data
```

**Form Data:**

- `file`: File chunk (binary data)
- `objectName`: Object key from start-upload
- `uploadId`: Upload ID from start-upload
- `partNumber`: Sequential part number (1, 2, 3, ...)

**Response:**

```json
{
  "ETag": "etag-value",
  "partNumber": 1
}
```

#### Complete Upload

```http
POST /files/complete-upload
Content-Type: application/json
```

**Request Body:**

```json
{
  "objectName": "object-key-for-minio",
  "uploadId": "unique-upload-id",
  "documentId": 1,
  "parts": [
    {
      "ETag": "etag-value-1",
      "partNumber": 1
    },
    {
      "ETag": "etag-value-2",
      "partNumber": 2
    }
  ]
}
```

**Response:**

```json
{
  "id": 1,
  "name": "document.pdf",
  "path": "/minio/path/to/file",
  "documentId": 1
}
```

---

## Resumable Upload Workflow

1. **Start Upload** : Call `/files/start-upload` with file name and document ID to get upload ID and object key
2. **Upload Chunks** : Split file into chunks and upload each using `/files/upload` with part numbers
3. **Complete Upload** : Call `/files/complete-upload` with all ETags and part numbers to finalize the file

**Example Upload Process:**

```bash
# 1. Start upload
curl -X POST http://localhost:3000/files/start-upload \
  -H "Content-Type: application/json" \
  -d '{"fileName": "document.pdf", "documentId": 1}'

# 2. Upload chunks (repeat for each chunk)
curl -X POST http://localhost:3000/files/upload \
  -F "file=@chunk1.part" \
  -F "objectName=returned-object-key" \
  -F "uploadId=returned-upload-id" \
  -F "partNumber=1"

# 3. Complete upload
curl -X POST http://localhost:3000/files/complete-upload \
  -H "Content-Type: application/json" \
  -d '{"objectName": "object-key", "uploadId": "upload-id", "documentId": 1, "parts": [{"ETag": "etag1", "partNumber": 1}]}'
```
