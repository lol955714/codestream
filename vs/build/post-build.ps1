param([string] $checkoutDir = $pwd, [string] $assetEnv = "", [string] $buildNumber = $env:build_number)

Write-Host '**** The script is running in directory' (Get-Location)

$codestreamVsDir = $checkoutDir + '\vs'
$buildDir = $checkoutDir + '\vs\build'
$assetDir = $buildDir + '\artifacts\Release'

Write-Host '**** changing to buildDir' $buildDir
cd $buildDir
Write-Host '**** Working directory is' (Get-Location)

Import-Module -Name $buildDir\modules.ps1
Import-Module -Name $buildDir\Modules\Vsix.ps1
Import-Module -Name $buildDir\Modules\Versioning.ps1


$codeVer = Read-Version "x64"
Write-Host '***** codeVer: ' $codeVer
#$assetVer = $codeVer.ToString() + '+' + $buildNumber
$assetVer = $codeVer.ToString()
Write-Host '***** asset version: ' $assetVer
$assetsBaseName = 'codestream-vs-' + $assetVer

$commitIds = @{}
cd $codestreamVsDir
$commitIds.codestream_vs = git rev-parse HEAD

$assetInfo = @{}
$assetInfo.assetEnvironment = $assetEnv
$assetInfo.name = "codestream-vs"
$assetInfo.version = $codeVer.ToString()
$assetInfo.buildNumber = $buildNumber
$assetInfo.repoCommitId = $commitIds
$infoFileName = $assetDir + '\' + $assetsBaseName + '.info'
Write-Host '********** Creating ' $infoFileName
$assetInfo | ConvertTo-Json | Out-File $infoFileName

$x86AssetName = $assetsBaseName + '-x86.vsix'
$x64AssetName = $assetsBaseName + '-x64.vsix'
Write-Host '********** Renaming vsix to ' $x86AssetName ' & ' $x64AssetName
cd $assetDir
mv codestream-vs.vsix $x86AssetName
mv codestream-vs-22.vsix $x64AssetName
