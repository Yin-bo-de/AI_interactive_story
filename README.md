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
├── .env.example             # 环境变量模板
├── backend/                # 后端服务
│   ├── api/               # API路由
│   │   ├── main.py       # FastAPI应用入口
│   │   ├── sessions.py   # 会话相关API
│   │   ├── messages.py   # 消息交互API
│   │   └── game.py      # 游戏状态API
│   ├── services/          # 核心业务逻辑
│   │   ├── llm_service.py      # AI模型调用
│   │   ├── session_service.py   # 会话管理
│   │   ├── story_service.py     # 故事逻辑
│   │   └── timer_service.py    # 计时器服务
│   ├── models/            # 数据模型
│   │   ├── session.py          # 会话模型
│   │   ├── story_state.py      # 故事状态模型
│   │   └── dialogue.py        # 对话模型
│   └── prompts/           # AI Prompt模板
│       ├── init_prompt.py      # 开局Prompt
│       ├── continue_prompt.py   # 互动推进Prompt
│       └── end_prompt.py       # 游戏结束Prompt
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── api/         # API客户端
│   │   │   ├── client.js      # Axios配置
│   │   │   ├── session.js     # 会话API
│   │   │   ├── message.js     # 消息API
│   │   │   └── game.js       # 游戏状态API
│   │   ├── components/   # React组件
│   │   │   ├── GameState.jsx      # 游戏状态显示
│   │   │   ├── ChatContainer.jsx  # 聊天容器
│   │   │   ├── InputArea.jsx      # 输入区域
│   │   │   ├── OptionsPanel.jsx   # 引导选项面板
│   │   │   └── CharacterInfo.jsx  # 角色信息
│   │   ├── contexts/    # React Context
│   │   │   └── GameContext.jsx   # 游戏全局状态
│   │   ├── pages/       # 页面组件
│   │   │   ├── Home.jsx       # 首页
│   │   │   ├── Game.jsx       # 游戏主页面
│   │   │   └── Result.jsx     # 结局页面
│   │   ├── App.jsx       # 主应用组件
│   │   ├── App.css       # 全局样式
│   │   └── index.css     # 根样式
│   ├── .env.example      # 前端环境变量
│   └── vite.config.js    # Vite配置
├── venv/                 # Python虚拟环境
└── log/                  # 日志目录
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

### 消息交互

#### 发送消息
```
POST /sessions/{session_id}/messages/send
```

#### 获取消息历史
```
GET /sessions/{session_id}/messages
```

### 游戏状态

#### 获取游戏状态
```
GET /sessions/{session_id}/game/state
```

#### 获取游戏时间
```
GET /sessions/{session_id}/game/time
```

#### 获取游戏轮次
```
GET /sessions/{session_id}/game/rounds
```

#### 暂停/恢复游戏
```
POST /sessions/{session_id}/game/pause
```

#### 获取游戏摘要
```
GET /sessions/{session_id}/game/summary
```

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

## 开发规范

- Python 遵循 PEP 8
- 使用 loguru 记录日志
- 添加必要的中文注释
- 使用类型提示（Type Hints）
- 剥端使用 React Hooks 和函数式组件

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
