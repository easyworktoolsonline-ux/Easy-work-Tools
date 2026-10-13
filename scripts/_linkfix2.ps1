$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$logOut = New-Object System.Text.StringBuilder
function L([string]$s){ [void]$logOut.AppendLine($s); Write-Output $s }

# ---------- universe ----------
$rootFiles = Get-ChildItem $root -Recurse -File | ForEach-Object { $_.FullName.Substring($root.Length+1).Replace('\','/') }
$rootDirs  = Get-ChildItem $root -Recurse -Directory | ForEach-Object { $_.FullName.Substring($root.Length+1).Replace('\','/') }

$toolDirs = New-Object System.Collections.ArrayList
foreach($d in (Get-ChildItem "$root\tools" -Directory)){
  [void]$toolDirs.Add($d.FullName.Substring($root.Length+1).Replace('\','/'))
  foreach($sd in (Get-ChildItem $d.FullName -Directory)){
    [void]$toolDirs.Add($sd.FullName.Substring($root.Length+1).Replace('\','/'))
  }
}
$toolByBase = @{}
foreach($t in $toolDirs){
  $b = ($t -split '/')[-1]
  if(-not $toolByBase.ContainsKey($b)){ $toolByBase[$b] = New-Object System.Collections.ArrayList }
  [void]$toolByBase[$b].Add($t)
}

function Test-Exact([string]$abs){
  if([string]::IsNullOrEmpty($abs)){ return $false }
  $a = $abs.TrimEnd('/')
  if($rootFiles -contains $a){ return $true }
  if($rootDirs -contains $a){ return ($rootFiles -contains "$a/index.html") }
  return $false
}

function Resolve-Abs([string]$href, [string]$pageRel){
  $h = ($href -split '\?')[0]
  if($h -eq '' -or $h.StartsWith('#')){ return 'ANCHOR' }
  if($h -match '^(?i:[a-z][a-z0-9+.-]*:)?//'){ return $null }
  if($h -match '^(?i:mailto:|tel:|javascript:|data:)'){ return $null }
  if($h -eq '/'){ return 'ROOT' }
  if($h -match '^/'){ return $h.TrimStart('/') }
  $dir = Split-Path $pageRel -Parent
  $stack = New-Object System.Collections.ArrayList
  foreach($p in ([regex]::Split($dir,'/'))){ if($p -ne '' -and $p -ne '.'){ [void]$stack.Add($p) } }
  foreach($p in ([regex]::Split($h,'/'))){
    if($p -eq '' -or $p -eq '.'){ continue }
    if($p -eq '..'){ if($stack.Count -gt 0){ $stack.RemoveAt($stack.Count-1) } }
    else { [void]$stack.Add($p) }
  }
  return ($stack -join '/')
}

function Make-Rel([string]$target, [string]$pageRel){
  $pageDir = Split-Path $pageRel -Parent
  if([string]::IsNullOrEmpty($pageDir)){ $pageDir = '.' }
  $depth = 0
  foreach($p in ([regex]::Split($pageDir,'/'))){ if($p -ne '' -and $p -ne '.'){ $depth++ } }
  return (('../' * $depth) + ($target -replace '^\./',''))
}

# ---------- PASS 1: identify real-tag href occurrences in RAW html ----------
# Only <a ...> / <link ...> tags count. Everything else is content/JS text.
$pages = Get-ChildItem $root -Recurse -Filter *.html -File | Where-Object { $_.FullName -notmatch '\\ads\\' }
$pageData = @{}
$realTagValues = @{}   # href value -> total occurrences inside real <a>/<link> tags, site-wide

foreach($f in $pages){
  $pageRel = $f.FullName.Substring($root.Length+1).Replace('\','/')
  $t = [System.IO.File]::ReadAllText($f.FullName)
  $occ = New-Object System.Collections.ArrayList
  foreach($m in [regex]::Matches($t, '(?is)<(?:a|link)\b[^>]*>')){
    $hm = [regex]::Match($m.Value, '(?i)\bhref\s*=\s*"([^"]*)"')
    if(-not $hm.Success){ continue }
    $v = $hm.Groups[1].Value
    [void]$occ.Add([pscustomobject]@{ Val=$v; Tag=$m.Value; Pos=$m.Index })
    if(-not $realTagValues.ContainsKey($v)){ $realTagValues[$v] = 0 }
    $realTagValues[$v] = $realTagValues[$v] + 1
  }
  $pageData[$pageRel] = [pscustomobject]@{ Path=$f.FullName; Text=$t; Occ=$occ }
}

# ---------- PASS 2: work out fixes ----------
$plan = @{}   # page -> ArrayList of @{Old=;New=}
$unresolved = New-Object System.Collections.ArrayList
$skipped = New-Object System.Collections.ArrayList

foreach($kv in $pageData.GetEnumerator()){
  $pageRel = $kv.Key
  $info = $kv.Value
  $list = New-Object System.Collections.ArrayList

  # group identical href values on this page so we compute once
  $byVal = [ordered]@{}
  foreach($o in $info.Occ){
    if(-not $byVal.Contains($o.Val)){ $byVal[$o.Val] = 0 }
    $byVal[$o.Val] = $byVal[$o.Val] + 1
  }

  foreach($val in $byVal.Keys){
    $abs = Resolve-Abs $val $pageRel
    if($null -eq $abs -or $abs -eq 'ANCHOR' -or $abs -eq 'ROOT'){ continue }
    if(Test-Exact $abs){ continue }

    $frag = ''
    if($val -match '#'){ $frag = '#' + ($val.Split('#',2)[1]) }
    $path = (($val -split '\?')[0]) -replace '#.*$',''

    $intended = $null; $why = ''
    if($path -match '^/'){ $cand = $path.TrimStart('/')
      if(Test-Exact $cand){ $intended = $cand.TrimEnd('/'); $why='absolute' }
    } else {
      if(Test-Exact $path.TrimEnd('/')){ $intended = $path.TrimEnd('/'); $why='root-relative' }
    }
    if($null -eq $intended -and $path -match '(?:^|/)([^/]+)/$'){
      $slug = $matches[1]
      if($toolByBase.ContainsKey($slug)){
        $cands = @($toolByBase[$slug] | Where-Object { Test-Exact $_ } | Select-Object -Unique)
        if($cands.Count -eq 1){ $intended = $cands[0].TrimEnd('/'); $why='sibling-tool' }
      }
    }
    if($null -eq $intended -and $path -match '^\.\./tools/([^/]+)/$'){
      $slug = $matches[1]
      if($toolByBase.ContainsKey($slug)){
        $cands = @($toolByBase[$slug] | Where-Object { Test-Exact $_ } | Select-Object -Unique)
        if($cands.Count -eq 1){ $intended = $cands[0].TrimEnd('/'); $why='tools-slug' }
      }
    }

    if($null -eq $intended){
      [void]$unresolved.Add([pscustomobject]@{ Page=$pageRel; Href=$val; Resolved=$abs })
      continue
    }

    $newVal = (Make-Rel $intended $pageRel) + $(if($path.EndsWith('/')){'/'}else{''}) + $frag
    [void]$list.Add([pscustomobject]@{ Old=$val; New=$newVal; Why=$why; N=$byVal[$val] })
  }
  if($list.Count -gt 0){ $plan[$pageRel] = $list }
}

# ---------- PASS 3: apply with String.Replace, guarded by occurrence counts ----------
$changed = New-Object System.Collections.ArrayList
$manifest = New-Object System.Collections.ArrayList

foreach($kv in $plan.GetEnumerator()){
  $pageRel = $kv.Key
  $info = $pageData[$pageRel]
  $t = $info.Text
  $orig = $t

  foreach($e in $kv.Value){
    $oldToken = ('href="' + $e.Old + '"')
    $newToken = ('href="' + $e.New + '"')

    # how many times does this exact token appear in the raw file?
    $total = ([regex]::Matches($t, [regex]::Escape($oldToken))).Count
    if($total -eq 0){ continue }
    if($total -ne $e.N){
      # some occurrences live outside real tags (e.g. JS strings) -> too risky, report
      [void]$skipped.Add([pscustomobject]@{ Page=$pageRel; Old=$e.Old; New=$e.New; Total=$total; RealTags=$e.N })
      continue
    }
    $t = $t.Replace($oldToken, $newToken)
    [void]$manifest.Add([pscustomobject]@{ Page=$pageRel; Old=$e.Old; New=$e.New; Why=$e.Why })
  }

  if($t -ne $orig){
    [System.IO.File]::WriteAllBytes($info.Path, [System.Text.Encoding]::UTF8.GetBytes($t))
    [void]$changed.Add($pageRel)
  }
}

L ("files changed : {0}" -f $changed.Count)
L ("href values rewrittens : {0}" -f $manifest.Count)
L ("unresolved   : {0}" -f $unresolved.Count)
L ("skipped(risky): {0}" -f $skipped.Count)
L ""
L "=========== MAPPINGS ==========="
foreach($e in ($manifest | Group-Object Old, New | Sort-Object Count -Descending)){
  $p = ($e.Name -split ', ')
  L ("  {0,4}x  {1,-40} ->  {2}" -f $e.Count, $p[0], $p[1])
}
if($unresolved.Count -gt 0){
  L ""
  L "=========== UNRESOLVED (untouched) ==========="
  foreach($u in $unresolved){ L ("  {0}  href=""{1}"" -> {2}" -f $u.Page, $u.Href, $u.Resolved) }
}
if($skipped.Count -gt 0){
  L ""
  L "=========== SKIPPED (occurrence mismatch, untouched) ==========="
  foreach($s in $skipped){ L ("  {0}  href=""{1}"" raw={2} realTags={3}" -f $s.Page, $s.Old, $s.Total, $s.RealTags) }
}

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_linkfix-log.txt'), $logOut.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("done. changed={0} rewrites={1} unresolved={2} skipped={3}" -f $changed.Count, $manifest.Count, $unresolved.Count, $skipped.Count)
