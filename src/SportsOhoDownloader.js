const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');

/**
 * SportsOho Photo Downloader
 * A tool for downloading photo albums from sportsoho.com
 */
class SportsOhoDownloader {
    /**
     * Initialize downloader
     * @param {string} downloadDir - Download directory
     */
    constructor(downloadDir = 'downloads') {
        this.downloadDir = downloadDir;
        this.downloadedPhotos = new Set();
        this.albumFolder = null; // Will be set when processing album
        this.logFilePath = null; // Will be set when processing album
        this.currentPageNumber = 0; // Track current page number

        // Setup axios default configuration
        this.axiosInstance = axios.create({
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            timeout: 30000, // 30 seconds timeout
        });

        // Ensure download directory exists
        this.ensureDirectoryExists();
    }

    /**
     * Ensure download directory exists
     */
    async ensureDirectoryExists() {
        try {
            await fs.ensureDir(this.downloadDir);
        } catch (error) {
            console.error(`Failed to create directory: ${error.message}`);
            throw error;
        }
    }

    /**
     * Extract album ID from URL
     * @param {string} url - Album URL
     * @returns {string} Album ID or 'unknown'
     */
    extractAlbumId(url) {
        try {
            // Match pattern: /album/[number]/? or /album/[number]
            const match = url.match(/\/album\/(\d+)\/?/);
            return match ? match[1] : 'unknown';
        } catch (error) {
            console.error('Error extracting album ID:', error.message);
            return 'unknown';
        }
    }

