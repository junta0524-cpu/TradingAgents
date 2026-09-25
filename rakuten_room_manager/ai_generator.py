# -*- coding: utf-8 -*-
"""
ai_generator.py
-----------------------------------------------------------------------------
商品情報とユーザーの感想・アピールポイントから、
楽天ROOM投稿用の紹介文を作ってもらうための「指示文（プロンプト）」を組み立てるモジュール。

【このアプリでの紹介文生成の方式について】
自動でAPI（OpenAIやAnthropicなど）を呼び出すと、使うたびに料金が発生する。
そこで本アプリでは、あえて自動呼び出しは行わず、
「指示文を作る → ユーザーが普段使っているClaude.aiやChatGPT（無料枠でもOK）に
自分でコピー&ペーストする → 出てきた紹介文をアプリに貼り戻して保存する」
という手動コピペ方式を採用している。これにより追加のAPI利用料が一切かからない。
"""


def build_prompt(product: dict, appeal_points: str, reference_posts: list[dict] | None = None) -> str:
    """
    ChatGPTやClaudeなどのAIチャットに貼り付けるための指示文（プロンプト）を組み立てる。

    Parameters
    ----------
    product : dict
        商品情報の辞書（item_name, price, shop_name等を含む）。
    appeal_points : str
        ユーザーが入力した感想・アピールポイント。
    reference_posts : list[dict], optional
        文体・構成の参考にしたい投稿（ユーザーが手動でコピーして
        「参考投稿ライブラリ」に保存したもの）のリスト。各要素は
        content（本文）とnote（メモ）を持つ辞書。

    Returns
    -------
    str
        AIチャットにそのままコピー&ペーストして使える指示文。
    """
    item_name = product.get("item_name", "")
    price = product.get("price", 0)
    shop_name = product.get("shop_name", "")

    # 参考投稿が指定されている場合は、指示文の中に「参考例」として埋め込む。
    # ここで重要なのは「文体・構成の参考にするだけで、文章をそのままコピーしない」
    # と明示すること（他人の投稿の丸写しはトラブルの元になるため）。
    reference_section = ""
    if reference_posts:
        examples = []
        for i, post in enumerate(reference_posts, start=1):
            content = post.get("content", "").strip()
            note = post.get("note", "").strip()
            example = f"### 参考例{i}\n{content}"
            if note:
                example += f"\n（この投稿が良いと思った理由: {note}）"
            examples.append(example)

        reference_section = f"""
# 文体・構成の参考にしてほしい「売れている投稿」の例
以下は、ユーザーが「これは良い投稿だ」と感じた実例です。
これらの文章をそのままコピーするのではなく、
・書き出しの引きつけ方
・文章のテンポやリズム
・絵文字の使い方や位置
・読者に語りかけるような言い回し
といった「型」だけを参考にして、今回の商品オリジナルの紹介文を作成してください。

{chr(10).join(examples)}
"""

    prompt = f"""
あなたは楽天ROOMで商品紹介を行う人気インフルエンサーです。
以下の商品情報とユーザーのコメントをもとに、楽天ROOMに投稿するための魅力的な紹介文を作成してください。

# 商品情報
- 商品名: {item_name}
- 価格: {price}円
- ショップ名: {shop_name}

# ユーザーの感想・アピールポイント
{appeal_points if appeal_points else "（特に指定なし。商品情報から魅力を推測して記述してください）"}
{reference_section}
# 紹介文の作成条件（必ず守ること）
1. 楽天ROOMのユーザー層（主に女性、買い物好き）に響く、親しみやすい口調で書くこと。
2. 絵文字を適度に使用すること（多用しすぎず、文章の要所に自然な形で入れる）。
3. 文章の最後に、内容に関連するハッシュタグを3〜5個追加すること（例: #楽天ROOM #おすすめコスメ など）。
4. ハッシュタグの最後には必ず「#PR」を含めること（PR表記として必須）。
5. 全体の文字数は150〜250文字程度を目安にすること。
6. 誇大表現・医療的な効能効果を断定する表現（治る、必ず痩せる等）は使用しないこと。
7. 参考例を示した場合でも、文章そのものは必ずオリジナルにすること（一部フレーズの丸写しも不可）。

紹介文本文のみを出力し、前置きや説明文は含めないでください。
"""
    return prompt.strip()
