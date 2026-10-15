Add-Type -AssemblyName System.Drawing

function Build-CrispOgCard {
    param(
        [string]$srcPath,
        [string]$destPath,
        [string]$subtitleText,
        [string]$headlineText
    )

    $targetW = 1200
    $targetH = 630
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # 1. Source image cover
    $srcImg = [System.Drawing.Image]::FromFile($srcPath)
    $targetRatio = $targetW / $targetH

    $cropW = $srcImg.Width
    $cropH = [int]($srcImg.Width / $targetRatio)
    if ($cropH -gt $srcImg.Height) {
        $cropH = $srcImg.Height
        $cropW = [int]($srcImg.Height * $targetRatio)
    }
    $cropX = [int](($srcImg.Width - $cropW) / 2)
    $cropY = [int](($srcImg.Height - $cropH) / 2)

    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetW, $targetH)
    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $srcImg.Dispose()

    # 2. Top soft vignette
    $topRect = New-Object System.Drawing.Rectangle(0, 0, $targetW, 160)
    $topBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $topRect,
        [System.Drawing.Color]::FromArgb(210, 8, 14, 25),
        [System.Drawing.Color]::FromArgb(0, 8, 14, 25),
        [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
    )
    $g.FillRectangle($topBrush, $topRect)
    $topBrush.Dispose()

    # Bottom prominent dark gradient banner
    $bottomH = 220
    $bottomY = $targetH - $bottomH
    $bottomRect = New-Object System.Drawing.Rectangle(0, $bottomY, $targetW, $bottomH)
    $botBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $bottomRect,
        [System.Drawing.Color]::FromArgb(0, 6, 12, 22),
        [System.Drawing.Color]::FromArgb(235, 6, 12, 22),
        [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
    )
    $g.FillRectangle($botBrush, $bottomRect)
    $botBrush.Dispose()

    # Golden border line at bottom
    $goldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 158, 11), 6)
    $g.DrawLine($goldPen, 0, $targetH - 3, $targetW, $targetH - 3)
    $goldPen.Dispose()

    # 3. Official Logo at top-left
    $logoPath = (Resolve-Path 'public/logo.png').Path
    $logoImg = [System.Drawing.Image]::FromFile($logoPath)
    $logoSize = 88
    $logoX = 60
    $logoY = 32

    # Logo outer ring
    $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 158, 11), 3)
    $g.DrawEllipse($ringPen, $logoX - 1, $logoY - 1, $logoSize + 2, $logoSize + 2)
    $ringPen.Dispose()

    # Logo circular clip
    $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clipPath.AddEllipse($logoX, $logoY, $logoSize, $logoSize)
    $oldClip = $g.Clip
    $g.SetClip($clipPath)
    $g.DrawImage($logoImg, $logoX, $logoY, $logoSize, $logoSize)
    $g.Clip = $oldClip
    $clipPath.Dispose()
    $logoImg.Dispose()

    # Brand Title: DIYAS N DUAS
    $brandFont = New-Object System.Drawing.Font('Arial', 32, [System.Drawing.FontStyle]::Bold)
    $brandBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
    $g.DrawString('DIYAS N DUAS', $brandFont, $brandBrush, $logoX + $logoSize + 20, $logoY + 6)
    $brandFont.Dispose()
    $brandBrush.Dispose()

    # Brand Tagline under title
    $tagFont = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Bold)
    $tagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(251, 191, 36))
    $g.DrawString('HANDCRAFTED FESTIVE DIYAS & SACRED ESSENTIALS', $tagFont, $tagBrush, $logoX + $logoSize + 22, $logoY + 48)
    $tagFont.Dispose()
    $tagBrush.Dispose()

    # Top-Right Domain Badge
    $badgeFont = New-Object System.Drawing.Font('Arial', 14, [System.Drawing.FontStyle]::Bold)
    $badgeText = 'diyasnduas.com'
    $badgeSize = $g.MeasureString($badgeText, $badgeFont)
    $badgeX = $targetW - $badgeSize.Width - 90
    $badgeY = 44

    $badgeBg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 0, 0, 0))
    $g.FillRectangle($badgeBg, $badgeX - 14, $badgeY - 6, $badgeSize.Width + 28, 36)
    $badgeBg.Dispose()

    $badgeBorder = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 158, 11), 2)
    $g.DrawRectangle($badgeBorder, $badgeX - 14, $badgeY - 6, $badgeSize.Width + 28, 36)
    $badgeBorder.Dispose()

    $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
    $g.DrawString($badgeText, $badgeFont, $badgeBrush, $badgeX, $badgeY)
    $badgeFont.Dispose()
    $badgeBrush.Dispose()

    # 4. Bottom Main Headline & Subtitle
    $headFont = New-Object System.Drawing.Font('Georgia', 34, [System.Drawing.FontStyle]::Bold)
    $headBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
    $g.DrawString($headlineText, $headFont, $headBrush, 60, $targetH - 142)
    $headFont.Dispose()
    $headBrush.Dispose()

    $subFont = New-Object System.Drawing.Font('Arial', 18, [System.Drawing.FontStyle]::Bold)
    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(251, 191, 36))
    $g.DrawString($subtitleText, $subFont, $subBrush, 60, $targetH - 80)
    $subFont.Dispose()
    $subBrush.Dispose()

    # Save output JPEG
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]95)

    $fullDest = (Resolve-Path $destPath).Path
    $bmp.Save($fullDest, $codec, $params)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $destPath successfully."
}

Build-CrispOgCard -srcPath 'C:\Users\DELL\.gemini\antigravity\brain\6212ea98-5c1c-44c9-ae5f-1db016d55edf\diyas_n_duas_festive_banner_1791977233453.jpg' -destPath 'public/og-home.jpg' -headlineText 'Illuminate Your Celebrations with Sacred Light' -subtitleText 'Artisan Terracotta Clay Diyas  |  Pure Brass Lamps  |  India-Wide Safe Delivery'

Build-CrispOgCard -srcPath 'C:\Users\DELL\.gemini\antigravity\brain\6212ea98-5c1c-44c9-ae5f-1db016d55edf\diyas_n_duas_catalog_banner_1791977228442.jpg' -destPath 'public/og-products.jpg' -headlineText 'Handcrafted Terracotta & Brass Diyas Collection' -subtitleText 'Clay Diyas  |  Samai Deepams  |  Urli Bowls  |  Hanging Bells  |  Festive Sets'
