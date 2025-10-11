# Notification Audio Files

This directory contains audio files for PharmaLens notification sounds.

## Required Files:

1. `drug identification.mp3` - Played when drug identification is complete
2. `darkandlight mode chang.mp3` - Played when theme is switched
3. `opening sound of pharmalens.mp3` - Played when app is accessed

## File Requirements:

- Format: MP3
- Duration: 1-3 seconds recommended
- Size: Keep under 100KB for optimal loading
- Quality: 44.1kHz, 128kbps recommended

## Deployment Notes:

These files must be included in the build process and deployed to the production server for audio notifications to work properly.

## Current Status:

⚠️ **Missing Audio Files**: The audio files are currently missing, which is why notifications don't work on deployment.

To fix this issue:
1. Add the required MP3 files to this directory
2. Ensure they are included in the build process
3. Verify they are accessible at `/notifications/[filename].mp3` on the deployed site