    /**
     * Extract album title from page content
     * @param {object} $ - Cheerio object with page content
     * @returns {string} Album title or 'untitled'
     */
    extractAlbumTitle($) {
        try {
            // Try to find title in content_area_user_title or similar elements
            let title = $('.content_area_user_title').text().trim();

            if (!title) {
                title = $('h1').first().text().trim();
            }

            if (!title) {
                title = $('title').text().trim();
            }

            // Clean up title for folder name
            if (title) {
                title = title.replace(/[<>:"/\\|?*]/g, '-').trim();
                return title || 'untitled';
            }

            return 'untitled';
        } catch (error) {
            console.error('Error extracting album title:', error.message);
            return 'untitled';
        }
    }

    /**
     * Create album folder and return the path
     * @param {string} albumUrl - Album URL
     * @param {cheerio.CheerioAPI} $ - Cheerio parsing object for title extraction
     * @returns {Promise<string>} Album folder path
     */
    async createAlbumFolder(albumUrl, $) {
        const albumId = this.extractAlbumId(albumUrl);
        const albumTitle = this.extractAlbumTitle($);
        const folderName = `${albumId}-${albumTitle}`;

        this.albumFolder = path.join(this.downloadDir, folderName);

        try {
            await fs.ensureDir(this.albumFolder);
            console.log(`Created album folder: ${folderName}`);

            // Initialize CSV log file
            this.logFilePath = path.join(this.albumFolder, `${folderName}.csv`);
            await this.initializeLogFile();

            return this.albumFolder;
        } catch (error) {
            console.error(`Failed to create album folder: ${error.message}`);
            throw error;
        }
    }

    /**
     * Load downloaded photos from existing CSV log file
     * @returns {Promise<void>}
     */
    async loadDownloadedPhotosFromLog() {
        try {
            if (!this.logFilePath || !(await fs.pathExists(this.logFilePath))) {
                console.log('No existing log file found, starting fresh download');
                return;
            }

            const logContent = await fs.readFile(this.logFilePath, 'utf8');
            const lines = logContent.split('\n');

            // Skip header line and empty lines
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const [_pageNumber, photoUrl, downloaded] = line.split(',');

                // Only add to downloaded set if download was successful
                if (downloaded === 'Y' && photoUrl) {
                    this.downloadedPhotos.add(photoUrl);
                }
            }

            console.log(
                `Loaded ${this.downloadedPhotos.size} previously downloaded photos from log`
            );
        } catch (error) {
            console.error(`Failed to load download log: ${error.message}`);
            // Don't throw error, continue with fresh download
        }
    }

    /**
     * Initialize CSV log file with headers
     * @returns {Promise<void>}
     */
    async initializeLogFile() {
        try {
            // Check if log file already exists
            if (await fs.pathExists(this.logFilePath)) {
                console.log(`Log file already exists: ${path.basename(this.logFilePath)}`);
                // Load previously downloaded photos from log
                await this.loadDownloadedPhotosFromLog();
                return;
            }

            // Create CSV header
            const csvHeader = 'Page,URL,Downloaded\n';
            await fs.writeFile(this.logFilePath, csvHeader, 'utf8');
            console.log(`Created log file: ${path.basename(this.logFilePath)}`);
        } catch (error) {
            console.error(`Failed to initialize log file: ${error.message}`);
            throw error;
        }
    }

    /**
     * Log photo download attempt to CSV file
     * @param {number} pageNumber - Page number
     * @param {string} photoUrl - Photo URL
     * @param {boolean} success - Whether download was successful
     * @returns {Promise<void>}
     */
    async logPhotoDownload(pageNumber, photoUrl, success) {
        try {
            if (!this.logFilePath) {
                console.warn('Log file not initialized, skipping log entry');
                return;
            }

            const successFlag = success ? 'Y' : 'N';
            const csvLine = `${pageNumber},${photoUrl},${successFlag}\n`;

            // Append to log file
            await fs.appendFile(this.logFilePath, csvLine, 'utf8');
        } catch (error) {
            console.error(`Failed to write to log file: ${error.message}`);
            // Don't throw error to avoid interrupting download process
        }
    }

    /**
     * Get web page content
     * @param {string} url - Web page URL
     * @returns {Promise<cheerio.CheerioAPI|null>} Cheerio parsing object
     */
    async getPageContent(url) {
        try {
            console.log(`Fetching page: ${url}`);
            const response = await this.axiosInstance.get(url);
            return cheerio.load(response.data);
        } catch (error) {
            console.error(`Failed to fetch page ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * Extract photo URLs from page
     * @param {cheerio.CheerioAPI} $ - Cheerio parsing object
     * @param {string} baseUrl - Base URL for relative path conversion
     * @returns {string[]} Photo URL list
     */
    extractPhotoUrls($, baseUrl) {
        const photoUrls = [];

        // Find portfolio container - more flexible matching conditions
        let portfolioDiv = $('#portfolio');

        // If id="portfolio" not found, try to find div with class containing portfolio
        if (portfolioDiv.length === 0) {
            portfolioDiv = $('div').filter(function () {
                const classes = $(this).attr('class');
                return (
                    classes && classes.includes('portfolio') && classes.includes('grid-container')
                );
            });
        }

        if (portfolioDiv.length === 0) {
            console.log('Portfolio container not found');
            return photoUrls;
        }

        console.log(
            `Found portfolio container: class=${portfolioDiv.attr('class')}, id=${portfolioDiv.attr('id')}`
        );

        // Find all images in portfolio container - including direct img tags and images in portfolio-image divs
        let images = portfolioDiv.find('img');

        // If no images found in main container, try to find in portfolio-image divs
        if (images.length === 0) {
            const portfolioImageDivs = portfolioDiv.find('div').filter(function () {
                const classes = $(this).attr('class');
                return classes && classes.includes('portfolio-image');
            });
            console.log(
                `Searching in portfolio-image divs, found ${portfolioImageDivs.length} containers`
            );
            images = portfolioImageDivs.find('img');
        }

        console.log(`Total found ${images.length} img tags`);

        images.each((index, element) => {
            const $img = $(element);
            // Get image source URL
            let src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-original');

            if (src) {
                // Skip irrelevant images (like logos, advertisements, etc.)
                const skipWords = ['logo', 'advertisement', 'banner', 'icon'];
                if (skipWords.some(word => src.toLowerCase().includes(word))) {
                    return; // continue
                }

                // Use regex to replace /medium/ with /original/ in URL to get original size photos
                src = src.replace(/\/medium\//g, '/original/');

                // Convert to absolute URL
                const fullUrl = new URL(src, baseUrl).href;
                if (!this.downloadedPhotos.has(fullUrl)) {
                    photoUrls.push(fullUrl);
                    console.log(`Found photo (original size): ${fullUrl}`);
                }
            }
        });

        console.log(`Found ${photoUrls.length} new photos on this page`);
        return photoUrls;
    }

    /**
     * Get pagination URLs
     * @param {cheerio.CheerioAPI} $ - Cheerio parsing object
     * @param {string} baseUrl - Base URL for relative path conversion
     * @returns {string[]} Pagination URL list
     */
    getPaginationUrls($, baseUrl) {
        const paginationUrls = [];

        // Find pagination container
        const paginationDiv = $('.pagination');

        if (paginationDiv.length === 0) {
            console.log('Pagination not found');
            return paginationUrls;
        }

        // Find all links in pagination container
        const links = paginationDiv.find('a[href]');

        links.each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                // Convert to absolute URL
                const fullUrl = new URL(href, baseUrl).href;
                paginationUrls.push(fullUrl);
            }
        });

        // Remove duplicates
        const uniquePaginationUrls = [...new Set(paginationUrls)];
        console.log(`Found ${uniquePaginationUrls.length} pagination links`);

        return uniquePaginationUrls;
    }

    /**
     * Download single photo
     * @param {string} photoUrl - Photo URL
     * @returns {Promise<boolean>} Whether download was successful
     */
    async downloadPhoto(photoUrl) {
        let downloadSuccess = false;

        try {
            // Check if photo was already downloaded according to CSV log
            if (this.downloadedPhotos.has(photoUrl)) {
                console.log(`Photo already downloaded according to log, skipping: ${photoUrl}`);
                downloadSuccess = true;

                // Log successful skip (don't duplicate in CSV)
                return true;
            }

            // Parse filename
            const urlObj = new URL(photoUrl);
            let filename = path.basename(urlObj.pathname);

            // If no file extension, try to infer from Content-Type
            if (!filename || !filename.includes('.')) {
                try {
                    const headResponse = await this.axiosInstance.head(photoUrl);
                    const contentType = headResponse.headers['content-type'] || '';
                    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
                        filename = `image_${this.downloadedPhotos.size}.jpg`;
                    } else if (contentType.includes('png')) {
                        filename = `image_${this.downloadedPhotos.size}.png`;
                    } else {
                        filename = `image_${this.downloadedPhotos.size}.jpg`;
                    }
                } catch {
                    filename = `image_${this.downloadedPhotos.size}.jpg`;
                }
            }

            // Use album folder instead of base download directory
            const downloadPath = this.albumFolder || this.downloadDir;
            const filepath = path.join(downloadPath, filename);

            // Download photo (no longer check if file exists on disk)
            console.log(`Downloading: ${filename}`);
            const response = await this.axiosInstance.get(photoUrl, {
                responseType: 'stream',
            });

            // Write file
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    this.downloadedPhotos.add(photoUrl);
                    console.log(`Download completed: ${filename}`);
                    downloadSuccess = true;

                    // Log successful download
                    this.logPhotoDownload(this.currentPageNumber, photoUrl, downloadSuccess)
                        .then(() => resolve(true))
                        .catch(() => resolve(true)); // Don't fail download due to log error
                });
                writer.on('error', error => {
                    downloadSuccess = false;

                    // Log failed download
                    this.logPhotoDownload(this.currentPageNumber, photoUrl, downloadSuccess)
                        .then(() => reject(error))
                        .catch(() => reject(error)); // Don't fail download due to log error
                });
            });
        } catch (error) {
            console.error(`Download failed ${photoUrl}: ${error.message}`);
            downloadSuccess = false;

            // Log failed download
            await this.logPhotoDownload(this.currentPageNumber, photoUrl, downloadSuccess);
            return false;
        }
    }

    /**
     * Process entire album
     * @param {string} albumUrl - Album URL
     */
    async processAlbum(albumUrl) {
        console.log(`Starting to process album: ${albumUrl}`);

        // Track processed pages to avoid infinite loops
        const processedPages = new Set();
        const pagesToProcess = [albumUrl];
        let isFirstPage = true;

        while (pagesToProcess.length > 0) {
            const currentUrl = pagesToProcess.shift();

            // Skip already processed pages
            if (processedPages.has(currentUrl)) {
                continue;
            }

            processedPages.add(currentUrl);

            // Update current page number (first page is 1, then increment for each new page)
            if (isFirstPage) {
                this.currentPageNumber = 1;
            } else {
                this.currentPageNumber++;
            }

            console.log(`Processing page ${this.currentPageNumber}: ${currentUrl}`);

            // Get page content
            const $ = await this.getPageContent(currentUrl);
            if (!$) {
                continue;
            }

            // Create album folder on first page only
            if (isFirstPage) {
                await this.createAlbumFolder(currentUrl, $);
                isFirstPage = false;
            }

            // Extract photo URLs
            const photoUrls = this.extractPhotoUrls($, currentUrl);

            // Download photos
            let successCount = 0;
            for (const photoUrl of photoUrls) {
                if (await this.downloadPhoto(photoUrl)) {
                    successCount++;
                }
                // Add small delay to avoid too fast requests
                await this.sleep(500);
            }

            console.log(
                `Page ${this.currentPageNumber} (${currentUrl}) successfully downloaded ${successCount}/${photoUrls.length} photos`
            );

            // Get pagination URLs
            const paginationUrls = this.getPaginationUrls($, currentUrl);

            // Add new pagination URLs to processing list
            for (const paginationUrl of paginationUrls) {
                if (!processedPages.has(paginationUrl)) {
                    pagesToProcess.push(paginationUrl);
                }
            }

            // Add delay to avoid too fast requests
            await this.sleep(1000);
        }

        console.log(
            `Album processing completed! Total downloaded ${this.downloadedPhotos.size} photos`
        );
        console.log(
            `Download log saved to: ${this.logFilePath ? path.basename(this.logFilePath) : 'N/A'}`
        );
    }

    /**
     * Sleep function
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => global.setTimeout(resolve, ms));
    }
}

module.exports = SportsOhoDownloader;
