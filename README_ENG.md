# Google Drive Automated Backup

A lightweight, robust Node.js application designed to automatically compress a local directory, upload the `.zip` archive to Google Drive, and clean up backups older than 30 days.

## Features

- **Local Compression**: Uses `archiver` (v8) with maximum compression (`ZipArchive`) to package your target directory.
- **Google Drive Integration**: Automatically authenticates via OAuth2 and uploads the resulting backup.
- **Automated Cleanup**: Queries Google Drive for backups matching your naming convention and deletes those older than 30 days.
- **Environment-Driven Configuration**: Easily configure local paths and prefixes using a `.env` file.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- A Google Cloud account with access to the Google Drive API.

---

## Setup Instructions

### 1. Project Setup
Ensure all project files (`backup_drive.js`, `package.json`) are in your working directory, and that your `package.json` includes `"type": "module"` for ES Modules support.

### 2. Install Dependencies
Run the following command in your project root to install the required packages (`googleapis`, `archiver`, and `dotenv`):

```bash
npm install
```

### 3. Configure Google Drive Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one) and enable the **Google Drive API**.
3. Go to **APIs & Services > Credentials** and click **Create Credentials > OAuth client ID**.
4. Select **Desktop application** as the application type.
5. Download the JSON credentials file, rename it to `credentials.json`, and place it in the root folder of your project.

### 4. Create your `.env` file
Create a file named `.env` in the root directory of your project and configure your local path and backup prefix:

```env
BACKUP_ROUTE=./mi_carpeta_a_respaldar
BACKUP_PREFIX=backup_
```

---

## Usage

Run the script using Node.js:

```bash
node backup_drive.js
```

### First-Time Authentication:
1. The first time you run the script, it may prompt you to authorize the application or provide a URL in your console.
2. Open the URL in your web browser, log in with your Google account, and grant permissions.
3. Once authorized, the script will generate a `token.json` file automatically, meaning you won't need to authenticate again for subsequent runs.