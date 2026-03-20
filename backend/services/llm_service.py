"""
LLM服务
处理与AI模型API的交互
"""

import json
import os
from typing import Any, Optional, List, Dict, AsyncGenerator
from loguru import logger
from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class LLMService:
    """AI模型API调用服务"""

    def __init__(self, api_key: Optional[str] = None, api_base: Optional[str] = None, model_name: Optional[str] = None):
        """初始化LLM服务"""
        self.provider = os.getenv("AI_MODEL_PROVIDER", "openai")
        self.api_key = api_key or os.getenv("AI_API_KEY", "")
        self.api_base = api_base or os.getenv("AI_API_BASE", "https://api.openai.com/v1")
        self.model_name = model_name or os.getenv("AI_MODEL_NAME", "gpt-4o")

        if not self.api_key:
            logger.warning("AI_API_KEY未设置，请检查环境变量")

        # 初始化OpenAI客户端（兼容所有OpenAI格式的API）
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.api_base,
            timeout=180.0
        )
        logger.info(f"LLM服务初始化完成: {self.provider}/{self.model_name}")

    async def call_llm(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        调用LLM API

        Args:
            prompt: 用户提示
            system_prompt: 系统提示（可选）

        Returns:
            LLM返回的文本内容
        """
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response_text = ""
            # 适配不同的API提供商
            if self.provider == "openai":
                response_text = await self._call_openai(messages)
            elif self.provider == "zhipuai":
                response_text = await self._call_zhipuai(messages)
            elif self.provider == "deepseek":
                response_text = await self._call_deepseek(messages)
            elif self.provider == "anthropic":
                response_text = await self._call_anthropic(messages)
            else:
                logger.warning(f"未知的API提供商: {self.provider}, 使用OpenAI兼容接口")
                response_text = await self._call_openai(messages)

            logger.debug(f"LLM响应: {response_text[:100]}...")
            return response_text

        except Exception as e:
            logger.error(f"调用LLM API失败: {e}")
            raise

    async def call_llm_stream(self, prompt: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        """
        流式调用LLM API，逐块返回内容

        Args:
            prompt: 用户提示
            system_prompt: 系统提示（可选）

        Returns:
            异步生成器，逐块返回LLM响应内容
        """
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            # 适配不同的API提供商
            if self.provider == "openai":
                async for chunk in self._call_openai_stream(messages):
                    yield chunk
            elif self.provider == "zhipuai":
                async for chunk in self._call_zhipuai_stream(messages):
                    yield chunk
            elif self.provider == "deepseek":
                async for chunk in self._call_deepseek_stream(messages):
                    yield chunk
            elif self.provider == "anthropic":
                async for chunk in self._call_anthropic_stream(messages):
                    yield chunk
            else:
                logger.warning(f"未知的API提供商: {self.provider}, 使用OpenAI兼容接口")
                async for chunk in self._call_openai_stream(messages):
                    yield chunk

        except Exception as e:
            logger.error(f"流式调用LLM API失败: {e}")
            raise

    async def _call_openai(self, messages: List[Dict]) -> str:
        """调用OpenAI兼容API"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.8,
                extra_body={
                    "enable_thinking": False # 是否开启深度思考
                }
            )
            return response.choices[0].message.content or ""
        except (APIError, APIConnectionError, RateLimitError) as e:
            logger.error(f"OpenAI API调用错误: {type(e).__name__}: {e}")
            raise

    async def _call_zhipuai(self, messages: List[Dict]) -> str:
        """调用智谱AI API"""
        # 处理API地址，确保包含/chat/completions后缀
        if self.api_base.endswith("/chat/completions"):
            url = self.api_base
        else:
            url = f"{self.api_base.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.8,
            "max_tokens": 2000
        }

        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]

    async def _call_deepseek(self, messages: List[Dict]) -> str:
        """调用DeepSeek API"""
        # 处理API地址，确保包含/chat/completions后缀
        if self.api_base.endswith("/chat/completions"):
            url = self.api_base
        else:
            url = f"{self.api_base.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": self.model_name,
            "messages": messages,
            "temperature": 0.8,
            "max_tokens": 2000
        }

        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]

    async def _call_anthropic(self, messages: List[Dict]) -> str:
        """调用Anthropic Claude API"""
        url = f"{self.api_base}"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }

        # 转换消息格式
        system = ""
        anthropic_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        data = {
            "model": self.model_name,
            "max_tokens": 2000,
            "temperature": 0.8,
            "system": system,
            "messages": anthropic_messages
        }

        response = await self.client.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result["content"][0]["text"]

    async def _call_openai_stream(self, messages: List[Dict]) -> AsyncGenerator[str, None]:
        """流式调用OpenAI兼容API"""
        try:
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.8,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        yield delta.content

        except (APIError, APIConnectionError, RateLimitError) as e:
            logger.error(f"OpenAI 流式API调用错误: {type(e).__name__}: {e}")
            raise

    async def _call_zhipuai_stream(self, messages: List[Dict]) -> AsyncGenerator[str, None]:
        """流式调用智谱AI API"""
        # 智谱AI兼容OpenAI流式格式，直接复用_openai_stream
        async for chunk in self._call_openai_stream(messages):
            yield chunk

    async def _call_deepseek_stream(self, messages: List[Dict]) -> AsyncGenerator[str, None]:
        """流式调用DeepSeek API"""
        # DeepSeek兼容OpenAI流式格式，直接复用_openai_stream
        async for chunk in self._call_openai_stream(messages):
            yield chunk

    async def _call_anthropic_stream(self, messages: List[Dict]) -> AsyncGenerator[str, None]:
        """流式调用Anthropic Claude API"""
        url = f"{self.api_base}"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        }

        # 转换消息格式
        system = ""
        anthropic_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        data = {
            "model": self.model_name,
            "max_tokens": 2000,
            "temperature": 0.8,
            "system": system,
            "messages": anthropic_messages,
            "stream": True
        }

        async with self.client.stream("POST", url, headers=headers, json=data) as response:
            response.raise_for_status()
            try:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        line = line[6:]
                        try:
                            chunk = json.loads(line)
                            event_type = chunk.get("type", "")
                            if event_type == "content_block_delta":
                                delta = chunk.get("delta", {})
                                content = delta.get("text", "")
                                if content:
                                    yield content
                            elif event_type == "message_stop":
                                break
                        except json.JSONDecodeError:
                            logger.warning(f"解析Anthropic流式响应失败: {line}")
                            continue
            finally:
                # 确保响应被完全读取，避免ResponseNotRead错误
                await response.read()

    def _clean_json_string(self, json_str: str) -> str:
        """
        清理JSON字符串，处理可能的格式问题

        Args:
            json_str: 原始JSON字符串

        Returns:
            清理后的JSON字符串
        """
        # 移除可能的前缀和后缀
        json_str = json_str.strip()
        
        # 处理可能的转义问题
        json_str = json_str.replace('\\n', ' ')
        json_str = json_str.replace('\\t', ' ')
        
        # 处理中文引号：中文双引号替换为英文单引号，避免和JSON边界双引号冲突
        json_str = json_str.replace('“', "'")
        json_str = json_str.replace('”', "'")
        json_str = json_str.replace('‘', "'")
        json_str = json_str.replace('’', "'")
        
        # 移除注释
        json_str = self._remove_comments(json_str)
        
        # 确保JSON以{开头，以}结尾
        if not json_str.startswith('{'):
            # 找到第一个{
            start_idx = json_str.find('{')
            if start_idx != -1:
                json_str = json_str[start_idx:]
        
        if not json_str.endswith('}'):
            # 找到最后一个}
            end_idx = json_str.rfind('}')
            if end_idx != -1:
                json_str = json_str[:end_idx + 1]
        
        return json_str

    def _remove_comments(self, json_str: str) -> str:
        """
        移除JSON字符串中的注释

        Args:
            json_str: 包含注释的JSON字符串

        Returns:
            移除注释后的JSON字符串
        """
        import re
        # 移除单行注释
        json_str = re.sub(r'//.*', '', json_str)
        # 移除多行注释
        json_str = re.sub(r'/\*[\s\S]*?\*/', '', json_str)
        return json_str

    def _repair_json_quotes(self, json_str: str) -> str:
        """
        修复JSON字符串中常见的引号问题：
        1. 字符串内未转义的双引号
        2. 缺失的逗号
        3. 多余的 trailing comma

        Args:
            json_str: 有问题的JSON字符串

        Returns:
            修复后的JSON字符串
        """
        import re
        # 先尝试修复字符串中的未转义双引号
        # 匹配 "key": "value" 模式，修复value中的未转义双引号
        pattern = r'("(?:\\.|[^"\\])*":\s*")((?:\\.|[^"\\])*)(")'

        def replace_quotes(match):
            prefix = match.group(1)
            content = match.group(2)
            suffix = match.group(3)
            # 将内容中的未转义双引号转义
            repaired_content = content.replace('"', '\\"')
            return prefix + repaired_content + suffix

        repaired = re.sub(pattern, replace_quotes, json_str)

        # 修复缺失的逗号（在}或]前的逗号问题）
        repaired = re.sub(r'(\s*})(?=\s*"[^"]+"\s*:)', r'\1,', repaired)
        repaired = re.sub(r'(\s*\])(?=\s*"[^"]+"\s*:)', r'\1,', repaired)

        # 移除 trailing comma
        repaired = re.sub(r',\s*([}\]])', r'\1', repaired)

        return repaired

    async def call_llm_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        调用LLM API并返回JSON格式结果

        Args:
            prompt: 用户提示
            system_prompt: 系统提示（可选）

        Returns:
            解析后的JSON字典
        """
        logger.info(f"调用LLM API，提示: {prompt}")
        logger.info(f"系统提示: {system_prompt}")

        response_text = await self.call_llm(prompt, system_prompt)
        logger.info(f"LLM返回原始响应: {response_text}")

        # 尝试从响应中提取JSON
        # 处理可能的markdown代码块包裹
        if "```json" in response_text:
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            json_str = response_text[start:end].strip()
        elif "```" in response_text:
            start = response_text.find("```") + 3
            end = response_text.find("```", start)
            json_str = response_text[start:end].strip()
        else:
            json_str = response_text.strip()

        try:
            cleaned_json = self._clean_json_string(json_str)
            return json.loads(cleaned_json)
        except json.JSONDecodeError as e:
            logger.warning(f"第一次JSON解析失败，尝试容错解析: {e}")
            # 尝试修复常见的JSON格式问题
            try:
                # 1. 修复未转义的双引号问题
                repaired = self._repair_json_quotes(cleaned_json)
                return json.loads(repaired)
            except json.JSONDecodeError as e2:
                logger.warning(f"第二次JSON解析失败，尝试更宽松的解析: {e2}")
                try:
                    # 2. 使用ast.literal_eval尝试解析（更宽松）
                    import ast
                    return ast.literal_eval(cleaned_json)
                except Exception as e3:
                    logger.error(f"所有JSON解析方式都失败: {e3}")
                    logger.error(f"原始响应: {response_text}")
                    logger.error(f"清理后的JSON: {cleaned_json}")
                    raise

    async def close(self):
        """关闭HTTP客户端"""
        await self.client.close()


# 全局LLM服务实例
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """获取LLM服务单例"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service