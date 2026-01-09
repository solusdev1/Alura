# Script PowerShell para capturar AD Display Name e salvar no MongoDB via API local
# Executa de forma rapida e confiavel

param(
    [string]$ApiUrl = "http://172.16.2.176:3002/api/save-display-name",
    [int]$TimeoutSeconds = 10
)

try {
    Write-Host "Iniciando captura de Display Name do AD..." -ForegroundColor Cyan
    
    # 1 - Obter informacoes do dispositivo
    $hostname = $env:COMPUTERNAME
    $domain = if ($env:USERDNSDOMAIN) { $env:USERDNSDOMAIN } else { "carrarologistica.com.br" }
    $fqdn = "$hostname.$domain"
    
    Write-Host "Dispositivo: $fqdn" -ForegroundColor Yellow
    
    # 2 - Obter Display Name do AD do usuario logado
    $currentUser = $env:USERNAME
    $userDomain = $env:USERDOMAIN
    
    Write-Host "Usuario atual: $userDomain\$currentUser" -ForegroundColor Yellow
    
    # Verificar se e conta de computador (termina com $)
    if ($currentUser -match '\$$') {
        Write-Host "Executando como conta de computador" -ForegroundColor Yellow
        # Tentar pegar o usuario logado da sessao
        try {
            $loggedUser = (Get-WmiObject -Class Win32_ComputerSystem).UserName
            if ($loggedUser -match '\\(.+)$') {
                $currentUser = $Matches[1]
                Write-Host "Usuario logado detectado: $currentUser" -ForegroundColor Green
            }
        } catch {
            Write-Host "Nao foi possivel detectar usuario logado" -ForegroundColor Yellow
        }
    }
    
    # Buscar informacoes do AD usando ADSI (nao requer modulo ActiveDirectory)
    $displayName = $currentUser  # Valor padrao
    
    try {
        Write-Host "Buscando Display Name no AD via ADSI..." -ForegroundColor Cyan
        
        $searcher = New-Object DirectoryServices.DirectorySearcher
        $searcher.Filter = "(&(objectCategory=User)(sAMAccountName=$currentUser))"
        $searcher.PropertiesToLoad.Add("displayName") | Out-Null
        $searcher.PropertiesToLoad.Add("cn") | Out-Null
        
        $result = $searcher.FindOne()
        
        if ($result -and $result.Properties["displayname"]) {
            $displayName = $result.Properties["displayname"][0]
            Write-Host "DisplayName encontrado: $displayName" -ForegroundColor Green
        } elseif ($result -and $result.Properties["cn"]) {
            $displayName = $result.Properties["cn"][0]
            Write-Host "CN encontrado: $displayName" -ForegroundColor Green
        } else {
            Write-Host "Display Name nao encontrado no AD, usando username" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Erro ao buscar no AD: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Usando username como fallback" -ForegroundColor Cyan
    }
    
    Write-Host "`nInformacoes coletadas!" -ForegroundColor Green
    Write-Host "   Dispositivo: $fqdn" -ForegroundColor White
    Write-Host "   Display Name: $displayName" -ForegroundColor White
    Write-Host "   Username: $currentUser" -ForegroundColor White
    
    # 3 - Enviar para API local (MongoDB)
    Write-Host "`nSalvando no servidor local..." -ForegroundColor Cyan
    
    $body = @{
        deviceName = $fqdn
        hostname = $hostname
        displayName = $displayName
        username = $currentUser
        domain = $userDomain
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $body -ContentType "application/json" -TimeoutSec $TimeoutSeconds
        
        if ($response.success) {
            Write-Host "SUCESSO! Display Name salvo no servidor!" -ForegroundColor Green
            Write-Host "   Dispositivo: $($response.deviceName)" -ForegroundColor White
            Write-Host "   Display Name: $($response.displayName)" -ForegroundColor White
        } else {
            Write-Host "Erro: $($response.error)" -ForegroundColor Yellow
        }
        
        # Retornar JSON de sucesso
        $finalResult = @{
            success = $true
            deviceName = $fqdn
            displayName = $displayName
            saved = $response.success
        } | ConvertTo-Json
        
        Write-Output $finalResult
        
    } catch {
        Write-Host "Erro ao conectar com servidor: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Os dados foram coletados mas nao salvos" -ForegroundColor Cyan
        
        # Retornar JSON mesmo com erro de conexao
        $fallbackResult = @{
            success = $true
            deviceName = $fqdn
            displayName = $displayName
            saved = $false
            error = "Servidor inacessivel"
        } | ConvertTo-Json
        
        Write-Output $fallbackResult
    }
    
} catch {
    Write-Host "`nERRO: $($_.Exception.Message)" -ForegroundColor Red
    
    # Retornar erro em JSON
    $errorResult = @{
        success = $false
        error = $_.Exception.Message
        deviceName = $env:COMPUTERNAME
    } | ConvertTo-Json
    
    Write-Output $errorResult
    exit 1
}
