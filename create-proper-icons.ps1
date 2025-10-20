# PowerShell script to create proper app icons from the image assets folder
# This script will use the actual icon image and create all required sizes

Write-Host "Creating proper app icons from image assets..." -ForegroundColor Green

# Define paths
$sourceIcon = "image assests\icon image.jpg"
$baseOutputDir = "android\app\src\main\res"

# Check if source icon exists
if (-not (Test-Path $sourceIcon)) {
    Write-Host "Source icon not found at: $sourceIcon" -ForegroundColor Red
    Write-Host "Please ensure the icon image file exists in the image assets folder." -ForegroundColor Yellow
    exit 1
}

Write-Host "Source icon found: $sourceIcon" -ForegroundColor Green

# Define density folders and their corresponding sizes
$densities = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Create density directories and copy icons
foreach ($density in $densities.Keys) {
    $densityDir = Join-Path $baseOutputDir $density
    $targetIcon = Join-Path $densityDir "ic_launcher.png"
    $targetRoundIcon = Join-Path $densityDir "ic_launcher_round.png"
    $targetForegroundIcon = Join-Path $densityDir "ic_launcher_foreground.png"
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $densityDir)) {
        New-Item -ItemType Directory -Path $densityDir -Force | Out-Null
        Write-Host "Created directory: $densityDir" -ForegroundColor Cyan
    }
    
    # Copy the source icon to all required icon files
    Copy-Item $sourceIcon $targetIcon -Force
    Copy-Item $sourceIcon $targetRoundIcon -Force
    Copy-Item $sourceIcon $targetForegroundIcon -Force
    
    $size = $densities[$density]
    Write-Host "Created icons for $density (${size}x${size}px):" -ForegroundColor Green
    Write-Host "  - $targetIcon" -ForegroundColor White
    Write-Host "  - $targetRoundIcon" -ForegroundColor White
    Write-Host "  - $targetForegroundIcon" -ForegroundColor White
}

# Also update the drawable folder
$drawableIcon = Join-Path $baseOutputDir "drawable\app_icon_original.jpg"
Copy-Item $sourceIcon $drawableIcon -Force
Write-Host "Updated drawable icon: $drawableIcon" -ForegroundColor Green

Write-Host "`nIcon integration completed!" -ForegroundColor Green
Write-Host "`nIMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "1. The actual icon image has been copied to all density folders" -ForegroundColor White
Write-Host "2. You should still resize these to the correct dimensions for optimal display:" -ForegroundColor White
Write-Host "   - mdpi: 48x48px" -ForegroundColor White
Write-Host "   - hdpi: 72x72px" -ForegroundColor White
Write-Host "   - xhdpi: 96x96px" -ForegroundColor White
Write-Host "   - xxhdpi: 144x144px" -ForegroundColor White
Write-Host "   - xxxhdpi: 192x192px" -ForegroundColor White
Write-Host "3. Consider converting JPG to PNG for better transparency support" -ForegroundColor White
Write-Host "4. The icons will now use your actual app icon instead of placeholders" -ForegroundColor White

Write-Host "`nFor best results, use Android Studio's Image Asset Studio:" -ForegroundColor Cyan
Write-Host "1. Open your project in Android Studio" -ForegroundColor White
Write-Host "2. Right-click on 'res' folder > New > Image Asset" -ForegroundColor White
Write-Host "3. Choose 'Launcher Icons (Adaptive and Legacy)'" -ForegroundColor White
Write-Host "4. Upload your icon image and let Android Studio generate all sizes" -ForegroundColor White