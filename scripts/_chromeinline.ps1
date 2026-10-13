$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

# selectors that belong to the SHARED chrome (must come from assets/styles.css only)
$chrome = @(
 'navbar','nav-inner','site-logo','site-logo-domain','nav-links','nav-search','nav-divider',
 'menu-btn','theme-toggle','share-button','nav-action-status',
 'site-footer','site-footer-inner','site-footer-top','site-footer-brand','site-footer-description',
 'site-footer-col','site-footer-categories','site-footer-support','site-footer-bottom',
 'site-footer-legal','support-email','site-brand-bar'
)

function Is-Chrome([string]$selectorText){
  foreach($c in $chrome){
    if($selectorText -match ('\b' + $c)){ return $true }
  }
  return $false
}

function Get-StyleBlocks([string]$t){
  return [regex]::Matches($t, '(?is)<style\b[^>]*>(.*?)</style>')
}

$pages = Get-ChildItem "$root\tools" -Recurse -Filter index.html -File
$hits = New-Object System.Collections.ArrayList
$filesWith = New-Object System.Collections.ArrayList

foreach($f in $pages){
  $t = [System.IO.File]::ReadAllText($f.FullName)
  $rel = $f.FullName.Substring($root.Length+1).Replace('\','/')
  $fileHits = New-Object System.Collections.ArrayList
  foreach($b in (Get-StyleBlocks $t)){
    $css = $b.Groups[1].Value
    foreach($m in [regex]::Matches($css, '(?s)([^{}]+)\{([^{}]*)\}')){
      $sel = ($m.Groups[1].Value -replace '\s+',' ').Trim()
      $body = ($m.Groups[2].Value -replace '\s+',' ').Trim()
      if($sel -eq ''){ continue }
      # skip the :root / variables block
      if($sel -eq ':root'){ continue }
      if(Is-Chrome $sel){
        [void]$fileHits.Add([pscustomobject]@{ Sel=$sel; Body=$body })
      }
    }
  }
  if($fileHits.Count -gt 0){
    [void]$filesWith.Add($rel)
    [void]$hits.Add([pscustomobject]@{ File=$rel; Rules=$fileHits })
  }
}

W ("tool pages scanned              : {0}" -f $pages.Count)
W ("pages with inline chrome rules  : {0}" -f $filesWith.Count)
W ("total inline chrome rules       : {0}" -f (($hits | ForEach-Object { $_.Rules.Count }) | Measure-Object -Sum).Sum)
W ""
W ("=========== PAGES WITH INLINE CHROME RULES ===========")
foreach($r in $filesWith | Sort-Object){ W ("  " + $r) }
W ""
W ("=========== THE RULES (easy-image-resizer) ===========")
$e = $hits | Where-Object { $_.File -like '*easy-image-resizer*' }
if($e){ foreach($r in $e.Rules){ W ("  {0} {{ {1} }}" -f $r.Sel, $r.Body) } } else { W "  (none)" }
W ""
W ("=========== THE RULES (age-calculator) ===========")
$e = $hits | Where-Object { $_.File -like '*age-calculator*' }
if($e){ foreach($r in $e.Rules){ W ("  {0} {{ {1} }}" -f $r.Sel, $r.Body) } } else { W "  (none)" }

W ""
W ("=========== UNIQUE SELECTORS USED SITE-WIDE ===========")
$all = $hits | ForEach-Object { $_.Rules } | Select-Object -ExpandProperty Sel | Sort-Object -Unique
foreach($s in $all){ W ("  " + $s) }

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_chrome-inline.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ('wrote scripts\_chrome-inline.txt  pagesWith=' + $filesWith.Count)
