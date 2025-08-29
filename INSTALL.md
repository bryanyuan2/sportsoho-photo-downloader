# Quick Installation Guide

## Node.js Version SportsOho Photo Downloader

### System Requirements
- Node.js >= 16.0.0
- npm >= 7.0.0

### One-Click Installation

```bash
# 1. Enter project directory
cd sportsoho-photo-downloader

# 2. Install dependencies
npm install

# 3. Global installation (can be used as command-line tool)
npm install -g .
```

### Usage

```bash
# After global installation, can be used directly
sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/

# Or specify download directory
sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/ -d my_photos
```

### If not globally installed

```bash
# Execute directly
node src/index.js https://www.sportsoho.com/pg/photos/album/11083369/

# Or use npm script
npm run start https://www.sportsoho.com/pg/photos/album/11083369/
```

### Features
- ✅ Automatically download original size photos (original vs medium)
- ✅ Automatically handle all pagination
- ✅ Avoid duplicate downloads
- ✅ Comprehensive error handling
- ✅ Command-line interface
- ✅ Can be globally installed

### Uninstall
```bash
npm uninstall -g sportsoho-photo-downloader
```