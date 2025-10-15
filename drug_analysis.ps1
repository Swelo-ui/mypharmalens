# Comprehensive Drug Analysis Script
$dataPath = "C:\Users\DELL\Documents\mypharmalens\src\data"
$categoryFiles = Get-ChildItem "$dataPath\*.ts" -Exclude "combinedDrugsData.ts","drugDataUtils.ts","mockDrugsData.ts","additionalDrugsData.ts"

$allDrugs = @()
$drugsByName = @{}
$drugsByGeneric = @{}
$duplicatesByName = @()
$duplicatesByGeneric = @()
$lowDetailEntries = @()

Write-Host "=== ANALYZING DRUG CATEGORIES ===" -ForegroundColor Green

foreach ($file in $categoryFiles) {
    $content = Get-Content $file.FullName -Raw
    $fileName = $file.Name
    
    # Extract drug entries
    $drugMatches = [regex]::Matches($content, "{\s*id:\s*['""]([^'""]+)['""],\s*name:\s*['""]([^'""]+)['""],\s*genericName:\s*['""]([^'""]*)['""],.*?description:\s*['""]([^'""]+)['""]", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    foreach ($match in $drugMatches) {
        $drug = @{
            ID = $match.Groups[1].Value
            Name = $match.Groups[2].Value
            GenericName = $match.Groups[3].Value
            Description = $match.Groups[4].Value
            File = $fileName
        }
        
        $allDrugs += $drug
        
        # Check for duplicates by name
        $normalizedName = $drug.Name.ToLower().Trim()
        if ($drugsByName.ContainsKey($normalizedName)) {
            $drugsByName[$normalizedName] += $drug
        } else {
            $drugsByName[$normalizedName] = @($drug)
        }
        
        # Check for duplicates by generic name (if not empty)
        if ($drug.GenericName -and $drug.GenericName.Trim() -ne "") {
            $normalizedGeneric = $drug.GenericName.ToLower().Trim()
            if ($drugsByGeneric.ContainsKey($normalizedGeneric)) {
                $drugsByGeneric[$normalizedGeneric] += $drug
            } else {
                $drugsByGeneric[$normalizedGeneric] = @($drug)
            }
        }
        
        # Check for low detail entries (short descriptions)
        if ($drug.Description.Length -lt 50) {
            $lowDetailEntries += $drug
        }
    }
}

Write-Host "`n=== DUPLICATE ANALYSIS RESULTS ===" -ForegroundColor Yellow

# Find duplicates by name
foreach ($name in $drugsByName.Keys) {
    if ($drugsByName[$name].Count -gt 1) {
        $duplicatesByName += @{
            Name = $name
            Drugs = $drugsByName[$name]
            Count = $drugsByName[$name].Count
        }
    }
}

# Find duplicates by generic name
foreach ($generic in $drugsByGeneric.Keys) {
    if ($drugsByGeneric[$generic].Count -gt 1) {
        $duplicatesByGeneric += @{
            GenericName = $generic
            Drugs = $drugsByGeneric[$generic]
            Count = $drugsByGeneric[$generic].Count
        }
    }
}

Write-Host "Total drugs analyzed: $($allDrugs.Count)"
Write-Host "Duplicates by name: $($duplicatesByName.Count)"
Write-Host "Duplicates by generic name: $($duplicatesByGeneric.Count)"
Write-Host "Low detail entries: $($lowDetailEntries.Count)"

if ($duplicatesByName.Count -gt 0) {
    Write-Host "`n--- NAME DUPLICATES ---" -ForegroundColor Red
    foreach ($dup in $duplicatesByName) {
        Write-Host "Drug: $($dup.Name) ($($dup.Count) instances)"
        foreach ($drug in $dup.Drugs) {
            Write-Host "  - ID: $($drug.ID) in $($drug.File)"
        }
    }
}

if ($duplicatesByGeneric.Count -gt 0) {
    Write-Host "`n--- GENERIC NAME DUPLICATES ---" -ForegroundColor Red
    foreach ($dup in $duplicatesByGeneric) {
        Write-Host "Generic: $($dup.GenericName) ($($dup.Count) instances)"
        foreach ($drug in $dup.Drugs) {
            Write-Host "  - $($drug.Name) (ID: $($drug.ID)) in $($drug.File)"
        }
    }
}

if ($lowDetailEntries.Count -gt 0) {
    Write-Host "`n--- LOW DETAIL ENTRIES ---" -ForegroundColor Magenta
    foreach ($drug in $lowDetailEntries) {
        Write-Host "$($drug.Name) (ID: $($drug.ID)) in $($drug.File) - Description: $($drug.Description.Substring(0, [Math]::Min(50, $drug.Description.Length)))..."
    }
}
