$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$logOut = New-Object System.Text.StringBuilder
function L([string]$s){ [void]$logOut.AppendLine($s) }

$bk = "C:\Users\ahmad\OneDrive\Documents\ewt-link-backup"
New-Item -ItemType Directory -Path $bk -Force | Out-Null

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

# ---------- length-preserving script mask ----------
function ConvertTo-Masked([string]$t, [ref]$tokens){
  $list = New-Object System.Collections.ArrayList
  $res = [regex]::Replace($t, '(?is)<script\b[^>]*>.*?</script>', { param($m)
      [void]$list.Add($m.Value)
      return ([string][char]0x01) * $m.Length
    })
  $tokens.Value = $list
  return $res
}
function Restore-From-Masked([string]$masked, $tokens){
  $out = New-Object System.Text.StringBuilder
  $i = 0
  $idx = 0
  while($i -lt $masked.Length){
    if($masked[$i] -eq [char]0x01){
      $j = $i
      while($j -lt $masked.Length -and $masked[$j] -eq [char]0x01){ $j++ }
      [void]$out.Append($tokens[$idx]); $idx++
      $i = $j
    } else {
      [void]$out.Append($masked[$i]); $i++
    }
  }
  return $out.ToString()
}

# ---------- process ----------
$pages = Get-ChildItem $root -Recurse -Filter *.html -File | Where-Object { $_.FullName -notmatch '\\ads\\' }
$changedFiles = New-Object System.Collections.ArrayList
$unresolved   = New-Object System.Collections.ArrayList
$manifest = New-Object System.Collections.ArrayList

foreach($f in $pages){
  $pageRel = $f.FullName.Substring($root.Length+1).Replace('\','/')
  $raw = [System.IO.File]::ReadAllBytes($f.FullName)
  $hasBom = ($raw.Length -ge 3 -and $raw[0] -eq 0xEF -and $raw[1] -eq 0xBB -and $raw[2] -eq 0xBF)
  $enc = New-Object System.Text.UTF8Encoding($hasBom)
  $t = $enc.GetString($raw)

  $tokens = $null
  $work = ConvertTo-Masked $t ([ref]$tokens)

  $edits = New-Object System.Collections.ArrayList
  foreach($m in [regex]::Matches($work, '(?is)<(?:a|link)\b[^>]*>')){
    $tag = $m.Value
    $hm = [regex]::Match($tag, '(?i)\bhref\s*=\s*"([^"]*)"')
    if(-not $hm.Success){ continue }
    $href = $hm.Groups[1].Value
    if($href -eq '' -or $href -eq '#'){ continue }

    $abs = Resolve-Abs $href $pageRel
    if($null -eq $abs -or $abs -eq 'ANCHOR' -or $abs -eq 'ROOT'){ continue }
    if(Test-Exact $abs){ continue }

    $frag = ''
    if($href -match '#'){ $frag = '#' + ($href.Split('#',2)[1]) }
    $path = (($href -split '\?')[0]) -replace '#.*$',''

    $intended = $null; $why = ''

    if($path -match '^/'){ $c = $path.TrimStart('/')
      if(Test-Exact $c){ $intended = $c.TrimEnd('/'); $why = 'absolute' }
    } else {
      if(Test-Exact $path.TrimEnd('/')){ $intended = $path.TrimEnd('/'); $why = 'root-relative' }
    }

    if($null -eq $intended -and $path -match '(?:^|/)([^/]+)/$'){
      $slug = $matches[1]
      if($toolByBase.ContainsKey($slug)){
        $cands = @($toolByBase[$slug] | Where-Object { Test-Exact $_ } | Select-Object -Unique)
        if($cands.Count -eq 1){ $intended = $cands[0].TrimEnd('/'); $why = 'sibling-tool' }
      }
    }

    if($null -eq $intended -and $path -match '^\.\./tools/([^/]+)/$'){
      $slug = $matches[1]
      if($toolByBase.ContainsKey($slug)){
        $cands = @($toolByBase[$slug] | Where-Object { Test-Exact $_ } | Select-Object -Unique)
        if($cands.Count -eq 1){ $intended = $cands[0].TrimEnd('/'); $why = 'tools-slug' }
      }
    }

    if($null -eq $intended){
      [void]$unresolved.Add([pscustomobject]@{ Page=$pageRel; Href=$href; Resolved=$abs })
      continue
    }

    $newBase = Make-Rel $intended $pageRel
    # preserve a trailing directory slash if the original had one (never change URL shape)
    $slash = if($path.EndsWith('/')){ '/' } else { '' }
    $newHref = $newBase + $slash + $frag
    $newTag  = $tag.Substring(0,$hm.Index) + 'href="' + $newHref + '"' + $tag.Substring($hm.Index + $hm.Length)

    [void]$edits.Add([pscustomobject]@{ Start=$m.Index; Old=$tag; New=$newTag; OldHref=$href; NewHref=$newHref; Why=$why })
  }

  if($edits.Count -gt 0){
    # apply from the end so indices stay valid
    $out = New-Object System.Text.StringBuilder
    $pos = 0
    $sorted = @($edits | Sort-Object { $_.Start })
    foreach($e in $sorted){
      [void]$out.Append($work.Substring($pos, $e.Start - $pos))
      [void]$out.Append($e.New)
      $pos = $e.Start + $e.Old.Length
      [void]$manifest.Add([pscustomobject]@{ Page=$pageRel; Old=$e.OldHref; New=$e.NewHref; Why=$e.Why })
    }
    [void]$out.Append($work.Substring($pos))
    $newText = Restore-From-Masked $out.ToString() $tokens

    $dst = Join-Path $bk $pageRel
    $dir = Split-Path $dst -Parent
    if(-not (Test-Path $dir)){ New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    if(-not (Test-Path $dst)){ [System.IO.File]::WriteAllBytes($dst, $raw) }

    [System.IO.File]::WriteAllBytes($f.FullName, $enc.GetBytes($newText))
    [void]$changedFiles.Add($pageRel)
  }
}

L ("files changed : {0}" -f $changedFiles.Count)
L ("links fixed   : {0}" -f $manifest.Count)
L ("unresolved    : {0}" -f $unresolved.Count)
L ""
L "=========== CHANGES BY (old -> new) ==========="
$g = $manifest | Group-Object Old, New | Sort-Object Count -Descending
foreach($e in $g){
  $parts = $e.Name -split ', '
  L ("  {0,4}x  {1,-42} ->  {2}" -f $e.Count, $parts[0], $parts[1])
}
L ""
L "=========== FILES TOUCHED ==========="
foreach($c in ($changedFiles | Sort-Object)){ L ("  " + $c) }
L ""
L ("=========== UNRESOLVED (left untouched, needs a decision) ===========")
if($unresolved.Count -eq 0){ L "  (none)" }
foreach($u in $unresolved){ L ("  {0}   href=""{1}""   (resolves to {2})" -f $u.Page, $u.Href, $u.Resolved) }

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_linkfix-log.txt'), $logOut.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("done. log -> scripts\_linkfix-log.txt   changed={0} fixed={1} unresolved={2}" -f $changedFiles.Count, $manifest.Count, $unresolved.Count)
