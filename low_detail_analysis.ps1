$dataPath = "C:\Users\DELL\Documents\mypharmalens\src\data"
$categoryFiles = Get-ChildItem "$dataPath\*.ts" -Exclude "combinedDrugsData.ts","drugDataUtils.ts","mockDrugsData.ts","additionalDrugsData.ts"

$lowDetailEntries = @()

Write-Host "=== LOW DETAIL ENTRIES ANALYSIS ===" -ForegroundColor Green

foreach ($file in $categoryFiles) {
    $content = Get-Content $file.FullName -Raw
    $fileName = $file.Name
    
    # Extract drug entries with more detail
    $drugMatches = [regex]::Matches($content, "{\s*id:\s*['""]([^'""]+)['""],\s*name:\s*['""]([^'""]+)['""],\s*genericName:\s*['""]([^'""]*)['""],.*?description:\s*['""]([^'""]+)['""].*?drugClass:\s*['""]([^'""]*)['""].*?mechanism:\s*['""]([^'""]+)['""]", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    foreach ($match in $drugMatches) {
        $drug = @{
            ID = $match.Groups[1].Value
            Name = $match.Groups[2].Value
            GenericName = $match.Groups[3].Value
            Description = $match.Groups[4].Value
            DrugClass = $match.Groups[5].Value
            Mechanism = $match.Groups[6].Value
            File = $fileName
        }
        
        # Check for low detail entries (short descriptions OR missing key fields)
        $isLowDetail = $false
        $reasons = @()
        
        if ($drug.Description.Length -lt 50) {
            $isLowDetail = $true
            $reasons += "Short description ($($drug.Description.Length) chars)"
        }
        
        if (-not $drug.DrugClass -or $drug.DrugClass.Trim() -eq "") {
            $isLowDetail = $true
            $reasons += "Missing drug class"
        }
        
        if ($drug.Mechanism.Length -lt 30) {
            $isLowDetail = $true
            $reasons += "Short mechanism ($($drug.Mechanism.Length) chars)"
        }
        
        if ($isLowDetail) {
            $drug.Reasons = $reasons -join ", "
            $lowDetailEntries += $drug
        }
    }
}

Write-Host "Found $($lowDetailEntries.Count) low-detail entries:" -ForegroundColor Yellow

foreach ($drug in $lowDetailEntries | Sort-Object File, ID) {
    Write-Host ""
    Write-Host "$($drug.Name) (ID: $($drug.ID)) in $($drug.File)" -ForegroundColor Red
    Write-Host "  Reasons: $($drug.Reasons)"
    Write-Host "  Description: $($drug.Description)"
    Write-Host "  Drug Class: $($drug.DrugClass)"
    Write-Host "  Mechanism: $($drug.Mechanism.Substring(0, [Math]::Min(100, $drug.Mechanism.Length)))..."
}

# Group by file for removal planning
$byFile = $lowDetailEntries | Group-Object File
Write-Host "`n=== REMOVAL PLAN BY FILE ===" -ForegroundColor Cyan
foreach ($group in $byFile) {
    Write-Host "$($group.Name): $($group.Count) entries to remove"
    foreach ($drug in $group.Group) {
        Write-Host "  - $($drug.ID): $($drug.Name)"
    }
}
