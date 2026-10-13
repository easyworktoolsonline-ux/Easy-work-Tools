$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

# ---------- helpers ----------
function Get-Section([string]$html, [string]$tag){
  $open  = [regex]::Match($html, "<$tag\b")
  if(-not $open.Success){ return $null }
  $depth = 0
  $rx = [regex]("<(/?)($tag)\b[^>]*>")
  $m = $rx.Match($html, $open.Index)
  while($m.Success){
    if($m.Groups[1].Value -eq '/'){ $depth-- } else { $depth++ }
    if($depth -eq 0){ return $html.Substring($open.Index, ($m.Index + $m.Length) - $open.Index) }
    $m = $m.NextMatch()
  }
  return $null
}

function Normalize-block([string]$s){
  if([string]::IsNullOrEmpty($s)){ return '' }
  $s = ($s -replace '\s+', ' ')
  $s = $s -replace '(?i)(href|src|action)="(?:\.\./)*([^"]*)"', '$1="ROOT/$2"'
  $s = $s -replace '(?i)https://easyworktools\.online/', 'ROOT/'
  $s = $s -replace '\?\w+=\d+', ''
  $s = $s -replace '(?s)/\*.*?\*/', ''
  return $s.Trim()
}

function Fingerprint-header([string]$block){
  if([string]::IsNullOrEmpty($block)){ return 'MISSING' }
  $feat = New-Object System.Collections.ArrayList
  function Add([string]$k,[bool]$v){ [void]$feat.Add($k + ':' + $v) }
  Add 'navbar'        ($block -match '<header[^>]*class="[^"]*\bnavbar\b')
  Add 'siteLogo'      ($block -match 'class="site-logo"')
  Add 'logoText'      ($block -match 'EasyWorkTools<span class="site-logo-domain">\.online</span>')
  Add 'navLinks'      ($block -match 'class="nav-links"')
  Add 'linkHome'      ($block -match 'href="[^"]*index\.html">Home<')
  Add 'linkTools'     ($block -match 'href="[^"]*tools/index\.html">Tools<')
  Add 'linkBlogs'     ($block -match 'href="[^"]*blog/index\.html">Blogs<')
  Add 'linkResources' ($block -match 'href="[^"]*resources/index\.html">Resources<')
  Add 'themeToggle'   ($block -match 'id="themeToggle"')
  Add 'shareButton'   ($block -match 'id="shareButton"')
  Add 'navDivider'    ($block -match 'class="nav-divider"')
  Add 'navSearch'     ($block -match 'class="nav-search"')
  Add 'navSearchInput'($block -match 'id="navSearch"')
  Add 'menuBtn'       ($block -match 'class="menu-btn"')
  return ($feat -join ' ')
}

function Fingerprint-footer([string]$block){
  if([string]::IsNullOrEmpty($block)){ return 'MISSING' }
  $feat = New-Object System.Collections.ArrayList
  function Add([string]$k,[bool]$v){ [void]$feat.Add($k + ':' + $v) }
  Add 'footerClass' ($block -match '<footer[^>]*class="[^"]*\bsite-footer\b')
  Add 'inner'       ($block -match 'class="site-footer-inner"')
  Add 'top'         ($block -match 'class="site-footer-top"')
  Add 'brand'       ($block -match 'class="site-footer-brand"')
  Add 'logo'        ($block -match 'EasyWorkTools<span class="site-logo-domain">\.online</span>')
  Add 'desc'        ($block -match 'class="site-footer-description"')
  Add 'cats'        ($block -match 'class="site-footer-col site-footer-categories"')
  Add 'support'     ($block -match 'class="site-footer-col site-footer-support"')
  Add 'bottom'      ($block -match 'class="site-footer-bottom"')
  Add 'legal'       ($block -match 'class="site-footer-legal"')
  Add 'copyright'   ($block -match '© 2026 EasyWorkTools\.online')
  Add 'majorCats'   ($block -match 'Major Categories')
  Add 'explore'     ($block -match '<h3>Explore</h3>')
  Add 'legalH'      ($block -match '<h3>Legal</h3>')
  Add 'helpH'       ($block -match '<h3>Help</h3>')
  Add 'supportH'    ($block -match '<h3>Support</h3>')
  Add 'email'       ($block -match 'href="mailto:EasyWorkTools\.online@gmail\.com"')
  return ($feat -join ' ')
}

