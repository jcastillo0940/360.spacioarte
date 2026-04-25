$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$imagesDir = Join-Path $root 'spacioarte_widget\images'

if (-not (Test-Path $imagesDir)) {
    throw "Images directory not found: $imagesDir"
}

$sizes = @(
    @{ Name = 'logo_main.png'; Width = 400; Height = 272; Variant = 'wide' },
    @{ Name = 'logo.png'; Width = 130; Height = 100; Variant = 'compact' },
    @{ Name = 'logo_medium.png'; Width = 240; Height = 84; Variant = 'wide' },
    @{ Name = 'logo_small.png'; Width = 108; Height = 108; Variant = 'square' },
    @{ Name = 'logo_min.png'; Width = 84; Height = 84; Variant = 'square' }
)

function New-Brush([string] $color) {
    return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($color))
}

function New-Pen([string] $color, [float] $width = 1) {
    $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($color))
    $pen.Width = $width
    return $pen
}

foreach ($size in $sizes) {
    $path = Join-Path $imagesDir $size.Name
    $bitmap = New-Object System.Drawing.Bitmap $size.Width, $size.Height

    try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

        try {
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

            $bgRect = New-Object System.Drawing.Rectangle 0, 0, $size.Width, $size.Height
            $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
                $bgRect,
                [System.Drawing.ColorTranslator]::FromHtml('#FFF8EF'),
                [System.Drawing.ColorTranslator]::FromHtml('#FFE2BF'),
                35
            )

            try {
                $graphics.FillRectangle($background, $bgRect)
            } finally {
                $background.Dispose()
            }

            $accentBrush = New-Brush '#FF7A00'
            $accentDarkBrush = New-Brush '#1F2937'
            $whiteBrush = New-Brush '#FFFFFF'
            $linePen = New-Pen '#E8B06A' 2

            try {
                if ($size.Variant -eq 'square') {
                    $circleSize = [Math]::Min($size.Width, $size.Height) - 16
                    $circleX = [int](($size.Width - $circleSize) / 2)
                    $circleY = [int](($size.Height - $circleSize) / 2)
                    $graphics.FillEllipse($accentBrush, $circleX, $circleY, $circleSize, $circleSize)
                    $graphics.DrawEllipse($linePen, $circleX, $circleY, $circleSize, $circleSize)

                    $fontSize = if ($size.Width -le 84) { 18 } else { 24 }
                    $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold)

                    try {
                        $format = New-Object System.Drawing.StringFormat
                        $format.Alignment = [System.Drawing.StringAlignment]::Center
                        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
                        $graphics.DrawString('SA', $font, $whiteBrush, (New-Object System.Drawing.RectangleF 0, 0, $size.Width, $size.Height), $format)
                    } finally {
                        $font.Dispose()
                    }
                } else {
                    $padding = if ($size.Width -le 130) { 10 } else { 16 }
                    $badgeWidth = if ($size.Width -le 130) { 34 } else { 56 }
                    $badgeHeight = if ($size.Height -le 100) { 34 } else { 56 }
                    $badgeRect = New-Object System.Drawing.Rectangle $padding, $padding, $badgeWidth, $badgeHeight
                    $graphics.FillEllipse($accentBrush, $badgeRect)
                    $graphics.DrawEllipse($linePen, $badgeRect)

                    $badgeFontSize = if ($size.Width -le 130) { 11 } else { 18 }
                    $badgeFont = New-Object System.Drawing.Font('Segoe UI', $badgeFontSize, [System.Drawing.FontStyle]::Bold)

                    try {
                        $badgeFormat = New-Object System.Drawing.StringFormat
                        $badgeFormat.Alignment = [System.Drawing.StringAlignment]::Center
                        $badgeFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
                        $badgeTextRect = New-Object System.Drawing.RectangleF $badgeRect.X, $badgeRect.Y, $badgeRect.Width, $badgeRect.Height
                        $graphics.DrawString('SA', $badgeFont, $whiteBrush, $badgeTextRect, $badgeFormat)
                    } finally {
                        $badgeFont.Dispose()
                    }

                    if ($size.Width -le 130) {
                        $titleFont = New-Object System.Drawing.Font('Segoe UI', 15, [System.Drawing.FontStyle]::Bold)
                        $subFont = New-Object System.Drawing.Font('Segoe UI', 7.5, [System.Drawing.FontStyle]::Regular)
                        try {
                            $graphics.DrawString('SpacioArte', $titleFont, $accentDarkBrush, 12, 50)
                            $graphics.DrawString('ERP x Kommo', $subFont, $accentDarkBrush, 12, 74)
                        } finally {
                            $titleFont.Dispose()
                            $subFont.Dispose()
                        }
                    } else {
                        $titleFontSize = if ($size.Width -ge 400) { 28 } else { 20 }
                        $subFontSize = if ($size.Width -ge 400) { 12 } else { 10 }
                        $titleFont = New-Object System.Drawing.Font('Segoe UI', $titleFontSize, [System.Drawing.FontStyle]::Bold)
                        $subFont = New-Object System.Drawing.Font('Segoe UI', $subFontSize, [System.Drawing.FontStyle]::Regular)
                        try {
                            $textX = $padding + $badgeWidth + 14
                            $titleY = if ($size.Height -ge 200) { 84 } else { 20 }
                            $subY = $titleY + $titleFontSize + 8
                            $graphics.DrawString('SpacioArte ERP', $titleFont, $accentDarkBrush, $textX, $titleY)
                            $graphics.DrawString('Invoices, quotes and order tracking in Kommo', $subFont, $accentDarkBrush, $textX, $subY)
                        } finally {
                            $titleFont.Dispose()
                            $subFont.Dispose()
                        }
                    }
                }
            } finally {
                $accentBrush.Dispose()
                $accentDarkBrush.Dispose()
                $whiteBrush.Dispose()
                $linePen.Dispose()
            }

            $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $graphics.Dispose()
        }
    } finally {
        $bitmap.Dispose()
    }
}

Write-Output "Kommo logos generated successfully in $imagesDir"
