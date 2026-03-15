"""
LLM服务
处理与AI模型API的交互
"""

import json
import os
from typing import Any, Optional, List, Dict
from loguru import logger
from httpx import AsyncClient, Timeout
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class LLMService:
    """AI模型API调用服务"""

    def __init__(self):
        """初始化LLM服务"""
        self.provider = os.getenv("AI_MODEL_PROVIDER", "openai")
        self.model_name = os.getenv("AI_MODEL_NAME", "gpt-4o")
        self.api_key = os.getenv("AI_API_KEY", "")
        self.api_base = os.getenv("AI_API_BASE", "https://api.openai.com/v1")

        if not self.api_key:
            logger.warning("AI_API_KEY未设置，请检查环境变量")

        self.client = AsyncClient(timeout=Timeout(120.0))
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

    async def _call_openai(self, messages: List[Dict]) -> str:
        """调用OpenAI兼容API"""
        url = f"{self.api_base}"
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

    async def _call_zhipuai(self, messages: List[Dict]) -> str:
        """调用智谱AI API"""
        url = f"{self.api_base}"
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
        url = f"{self.api_base}"
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
        
        # 处理中文引号
        json_str = json_str.replace('“', '"')
        json_str = json_str.replace('”', '"')
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
            logger.error(f"解析LLM返回的JSON失败: {e}")
            logger.error(f"原始响应: {response_text}")
            raise

    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()


# 全局LLM服务实例
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """获取LLM服务单例"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service