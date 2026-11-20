$out = "C:\Users\HANMANTH\chaatmap\react-app\public\images"
$ua = @{ 'User-Agent' = 'ChaatMapStudentProject/1.0 (educational project)' }
$dest = Join-Path $out 'vendor-8.jpg'
$tmp = "$dest.tmp"
$reject = 'dolphin|Map|diagram|logo|icon|chart|seal|flag|burger|Big Mac'
$ok = $false
foreach ($q in @('Indian chaat', 'bhel puri plate', 'panipuri chaat')) {
  if ($ok) { break }
  $attempt = 0
  while ($attempt -lt 3 -and -not $ok) {
    $attempt++
    try {
      Start-Sleep -Seconds 3
      $enc = [uri]::EscapeDataString($q)
      $api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$enc&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime&iiurlwidth=1100&format=json"
      $r = Invoke-RestMethod -Uri $api -TimeoutSec 30 -Headers $ua
      $pages = @($r.query.pages.PSObject.Properties.Value | Sort-Object { $_.index })
      foreach ($p in $pages) {
        $ii = $p.imageinfo[0]
        if ($ii -and $ii.mime -in @('image/jpeg', 'image/png') -and $ii.thumburl -and ($p.title -notmatch $reject)) {
          Invoke-WebRequest -Uri $ii.thumburl -OutFile $tmp -TimeoutSec 40 -Headers $ua
          if ((Get-Item $tmp).Length -gt 10000) {
            Move-Item $tmp $dest -Force
            Write-Output "OK vendor-8 <- [$q] $($p.title)"
            $ok = $true
            break
          }
          Remove-Item $tmp -Force -ErrorAction SilentlyContinue
        }
      }
    } catch {
      Write-Output "RETRY [$q] #$attempt : $($_.Exception.Message)"
      Start-Sleep -Seconds 8
    }
  }
}
if (-not $ok) { Write-Output 'MISS vendor-8' }
