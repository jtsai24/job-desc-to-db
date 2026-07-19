# Job Description to Notion

This repository preserves small, runnable milestones showing how the browser
extension evolved. Each folder is a stable starting point for learning,
testing, or debugging one part of the workflow.

## Milestone index

### 01 — `hello_world`

Basic browser-extension example using a popup. Reads simple information from
the active webpage.

### 02 — `sidebar_notion_conn_validator`

Firefox sidebar that accepts a Notion token, stores it with
`browser.storage.local`, and validates access to the Job Application database.

### 03 — `application_fields_preview`

Extracts and previews application database fields, including job title,
company, URL, source, and capture method. Includes the LinkedIn-specific
company-name fallback.

### 04 — `job_capture_review`

Extends application-field extraction with full job-description capture.
Supports:

- Schema.org `JobPosting.description`
- LinkedIn's `About the job` content

### 05 — `job_capture_notion_write`

Current development milestone. Begins as a copy of `job_capture_review` and
will add creation of the Notion application record and its Job Description
subpage.

## Running a milestone in Firefox

1. Open `about:debugging`.
2. Select **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select the desired folder's `manifest.json`.

These milestone numbers describe development order. The folders retain
descriptive names so existing paths do not need to change.
