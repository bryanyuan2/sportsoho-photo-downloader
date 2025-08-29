# SportsOho Photo Downloader (Node.js)

A Node.js tool for downloading photo albums from sportsoho.com.

## Features

- 🖼️ Parse all photos within portfolio containers on web pages
- 📄 Automatic pagination handling
- 🚫 Avoid duplicate downloads of existing photos
- 📁 Support command-line arguments to specify download directory
- 🔄 Automatically replace medium size with original size
- 📦 Can be globally installed as a command-line tool
- 🗂️ Automatic album folder organization with album ID and title
- 📊 **NEW:** CSV download log for tracking progress and resume capability

## Installation

### Global Installation (Recommended)

```bash
# Clone the repository
git clone https://github.com/bryanyuan2/sportsoho-photo-downloader.git
cd sportsoho-photo-downloader

# Install dependencies
npm install

# Install globally
npm install -g .
```

After global installation, you can use `sportsoho-downloader` command anywhere.

### Method 2: Direct installation (if published to npm)

```bash
npm install -g sportsoho-photo-downloader
```

## Usage

### If globally installed

```bash
# Basic usage
sportsoho-downloader <album-URL>

# Specify download directory
sportsoho-downloader <album-URL> -d <download-directory>
```

### If not globally installed

```bash
# Use npm run
npm run start <album-URL>

# Or execute directly
node src/index.js <album-URL>
```

## Examples

```bash
# Download to default downloads directory with album folder organization
sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/
# This creates: downloads/11083369-Swimming_Competition/
#               ├── photo1.jpg
#               ├── photo2.jpg
#               ├── ...
#               └── 11083369-Swimming_Competition.csv (download log)

# Download to specified directory with album folder organization
sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/ -d my_photos
# This creates: my_photos/11083369-Swimming_Competition/

# Use full parameter name
sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/ --download-dir ./my_album_photos
# This creates: my_album_photos/11083369-Swimming_Competition/
```

## How It Works

1. **Photo Parsing**: The program searches for `<div id="portfolio" class="portfolio grid-container">` containers on web pages
2. **Album Organization**: Automatically creates organized folders using format `{albumId}-{title}` (e.g., `11083369-Swimming Competition`)
3. **CSV Logging**: Creates a detailed download log in CSV format tracking each photo's download status
4. **Size Conversion**: Automatically replaces `/medium/` with `/original/` in URLs to get original size photos
5. **Pagination Handling**: Automatically detects `<div class="pagination">` pagination containers and traverses all pages
6. **Photo Download**: Downloads all found photos to the album-specific directory
7. **Duplicate Prevention**: Skips existing files to avoid duplicate downloads

## Download Log (CSV)

The program creates a detailed CSV log file for each album download, providing:

- **Progress Tracking**: Monitor download progress across multiple pages
- **Resume Capability**: Know exactly what was downloaded if interrupted
- **Debugging**: Identify failed downloads for manual retry

### Log Format

The CSV file contains three columns:

- `Page`: Sequential page number (starting from 1 for the given URL)
- `URL`: Full photo URL
- `Downloaded`: Y for successful download, N for failed download

### Example Log Content

```csv
Page,URL,Downloaded
1,https://www.sportsoho.com/pg/photos/medium/photo1.jpg,Y
1,https://www.sportsoho.com/pg/photos/medium/photo2.jpg,Y
1,https://www.sportsoho.com/pg/photos/medium/photo3.jpg,N
2,https://www.sportsoho.com/pg/photos/medium/photo4.jpg,Y
```

### Log File Location

The log file is saved in the album folder with the same name as the folder:

```
downloads/11083369-Swimming_Competition/
├── photo1.jpg
├── photo2.jpg
├── ...
└── 11083369-Swimming_Competition.csv  ← Download log
```

## Project Structure

```
sportsoho-photo-downloader/
├── package.json          # Project configuration and dependencies
├── README.md             # Documentation
├── bin/
│   └── sportsoho-downloader.js  # Command-line executable
├── src/
│   ├── index.js          # Main program entry
│   └── SportsOhoDownloader.js   # Core downloader class
└── downloads/            # Default download directory (auto-created)
```

## Dependencies

- `axios`: HTTP client for network requests
- `cheerio`: Server-side jQuery implementation for HTML parsing
- `commander`: Command-line interface framework
- `fs-extra`: Enhanced file system operations
- `path`: Path handling utilities
- `url`: URL handling utilities

## System Requirements

- Node.js >= 16.0.0
- npm >= 7.0.0

## Notes

- The program adds short delays between requests to avoid overloading the server
- Downloaded photos maintain their original filenames; if no filename is available, one will be auto-generated
- The program automatically creates the download directory if it doesn't exist
- Original size photos are larger files, please ensure sufficient storage space

## Error Handling

The program includes comprehensive error handling:

- Network connection errors
- File write errors
- HTML parsing errors
- User interruption (Ctrl+C)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev <URL>

# Check syntax
npm run lint  # (if configured)
```

## License

MIT License
