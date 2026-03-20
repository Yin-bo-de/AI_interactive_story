# 幻境回响 - 互动式AI推理叙事游戏

## 项目简介

"幻境回响"是一个互动式AI推理叙事游戏，用户通过与AI角色互动，共同推进剧情，在30分钟内体验一个完整的推理故事。

## 技术架构

### 后端架构
- **框架**: Python FastAPI
- **AI模型**: 支持OpenAI、Anthropic、智谱AI、DeepSeek等多种大模型
- **核心功能**:
  - 会话管理：处理用户会话状态
  - 上下文存储：维护完整的对话历史和关键信息
  - LLM API交互：与AI模型通信
  - 计时与轮次控制：30分钟倒计时 + 100轮上限
  - 结局种子机制：内部生成多个可能的结局，根据玩家选择动态调整

### 前端架构
- **框架**: React + Vite
- **路由**: React Router
- **状态管理**: React Context API
- **UI特点**: PC端宽屏适配，沉浸式阅读体验

## 目录结构

```
AI_interactive_story/
├── 产品文档.md              # 产品设计文档
├── 技术文档.md              # 技术设计文档
├── CLAUDE.md                # Claude Code 项目指导
├── README.md                # 项目说明（本文件）
├── todo.md                  # 待办事项
├── .env.example             # 环境变量模板
├── backend/                # 后端服务
│   ├── api/               # API路由
│   │   ├── __init__.py
│   │   ├── main.py       # FastAPI应用入口
│   │   ├── sessions.py   # 会话相关API
│   │   ├── messages.py   # 消息交互API
│   │   └── game.py      # 游戏状态API
│   ├── models/            # 数据模型
│   │   ├── __init__.py
│   │   ├── session.py          # 会话模型
│   │   ├── story_state.py      # 故事状态模型
│   │   └── dialogue.py        # 对话模型
│   ├── prompts/           # AI Prompt模板
│   │   ├── __init__.py
│   │   ├── init_prompt.py      # 开局Prompt
│   │   ├── continue_prompt.py   # 互动推进Prompt
│   │   └── end_prompt.py       # 游戏结束Prompt
│   ├── services/          # 核心业务逻辑
│   │   ├── __init__.py
│   │   ├── llm_service.py      # AI模型调用
│   │   ├── session_service.py   # 会话管理
│   │   ├── story_service.py     # 故事逻辑
│   │   └── timer_service.py    # 计时器服务
│   ├── scripts/           # 工具脚本
│   │   └── generate_code.py   # 兑换码生成脚本
│   └── main.py            # 后端入口文件
├── frontend/              # 前端应用
│   ├── public/             # 静态资源
│   │   └── assets/         # 图片、音频等资源
│   ├── src/
│   │   ├── api/         # API客户端
│   │   │   ├── client.js      # Axios配置
│   │   │   ├── session.js     # 会话API
│   │   │   └── message.js     # 消息API
│   │   ├── components/   # React组件
│   │   │   ├── GameState.jsx      # 游戏状态显示
│   │   │   ├── ChatContainer.jsx  # 聊天容器
│   │   │   ├── InputArea.jsx      # 输入区域
│   │   │   ├── OptionsPanel.jsx   # 引导选项面板
│   │   │   ├── CharacterInfo.jsx  # 角色信息
│   │   │   ├── Typewriter.jsx    # 打字机效果
│   │   │   └── BackgroundMusic.jsx # 背景音乐
│   │   ├── contexts/    # React Context
│   │   │   └── GameContext.jsx   # 游戏全局状态
│   │   ├── pages/       # 页面组件
│   │   │   ├── Home.jsx       # 首页
│   │   │   ├── Intro.jsx      # 开场介绍页
│   │   │   ├── Game.jsx       # 游戏主页面
│   │   │   └── Result.jsx     # 结局页面
│   │   ├── App.jsx       # 主应用组件
│   │   └── main.jsx      # 入口文件
│   ├── .env.example      # 前端环境变量
│   └── vite.config.js    # Vite配置
├── venv/                 # Python虚拟环境
└── log/                   # 日志目录
```

## 快速开始

### 1. 配置环境变量

复制 `.env.example` 到 `.env` 并配置相关参数：

```bash
# 后端配置
cp .env.example .env
```

编辑 `.env` 文件，设置 AI API 配置：

```env
AI_MODEL_PROVIDER=openai
AI_MODEL_NAME=gpt-4o
AI_API_KEY=your_api_key_here
```

```bash
# 前端配置
cd frontend
cp .env.example .env
```

### 2. 启动服务

**一键启动前后端（推荐）：**

```bash
./start.sh
```

该脚本会自动：
- 检测并停止占用端口的现有进程
- 启动后端服务（端口 8000）
- 启动前端服务（端口 5173）
- 显示服务访问地址和日志位置

停止服务：

```bash
./stop.sh
```

**分别启动服务：**

启动后端：

```bash
./start_backend.sh
```

启动前端：

```bash
./start_frontend.sh
```

**手动启动：**

后端服务：

```bash
# 激活虚拟环境
source venv/bin/activate

# 启动后端
cd backend
python main.py
```

前端服务：

```bash
cd frontend
npm install
npm run dev
```

### 3. 访问服务

- 前端地址: http://localhost:5173
- 后端地址: http://localhost:8000
- API文档: http://localhost:8000/docs

## API文档

### 会话相关

#### 创建会话

```
POST /sessions/create
```

#### 验证API配置

```
POST /sessions/verify-api
```

