# PWA ikonlarını ve logoyu scripts/brand içindeki kaynak görsellerden üretir.
# powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
Add-Type -AssemblyName System.Drawing
$root = Join-Path $PSScriptRoot ".."
$iconsOut = Join-Path $root "public\icons"
$brandOut = Join-Path $root "public\brand"
New-Item -ItemType Directory -Force $iconsOut, $brandOut | Out-Null

function Get-Bounds([System.Drawing.Bitmap]$bmp, [int]$minAlpha = 40) {
  $minX = $bmp.Width; $minY = $bmp.Height; $maxX = 0; $maxY = 0
  for ($y = 0; $y -lt $bmp.Height; $y += 1) {
    for ($x = 0; $x -lt $bmp.Width; $x += 1) {
      if ($bmp.GetPixel($x, $y).A -gt $minAlpha) {
        if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }; if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

function New-Canvas([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "HighQuality"; $g.InterpolationMode = "HighQualityBicubic"; $g.PixelOffsetMode = "HighQuality"; $g.CompositingQuality = "HighQuality"
  $g.Clear([System.Drawing.Color]::Transparent)
  return @($bmp, $g)
}

$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path (Join-Path $PSScriptRoot "brand/app-icon-m-source.png")))
# Yüksek eşik: kaynak görseldeki yarı saydam dağınık noktalar kırpmaya dahil edilmez
$box = Get-Bounds $src 200
# Zemin renkleri (tam dolu ikonlarda köşe boşluklarını doldurmak için)
$cTop = $src.GetPixel($box.X + [int]($box.Width * 0.5), $box.Y + [int]($box.Height * 0.12))
$cBottom = $src.GetPixel($box.X + [int]($box.Width * 0.5), $box.Y + [int]($box.Height * 0.88))

# $mode: "any" = orijinal yuvarlak kare, şeffaf köşeler
#        "bleed" = köşeleri kesilmiş tam dolu kare (iOS / Android kendisi maskeler)
function New-Icon([int]$size, [string]$file, [string]$mode, [double]$zoom) {
  $c = New-Canvas $size $size; $bmp = $c[0]; $g = $c[1]
  if ($mode -eq "bleed") {
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $cTop, $cBottom, 45
    $g.FillRectangle($brush, $rect)
  }
  $s = $size * $zoom
  $o = ($size - $s) / 2
  $dest = New-Object System.Drawing.RectangleF $o, $o, $s, $s
  $g.DrawImage($src, $dest, [System.Drawing.RectangleF]$box, [System.Drawing.GraphicsUnit]::Pixel)
  $bmp.Save((Join-Path $iconsOut $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-Icon 192 "icon-192.png" "any" 1.0
New-Icon 512 "icon-512.png" "any" 1.0
New-Icon 32 "favicon-32.png" "any" 1.0
New-Icon 180 "apple-touch-icon.png" "bleed" 1.24
New-Icon 512 "maskable-512.png" "bleed" 0.92
$src.Dispose()

# Yazı logoları: boşlukları kırpılmış, 720px genişlik
function New-Wordmark([string]$source, [string]$file) {
  $wm = [System.Drawing.Bitmap]::FromFile((Resolve-Path (Join-Path $PSScriptRoot $source)))
  $wb = Get-Bounds $wm
  $w = 720; $h = [int]($w * $wb.Height / $wb.Width)
  $c = New-Canvas $w $h; $bmp = $c[0]; $g = $c[1]
  $g.DrawImage($wm, (New-Object System.Drawing.RectangleF 0, 0, $w, $h), [System.Drawing.RectangleF]$wb, [System.Drawing.GraphicsUnit]::Pixel)
  $bmp.Save((Join-Path $brandOut $file), [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "$file : ${w}x${h}"
  $g.Dispose(); $bmp.Dispose(); $wm.Dispose()
}

New-Wordmark "brand/wordmark-mesaigo-dark-source.png" "mesaigo-dark.png"          # açık zemin (giriş kartı)
New-Wordmark "brand/wordmark-mesaigo-white-source.png" "mesaigo-white.png" # koyu zemin (personel ekranı)
Write-Output "OK"
