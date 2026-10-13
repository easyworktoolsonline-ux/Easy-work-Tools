$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

$chrome = @(
 'navbar','nav-inner','site-logo','site-logo-domain','nav-links','nav-search','nav-divider',
 'menu-btn','theme-toggle','share-button','nav-action-status',
 'site-footer','site-footer-inner','site-footer-top','site-footer-brand','site-footer-description',
 'site-footer-col','site-footer-categories','site-footer-support','site-footer-bottom',
 'site-footer-legal','support-email','site-brand-bar'
)
function Is-Chrome([string]$sel){
  foreach($c in $chrome){ if($sel -match ('\b' + [regex]::Escape($c))){ return $true } }
  return $false
}

$f = [System.IO.File]::ReadAllText((Join-Path $root "tools\age-calculator\index.html"))
W "=========== age-calculator inline <style> blocks: classification ==========="
$i = 0
foreach($b in [regex]::Matches($f,'(?is)<style\b[^>]*>(.*?)</style>')){
  $css = $b.Groups[1].Value
  $chromeRules = 0; $otherRules = 0
  foreach($m in [regex]::Matches($css,'(?s)([^{}]+)\{([^{}]*)\}')){
    $sel = ($m.Groups[1].Value -replace '\s+',' ').Trim()
    if($sel -eq ''){ continue }
    if($sel -eq ':root'){ continue }
    if(Is-Chrome $sel){ $chromeRules++ } else { $otherRules++ }
  }
  $hasMedia = [regex]::Matches($css,'@media').Count
  $hasKey = [regex]::Matches($css,'@keyframes').Count
  W ("  block {0}: len={1} chromeRules={2} otherRules={3} atMedia={4} keyframes={5}" -f $i,$css.Length,$chromeRules,$otherRules,$hasMedia,$hasKey)
  $i++
}
W ""
W "=========== first 3000 chars of block 0 ==========="
$css0 = [regex]::Matches($f,'(?is)<style\b[^>]*>(.*?)</style>')[0].Groups[1].Value
[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_blockclass.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "wrote scripts\_blockclass.txt"
