# v2: replace wrong/duplicate images and fetch missing ones (gentle on Wikimedia rate limits)
$out = "C:\Users\HANMANTH\chaatmap\react-app\public\images"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$ua = @{ 'User-Agent' = 'ChaatMapStudentProject/1.0 (educational project)' }

$assets = @(
  # wrong downloads (dolphin photo) -> replace
  @{ n = 'cat-chaat';    qs = @('dahi puri', 'sev puri chaat') },
  @{ n = 'cat-snacks';   qs = @('pakora Indian', 'bhaji fritter') },
  @{ n = 'vendor-6';     qs = @('masala chai', 'Indian chai tea') },
  @{ n = 'cta';          qs = @('street food stall India', 'food festival India') },
  @{ n = 'about-1';      qs = @('food stall India', 'street vendor India') },
  # duplicates -> vary
  @{ n = 'cat-panipuri'; qs = @('panipuri plate', 'golgappa') },
  @{ n = 'vendor-1';     qs = @('sev puri', 'Indian chaat stall') },
  @{ n = 'vendor-7';     qs = @('samosa plate', 'samosa chutney') },
  # missing
  @{ n = 'vendor-2';     qs = @('plain dosa', 'dosa') },
  @{ n = 'vendor-3';     qs = @('bajji', 'palak pakoda') },
  @{ n = 'vendor-4';     qs = @('pav bhaji', 'Mumbai street food') },
  @{ n = 'vendor-5';     qs = @('momo dumplings', 'steamed momos') },
  @{ n = 'vendor-8';     qs = @('pattice', 'chaat plate') },
  @{ n = 'trail-1';      qs = @('Charminar', 'Charminar night') },
  @{ n = 'trail-2';      qs = @('Laad Bazaar', 'Hyderabad market street') }
)

$reject = 'dolphin|Map|diagram|logo|icon|chart|seal|flag|coat of arms'

foreach ($a in $assets) {
  $dest = Join-Path $out "$($a.n).jpg"
  $tmp = "$dest.tmp"
  $ok = $false
  foreach ($q in $a.qs) {
    if ($ok) { break }
    $attempt = 0
    while ($attempt -lt 3 -and -not $ok) {
      $attempt++
      try {
        Start-Sleep -Seconds 2
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
              Write-Output "OK   $($a.n) <- [$q] $($p.title)"
              $ok = $true
              break
            }
            Remove-Item $tmp -Force -ErrorAction SilentlyContinue
          }
        }
      } catch {
        Write-Output "RETRY $($a.n) [$q] #$attempt : $($_.Exception.Message)"
        Start-Sleep -Seconds 8
      }
    }
  }
  if (-not $ok) { Write-Output "MISS $($a.n)" }
}
Write-Output "DONE"