**请求参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| api_key | string | 是 | API Key |
| api_base | string | 是 | API Base URL |
| model_name | string | 否 | 模型名称，默认 gpt-4o |

**响应示例：**

```json
{
  "success": true,
  "message": "API验证成功"
}
```

#### 验证兑换码

```
POST /sessions/verify-code
```

**请求参数：**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| code | string | 是 | 兑换码（格式：XXXX-XXXX-XXXX-XXXX）|

**响应示例：**

```json
{
  "success": true,
  "message": "兑换码验证成功",
  "remaining_games": 10,
  "api_key": "sk-xxx",
  "api_base": "https://api.openai.com/v1",
  "model_name": "gpt-4o"
}
```

#### 进入现场

```
POST /sessions/{session_id}/enter-scene
```

#### 获取会话状态

```
GET /sessions/{session_id}/status
```

#### 获取会话详情

```
GET /sessions/{session_id}
```

#### 删除会话

```
DELETE /sessions/{session_id}
```

#### 结束游戏

```
POST /sessions/{session_id}/end-game
```

### 消息交互

#### 发送消息

```
POST /sessions/{session_id}/messages/send
```

#### 获取消息历史

```
GET /sessions/{session_id}/messages
```

## 兑换码生成

### 基本用法

```bash
# 激活虚拟环境
source venv/bin/activate

# 进入脚本目录
cd backend/scripts

# 生成1个兑换码
python generate_code.py --api-key "your-api-key" --api-base "https://api.openai.com/v1/chat/completions" 
```

### 参数说明

| 参数 | 说明 | 是否必需 | 默认值 |
|------|------|---------|---------|
| `-n, --count` | 生成兑换码数量 | 否 | 1 |
| `--api-key` | API Key | 是 | - |
| `--api-base` | API Base URL | 是 | - |
| `--model-name` | 模型名称 | 否 | `gpt-4o` |
| `-o, --output` | 输出文件名 | 否 | `redemption_codes.json` |
| `--load-to-server` | 生成服务器端配置文件 | 否 | - |

### 使用示例

```bash
# 生成5个兑换码
python3 generate_code.py -n 5 \
  --api-key "sk-xxxxxxxxxxxxxxxxxxxxxxxx" \
  --api-base "https://api.openai.com/v1/chat/completions" \
  --model-name "gpt-4o"

# 生成兑换码并生成服务器端配置
python generate_code.py -n 3 \
  --api-key "sk-xxxxxxxxxxxxxxxxxxxxxxxx" \
  --api-base "https://api.openai.com/v1/chat/completions" \
  --model-name "gpt-4o" \
  --load-to-server

# 指定输出文件名
python3 generate_code.py -n 2 \
  --api-key "sk-xxxxxxxxxxxxxxxxxxxxxxxx" \
  --api-base "https://api.openai.com/v1/chat/completions" \
  -o "my_codes.json"
```

### 输出文件

1. **兑换码文件** (`redemption_codes.json`)：

```json
{
  "XXXX-XXXX-XXXX-XXXX": {
    "api_key": "sk-xxx",
    "api_base": "https://api.openai.com/v1/chat/completions",
    "model_name": "gpt-4o",
    "remaining_games": 10
  }
}
```

2. **服务器端配置** (`server_codes.json`) - 使用 `--load-to-server` 参数时生成：

```json
{
  "redemption_codes": {
    "XXXX-XXXX-XXXX-XXXX": {
      "api_key": "sk-xxx",
      "api_base": "https://api.openai.com/v1/chat/completions",
      "model_name": "gpt-4o",
      "remaining_games": 10
    }
  }
}
```

### 注意事项

1. 兑换码格式为 `XXXX-XXXX-XXXX-XXXX`（19个字符）
2. 每个兑换码默认可玩10局游戏
3. 生成的兑换码需要手动添加到后端的 `_redemption_codes` 字典中，或修改后端代码从文件加载

## 核心功能

### 结局种子机制

1. **开局**: AI生成故事背景的同时，在内部生成3个可能的结局种子
2. **推进**: 根据用户输入，选择最合适的种子靠拢，逐步丰满线索
3. **结局**: 根据实际选择的路径生成最终结局

### 上下文管理

- **全量存储**: 后端维护完整对话历史
- **滑动窗口**: 发送给API时采用"关键摘要 + 最近N轮对话"
- **关键信息**: 故事背景、人物、线索、结局种子作为固定系统提示
- **状态结构化**: 维护JSON格式的剧情状态

### 游戏控制

- **30分钟倒计时**: 后端启动，独立于前端
- **100轮上限**: 每完成一次"用户输入->AI回复"循环，计数器+1
- **结束条件**: 时间或轮次任一先到即触发结束

### API配置与兑换码

- **直接配置**: 用户可输入API Key和Base URL进行游戏
- **兑换码模式**: 用户输入兑换码，系统自动获取对应的API配置
- **验证机制**: 配置和兑换码都需要验证通过后才能开始游戏
- **本地存储**: 验证通过的配置保存在localStorage中

## 开发规范

- Python 遵循 PEP 8
- 使用 loguru 记录日志
- 添加必要的中文注释
- 使用类型提示（Type Hints）
- 前端使用 React Hooks 和函数式组件

## 技术栈

### 后端
- FastAPI - Web框架
- Pydantic - 数据验证
- Loguru - 日志记录
- HTTPX - 异步HTTP客户端
- Python-dotenv - 环境变量管理

### 前端
- React 18 - UI框架
- Vite - 构建工具
- React Router - 路由管理
- Axios - HTTP客户端

## 许可证

本项目仅供学习和研究使用。
