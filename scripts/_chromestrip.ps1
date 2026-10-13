param([switch]$Apply, [string[]]$Only)

$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$logOut = New-Object System.Text.StringBuilder
function L([string]$s){ [void]$logOut.AppendLine($s); Write-Output $s }

# selectors that are SHARED CHROME and must be governed only by assets/styles.css
$chromeSelectors = @(
 'navbar','nav-inner','site-logo','site-logo-domain','nav-links','nav-search','nav-divider',
 'menu-btn','site-footer','site-footer-logo','site-footer-inner','site-footer-top',
 'site-footer-brand','site-footer-description','site-footer-col','site-footer-categories',
 'site-footer-support','site-footer-bottom','site-footer-legal','support-email','site-brand-bar'
)

function Test-IsChrome([string]$selectorText){
  $s = ($selectorText -replace '(?s)/\*.*?\*/',' ')
  $s = ($s -replace '\s+',' ').Trim()
  if($s -eq ''){ return $false }
  foreach($c in $chromeSelectors){
    if($s -match ('\.' + [regex]::Escape($c) + '(?![a-zA-Z0-9_-])')){ return $true }
  }
  return $false
}

function Find-Match([string]$s, [int]$openIdx){
  $d = 0; $j = $openIdx
  while($j -lt $s.Length){
    if($s[$j] -eq '{'){ $d++ }
    elseif($s[$j] -eq '}'){ $d--; if($d -eq 0){ return $j } }
    $j++
  }
  return -1
}

# Rewrite a CSS text: drop declaration rules whose selector is chrome; recurse into @media/@supports
function Strip-Css([string]$css){
  $sb = New-Object System.Text.StringBuilder
  $i = 0; $n = $css.Length
  $pending = New-Object System.Text.StringBuilder   # raw selector text before '{'
  $kept = 0; $dropped = 0

  while($i -lt $n){
    $ch = $css[$i]
    if($ch -eq '{'){
      $close = Find-Match $css $i
      if($close -lt 0){ [void]$pending.Append($css.Substring($i)); break }
      $head = $pending.ToString()
      $pending.Length = 0
      $inner = $css.Substring($i+1, $close-$i-1)
      $whole = $head + '{' + $inner + '}'

      $isAt = ($head -match '(?is)^\s*@(media|supports|layer|container|scope)\b')
      $isKey = ($head -match '(?is)^\s*@(keyframes|font-face|page|property)\b')

      if($isKey){
        [void]$sb.Append($whole); $kept++
      }
      elseif($isAt){
        $newInner = Strip-Css $inner
        if($newInner.Text.Trim() -eq ''){
          $dropped++
        } else {
          [void]$sb.Append($head.TrimEnd() + '{')
          [void]$sb.Append($newInner.Text)
          [void]$sb.Append('}')
          $kept++
        }
      }
      else {
        if(Test-IsChrome $head){ $dropped++ } else { [void]$sb.Append($whole); $kept++ }
      }
      $i = $close + 1
      continue
    }
    if($ch -eq '}'){ [void]$pending.Append($ch); $i++; continue }
    [void]$pending.Append($ch); $i++
  }
  [void]$sb.Append($pending.ToString())
  return @{ Text = $sb.ToString(); Kept = $kept; Dropped = $dropped }
}

$targets = @()
if($Only -and $Only.Count -gt 0){
  foreach($o in $Only){ $targets += (Get-ChildItem $root -Recurse -Filter 'index.html' -File | Where-Object { $_.FullName.Substring($root.Length+1).Replace('\','/') -like $o }) }
} else {
  $targets = Get-ChildItem "$root\tools" -Recurse -Filter index.html -File
}

$totalDropped = 0
$filesChanged = New-Object System.Collections.ArrayList

foreach($f in $targets){
  $pageRel = $f.FullName.Substring($root.Length+1).Replace('\','/')
  $t = [System.IO.File]::ReadAllText($f.FullName)

  $newFile = $t
  $fDropped = 0
  # process each inline <style> block
  foreach($b in [regex]::Matches($t,'(?is)(<style\b[^>]*>)(.*?)(</style>)')){
    $css = $b.Groups[2].Value
    if($css -eq ''){ continue }
    $r = Strip-Css $css
    if($r.Dropped -gt 0){
      $newFile = $newFile.Replace($b.Value, ($b.Groups[1].Value + $r.Text + $b.Groups[3].Value))
      $fDropped += $r.Dropped
    }
  }

  if($fDropped -gt 0){
    $totalDropped += $fDropped
    L ("  {0,-52} chrome rules dropped: {1}" -f $pageRel, $fDropped)
    if($Apply){
      [System.IO.File]::WriteAllBytes($f.FullName, [System.Text.Encoding]::UTF8.GetBytes($newFile))
      [void]$filesChanged.Add($pageRel)
    }
  }
}

L ""
L ("files with chrome rules : {0}" -f ($targets.Count))
L ("chrome rules dropped    : {0}" -f $totalDropped)
L ("mode                    : {0}" -f $(if($Apply){'APPLIED'}else{'DRY RUN'}))

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_chrome-strip.txt'), $logOut.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("wrote scripts\_chrome-strip.txt  dropped={0} mode={1}" -f $totalDropped, $(if($Apply){'APPLY'}else{'DRYRUN'}))
