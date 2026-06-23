$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open("c:\Users\Administrator\Desktop\Leaderboard-THPT2026\DS_PHONG_THI_SBD_CHINH_XAC.xlsx")
$ws = $wb.Sheets.Item(1)

Write-Host "Sheet name: $($ws.Name)"
Write-Host "Used Range: $($ws.UsedRange.Rows.Count) rows x $($ws.UsedRange.Columns.Count) cols"
Write-Host "--- Headers ---"

$colCount = $ws.UsedRange.Columns.Count
for ($c = 1; $c -le $colCount; $c++) {
    Write-Host "Col ${c}: $($ws.Cells.Item(1, $c).Text)"
}

Write-Host "--- First 5 data rows ---"
$maxRow = [Math]::Min(6, $ws.UsedRange.Rows.Count)
for ($r = 2; $r -le $maxRow; $r++) {
    $row = ""
    for ($c = 1; $c -le $colCount; $c++) {
        $row += "$($ws.Cells.Item($r, $c).Text) | "
    }
    Write-Host "Row ${r}: $row"
}

Write-Host "--- Last 3 rows ---"
$startLast = [Math]::Max($ws.UsedRange.Rows.Count - 2, 2)
for ($r = $startLast; $r -le $ws.UsedRange.Rows.Count; $r++) {
    $row = ""
    for ($c = 1; $c -le $colCount; $c++) {
        $row += "$($ws.Cells.Item($r, $c).Text) | "
    }
    Write-Host "Row ${r}: $row"
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