function Compare-Fp([string]$masterFp, [string]$pageFp, [string]$label){
  $diffs = New-Object System.Collections.ArrayList
  foreach($m in $masterFp.Split(' ')){
    $parts = $m.Split(':')
    $k = $parts[0]; $mv = $parts[1]
    $hit = $null
    foreach($p in $pageFp.Split(' ')){ if($p -match ('^' + [regex]::Escape($k) + ':')){ $hit = $p; break } }
    $pv = if($hit){ $hit.Split(':')[1] } else { 'absent' }
    if($hit -ne $m){ [void]$diffs.Add($k + ': master=' + $mv + '  page=' + $pv) }
  }
  return $diffs
}

# ---------- master ----------
$masterHtml = [System.IO.File]::ReadAllText("$root\index.html")
$mh = Get-Section $masterHtml 'header'
$mf = Get-Section $masterHtml 'footer'
$mHF = Fingerprint-header $mh
$mFF = Fingerprint-footer $mf
W "=========== MASTER HEADER FP ==========="
W $mHF
W ""
W "=========== MASTER FOOTER FP ==========="
W $mFF
W ""

# ---------- scan ----------
$allPages = Get-ChildItem $root -Recurse -Filter *.html -File | Where-Object { $_.FullName -notmatch '\\ads\\' }

$hdrMissing = New-Object System.Collections.ArrayList
$ftrMissing = New-Object System.Collections.ArrayList
$hdrDiff = @()
$ftrDiff = @()

foreach($f in $allPages){
  $t = [System.IO.File]::ReadAllText($f.FullName)
  $rel = $f.FullName.Substring($root.Length+1)
  $h  = Get-Section $t 'header'
  $ff = Get-Section $t 'footer'
  $hf = Fingerprint-header $h
  $ffg = Fingerprint-footer $ff

  if($hf -eq 'MISSING'){ [void]$hdrMissing.Add($rel); continue }
  if($hf -ne $mHF){
    $d = Compare-Fp $mHF $hf 'header'
    if($d.Count -gt 0){ $hdrDiff += [pscustomobject]@{F=$rel; D=(($d.ToArray()) -join '; ')} }
  }

  if($ffg -eq 'MISSING'){ [void]$ftrMissing.Add($rel); continue }
  if($ffg -ne $mFF){
    $d = Compare-Fp $mFF $ffg 'footer'
    if($d.Count -gt 0){ $ftrDiff += [pscustomobject]@{F=$rel; D=(($d.ToArray()) -join '; ')} }
  }
}

W "=========== PAGES WITH NO <header>: $($hdrMissing.Count) ==========="
foreach($e in $hdrMissing){ W ('  ' + $e) }

W ""
W "=========== PAGES WITH NO <footer>: $($ftrMissing.Count) ==========="
foreach($e in $ftrMissing){ W ('  ' + $e) }

W ""
W "=========== HEADER DIFFS vs master: $($hdrDiff.Count) pages ==========="
foreach($e in $hdrDiff){ W ('  ' + $e.F); W ('      ' + $e.D) }

W ""
W "=========== FOOTER DIFFS vs master: $($ftrDiff.Count) pages ==========="
foreach($e in $ftrDiff){ W ('  ' + $e.F); W ('      ' + $e.D) }

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_hf-audit.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ('wrote scripts\_hf-audit.txt   hdrMissing=' + $hdrMissing.Count + ' ftrMissing=' + $ftrMissing.Count + ' hdrDiff=' + $hdrDiff.Count + ' ftrDiff=' + $ftrDiff.Count)
