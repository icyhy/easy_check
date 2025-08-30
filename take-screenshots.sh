#!/bin/bash
# 自动化截图脚本 - 自律打卡小程序
# 使用说明：确保微信开发者工具已打开项目，然后运行此脚本

echo "🚀 自律打卡小程序 - 自动化截图工具"
echo "================================================"
echo "请确保微信开发者工具已打开项目并可以正常预览"
echo "按 Ctrl+C 可随时退出脚本"
echo ""

# 检查 screenshots 目录是否存在，不存在则创建
if [ ! -d "screenshots" ]; then
    echo "📁 创建 screenshots 目录..."
    mkdir -p screenshots
fi

echo "开始截图流程，请按照提示操作..."
sleep 2

echo ""
echo "📱 1/5 - 打卡页面截图"
echo "请在微信开发者工具中导航到【打卡】页面，确保页面显示正常"
echo "准备好后按回车键开始截图..."
read
echo "请选择截图区域（建议选择手机模拟器区域）"
screencapture -i -x screenshots/checkin-page.png
echo "✅ 打卡页面截图完成"

echo ""
echo "📋 2/5 - 任务管理页面截图"
echo "请导航到【任务】页面，确保有一些示例任务数据"
echo "准备好后按回车键开始截图..."
read
echo "请选择截图区域"
screencapture -i -x screenshots/tasks-page.png
echo "✅ 任务管理页面截图完成"

echo ""
echo "⏰ 3/5 - 专注模式页面截图"
echo "请导航到【专注】页面，展示番茄钟或计时功能"
echo "准备好后按回车键开始截图..."
read
echo "请选择截图区域"
screencapture -i -x screenshots/focus-page.png
echo "✅ 专注模式页面截图完成"

echo ""
echo "🏆 4/5 - 成就系统页面截图"
echo "请导航到【成就】页面，展示成就徽章和进度"
echo "准备好后按回车键开始截图..."
read
echo "请选择截图区域"
screencapture -i -x screenshots/achievements-page.png
echo "✅ 成就系统页面截图完成"

echo ""
echo "📊 5/5 - 项目管理页面截图"
echo "请导航到【项目管理】页面（如果有的话）"
echo "准备好后按回车键开始截图..."
read
echo "请选择截图区域"
screencapture -i -x screenshots/projects-page.png
echo "✅ 项目管理页面截图完成"

echo ""
echo "🎉 截图完成！"
echo "================================================"
echo "所有截图已保存到 screenshots 目录："
ls -la screenshots/*.png 2>/dev/null || echo "⚠️  未找到截图文件，请检查截图过程是否正常"
echo ""
echo "📝 接下来你可以："
echo "1. 检查 screenshots 目录中的截图质量"
echo "2. 如需重新截图，可以删除对应文件后重新运行脚本"
echo "3. 将截图添加到 README.md 中展示应用功能"
echo ""
echo "感谢使用自动化截图工具！ 🚀"