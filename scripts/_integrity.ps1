$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$bk   = "C:\Users\ahmad\OneDrive\Documents\ewt-link-backup"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

$problems = New-Object System.Collections.ArrayList
$changedHrefs = 0
$checked = 0

foreach($src in (Get-ChildItem $bk -Recurse -File)){
  $rel = $src.FullName.Substring($bk.Length+1)
  $cur = Join-Path $root $rel
  if(-not (Test-Path $cur)){ [void]$problems.Add("MISSING-NOW: $rel"); continue }
  $a = [System.IO.File]::ReadAllText($src.FullName)
  $c = [System.IO.File]::ReadAllText($cur)
  $checked++

  $pairs = @(
    @{N='scriptOpen'; R='(?i)<script[\s>]'},
    @{N='scriptClose';R='(?i)</script>'},
    @{N='styleOpen';  R='(?i)<style[\s>]'},
    @{N='styleClose'; R='(?i)</style>'},
    @{N='linkOpen';   R='(?i)<link\b'},
    @{N='aOpen';      R='(?i)<a\b'},
    @{N='htmlClose';  R='(?i)</html>'},
    @{N='bodyClose';  R='(?i)</body>'}
  )
  foreach($p in $pairs){
    $d = ([regex]::Matches($c,$p.R)).Count - ([regex]::Matches($a,$p.R)).Count
    if($d -ne 0){ [void]$problems.Add(("{0} :: {1} delta={2}" -f $rel,$p.N,$d)) }
  }
  # style/script inner content must be byte-identical (only hrefs may change)
  $sa = [regex]::Matches($a,'(?is)<style\b[^>]*>.*?</style>')
  $sc = [regex]::Matches($c,'(?is)<style\b[^>]*>.*?</style>')
  if($sa.Count -ne $sc.Count){ [void]$problems.Add("$rel :: style-block-count") }
  else {
    for($i=0;$i -lt $sa.Count;$i++){ if($sa[$i].Value -ne $sc[$i].Value){ [void]$problems.Add("$rel :: style-block-$i CHANGED"); break } }
  }
  # script bodies must be identical
  $ja = [regex]::Matches($a,'(?is)<script\b[^>]*>.*?</script>')
  $jc = [regex]::Matches($c,'(?is)<script\b[^>]*>.*?</script>')
  if($ja.Count -ne $jc.Count){ [void]$problems.Add("$rel :: script-block-count") }
  else {
    for($i=0;$i -lt $ja.Count;$i++){ if($ja[$i].Value -ne $jc[$i].Value){ [void]$problems.Add("$rel :: script-block-$i CHANGED"); break } }
  }
}

# count how many href values actually changed
foreach($src in (Get-ChildItem $bk -Recurse -File)){
  $rel = $src.FullName.Substring($bk.Length+1)
  $cur = Join-Path $root $rel
  if(-not (Test-Path $cur)){ continue }
  $a = [System.IO.File]::ReadAllText($src.FullName)
  $c = [System.IO.File]::ReadAllText($cur)
  $ha = [regex]::Matches($a,'(?i)<(?:a|link)\b[^>]*href="([^"]*)"')
  $hc = [regex]::Matches($c,'(?i)<(?:a|link)\b[^>]*href="([^"]*)"')
  if($ha.Count -ne $hc.Count){ continue }
  for($i=0;$i -lt $ha.Count;$i++){ if($ha[$i].Groups[1].Value -ne $hc[$i].Groups[1].Value){ $changedHrefs++ } }
}

W ("checked files        : {0}" -f $checked)
W ("hrefs changed        : {0}" -f $changedHrefs)
W ("integrity problems   : {0}" -f $problems.Count)
W ""
if($problems.Count -gt 0){
  W "=========== PROBLEMS ==========="
  foreach($p in ($problems | Select-Object -First 60)){ W ("  " + $p) }
  if($problems.Count -gt 60){ W ("  ... and $($problems.Count-60) more") }
} else {
  W "*** NO INTEGRITY PROBLEMS - only href values differ ***"
}

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_integrity.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("checked={0} changedHrefs={1} problems={2}" -f $checked, $changedHrefs, $problems.Count)
