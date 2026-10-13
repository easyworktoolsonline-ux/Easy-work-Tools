param([int]$Port = 4322)
$ErrorActionPreference = "Stop"
$root = "C:\Users\ahmad\OneDrive\Documents\Default Project"

$types = @{
  ".html"="text/html; charset=utf-8"
  ".htm"="text/html; charset=utf-8"
  ".css"="text/css; charset=utf-8"
  ".js"="text/javascript; charset=utf-8"
  ".mjs"="text/javascript; charset=utf-8"
  ".json"="application/json; charset=utf-8"
  ".png"="image/png"
  ".jpg"="image/jpeg"
  ".jpeg"="image/jpeg"
  ".gif"="image/gif"
  ".svg"="image/svg+xml"
  ".webp"="image/webp"
  ".ico"="image/x-icon"
  ".woff"="font/woff"
  ".woff2"="font/woff2"
  ".ttf"="font/ttf"
  ".txt"="text/plain; charset=utf-8"
  ".xml"="application/xml; charset=utf-8"
  ".pdf"="application/pdf"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Output "serving $root on http://127.0.0.1:$Port/"
while($listener.IsListening){
  try{
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath
    $rel = ($path.TrimStart("/") -replace "/","\")
    if($rel -eq ""){ $rel = "index.html" }
    $file = Join-Path $root $rel
    if((Test-Path -LiteralPath $file -PathType Container)){
      $idx = Join-Path $file "index.html"
      if(Test-Path -LiteralPath $idx -PathType Leaf){ $file = $idx }
    }
    if(Test-Path -LiteralPath $file -PathType Leaf){
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ct = "application/octet-stream"
      if($types.ContainsKey($ext)){ $ct = $types[$ext] }
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentType = $ct
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $err = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $ctx.Response.OutputStream.Write($err,0,$err.Length)
    }
    $ctx.Response.OutputStream.Close()
  } catch { }
}
