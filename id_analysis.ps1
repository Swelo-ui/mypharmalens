$dataPath = "C:\Users\DELL\Documents\mypharmalens\src\data"
$categoryFiles = Get-ChildItem "$dataPath\*.ts" -Exclude "combinedDrugsData.ts","drugDataUtils.ts","mockDrugsData.ts","additionalDrugsData.ts"

Write-Host "=== ID NUMBERING PATTERN ANALYSIS ===" -ForegroundColor Green

foreach ($file in $categoryFiles) {
    $content = Get-Content $file.FullName -Raw
    $fileName = $file.Name
    
    # Extract all IDs from the file
    $idMatches = [regex]::Matches($content, "id:\s*['""]([^'""]+)['""]")
    
    if ($idMatches.Count -gt 0) {
        $ids = $idMatches | ForEach-Object { $_.Groups[1].Value }
        $prefix = ""
        $numbers = @()
        
        # Analyze ID pattern
        foreach ($id in $ids) {
            if ($id -match "^([A-Z]+)(\d+)$") {
                if (-not $prefix) { $prefix = $matches[1] }
                $numbers += [int]$matches[2]
            }
        }
        
        if ($numbers.Count -gt 0) {
            $sortedNumbers = $numbers | Sort-Object
            $minNum = $sortedNumbers[0]
            $maxNum = $sortedNumbers[-1]
            $expectedCount = $maxNum - $minNum + 1
            $actualCount = $numbers.Count
            $gaps = @()
            
            # Find gaps in numbering
            for ($i = $minNum; $i -le $maxNum; $i++) {
                if ($i -notin $numbers) {
                    $gaps += $i
                }
            }
            
            Write-Host "`n$fileName:"
            Write-Host "  Prefix: $prefix"
            Write-Host "  Range: $minNum - $maxNum"
            Write-Host "  Count: $actualCount"
            Write-Host "  Expected: $expectedCount"
            if ($gaps.Count -gt 0) {
                Write-Host "  Gaps: $($gaps -join ', ')" -ForegroundColor Yellow
            } else {
                Write-Host "  Sequential: YES" -ForegroundColor Green
            }
        }
    }
}
