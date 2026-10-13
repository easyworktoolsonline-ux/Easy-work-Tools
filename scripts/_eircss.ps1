$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

function Get-Blocks([string]$t){
  return [regex]::Matches($t,'(?s)<style[^>]*>(.*?)</style>')
}

$f = [System.IO.File]::ReadAllText("$root\tools\easy-image-resizer\index.html")
W "########## easy-image-resizer: all inline <style> blocks ##########"
$b = Get-Blocks $f
W ("blocks: " + $b.Count)
for($i=0; $i -lt $b.Count; $i++){
  W ""
  W ("----- block " + $i + "  (len " + $b[$i].Groups[1].Value.Length + ") -----")
  W ($b[$i].Groups[1].Value -replace "`r?`n\s*", "`n")
}

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_eir-css.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "wrote scripts\_eir-css.txt"
