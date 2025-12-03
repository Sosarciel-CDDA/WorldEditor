# 配置文件路径
$configFile = "conda.json"

# 检查配置文件是否存在
if (-Not (Test-Path $configFile)) {
    Write-Host "配置文件 $configFile 不存在，请确认路径正确。"
    exit 1
}

# 读取 JSON 文件
$json = Get-Content $configFile | ConvertFrom-Json
$envName = $json.name

# 检查环境是否存在
$exists = conda env list | Select-String $envName

if ($exists) {
    Write-Host "环境 $envName 已存在，直接激活..."
    conda activate $envName
} else {
    Write-Host "环境 $envName 不存在，正在创建..."

    # 从 JSON 获取 channel、template、name
    $channel = $json.channel
    $template = $json.template

    # 创建 Conda 环境
    conda create -y -n $envName -c $channel $template
    conda activate $envName

    # 安装 npm 依赖
    if ($json.dependencies) {
        $deps = $json.dependencies.PSObject.Properties | ForEach-Object {
            "$($_.Name)@$($_.Value)"
        }
        Write-Host "正在安装 npm 依赖: $deps"
        npm install -g $deps
    } else {
        Write-Host "未在配置文件中找到 npm 依赖，跳过安装。"
    }
}
