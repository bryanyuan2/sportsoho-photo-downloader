#!/usr/bin/env node

const { Command } = require('commander');
const SportsOhoDownloader = require('./SportsOhoDownloader');

/**
 * Main function
 */
async function main() {
    const program = new Command();

    program
        .name('sportsoho-downloader')
        .description('Download photo albums from SportsOho website')
        .version('1.1.0')
        .argument('<url>', 'Album URL to download')
        .option('-d, --download-dir <dir>', 'Download directory', 'downloads')
        .addHelpText(
            'after',
            `
Examples:
  sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/
  sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/ -d my_photos
  sportsoho-downloader https://www.sportsoho.com/pg/photos/album/11083369/ --download-dir ./downloads
  
Note: The program automatically downloads original size photos (replaces medium with original in URLs)
        `
        );

    program.parse();

    const options = program.opts();
    const url = program.args[0];

    // Validate URL
    if (!url || !url.startsWith('http')) {
        console.error('Error: Please provide a valid URL');
        process.exit(1);
    }

    // Create downloader and start processing
    const downloader = new SportsOhoDownloader(options.downloadDir);

    try {
        await downloader.processAlbum(url);
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
        process.exit(1);
    }
}

// Handle unhandled exceptions
process.on('unhandledRejection', (reason, _promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle user interruption (Ctrl+C)
process.on('SIGINT', () => {
    console.log('\nDownload interrupted by user');
    process.exit(0);
});

// If running as main module or being required from bin
if (require.main === module || process.argv[1].includes('sportsoho-downloader')) {
    main().catch(error => {
        console.error('Program execution failed:', error);
        process.exit(1);
    });
}

module.exports = main;
