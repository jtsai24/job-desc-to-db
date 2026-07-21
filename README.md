# Job Description to Notion

A Firefox sidebar extension for extracting a job listing, reviewing the
captured fields, checking for possible duplicates, and saving the application
to Notion.

The current extension is in [`job_capture_notion_write`](job_capture_notion_write).
The other folders preserve earlier, runnable development milestones.

## What the extension does

The extension uses an explicit two-step workflow:

1. **Extract and review** reads the active job page and displays the proposed
   Notion fields and job description.
2. **Save to Notion** writes the reviewed snapshot only after you click the
   separate save button.

Extraction does not create a Notion record. This makes it safe to try the
extractor on unfamiliar pages and inspect imperfect results before deciding
whether to save them.

## Features

- Extracts job title, company, URL, and job description.
- Prefers Schema.org `JobPosting` structured data when a page provides it.
- Includes LinkedIn-specific fallbacks for company and description capture.
- Converts LinkedIn tracking URLs into stable URLs based on the job ID.
- Previews every captured application field before saving.
- Checks Notion for possible duplicates during the review step.
- Uses color-coded duplicate warnings without blocking an intentional save.
- Invalidates a review when you switch tabs or the extracted tab changes URL.
- Creates both the Notion application record and its **Job Description**
  subpage.

## Duplicate warnings

Duplicate checking is advisory. A warning never disables **Save to Notion**.

### Light red — matching URL

The cleaned job URL matches an existing Notion record. For LinkedIn, the job
ID is the stable identity, so older URLs containing tracking parameters can
still match a newly cleaned URL.

> Duplicate found: URL matches an existing job.

### Yellow — matching company and title

The company and job title exactly match an existing record, but the URL does
not match.

> Possible duplicate: company and job title match an existing job.

Company and title matching is currently exact. For example, `Scribd` and
`Scribd, Inc.` are treated as different company names. URL matching is
independent so the same LinkedIn job can still be detected when its visible
company or title changes.

## How to use it

1. Open a supported job listing in Firefox.
2. Open the **Application Fields Preview** sidebar.
3. Click **Extract and review**.
4. Inspect the job title, company, cleaned URL, description, and other proposed
   Notion fields.
5. Review any duplicate warning.
6. If the preview is correct, click **Save to Notion**.
7. Follow the displayed Notion link to inspect the created record.

If you change tabs or navigate to another URL after extraction, the extension
clears the reviewed snapshot and disables saving. Click **Extract and review**
again on the page you intend to save.

## Loading the current extension in Firefox

1. Open `about:debugging`.
2. Select **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select `job_capture_notion_write/manifest.json`.
5. Open the Firefox sidebar and select **Application Fields Preview**.

Temporary extensions must be loaded again after restarting Firefox.

## Notion requirements

The current milestone expects:

- A Notion integration with access to the Job Application data source.
- A Notion integration token stored in extension-local storage under the key
  `notionToken`.
- The Job Application data source ID configured in `notion-client.js` and
  `check-duplicate.js`.
- Database properties matching the names used by the code, including
  `Job Title`, `Company`, `URL`, `Date first seen`, `source`, `job type`,
  `status`, `Capture Method`, and `sort id`.

The current extension does not yet provide a token-entry screen. The
`sidebar_notion_conn_validator` folder demonstrates saving and testing a
token, but it is a separate milestone; browser extension storage should not be
assumed to transfer between different extension identities.

Treat the Notion token as a secret. Do not commit it to this repository.

## Capture behavior

### Application fields

The application-field extractor uses this order:

1. Schema.org `JobPosting` structured data.
2. LinkedIn-specific company extraction.
3. Generic page-title and heading fallbacks.

New records currently default to:

- Job type: `full time`
- Status: `prepare to apply`
- Date first seen: the local current date

### Job description

The description extractor supports:

- Schema.org `JobPosting.description`
- LinkedIn's visible **About the job** section

The captured description is saved as a child page named **Job Description**.

## Safety behavior

- **Extract and review** does not write to Notion.
- **Save to Notion** stays disabled until extraction and duplicate checking
  finish.
- Duplicate warnings do not prevent saving.
- Repeated save clicks are prevented while a write is in progress.
- Switching tabs invalidates the review.
- Navigating the extracted tab to another URL invalidates the review.
- A failed duplicate lookup displays a warning but does not prevent saving.

## Known limitations

- The Notion data source ID and property names are specific to the current
  project configuration.
- Token setup is not part of the current sidebar UI.
- Company and title duplicate matching requires exact text.
- Job-description similarity is not used for duplicate detection.
- LinkedIn URL cleanup handles numeric `/jobs/view/{jobId}` URLs. Other sites'
  URLs are preserved because query parameters may contain their job IDs.
- Generic extraction quality depends on the structure of the job page.
- Saving the application and saving its description are separate Notion
  requests. A failure during the second request can leave an application record
  without its description subpage.

## Repository milestones

Each folder is a stable starting point for learning, testing, or debugging one
part of the workflow.

### 01 — `hello_world`

Basic browser-extension popup that reads simple information from the active
webpage.

### 02 — `sidebar_notion_conn_validator`

Firefox sidebar prototype that accepts a Notion token, stores it with
`browser.storage.local`, and validates access to the Job Application data
source.

### 03 — `application_fields_preview`

Extracts and previews application fields, including job title, company, URL,
source, and capture method.

### 04 — `job_capture_review`

Adds full job-description extraction using Schema.org and LinkedIn-specific
rules.

### 05 — `job_capture_notion_write`

The current milestone. Adds the two-step review/save workflow, Notion writes,
LinkedIn URL cleanup, navigation safeguards, and duplicate warnings.
