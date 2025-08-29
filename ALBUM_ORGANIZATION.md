# Album Folder Organization Feature

## Overview

The SportsOho Photo Downloader now automatically creates organized folders for each album based on the album ID and title extracted from the webpage.

## Folder Naming Convention

The program creates folders using the format: `{albumId}-{title}`

### Examples:
- URL: `https://www.sportsoho.com/pg/photos/album/11083369/`
- Album ID: `11083369`
- Title: `Swimming Competition` (extracted from page)
- Folder: `11083369-Swimming_Competition`

## How It Works

1. **URL Analysis**: Extracts album ID from the URL using regex pattern `/album/(\d+)/?/`
2. **Title Extraction**: Searches for page title in these elements (in order):
   - `.content_area_user_title`
   - `h1` (first occurrence)
   - `title` element
3. **Folder Creation**: Combines ID and cleaned title to create folder name
4. **Download Organization**: All photos from the album are saved in this dedicated folder

## Technical Implementation

### Key Methods:

- `extractAlbumId(url)`: Extracts numeric album ID from URL
- `extractAlbumTitle($)`: Extracts and cleans album title from page content
- `createAlbumFolder(albumUrl, $)`: Creates the organized folder structure

### Title Cleaning:

The title is automatically cleaned for file system compatibility:
- Removes invalid characters: `<>:"/\\|?*`
- Replaces them with safe characters (usually `-`)
- Handles empty or missing titles with fallback to `'untitled'`

## Usage Examples

```bash
# Basic usage - creates organized album folder
sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/
# Result: downloads/11083369-Swimming_Competition/

# Custom base directory - album folder created inside
sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/ -d my_sports_photos
# Result: my_sports_photos/11083369-Swimming_Competition/
```

## Benefits

1. **Organization**: Each album gets its own clearly labeled folder
2. **Identification**: Easy to identify albums by both ID and descriptive name
3. **Avoiding Conflicts**: Different albums never mix their photos
4. **File Management**: Easier to manage large collections of sports albums

This feature maintains backward compatibility while adding powerful organization capabilities for better photo collection management.