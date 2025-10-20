# PowerShell script to create app icons in different densities
# This script will create the required icon sizes for Android

Write-Host "Creating app icons in different densities..." -ForegroundColor Green

# Define the source icon path
$sourceIcon = "android\app\src\main\res\drawable\app_icon_original.jpg"
$baseOutputDir = "android\app\src\main\res"

# Define density folders and their corresponding sizes
$densities = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Check if source icon exists
if (-not (Test-Path $sourceIcon)) {
    Write-Host "Source icon not found at: $sourceIcon" -ForegroundColor Red
    Write-Host "Please ensure the original icon file exists." -ForegroundColor Yellow
    exit 1
}

Write-Host "Source icon found: $sourceIcon" -ForegroundColor Green

# Create density directories and copy icons
foreach ($density in $densities.Keys) {
    $densityDir = Join-Path $baseOutputDir $density
    $targetIcon = Join-Path $densityDir "ic_launcher.png"
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $densityDir)) {
        New-Item -ItemType Directory -Path $densityDir -Force | Out-Null
        Write-Host "Created directory: $densityDir" -ForegroundColor Cyan
    }
    
    # For now, copy the original icon (you'll need to resize these manually or use an image editor)
    Copy-Item $sourceIcon $targetIcon -Force
    Write-Host "Created icon for $density (${$densities[$density]}x${$densities[$density]}px): $targetIcon" -ForegroundColor Green
}

Write-Host "`nIcon creation completed!" -ForegroundColor Green
Write-Host "`nIMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "1. The icons have been copied but need to be resized to the correct dimensions:" -ForegroundColor White
Write-Host "   - mdpi: 48x48px" -ForegroundColor White
Write-Host "   - hdpi: 72x72px" -ForegroundColor White
Write-Host "   - xhdpi: 96x96px" -ForegroundColor White
Write-Host "   - xxhdpi: 144x144px" -ForegroundColor White
Write-Host "   - xxxhdpi: 192x192px" -ForegroundColor White
Write-Host "2. Convert JPG to PNG format for better transparency support" -ForegroundColor White
Write-Host "3. Use an image editor like GIMP, Photoshop, or online tools to resize" -ForegroundColor White
Write-Host "4. Ensure icons have rounded corners and follow Material Design guidelines" -ForegroundColor White

Write-Host "`nAlternatively, you can use Android Studio's Image Asset Studio:" -ForegroundColor Cyan
Write-Host "1. Open your project in Android Studio" -ForegroundColor White
Write-Host "2. Right-click on 'res' folder > New > Image Asset" -ForegroundColor White
Write-Host "3. Choose 'Launcher Icons (Adaptive and Legacy)'" -ForegroundColor White
Write-Host "4. Upload your icon and let Android Studio generate all sizes" -ForegroundColor White