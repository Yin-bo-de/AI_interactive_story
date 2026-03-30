## 目录结构

```
AI_interactive_story/
├── 技术文档.md              # 项目第一期 技术设计文档：基于用户和剧本中一个角色的互动模式，通过AI生成对话内容，实现互动式故事体验。 
├── 群聊模式技术方案.md      # 项目第二期 群聊模式技术方案：在群聊模式下，用户可以与多个角色进行互动，每个角色都有自己的头像和名字。
├── CLAUDE.md                # Claude Code 项目指导
├── README.md                # 项目说明（本文件）
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
│   │   ├── end_prompt.py       # 游戏结束Prompt
│   │   └── group_chat_prompt.py     # 群聊模式Prompt
│   ├── services/          # 核心业务逻辑
│   │   ├── __init__.py
│   │   ├── llm_service.py      # AI模型调用
│   │   ├── session_service.py   # 会话管理
│   │   ├── story_service.py     # 故事逻辑
│   │   ├── charater_service.py   # 角色管理
│   │   ├── group_chat_service.py   # 群聊管理
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
│   │   │   ├── game.js     # 游戏状态API
│   │   │   └── message.js     # 消息API
│   │   ├── components/   # React组件
│   │   │   ├── GameState.jsx      # 游戏状态显示
│   │   │   ├── ChatContainer.jsx  # 聊天容器
│   │   │   ├── InputArea.jsx      # 输入区域
│   │   │   ├── OptionsPanel.jsx   # 引导选项面板
│   │   │   ├── CharacterInfo.jsx  # 角色信息
│   │   │   ├── CharaterList.jsx   # 角色列表
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



