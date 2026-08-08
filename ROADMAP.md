# 🗺️ VTAWEB Evolution Roadmap

> 本文档记录了 VTAWEB 未来的架构演进方向与待开发的高级特性。

---

## 📅 [Future Feature] 首页智能对话框 (AI Chat Assistant)

**需求目标**：在 VTAWEB 首页植入一个智能对话框，允许用户直接提问。该模块需要支持多模型路由（如 Gemini 1.5 Pro 与本地 Ollama），以实现成本和效率的最优化。

**技术栈冲突提示**：
VTAWEB 是一个基于 **Next.js (TypeScript / Node.js)** 的全栈项目，无法直接在代码中 `npm install litellm` (因为 LiteLLM 是 Python 原生 SDK)。

为了解决跨语言模型路由问题，未来接手的开发者必须从以下两个架构方案中选择其一：

### 方案 A：Cloudflare AI Gateway (🔥 强烈推荐，适合全栈部署)
利用 Cloudflare 官方提供的免费 AI 网关，无需部署任何额外服务器即可获得 API 路由、负载均衡和极速边缘缓存。

- **实施步骤**:
  1. 在 Cloudflare Dashboard 创建 `AI Gateway`，获取唯一的网关 URL。
  2. 在 VTAWEB 中安装标准的官方库：`npm install openai`。
  3. 在 Next.js 的服务端路由 (`src/app/api/chat/route.ts`) 中，将请求指向 Cloudflare 网关：
     ```typescript
     import OpenAI from 'openai';

     // 使用通用的 OpenAI 客户端，但劫持 BaseURL 指向 Cloudflare
     const client = new OpenAI({
       baseURL: 'https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_TAG/YOUR_GATEWAY/openai',
       apiKey: process.env.GEMINI_API_KEY // 无论底层什么模型，统一配置
     });

     // Cloudflare 网关会在边缘节点自动做协议转换和缓存
     const response = await client.chat.completions.create({
       model: 'gemini-1.5-pro',
       messages: [{ role: 'user', content: '你好' }],
     });
     ```

### 方案 B：LiteLLM 独立网关模式 (适合私有化/本地调试)
不使用云端代理，而是自己在本地机器或云服务器上跑一个 LiteLLM Docker 容器充当“本地交警”。

- **实施步骤**:
  1. 在 VTAWEB 环境之外，起一个 Docker 进程：`docker run litellm/litellm` (暴露 4000 端口)。
  2. 在 `litellm_config.yaml` 中配置好所有的 LLM 映射（如将 `gemini` 映射到云端，`ollama` 映射到本地 `11434`）。
  3. 在 Next.js 后端代码中，依然使用官方 `openai` 包，但将 URL 指向本地：
     ```typescript
     import OpenAI from 'openai';

     const client = new OpenAI({
       baseURL: 'http://localhost:4000/v1',
       apiKey: 'sk-litellm-proxy' // 随便填，LiteLLM 自己会处理真实的 API Key
     });
     ```
