$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$bk   = "C:\Users\ahmad\OneDrive\Documents\ewt-link-backup"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

$bad = New-Object System.Collections.ArrayList
$n = 0
foreach($src in (Get-ChildItem $bk -Recurse -File)){
  $rel = $src.FullName.Substring($bk.Length+1)
  $cur = Join-Path $root $rel
  if(-not (Test-Path $cur)){ [void]$bad.Add("MISSING-NOW: $rel"); continue }
  $a = [System.IO.File]::ReadAllText($src.FullName)
  $c = [System.IO.File]::ReadAllText($cur)
  $n++
  $dOpen  = ([regex]::Matches($c,'(?i)<script[\s>]')).Count   - ([regex]::Matches($a,'(?i)<script[\s>]')).Count
  $dClose = ([regex]::Matches($c,'(?i)</script>')).Count      - ([regex]::Matches($a,'(?i)</script>')).Count
  $dStyle = ([regex]::Matches($c,'(?i)<style[\s>]')).Count    - ([regex]::Matches($a,'(?i)<style[\s>]')).Count
  $dStyleC= ([regex]::Matches($c,'(?i)</style>')).Count       - ([regex]::Matches($a,'(?i)</style>')).Count
  $dHtml  = ([regex]::Matches($c,'(?i)</html>')).Count        - ([regex]::Matches($a,'(?i)</html>')).Count
  $dBody  = ([regex]::Matches($c,'(?i)</body>')).Count       - ([regex]::Matches($a,'(?i)</body>')).Count
  $dLink  = ([regex]::Matches($c,'(?i)<link\b')).Count       - ([regex]::Matches($a,'(?i)<link\b')).Count
  if($dOpen -ne 0 -or $dClose -ne 0 -or $dStyle -ne 0 -or $dStyleC -ne 0 -or $dHtml -ne 0 -or $dBody -ne 0 -or $dLink -ne 0){
    [void]$bad.Add(("{0} :: dScriptOpen={1} dScriptClose={2} dStyleOpen={3} dStyleClose={4} dHtml={5} dBody={6} dLink={7} dLen={8}" -f $rel,$dOpen,$dClose,$dStyle,$dStyleC,$dHtml,$dBody,$dLink,($c.Length-$a.Length)))
  }
}

W ("compared $n files against pre-fix backup")
W ("structural damage found in $($bad.Count) file(s)")
W ""
if($bad.Count -gt 0){
  W "=========== DAMAGED FILES ==========="
  foreach($b in $bad){ W ("  " + $b) }
}

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_damage.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("compared={0} damaged={1}" -f $n, $bad.Count)
