# Resumable file uploader

This backend service manages **cases**, where each case contains **logs**, and each log acts as a folder holding **uploaded files**.
It supports **resumable file uploads** to handle unreliable network conditions and pause resume features.

---

## Features

- Create and get cases
- each case got documents related to it
- each document can handle multiple files inside it
- Persistent storage using minio and S3 SDK
- handling resumable file upload

---

## Tech Stack

- **Language / Framework:** Typescript/NestJS
- **Database:** MySQL(via Prisma)
- **Other:** Docker, Minio(via S3)

---

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL running locally
- minio runninig via Docker

```bash
git clone https://github.com/Ahmedsam199/Resumable_Uploader.git
cd your-repo
npm install
```

---

## How To Use The App

you can use the frontend part that related to this project with the link

you shuold have a minio bucked called resumable that you should create from the minio dashboard

```bash
`git clone https://github.com/Ahmedsam199/Resumable_Uploader.git
cd your-repo
npm install`
```

or use the seed for fast setup

## Multipart Upload Workflow

The backend supports **resumable multipart uploads** to handle large files and poor network conditions.
All uploaded files are stored in **MinIO** and linked to **documents/logs** in **MySQL**.

The upload process involves **three main API calls**:

### 1. `startMultipart` (Initialize Upload)

The user will start upload process to initalize a new file

**Endpoint:** `POST /files/start-upload`

**Request:**

```json
{
  "filename": "evidence_video.mp4",
  "uploadId": 104857600
}
```

### 2. Upload Part (Upload chunks)

The user will upload a chunks and will recive an ETage and the part number

**Endpoint:**`POST /files/start-upload`

```
{
  "ETag": "a number tag",
  "PartNumber": 3
}

```

### 3. Complete the upload (Combine file)

The user will give the parts that he recives then it will combine it and store it inside the minio S3 Bucket and save file info and path inside the DB

**Endpoint:**`POST /files/complete-upload`
