"""
兑换码生成脚本
生成带-的随机字符串，长度为16位（格式：XXXX-XXXX-XXXX-XXXX）
"""

import random
import string
import argparse
import json
import os

def generate_code():
    """生成16位兑换码，格式：XXXX-XXXX-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    code = '-'.join([''.join(random.choices(chars, k=4)) for _ in range(4)])
    return code

def generate_multiple_codes(count, api_key, api_base, model_name):
    """
    生成多个兑换码

    Args:
        count: 生成数量
        api_key: API Key
        api_base: API Base URL
        model_name: 模型名称

    Returns:
        兑换码字典
    """
    codes = {}
    for _ in range(count):
        code = generate_code()
        codes[code] = {
            "api_key": api_key,
            "api_base": api_base,
            "model_name": model_name,
            "remaining_games": 10
        }
    return codes

def save_codes_to_file(codes, filename="redemption_codes.json"):
    """将兑换码保存到文件"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(codes, f, indent=2, ensure_ascii=False)
    print(f"兑换码已保存到: {os.path.abspath(filename)}")

def load_codes_to_server(codes_file="redemption_codes.json", output_file="server_codes.json"):
    """
    生成服务器端可直接使用的兑换码配置

    Args:
        codes_file: 兑换码文件
        output_file: 输出文件
    """
    with open(codes_file, 'r', encoding='utf-8') as f:
        codes = json.load(f)

    #    生成服务器端配置格式
    server_config = {
        "redemption_codes": {
            code: {
                "api_key": info["api_key"],
                "api_base": info["api_base"],
                "model_name": info["model_name"],
                "remaining_games": info["remaining_games"]
            }
            for code, info in codes.items()
        }
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(server_config, f, indent=2, ensure_ascii=False)
    print(f"服务器端配置已保存到: {os.path.abspath(output_file)}")

def main():
    parser = argparse.ArgumentParser(description='生成游戏兑换码')
    parser.add_argument('-n', '--count', type=int, default=1, help='生成兑换码的数量')
    parser.add_argument('--api-key', type=str, required=True, help='API Key')
    parser.add_argument('--api-base', type=str, required=True, help='API Base URL')
    parser.add_argument('--model-name', type=str, default='gpt-4o', help='模型名称')
    parser.add_argument('-o', '--output', type=str, default='redemption_codes.json', help='输出文件名')
    parser.add_argument('--load-to-server', action='store_true', help='生成服务器端配置文件')

    args = parser.parse_args()

    print(f"生成 {args.count} 个兑换码...")
    print(f"API Key: {args.api_key[:10]}...")
    print(f"API Base: {args.api_base}")
    print(f"模型名称: {args.model_name}")
    print("-" * 50)

    codes = generate_multiple_codes(args.count, args.api_key, args.api_base, args.model_name)

    # 打印生成的兑换码
    for code, info in codes.items():
        print(f"兑换码: {code}")
        print(f"  剩余游戏次数: {info['remaining_games']}")
        print(f"  API Key: {info['api_key'][:10]}...")
        print(f"  API Base: {info['api_base']}")
        print(f"  模型名称: {info['model_name']}")
        print()

    # 保存到文件
    save_codes_to_file(codes, args.output)

    # 如果需要生成服务器端配置
    if args.load_to_server:
        load_codes_to_server(args.output)

    print("-" * 50)
    print(f"✓ 已生成 {args.count} 个兑换码")

if __name__ == '__main__':
    main()
