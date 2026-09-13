# -*- coding: utf-8 -*-
"""
ai_generator.py
-----------------------------------------------------------------------------
商品情報とユーザーの感想・アピールポイントをもとに、
楽天ROOM投稿用の紹介文をLLM（OpenAI または Anthropic）で生成するモジュール。

このモジュールはあくまで「紹介文のドラフト（下書き）生成の補助」を行うのみで、
生成した文章を楽天ROOMへ自動投稿することは一切行わない。
生成された文章は必ずユーザー自身が内容を確認し、手動で投稿することを想定している。
"""

from openai import OpenAI
import anthropic

# デフォルトで使用するモデル名（設定画面で変更可能）
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5"


class AIGeneratorError(Exception):
    """紹介文生成に失敗した場合に送出する例外。"""
    pass


def _build_prompt(product: dict, appeal_points: str) -> str:
    """
    LLMに渡すプロンプト（指示文）を組み立てる。

    商品情報（商品名・価格・ショップ名）と、ユーザーが入力した
    「簡単な感想・アピールポイント」を組み合わせ、
    楽天ROOM向けの紹介文の生成条件を明示的に指示する。
    """
    item_name = product.get("item_name", "")
    price = product.get("price", 0)
    shop_name = product.get("shop_name", "")

    prompt = f"""
あなたは楽天ROOMで商品紹介を行う人気インフルエンサーです。
以下の商品情報とユーザーのコメントをもとに、楽天ROOMに投稿するための魅力的な紹介文を作成してください。

# 商品情報
- 商品名: {item_name}
- 価格: {price}円
- ショップ名: {shop_name}

# ユーザーの感想・アピールポイント
{appeal_points if appeal_points else "（特に指定なし。商品情報から魅力を推測して記述してください）"}

# 紹介文の作成条件（必ず守ること）
1. 楽天ROOMのユーザー層（主に女性、買い物好き）に響く、親しみやすい口調で書くこと。
2. 絵文字を適度に使用すること（多用しすぎず、文章の要所に自然な形で入れる）。
3. 文章の最後に、内容に関連するハッシュタグを3〜5個追加すること（例: #楽天ROOM #おすすめコスメ など）。
4. ハッシュタグの最後には必ず「#PR」を含めること（PR表記として必須）。
5. 全体の文字数は150〜250文字程度を目安にすること。
6. 誇大表現・医療的な効能効果を断定する表現（治る、必ず痩せる等）は使用しないこと。

紹介文本文のみを出力し、前置きや説明文は含めないでください。
"""
    return prompt.strip()


def generate_caption(
    provider: str,
    api_key: str,
    product: dict,
    appeal_points: str,
    model: str | None = None,
) -> str:
    """
    紹介文を生成するメイン関数。

    Parameters
    ----------
    provider : str
        "OpenAI" または "Anthropic"。
    api_key : str
        使用するLLMプロバイダのAPIキー。
    product : dict
        商品情報の辞書（item_name, price, shop_name等を含む）。
    appeal_points : str
        ユーザーが入力した感想・アピールポイント。
    model : str, optional
        使用するモデル名。未指定時はプロバイダごとのデフォルトモデルを使用する。

    Returns
    -------
    str
        生成された紹介文。
    """
    if not api_key:
        raise AIGeneratorError(
            f"{provider} のAPIキーが設定されていません。設定画面から入力してください。"
        )

    prompt = _build_prompt(product, appeal_points)

    if provider == "OpenAI":
        return _generate_with_openai(api_key, prompt, model or DEFAULT_OPENAI_MODEL)
    elif provider == "Anthropic":
        return _generate_with_anthropic(api_key, prompt, model or DEFAULT_ANTHROPIC_MODEL)
    else:
        raise AIGeneratorError(f"未対応のプロバイダです: {provider}")


def _generate_with_openai(api_key: str, prompt: str, model: str) -> str:
    """OpenAI APIを利用して紹介文を生成する。"""
    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "あなたは優秀な日本語のSNSマーケティングライターです。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=600,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:  # OpenAI SDKの例外を包んで扱いやすくする
        raise AIGeneratorError(f"OpenAI APIの呼び出しに失敗しました: {exc}") from exc


def _generate_with_anthropic(api_key: str, prompt: str, model: str) -> str:
    """Anthropic APIを利用して紹介文を生成する。"""
    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            max_tokens=600,
            temperature=0.8,
            system="あなたは優秀な日本語のSNSマーケティングライターです。",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except Exception as exc:  # Anthropic SDKの例外を包んで扱いやすくする
        raise AIGeneratorError(f"Anthropic APIの呼び出しに失敗しました: {exc}") from exc
