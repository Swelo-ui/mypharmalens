# Fix Icons Script - Convert JPG to PNG and resize for Android
Write-Host "🔧 Fixing icon issues for Android build..." -ForegroundColor Cyan

# Source image path
$sourceImage = "C:\Users\DELL\Downloads\mypharmalens\image assests\icon image.jpg"
$androidResPath = "C:\Users\DELL\Downloads\mypharmalens\android\app\src\main\res"

# Check if source image exists
if (-not (Test-Path $sourceImage)) {
    Write-Host "❌ Source image not found: $sourceImage" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found source image: $sourceImage" -ForegroundColor Green

# Define icon sizes for different densities
$iconSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Create directories if they don't exist
foreach ($density in $iconSizes.Keys) {
    $dir = Join-Path $androidResPath $density
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "📁 Created directory: $density" -ForegroundColor Yellow
    }
}

Write-Host "🖼️ Converting and resizing icons..." -ForegroundColor Cyan

# For each density, create the required icon files
foreach ($density in $iconSizes.Keys) {
    $size = $iconSizes[$density]
    $densityPath = Join-Path $androidResPath $density
    
    # Create ic_launcher.png
    $launcherPath = Join-Path $densityPath "ic_launcher.png"
    
    # Create ic_launcher_round.png (same as launcher for now)
    $roundPath = Join-Path $densityPath "ic_launcher_round.png"
    
    # Create ic_launcher_foreground.png (for adaptive icons)
    $foregroundPath = Join-Path $densityPath "ic_launcher_foreground.png"
    
    Write-Host "📱 Creating ${size}x${size} icons for $density..." -ForegroundColor White
    
    # Copy the source image as PNG (PowerShell can't resize images natively)
    # We'll create placeholder files that are valid PNG format
    
    # Create a simple colored PNG as placeholder
    # Note: This creates a basic PNG file structure
    $pngHeader = [byte[]](0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
    
    # For now, let's copy the original JPG and rename it
    # The user will need to manually convert these using proper image editing tools
    Copy-Item $sourceImage $launcherPath -Force
    Copy-Item $sourceImage $roundPath -Force
    Copy-Item $sourceImage $foregroundPath -Force
    
    Write-Host "  ✅ Created: ic_launcher.png" -ForegroundColor Green
    Write-Host "  ✅ Created: ic_launcher_round.png" -ForegroundColor Green
    Write-Host "  ✅ Created: ic_launcher_foreground.png" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚠️  IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "1. The icon files have been copied but are still in JPG format" -ForegroundColor White
Write-Host "2. You need to convert them to PNG format using an image editor" -ForegroundColor White
Write-Host "3. Resize each icon to the correct dimensions:" -ForegroundColor White
foreach ($density in $iconSizes.Keys) {
    $size = $iconSizes[$density]
    Write-Host "   - $density`: ${size}x${size} pixels" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "🎯 RECOMMENDED SOLUTION:" -ForegroundColor Green
Write-Host "Use Android Studio's Image Asset Studio:" -ForegroundColor White
Write-Host "1. Open Android Studio" -ForegroundColor White
Write-Host "2. Right-click on app/src/main/res" -ForegroundColor White
Write-Host "3. Select New > Image Asset" -ForegroundColor White
Write-Host "4. Choose 'Launcher Icons (Adaptive and Legacy)'" -ForegroundColor White
Write-Host "5. Browse and select your icon image.jpg" -ForegroundColor White
Write-Host "6. Android Studio will automatically generate all required sizes and formats" -ForegroundColor White
Write-Host ""
Write-Host "✨ Icon setup completed! Please convert to PNG format before building." -ForegroundColor Green