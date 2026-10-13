$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s) }

$t = [System.IO.File]::ReadAllText("$root\index.html")

function SectionText($html, $startMatch, $endMatch, [string]$label, [int]$max = 3000){
  W ""
  W "------------------------- $label -------------------------"
  $ms = [regex]::Match($html, $startMatch)
  if(-not $ms.Success){ W "  !! start pattern not found: $startMatch"; return }
  # find the end pattern after the start
  $me = [regex]::Match($html.Substring($ms.Index), $endMatch)
  if(-not $me.Success){ W "  !! end pattern not found after start"; return }
  $s = $html.Substring($ms.Index, $me.Index + $me.Length)
  if($s.Length -gt $max){ $s = $s.Substring(0, $max) + "  ...[truncated]" }
  # normalise whitespace for readability
  W ($s -replace "`r?`n\s*", "`n")
}

SectionText $t '<header\b' '</header>' "index.html HEADER"
SectionText $t '<footer\b' '</footer>' "index.html FOOTER"

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_master.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "wrote scripts\_master.txt"
