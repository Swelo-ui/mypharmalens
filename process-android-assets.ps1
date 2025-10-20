# PowerShell script to process and copy image assets for Android
Write-Host "Processing Android image assets..." -ForegroundColor Green

# Define source and destination paths
$sourceDir = "image assests"
$androidResDir = "android\app\src\main\res"

# Check if source directory exists
if (-not (Test-Path $sourceDir)) {
    Write-Host "Error: Source directory '$sourceDir' not found!" -ForegroundColor Red
    exit 1
}

# Check if Android res directory exists
if (-not (Test-Path $androidResDir)) {
    Write-Host "Error: Android res directory '$androidResDir' not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Source directory: $sourceDir" -ForegroundColor Yellow
Write-Host "Android res directory: $androidResDir" -ForegroundColor Yellow

# Process splash screen
$splashSource = Join-Path $sourceDir "splash screen.png"
if (Test-Path $splashSource) {
    Write-Host "Processing splash screen..." -ForegroundColor Cyan
    
    # Copy splash screen to all drawable directories
    $drawableDirs = @(
        "drawable",
        "drawable-land-hdpi", "drawable-land-mdpi", "drawable-land-xhdpi", "drawable-land-xxhdpi", "drawable-land-xxxhdpi",
        "drawable-port-hdpi", "drawable-port-mdpi", "drawable-port-xhdpi", "drawable-port-xxhdpi", "drawable-port-xxxhdpi"
    )
    
    foreach ($dir in $drawableDirs) {
        $destDir = Join-Path $androidResDir $dir
        if (Test-Path $destDir) {
            $destFile = Join-Path $destDir "splash.png"
            Copy-Item $splashSource $destFile -Force
            Write-Host "  Copied to $dir/splash.png" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "Warning: splash screen.png not found in source directory" -ForegroundColor Yellow
}

# Process app icon
$iconSource = Join-Path $sourceDir "icon image.jpg"
if (Test-Path $iconSource) {
    Write-Host "Processing app icon..." -ForegroundColor Cyan
    Write-Host "Note: You may need to convert JPG to PNG and resize for different densities" -ForegroundColor Yellow
    
    # For now, copy to one location as a reference
    # In production, you'd want to create multiple sizes and convert to PNG
    $iconDest = Join-Path $androidResDir "drawable\app_icon_original.jpg"
    Copy-Item $iconSource $iconDest -Force
    Write-Host "  Copied original icon to drawable/app_icon_original.jpg" -ForegroundColor Gray
    Write-Host "  Manual step needed: Convert to PNG and create multiple sizes for mipmap directories" -ForegroundColor Yellow
} else {
    Write-Host "Warning: icon image.jpg not found in source directory" -ForegroundColor Yellow
}

# Process notification icon
$notificationSource = Join-Path $sourceDir "notification icon.png"
if (Test-Path $notificationSource) {
    Write-Host "Processing notification icon..." -ForegroundColor Cyan
    
    $notificationDest = Join-Path $androidResDir "drawable\ic_notification.png"
    Copy-Item $notificationSource $notificationDest -Force
    Write-Host "  Copied to drawable/ic_notification.png" -ForegroundColor Gray
} else {
    Write-Host "Warning: notification icon.png not found in source directory" -ForegroundColor Yellow
}

Write-Host "Asset processing completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Convert icon image.jpg to PNG format" -ForegroundColor White
Write-Host "2. Create multiple icon sizes for different densities (48x48, 72x72, 96x96, 144x144, 192x192)" -ForegroundColor White
Write-Host "3. Update AndroidManifest.xml if needed" -ForegroundColor White
Write-Host "4. Test the app to ensure assets display correctly" -ForegroundColor White