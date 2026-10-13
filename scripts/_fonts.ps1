$ErrorActionPreference = 'Stop'
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"
$out = New-Object System.Text.StringBuilder
function W([string]$s){ [void]$out.AppendLine($s); Write-Output $s }

$masterCss = Get-Content "$root\assets\styles.css" -Raw
W "=== master font-family rules in styles.css ==="
foreach($mm in [regex]::Matches($masterCss,'(?s)([^{}]+)\{([^{}]*)\}')){
  $b = $mm.Groups[2].Value
  if($b -match 'BlinkMacSystemFont'){
    $sel = ($mm.Groups[1].Value -replace '\s+',' ').Trim()
    $bb  = ($b -replace '\s+',' ').Trim()
    W ("  " + $sel + " { " + $bb + " }")
  }
}

W ""
W "=== tool pages with a body/html/* font-family that lacks BlinkMacSystemFont ==="
$pages = Get-ChildItem "$root\tools" -Recurse -Filter index.html -File
$list = New-Object System.Collections.ArrayList
foreach($f in $pages){
  $rel = $f.FullName.Substring($root.Length+1).Replace('\','/')
  $t = [System.IO.File]::ReadAllText($f.FullName)
  foreach($b in [regex]::Matches($t,'(?is)<style\b[^>]*>(.*?)</style>')){
    $css = $b.Groups[1].Value
    foreach($m2 in [regex]::Matches($css,'(?s)([^{}]+)\{([^{}]*)\}')){
      $sel  = ($m2.Groups[1].Value -replace '(?s)/\*.*?\*/',' ' -replace '\s+',' ').Trim()
      $body = ($m2.Groups[2].Value -replace '\s+',' ').Trim()
      if($body -match 'font-family' -and $sel -match '^(body|html|\*)$'){
        if($body -notmatch 'BlinkMacSystemFont'){
          [void]$list.Add($rel + " || " + $sel + " { " + $body + " }")
        }
      }
    }
  }
}
foreach($x in $list){ W ("  " + $x) }
W ("  pages: " + $list.Count)

W ""
W "=== pages with a --font variable missing BlinkMacSystemFont ==="
foreach($f in $pages){
  $rel = $f.FullName.Substring($root.Length+1).Replace('\','/')
  $t = [System.IO.File]::ReadAllText($f.FullName)
  foreach($m3 in [regex]::Matches($t,'--[a-zA-Z0-9-]*font[a-zA-Z0-9-]*\s*:\s*([^;}]+)')){
    $val = $m3.Groups[1].Value.Trim()
    if($val -notmatch 'BlinkMacSystemFont'){
      W ("  " + $rel + "  ->  " + $m3.Value.Trim())
    }
  }
}

[System.IO.File]::WriteAllText((Join-Path $root 'scripts\_fonts.txt'), $out.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Output "wrote scripts\_fonts.txt"
