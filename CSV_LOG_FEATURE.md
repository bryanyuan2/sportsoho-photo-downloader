# CSV Download Log Feature

## Overview

The SportsOho Photo Downloader now includes comprehensive CSV logging functionality that tracks every photo download attempt across all pages of an album.

## Key Features

### 📊 Progress Tracking
- Records each photo's download status (success/failure)
- Tracks page numbers for organized multi-page albums
- Provides detailed view of download progress

### 🔄 Resume Capability
- Logs allow easy identification of what's been downloaded
- Perfect for resuming interrupted downloads
- No guesswork about download progress

### 🐛 Debugging Support
- Identifies failed downloads for manual retry
- Helps troubleshoot network or server issues
- Provides audit trail for download sessions

## CSV Format

Each log entry contains exactly three fields:

| Field | Description | Example |
|-------|-------------|----------|
| `Page` | Sequential page number (1, 2, 3...) | `1` |
| `URL` | Full photo URL | `https://www.sportsoho.com/pg/photos/medium/photo1.jpg` |
| `Downloaded` | Success flag (Y/N) | `Y` |

## Implementation Details

### File Location
```
album-folder/
├── photo1.jpg
├── photo2.jpg
├── ...
└── {albumId}-{title}.csv  ← Same name as folder
```

### Page Numbering
- **Page 1**: The initial given URL
- **Page 2+**: Each subsequent pagination page discovered
- **Sequential**: Pages are numbered in order of processing

### Download Status
- **Y**: Photo successfully downloaded
- **N**: Photo download failed (network error, file error, etc.)
- **Y (skip)**: Photo already existed and was skipped (also counted as success)

## Example Usage Scenario

### Initial Download
```bash
sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/
```

**Generated Log (`11083369-Swimming_Competition.csv`):**
```csv
Page,URL,Downloaded
1,https://www.sportsoho.com/pg/photos/medium/photo1.jpg,Y
1,https://www.sportsoho.com/pg/photos/medium/photo2.jpg,Y
1,https://www.sportsoho.com/pg/photos/medium/photo3.jpg,N
2,https://www.sportsoho.com/pg/photos/medium/photo4.jpg,Y
2,https://www.sportsoho.com/pg/photos/medium/photo5.jpg,Y
```

### Resume Analysis
From the log, you can see:
- **Total pages processed**: 2
- **Successful downloads**: 4 photos
- **Failed downloads**: 1 photo (photo3.jpg on page 1)
- **Next action**: Manually check or retry photo3.jpg

## Technical Implementation

### Key Methods

1. **`initializeLogFile()`**
   - Creates CSV file with headers
   - Checks for existing log files
   - Called when album folder is created

2. **`logPhotoDownload(pageNumber, photoUrl, success)`**
   - Appends CSV entry for each download attempt
   - Called after every download (success or failure)
   - Non-blocking (won't stop downloads if logging fails)

3. **Page Tracking**
   - `currentPageNumber` property tracks page sequence
   - Updated in `processAlbum()` as pages are processed
   - Starts at 1 for the given URL

### Error Handling
- Log failures don't interrupt downloads
- Missing log file won't crash the program
- Graceful degradation if filesystem issues occur

## Benefits

1. **Transparency**: See exactly what happened during download
2. **Reliability**: Resume capability for large albums
3. **Debugging**: Easy identification of problematic photos/pages
4. **Audit**: Complete record of download sessions
5. **Efficiency**: Avoid re-downloading existing content

This feature makes the downloader production-ready for large-scale album downloads with enterprise-level logging and resume capabilities.