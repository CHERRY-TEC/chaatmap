# Downloads real Indian street-food photography from Wikimedia Commons into public/images
$out = "C:\Users\HANMANTH\chaatmap\react-app\public\images"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$ua = @{ 'User-Agent' = 'ChaatMapStudentProject/1.0 (educational use)' }

$assets = @(
  @{ n = 'hero-1';       q = 'panipuri golgappa' },
  @{ n = 'hero-2';       q = 'bhel puri' },
  @{ n = 'cat-panipuri'; q = 'panipuri' },
  @{ n = 'cat-chaat';    q = 'Indian chaat snack' },
  @{ n = 'cat-dosa';     q = 'masala dosa' },
  @{ n = 'cat-pavbhaji'; q = 'pav bhaji' },
  @{ n = 'cat-momos';    q = 'momos dumplings Indian' },
  @{ n = 'cat-samosa';   q = 'samosa' },
  @{ n = 'cat-vadapav';  q = 'vada pav' },
  @{ n = 'cat-snacks';   q = 'Indian fritters bhaji' },
  @{ n = 'vendor-1';     q = 'panipuri stall India' },
  @{ n = 'vendor-2';     q = 'dosa street food India' },
  @{ n = 'vendor-3';     q = 'mirchi bajji' },
  @{ n = 'vendor-4';     q = 'pav bhaji Mumbai' },
  @{ n = 'vendor-5';     q = 'momos street food India' },
  @{ n = 'vendor-6';     q = 'Indian chai tea stall' },
  @{ n = 'vendor-7';     q = 'samosa Indian street' },
  @{ n = 'vendor-8';     q = 'ragda pattice' },
  @{ n = 'trail-1';      q = 'Charminar Hyderabad' },
  @{ n = 'trail-2';      q = 'Laad Bazaar Hyderabad' },
  @{ n = 'cta';          q = 'Indian street food market night' },
  @{ n = 'about-1';      q = 'Indian street food vendor' }
)

foreach ($a in $assets) {
  $dest = Join-Path $out "$($a.n).jpg"
  if (Test-Path $dest) { Write-Output "SKIP $($a.n)"; continue }
  $found = $false
  foreach ($q in @($a.q, ($a.q -split ' ')[0])) {
    if ($found) { break }
    $enc = [uri]::EscapeDataString($q)
    $api = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=$enc&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime&iiurlwidth=1100&format=json"
    try {
      $r = Invoke-RestMethod -Uri $api -TimeoutSec 25 -Headers $ua
      $pages = @($r.query.pages.PSObject.Properties.Value)
      foreach ($p in ($pages | Sort-Object { $_.index })) {
        $ii = $p.imageinfo[0]
        if ($ii -and $ii.mime -in @('image/jpeg', 'image/png') -and $ii.thumburl) {
          Invoke-WebRequest -Uri $ii.thumburl -OutFile $dest -TimeoutSec 40 -Headers $ua
          if ((Get-Item $dest).Length -gt 8000) { Write-Output "OK   $($a.n)  <-  $($p.title)"; $found = $true; break }
          Remove-Item $dest -Force
        }
      }
    } catch {
      Write-Output "ERR  $($a.n): $($_.Exception.Message)"
    }
  }
  if (-not $found) { Write-Output "MISS $($a.n)" }
}
Write-Output "DONE"
