#!/bin/bash

# Aurora MBTI 一键安装脚本
# 适用于 Linux/macOS 系统

set -e

echo "🌟 欢迎使用 Aurora MBTI 安装脚本！"
echo "这个脚本将帮你快速部署 AI 智能人格测试应用"
echo ""

# 检查系统要求
check_requirements() {
    echo "🔍 检查系统要求..."
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        echo "❌ 错误: 未找到 Git，请先安装 Git"
        exit 1
    fi
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ 错误: 未找到 Docker"
        echo "请访问 https://docs.docker.com/get-docker/ 安装 Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ 错误: 未找到 Docker Compose"
        echo "请安装 Docker Compose"
        exit 1
    fi
    
    echo "✅ 系统要求检查通过"
}

# 获取API配置
setup_environment() {
    echo ""
    echo "🔧 配置 AI API 服务"
    echo "支持 OpenAI、月之暗面、智谱AI、阿里通义等服务商"
    echo ""
    
    # 复制环境配置模板
    if [ ! -f ".env.local" ]; then
        cp env.template .env.local
        echo "📝 已创建环境配置文件 .env.local"
    fi
    
    # 提示用户配置
    echo "请选择你的 AI API 服务商："
    echo "1) OpenAI 官方"
    echo "2) 月之暗面 (Moonshot AI)"
    echo "3) 智谱AI (GLM)"
    echo "4) 阿里通义千问"
    echo "5) 手动配置"
    
    read -p "请输入选择 (1-5): " choice
    
    case $choice in
        1)
            api_url="https://api.openai.com"
            model="gpt-3.5-turbo"
            ;;
        2)
            api_url="https://api.moonshot.cn"
            model="moonshot-v1-8k"
            ;;
        3)
            api_url="https://open.bigmodel.cn/api/paas/v4"
            model="glm-4"
            ;;
        4)
            api_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
            model="qwen-plus"
            ;;
        5)
            read -p "请输入 API URL: " api_url
            read -p "请输入模型名称: " model
            ;;
        *)
            echo "无效选择，使用默认配置"
            api_url="https://api.openai.com"
            model="gpt-3.5-turbo"
            ;;
    esac
    
    read -p "请输入你的 API Key: " api_key
    
    # 更新配置文件
    sed -i.bak "s|OPENAI_API_URL=.*|OPENAI_API_URL=$api_url|" .env.local
    sed -i.bak "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$api_key|" .env.local
    sed -i.bak "s|OPENAI_MODEL=.*|OPENAI_MODEL=$model|" .env.local
    rm .env.local.bak
    
    echo "✅ API 配置完成"
}

# 构建和启动应用
deploy_application() {
    echo ""
    echo "🚀 构建和部署应用..."
    
    # 给构建脚本执行权限
    chmod +x docker-build.sh
    
    # 构建Docker镜像
    echo "📦 构建 Docker 镜像..."
    ./docker-build.sh
    
    # 启动应用
    echo "🎯 启动应用服务..."
    docker-compose up -d
    
    # 等待服务就绪
    echo "⏳ 等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if curl -s http://localhost:3000/api/health > /dev/null; then
        echo "✅ 应用启动成功！"
    else
        echo "⚠️  应用可能还在启动中，请稍等片刻"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 Aurora MBTI 部署完成！"
    echo ""
    echo "📍 访问地址:"
    echo "   应用首页: http://localhost:3000"
    echo "   健康检查: http://localhost:3000/api/health"
    echo ""
    echo "📋 常用命令:"
    echo "   查看状态: docker-compose ps"
    echo "   查看日志: docker-compose logs -f"
    echo "   停止应用: docker-compose down"
    echo "   重启应用: docker-compose restart"
    echo ""
    echo "📖 更多信息请查看 README.md 和 DOCKER_DEPLOYMENT.md"
    echo ""
    echo "🔧 如需修改配置，编辑 .env.local 文件后重启应用"
    echo ""
}

# 主安装流程
main() {
    check_requirements
    setup_environment
    deploy_application
    show_deployment_info
    
    echo "感谢使用 Aurora MBTI！🌟"
}

# 执行安装
main
