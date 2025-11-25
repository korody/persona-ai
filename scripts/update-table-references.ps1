# Script para atualizar referências de 'exercises' para 'hub_exercises' nos scripts
# Executa de forma segura, verificando cada arquivo antes de modificar

Write-Host "🔄 Atualizando referências de 'exercises' para 'hub_exercises' nos scripts..." -ForegroundColor Cyan

$scriptPath = "C:\projetos\persona-ai\scripts"
$files = Get-ChildItem -Path $scriptPath -Filter "*.ts" -Recurse

$updated = 0
$skipped = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Verificar se contém .from('exercises') ou .from("exercises")
    if ($content -match "\.from\([`"']exercises[`"']\)") {
        Write-Host "`n📄 Processando: $($file.Name)" -ForegroundColor Yellow
        
        # Substituir .from('exercises') por .from('hub_exercises')
        $newContent = $content -replace "\.from\('exercises'\)", ".from('hub_exercises')"
        $newContent = $newContent -replace '\.from\("exercises"\)', '.from("hub_exercises")'
        
        # Salvar apenas se houve mudança
        if ($content -ne $newContent) {
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
            Write-Host "  ✅ Atualizado!" -ForegroundColor Green
            $updated++
        } else {
            Write-Host "  ⏭️  Sem alterações necessárias" -ForegroundColor Gray
            $skipped++
        }
    }
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "`nRESUMO:" -ForegroundColor Cyan
Write-Host "  Arquivos atualizados: $updated" -ForegroundColor Green
Write-Host "  Arquivos ignorados: $skipped" -ForegroundColor Gray
Write-Host "`nConcluido!" -ForegroundColor Green
