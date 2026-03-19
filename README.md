# Sidewalk Roleplay Simulator

## 移动端（iOS Safari）使用说明

- 必须使用 HTTPS 域名访问，才能在 iOS Safari 上启用麦克风与稳定的音频播放。
- 部署到支持 HTTPS 的平台（推荐 Vercel），或自托管 + Nginx/Traefik 配置 TLS。
- 首次点击麦克风/播放按钮时，根据系统提示授予权限；所有音频相关操作需由用户手势触发。

### 快速部署（Vercel 推荐）
1. 将仓库推到 GitHub/GitLab，导入 Vercel。
2. 在 Vercel 项目 Settings → Environment Variables 配置下述环境变量。
3. Redeploy，使用生成的 HTTPS 域名在 iPhone Safari 中访问。

### 本地联调（临时）
- 开发脚本已默认对外监听：`npm run dev` → http://0.0.0.0:3003
- 局域网仅用于 UI 调试；麦克风与部分音频策略在 HTTP 下受限。可用 ngrok/Cloudflare Tunnel 将本地服务暴露为 HTTPS：
  - `ngrok http 3003` → 使用 https://xxxx.ngrok.io 在手机访问。

## 环境变量

服务端读取以下变量；请在部署平台或 `.env.local` 中配置：

### LLM（DeepSeek）
- `DEEPSEEK_API_KEY`（必填）
- `DEEPSEEK_API_URL`（可选，默认 `https://api.deepseek.com/v1/chat/completions`）

### 语音（科大讯飞 STT/TTS）
- `IFLYTEK_APP_ID`（必填）
- `IFLYTEK_API_KEY`（必填）
- `IFLYTEK_IAT_URL`（可选，默认 `https://api.xfyun.cn/v1/service/v1/iat`）
- `IFLYTEK_TTS_URL`（可选，默认 `https://api.xfyun.cn/v1/service/v1/tts`）

### 翻译（LibreTranslate，按需启用）
- `LIBRETRANSLATE_URL`（推荐使用官方或自建实例，如 `https://libretranslate.com/translate`）
- `LIBRETRANSLATE_API_KEY`（托管端点通常需要）
  - 已提供服务端代理 `/api/translate`；前端仅调用此路由，避免在浏览器暴露密钥。
  - 若未配置密钥，服务端将**降级直出原文**避免中断流程。

## 常用脚本

- `npm run dev`：开发模式，监听 `0.0.0.0:3003`
- `npm run build`：构建产物
- `npm start`：生产模式启动，监听 `0.0.0.0:3003`

## 接口说明（节选）

- `POST /api/turn`：对话推进
- `POST /api/stt/iflytek`：语音识别（WAV 原始 PCM → 文本）
- `POST /api/tts/iflytek`：语音合成（文本 → 音频）
- `POST /api/translate`：翻译代理（body: `{ q, source='auto', target, format='text' }` → `{ text }`）

## 上线检查清单（iOS Safari）

- 域名已启用 HTTPS，证书有效
- 环境变量已配置（DeepSeek、讯飞、翻译按需）
- 首次访问授予麦克风/音频权限后，能正常进行语音输入与播报
- `/api/translate` 无 400 错误（如未配置密钥则自动降级直出原文）

