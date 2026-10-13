$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

$pages = Get-ChildItem $root -Recurse -Filter *.html -File | Where-Object { $_.FullName -notmatch '\\ads\\' }
$allFiles = Get-ChildItem $root -Recurse -File | ForEach-Object { $_.FullName.Substring($root.Length+1).Replace('\','/') }
$allDirs  = Get-ChildItem $root -Recurse -Directory | ForEach-Object { $_.FullName.Substring($root.Length+1).Replace('\','/') }

function Split-Slash([string]$s){ return [regex]::Split($s,'/') }
function Resolve-Rel([string]$h, [string]$pageRel){
  $h2 = ($h -split '#')[0]
  if($h2 -eq ''){ return 'ANCHOR' }
  $h2 = ($h2 -split '\?')[0]
  if($h2 -eq ''){ return 'QUERY' }
  if($h2 -match '^(?i:https?|mailto|tel|javascript|data|ftp):'){ return 'SCHEME' }
  if($h2 -match '^//'){ return 'PROTOCOLREL' }

  $abs = $null
  if($h2 -match '^/'){ $abs = $h2.TrimStart('/') }
  else {
    $dir = Split-Path $pageRel -Parent
    $stack = New-Object System.Collections.ArrayList
    foreach($p in (Split-Slash $dir)){ if($p -ne '' -and $p -ne '.'){ [void]$stack.Add($p) } }
    foreach($p in (Split-Slash $h2)){
      if($p -eq '' -or $p -eq '.'){ continue }
      if($p -eq '..'){ if($stack.Count -gt 0){ $stack.RemoveAt($stack.Count-1) } }
      else { [void]$stack.Add($p) }
    }
    $abs = ($stack -join '/')
  }
  return ($abs.TrimEnd('/'))
}

function Test-Target([string]$abs){
  if($abs -eq '' -or $abs -eq $null){ return $null }
  if($allFiles -contains $abs){ return $true }
  if($allDirs -contains $abs){ if($allFiles -contains "$abs/index.html"){ return $true } ; return $false }
  return $false
}

# collect all href/src occurrences with page context
$recs = New-Object System.Collections.ArrayList
foreach($f in $pages){
  $pageRel = $f.FullName.Substring($root.Length+1).Replace('\','/')
  $t = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($f.FullName))
  foreach($m in [regex]::Matches($t,'(?i)\b(href|src)="([^"]+)"')){
    [void]$recs.Add([pscustomobject]@{
      Page=$pageRel; Attr=$m.Groups[1].Value.ToLower(); Val=$m.Groups[2].Value; Index=$m.Index
    })
  }
}

W ("total href/src occurrences: {0}" -f $recs.Count)

$broken = @()
foreach($r in $recs){
  $abs = Resolve-Rel $r.Val $r.Page
  if($abs -eq 'ANCHOR' -or $abs -eq 'QUERY' -or $abs -eq 'SCHEME' -or $abs -eq 'PROTOCOLREL'){ continue }
  if($abs -eq ''){ continue }
  if(-not (Test-Target $abs)){
    $pageDir = Split-Path $r.Page -Parent
    if([string]::IsNullOrEmpty($pageDir)){ $pageDir = '' }
    $prefix = if($pageDir){ $r.Page } else { $r.Page }
    # is the resolved path = pageDir + val  ?  (i.e. href written root-relative)
    $suffix = $r.Val -split '#' | Select-Object -First 1
    $isRootRelative = $abs -eq (($pageDir + '/' + $suffix).TrimEnd('/')) -or $abs -eq ($suffix.TrimEnd('/'))
    $broken += [pscustomobject]@{ Page=$r.Page; Attr=$r.Attr; Val=$r.Val; Abs=$abs; Idx=$r.Index; RootRel=[bool]$isRootRelative }
  }
}

W ""
W ("=========== BROKEN link count: {0} occurrences ===========" -f $broken.Count)

# what href VALUES are broken, grouped
$g = $broken | Group-Object Attr, Val | Sort-Object Count -Descending
W ""
W ("=========== broken href VALUES ({0} distinct) ===========" -f $g.Count)
foreach($e in $g){ W ("  {0,4}x  {1}=""{2}""" -f $e.Count, ($e.Name -split ', ')[0], ($e.Name -split ', ')[1]) }

W ""
W ("=========== is the bad href root-relative (pageDir + val) on its page? ===========")
W ("  root-relative  : {0}" -f (@($broken | Where-Object { $_.RootRel }).Count))
W ("  other/unknown  : {0}" -f (@($broken | Where-Object { -not $_.RootRel }).Count))
W ""
W "  --- the 'other/unknown' ones (need eyeballing) ---"
foreach($b in ($broken | Where-Object { -not $_.RootRel } | Sort-Object Val)){ W ("    {0}   href=""{1}""   -> resolved {2}" -f $b.Page, $b.Val, $b.Abs) }

W ""
W ("=========== distinct broken href basenames and where they SHOULD live in root ===========")
$vals = $broken | Group-Object Val | Sort-Object Name
foreach($e in $vals){
  $v = ($e.Name -split '#')[0]
  $cand = $allFiles | Where-Object { $_ -eq $v -or $_ -like "*/$v" }
  $cl = ($cand | Select-Object -Unique) -join ','
  W ("  {0,4}x  ""{1}""  ->  root-candidates: {2}" -f $e.Count, $e.Name, $cl)
}

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_links2.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ('wrote scripts\_links2.txt  brokenOccurrences=' + $broken.Count)
