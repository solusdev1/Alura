# Script PowerShell para dispositivos REMOTOS (outras filiais/redes)
# Salva dados diretamente no MongoDB Atlas via Vercel (público)
# NÃO depende do servidor local 172.16.0.176

param(
    [string]$ApiUrl = "https://inventario-two-gamma.vercel.app/api/save-remote",
    [int]$TimeoutSeconds = 15
)

# ===============================
# CONFIGURACAO DE CACHE
# ===============================
$cacheFolder = Join-Path $env:TEMP "Action1Cache"
$cacheFile = Join-Path $cacheFolder "$env:COMPUTERNAME.json"

if (-not (Test-Path $cacheFolder)) {
    New-Item -Path $cacheFolder -ItemType Directory -Force | Out-Null
}

# ===============================
# FUNCOES AUXILIARES
# ===============================

function Send-ToServer {
    param($data, $url, $timeout)
    try {
        $json = $data | ConvertTo-Json -Depth 3
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $json -ContentType "application/json" -TimeoutSec $timeout
        return @{ success = $true; response = $response }
    } catch {
        return @{ success = $false; error = $_.Exception.Message }
    }
}

function Save-ToCache {
    param($data)
    try {
        $cacheData = @{
            timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            data = $data
        }
        $cacheData | ConvertTo-Json -Depth 5 | Set-Content -Path $cacheFile -Force
        Write-Host "   Dados salvos em cache local: $cacheFile" -ForegroundColor Yellow
        return $true
    } catch {
        Write-Host "   Erro ao salvar cache: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Try-SendPendingCache {
    param($url, $timeout)
    if (Test-Path $cacheFile) {
        try {
            $cached = Get-Content $cacheFile | ConvertFrom-Json
            Write-Host "   Encontrados dados em cache de $($cached.timestamp)" -ForegroundColor Cyan
            
            $result = Send-ToServer -data $cached.data -url $url -timeout $timeout
            if ($result.success) {
                Remove-Item $cacheFile -Force
                Write-Host "   Cache enviado e limpo com sucesso!" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "   Erro ao processar cache: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    return $false
}

function Get-PublicIP {
    try {
        $response = Invoke-RestMethod "https://api.ipify.org?format=json" -TimeoutSec 5
        return $response.ip
    } catch {
        return $null
    }
}

function Get-CityFromIP {
    param ($ip)
    try {
        $geo = Invoke-RestMethod "https://ipinfo.io/$ip/json" -TimeoutSec 5
        return $geo.city
    } catch {
        return $null
    }
}

# ===============================
# INICIO DO SCRIPT
# ===============================

try {
    Write-Host "Iniciando captura de informacoes do dispositivo (REMOTO)..." -ForegroundColor Cyan
    
    # 0 - Tentar enviar dados pendentes do cache
    Write-Host "`nVerificando cache pendente..." -ForegroundColor Cyan
    Try-SendPendingCache -url $ApiUrl -timeout $TimeoutSeconds
    
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
    
    # 3 - Detectar cidade baseada no IP publico
    Write-Host "`nDetectando localizacao..." -ForegroundColor Cyan
    
    $city = "Desconhecida"
    $publicIP = Get-PublicIP
    
    if ($publicIP) {
        Write-Host "   IP Publico: $publicIP" -ForegroundColor White
        $detectedCity = Get-CityFromIP $publicIP
        if ($detectedCity) {
            $city = $detectedCity
            Write-Host "   Cidade detectada: $city" -ForegroundColor Green
        } else {
            Write-Host "   Cidade nao detectada, usando padrao" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   Nao foi possivel obter IP publico" -ForegroundColor Yellow
    }
    
    Write-Host "`nInformacoes coletadas!" -ForegroundColor Green
    Write-Host "   Dispositivo: $fqdn" -ForegroundColor White
    Write-Host "   Display Name: $displayName" -ForegroundColor White
    Write-Host "   Username: $currentUser" -ForegroundColor White
    Write-Host "   Cidade: $city" -ForegroundColor White
    
    # 4 - Enviar para API Cloud (Vercel + MongoDB Atlas)
    Write-Host "`nSalvando na nuvem (Vercel)..." -ForegroundColor Cyan
    Write-Host "   URL: $ApiUrl" -ForegroundColor Gray
    
    $dataToSend = @{
        deviceName = $fqdn
        hostname = $hostname
        displayName = $displayName
        username = $currentUser
        domain = $userDomain
        city = $city
        publicIP = $publicIP
    }
    
    $sendResult = Send-ToServer -data $dataToSend -url $ApiUrl -timeout $TimeoutSeconds
    
    if ($sendResult.success) {
        $response = $sendResult.response
        
        Write-Host "SUCESSO! Informacoes salvas na nuvem!" -ForegroundColor Green
        Write-Host "   Dispositivo: $($response.deviceName)" -ForegroundColor White
        Write-Host "   Display Name: $($response.displayName)" -ForegroundColor White
        
        # Retornar JSON de sucesso com Custom Attributes para Action1
        $finalResult = @{
            success = $true
            deviceName = $fqdn
            displayName = $displayName
            city = $city
            saved = $true
            location = "Cloud (Vercel)"
            customAttributes = @(
                @{
                    name = "AD Display Name"
                    value = $displayName
                }
                @{
                    name = "City"
                    value = $city
                }
            )
        } | ConvertTo-Json -Depth 3
        
        Write-Output $finalResult
        
    } else {
        Write-Host "Erro ao conectar com servidor cloud: $($sendResult.error)" -ForegroundColor Yellow
        Write-Host "Salvando dados em cache local..." -ForegroundColor Cyan
        
        $cached = Save-ToCache -data $dataToSend
        
        # Retornar JSON mesmo com erro de conexao (com Custom Attributes)
        $fallbackResult = @{
            success = $true
            deviceName = $fqdn
            displayName = $displayName
            city = $city
            saved = $false
            cached = $cached
            error = "Servidor cloud inacessivel - dados em cache"
            customAttributes = @(
                @{
                    name = "AD Display Name"
                    value = $displayName
                }
                @{
                    name = "City"
                    value = $city
                }
            )
        } | ConvertTo-Json -Depth 3
        
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
