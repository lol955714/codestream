param(
[string] $ConfigurationName,
[string] $SolutionDir,
[string] $TargetDir
)
Write-Host ""
Write-Host "CS4VS Post-Build.ps1 Starting..."
Write-Host ""
Write-Host ""

Write-Host "ProjectDir=$($ProjectDir)"
Write-Host "SolutionDir=$($SolutionDir)"
Write-Host "TargetDir=$($TargetDir)"
Write-Host ""

if ($ConfigurationName -eq "Debug") {
	pushd ..\..\..\..\..\build
	& .\Extract-Pdb.ps1
	popd
}

xcopy /E /Y "$($SolutionDir)..\publish" "$($TargetDir)publish\"

Write-Host ""
Write-Host ""
Write-Host "VS Post-Build.ps1 Completed"
Write-Host ""
Write-Host ""
