$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

$pages = Get-ChildItem $root -Recurse -Filter *.html -File | Where-Object { $_.FullName -notmatch '\\ads\\' }

# build set of resolvable targets (files + directories with index.html)
$allFiles = Get-ChildItem $root -Recurse -File | ForEach-Object { $_.FullName.Substring($root.Length+1).Replace('\','/') }
$allDirs  = Get-ChildItem $root -Recurse -Directory | ForEach-Object { $_.FullName.Substring($root.Length+1).Replace('\','/') }

function Resolve-Local([string]$href, [string]$pageRel){
  # strip fragment / query
  $h = $href -split '#' | Select-Object -First 1
  if($h -eq ''){ return $null }          # pure anchor
  $h = $h -split '\?' | Select-Object -First 1
  if($h -eq ''){ return $null }
  # skip non-local schemes
  if($h -match '^(?:[a-z][a-z0-9+.-]*:)?//' -and $h -notmatch '(?i)^https?://easyworktools\.online/'){ return $null }
  if($h -match '^(?i:mailto:|tel:|javascript:|data:)'){ return $null }

  if($h -match '^(?i)https?://easyworktools\.online(/.*)$'){ $h = $matches[1] }

  $abs = $null
  if($h -match '^/'){ $abs = $h.TrimStart('/') }
  else {
    $dir = Split-Path $pageRel -Parent
    if($dir -eq ''){ $dir = '.' }
    $stack = New-Object System.Collections.ArrayList
    foreach($p in ([regex]::Split($dir,'[\\/]'))){ if($p -ne '' -and $p -ne '.'){ [void]$stack.Add($p) } }
    foreach($p in ([regex]::Split($h,'/'))){
      if($p -eq '' -or $p -eq '.'){ continue }
      if($p -eq '..'){ if($stack.Count -gt 0){ $stack.RemoveAt($stack.Count-1) } }
      else { [void]$stack.Add($p) }
    }
    $abs = ($stack -join '/')
  }
  $abs = $abs.TrimEnd('/')
  return $abs
}

function Test-Target([string]$abs){
  if([string]::IsNullOrEmpty($abs)){ return $null }
  if($abs -eq ''){ return $null }
  # exact file
  if($allFiles -contains $abs){ return $true }
  # directory index
  if($allDirs -contains $abs){
    if(($allFiles -contains "$abs/index.html")){ return $true }
    return $false
  }
  return $false
}

$broken = @{}
foreach($f in $pages){
  $pageRel = $f.FullName.Substring($root.Length+1).Replace('\','/')
  $raw = [System.IO.File]::ReadAllBytes($f.FullName)
  $t = [System.Text.Encoding]::UTF8.GetString($raw)

  foreach($m in [regex]::Matches($t,'(?i)\b(?:href|src)="([^"]+)"')){
    $href = $m.Groups[1].Value
    $abs = Resolve-Local $href $pageRel
    $ok = Test-Target $abs
    if($ok -eq $false){
      $key = "$abs  <=  href='$href'"
      if(-not $broken.ContainsKey($key)){ $broken[$key] = New-Object System.Collections.ArrayList }
      [void]$broken[$key].Add($pageRel)
    }
  }
}

W ("=========== BROKEN LOCAL LINKS / ASSET REFS: {0} distinct targets ===========" -f $broken.Count)
if($broken.Count -gt 0){
  W ""
  $sorted = $broken.GetEnumerator() | Sort-Object Value.Count -Descending
  foreach($kv in $sorted){
    W ("  !! -> {0}" -f $kv.Key)
    W ("       on {0} page(s): {1}" -f $kv.Value.Count, (($kv.Value | Select-Object -First 4) -join ', ') + $(if($kv.Value.Count -gt 4){', ...'}else{''}))
  }
}

W ""
W "=========== per-page counts (sorted) ==========="
$byPage = @()
foreach($kv in $broken.GetEnumerator()){
  foreach($p in $kv.Value){
    if($byPage | Where-Object { $_.F -eq $p }){ ($byPage | Where-Object { $_.F -eq $p }).N += $kv.Value.Count }
    else { $byPage += [pscustomobject]@{F=$p; N=$kv.Value.Count} }
  }
}
$byPage = $byPage | Sort-Object N -Descending
foreach($e in $byPage){ W ("  {0,3}  {1}" -f $e.N, $e.F) }

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_links.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ('wrote scripts\_links.txt  brokenTargets=' + $broken.Count)
