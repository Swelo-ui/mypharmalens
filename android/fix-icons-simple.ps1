# Simple Icon Fix Script
Write-Host "Fixing icon issues for Android build..." -ForegroundColor Cyan

# Remove existing problematic icon files
$androidResPath = "C:\Users\DELL\Downloads\mypharmalens\android\app\src\main\res"
$densities = @("mipmap-mdpi", "mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi")

foreach ($density in $densities) {
    $densityPath = Join-Path $androidResPath $density
    if (Test-Path $densityPath) {
        Remove-Item (Join-Path $densityPath "ic_launcher.png") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $densityPath "ic_launcher_round.png") -ErrorAction SilentlyContinue
        Remove-Item (Join-Path $densityPath "ic_launcher_foreground.png") -ErrorAction SilentlyContinue
        Write-Host "Cleaned $density directory" -ForegroundColor Yellow
    }
}

Write-Host "Icon cleanup completed. You can now build without icon compilation errors." -ForegroundColor Green
Write-Host "The app will use default Android icons until you add proper PNG icons." -ForegroundColor White