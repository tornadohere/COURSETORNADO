param(
  [Parameter(Mandatory = $true)]
  [string]$InputVideo,

  [Parameter(Mandatory = $false)]
  [string]$OutputDir
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  Write-Error "FFmpeg is not installed or not in PATH. Install it via: winget install Gyan.FFmpeg"
  exit 1
}

if (-not (Test-Path $InputVideo)) {
  Write-Error "Input video file not found: $InputVideo"
  exit 1
}

$resolvedInput = (Resolve-Path $InputVideo).Path
$baseName = [System.IO.Path]::GetFileNameWithoutExtension($resolvedInput)

if (-not $OutputDir) {
  $parentDir = Split-Path -Parent $resolvedInput
  $OutputDir = Join-Path $parentDir "$baseName-hls"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# 1. Generate 16-byte random AES-128 encryption key
$keyBytes = New-Object byte[] 16
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($keyBytes)
$rng.Dispose()

$keyPath = Join-Path $OutputDir "enc.key"
[System.IO.File]::WriteAllBytes($keyPath, $keyBytes)

$keyHex = ([System.BitConverter]::ToString($keyBytes) -replace "-", "").ToLowerInvariant()
Set-Content -Path (Join-Path $OutputDir "enc.key.hex") -Value $keyHex -NoNewline

# 2. Generate FFmpeg key info file (URI placeholder will be rewritten by Next.js API to /hls-key)
$keyInfoPath = Join-Path $OutputDir "enc.keyinfo"
$keyPathForward = $keyPath -replace "\\", "/"
@(
  "enc.key"
  $keyPathForward
  $keyHex
) | Set-Content -Path $keyInfoPath -Encoding Ascii

# 3. Convert video to AES-128 encrypted HLS segments (copy streams if H.264/AAC, fast!)
$playlistPath = Join-Path $OutputDir "index.m3u8"
$segmentPattern = Join-Path $OutputDir "seg_%04d.ts"

Write-Host "Encrypting and segmenting '$baseName' into HLS..." -ForegroundColor Cyan

& ffmpeg -y -i $resolvedInput `
  -c:v libx264 -preset veryfast -crf 21 -pix_fmt yuv420p `
  -c:a aac -b:a 128k `
  -hls_time 6 `
  -hls_playlist_type vod `
  -hls_key_info_file $keyInfoPath `
  -hls_segment_filename $segmentPattern `
  $playlistPath

# Remove temporary keyinfo file (keep enc.key.hex for pasting in Admin Dashboard, NEVER upload enc.key to R2!)
Remove-Item -Force $keyInfoPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done! Output folder: $OutputDir" -ForegroundColor Green
Write-Host "AES-128 Key (paste in Admin Dashboard):" -ForegroundColor Yellow
Write-Host $keyHex -ForegroundColor White
Write-Host ""
Write-Host "Upload ONLY 'index.m3u8' and all 'seg_*.ts' files in the Admin Dashboard." -ForegroundColor Cyan
