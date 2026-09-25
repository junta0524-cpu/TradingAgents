# -*- coding: utf-8 -*-
"""
app.py
-----------------------------------------------------------------------------
楽天ROOM運用効率化ツール - メインのStreamlitアプリケーション。

【このアプリの位置づけ】
楽天の利用規約（自動投稿・スクレイピングの禁止）を遵守するため、本アプリは
以下の3つに機能を限定している。
  1. 楽天公式APIを使った商品情報の「取得」と、SQLiteでの「管理」
  2. 紹介文の「指示文（プロンプト）作成補助」（AI呼び出し自体は行わない）
  3. ランク維持のための活動記録（ToDo管理）
楽天ROOMへの自動投稿や、楽天サイトのスクレイピングは一切行わない。

【紹介文AI機能について】
本アプリはOpenAIやAnthropicなどのAPIを自動で呼び出すことはしない
（呼び出すたびに料金が発生するため）。代わりに、AIチャットに貼り付けるための
指示文（プロンプト）を作成する機能のみを提供する。ユーザーは普段使っている
Claude.aiやChatGPT（無料枠でもよい）にその指示文を自分でコピー&ペーストし、
出てきた紹介文をこのアプリに貼り戻して保存する。これにより追加のAPI利用料は
一切かからない。

生成された紹介文や取得した情報は、必ずユーザー自身が確認したうえで
手動で楽天ROOMアプリ／サイトに投稿することを前提としている。

起動方法:
    streamlit run app.py
-----------------------------------------------------------------------------
"""

import os
from datetime import date

import streamlit as st

import database as db
from rakuten_api import search_items, RakutenAPIError
from ai_generator import build_prompt

# .env ファイルがあれば読み込む（python-dotenv）。無くてもエラーにはしない。
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# =============================================================================
# 初期設定
# =============================================================================

st.set_page_config(
    page_title="楽天ROOM運用管理ツール",
    page_icon="🛍️",
    layout="wide",
)

# アプリ起動時にDBのテーブルを初期化（既に存在する場合は何もしない）
db.init_db()


def get_effective_setting(setting_key: str, env_key: str) -> str:
    """
    APIキーなどの設定値を取得するヘルパー関数。

    優先順位:
        1. SQLiteのsettingsテーブルに保存された値（UIの設定画面から入力したもの）
        2. 環境変数
        3. 空文字列
    """
    value = db.get_setting(setting_key, "")
    if value:
        return value
    return os.environ.get(env_key, "")


# =============================================================================
# サイドバー（ページ切り替え）
# =============================================================================

st.sidebar.title("🛍️ 楽天ROOM運用管理ツール")
page = st.sidebar.radio(
    "メニュー",
    [
        "🔍 商品検索",
        "📦 商品管理",
        "✨ 紹介文AIジェネレーター",
        "📚 参考投稿ライブラリ",
        "📅 ランク維持トラッカー",
        "⚙️ 設定",
    ],
)

st.sidebar.markdown("---")
st.sidebar.caption(
    "※本ツールは楽天公式APIを利用した情報取得・管理のみを行います。\n"
    "楽天ROOMへの自動投稿やスクレイピングは行いません。"
)


# =============================================================================
# ページ: 商品検索
# =============================================================================

if page == "🔍 商品検索":
    st.header("🔍 商品検索（楽天商品検索API）")
    st.write("キーワードを入力して楽天市場の商品を検索し、気になる商品をデータベースに保存できます。")

    rakuten_app_id = get_effective_setting("rakuten_app_id", "RAKUTEN_APP_ID")
    if not rakuten_app_id:
        st.warning("楽天アプリケーションIDが未設定です。「⚙️ 設定」画面から入力してください。")

    with st.form("search_form"):
        col1, col2 = st.columns([3, 1])
        with col1:
            keyword = st.text_input("検索キーワード", placeholder="例: ワイヤレスイヤホン")
        with col2:
            hits = st.number_input("取得件数", min_value=1, max_value=30, value=10)
        submitted = st.form_submit_button("検索する", type="primary")

    # 検索結果はページのリロードでも消えないよう session_state に保持する
    if submitted:
        try:
            with st.spinner("楽天商品検索APIを呼び出しています..."):
                results = search_items(rakuten_app_id, keyword, hits=hits)
            st.session_state["search_results"] = results
            if not results:
                st.info("該当する商品が見つかりませんでした。")
        except RakutenAPIError as exc:
            st.error(str(exc))
            st.session_state["search_results"] = []

    results = st.session_state.get("search_results", [])

    if results:
        st.subheader(f"検索結果（{len(results)}件）")
        for idx, item in enumerate(results):
            with st.container(border=True):
                col_img, col_info, col_action = st.columns([1, 3, 1])
                with col_img:
                    if item.get("image_url"):
                        st.image(item["image_url"], width=120)
                with col_info:
                    st.markdown(f"**{item['item_name']}**")
                    st.write(f"価格: {item['price']:,}円　|　ショップ: {item['shop_name']}")
                    st.markdown(f"[商品ページを開く]({item['item_url']})")
                with col_action:
                    # 商品ごとに一意なキーを付与してボタンを配置する
                    if st.button("DBに保存", key=f"save_{idx}"):
                        inserted = db.insert_product(item)
                        if inserted:
                            st.success("保存しました。")
                        else:
                            st.info("この商品は既に登録済みです。")


# =============================================================================
# ページ: 商品管理
# =============================================================================

elif page == "📦 商品管理":
    st.header("📦 商品管理データベース")
    st.write("登録済みの商品の投稿ステータス・オリジナル写真の有無・メモを一覧で編集できます。")

    products_df = db.get_all_products()

    if products_df.empty:
        st.info("まだ商品が登録されていません。「🔍 商品検索」から商品を検索・保存してください。")
    else:
        # フィルタ機能（投稿ステータスで絞り込み）
        status_filter = st.selectbox("投稿ステータスで絞り込み", ["すべて", "未投稿", "投稿済"])
        display_df = products_df.copy()
        if status_filter != "すべて":
            display_df = display_df[display_df["post_status"] == status_filter]

        st.caption("表内のセルを直接編集し、下部の「変更を保存」ボタンを押してください。")

        # st.data_editor でステータス・写真有無・メモを編集可能にする。
        # 商品名・価格・URL等は編集不可（disabled）にして誤操作を防ぐ。
        edited_df = st.data_editor(
            display_df[
                [
                    "id",
                    "item_name",
                    "price",
                    "shop_name",
                    "post_status",
                    "has_original_photo",
                    "memo",
                    "item_url",
                ]
            ],
            column_config={
                "id": st.column_config.NumberColumn("ID", disabled=True),
                "item_name": st.column_config.TextColumn("商品名", disabled=True),
                "price": st.column_config.NumberColumn("価格", disabled=True, format="%d円"),
                "shop_name": st.column_config.TextColumn("ショップ名", disabled=True),
                "post_status": st.column_config.SelectboxColumn(
                    "投稿ステータス", options=["未投稿", "投稿済"], required=True
                ),
                "has_original_photo": st.column_config.SelectboxColumn(
                    "オリジナル写真", options=["あり", "なし"], required=True
                ),
                "memo": st.column_config.TextColumn("メモ"),
                "item_url": st.column_config.LinkColumn("商品URL", disabled=True),
            },
            hide_index=True,
            use_container_width=True,
            key="product_editor",
        )

        col_save, col_delete = st.columns([1, 3])
        with col_save:
            if st.button("💾 変更を保存", type="primary"):
                # 編集前後の差分がある行だけをDBに反映する
                for _, row in edited_df.iterrows():
                    db.update_product_fields(
                        int(row["id"]),
                        post_status=row["post_status"],
                        has_original_photo=row["has_original_photo"],
                        memo=row["memo"],
                    )
                st.success("変更を保存しました。")
                st.rerun()

        st.markdown("---")
        st.subheader("🗑️ 商品の削除")
        delete_id = st.selectbox(
            "削除する商品のIDを選択",
            options=display_df["id"].tolist(),
            format_func=lambda x: f"ID:{x} - " + display_df.loc[display_df['id'] == x, 'item_name'].values[0],
        )
        if st.button("選択した商品を削除"):
            db.delete_product(int(delete_id))
            st.success("削除しました。")
            st.rerun()


# =============================================================================
# ページ: 紹介文AIジェネレーター
# =============================================================================

elif page == "✨ 紹介文AIジェネレーター":
    st.header("✨ 紹介文AIジェネレーター")
    st.write(
        "商品情報と、あなたの感想・アピールポイントから「AIに渡す指示文」を作成します。"
        "このアプリ自体はAIを自動で呼び出さないので、追加の利用料金は一切かかりません。"
    )
    st.info(
        "**使い方**\n"
        "1. 下で商品と感想を入力し、「指示文を作成する」を押す\n"
        "2. 表示された指示文をコピーする（右上のコピーアイコンが使えます）\n"
        "3. 普段使っているClaude.aiやChatGPTなど（無料のもので構いません）のチャット画面に貼り付ける\n"
        "4. 出てきた紹介文をコピーし、下の入力欄に貼り付けて保存する"
    )

    products_df = db.get_all_products()
    if products_df.empty:
        st.info("まだ商品が登録されていません。先に「🔍 商品検索」から商品を登録してください。")
    else:
        product_options = {
            f"ID:{row.id} - {row.item_name}": row.id for row in products_df.itertuples()
        }
        selected_label = st.selectbox("紹介文を作成する商品を選択", list(product_options.keys()))
        selected_id = product_options[selected_label]
        product = db.get_product_by_id(selected_id)

        col_img, col_detail = st.columns([1, 3])
        with col_img:
            if product.get("image_url"):
                st.image(product["image_url"], width=150)
        with col_detail:
            st.markdown(f"**{product['item_name']}**")
            st.write(f"価格: {product['price']:,}円　|　ショップ: {product['shop_name']}")

        appeal_points = st.text_area(
            "簡単な感想・アピールポイントを入力してください",
            placeholder="例: 実際に1ヶ月使ってみたら肌の乾燥が気にならなくなった。香りも優しくて使うたびに癒される。",
            height=120,
        )

        # 「参考投稿ライブラリ」に保存済みの投稿があれば、文体の参考として選べるようにする
        reference_df = db.get_all_reference_posts()
        selected_reference_ids = []
        if not reference_df.empty:
            st.markdown("**参考にしたい投稿（任意）**")
            st.caption("「📚 参考投稿ライブラリ」に保存した投稿から、文体・構成の参考にしたいものを選べます（コピーはされず、型だけ参考にする指示になります）。")
            reference_options = {
                f"ID:{row.id} - {row.content[:20]}...": row.id
                for row in reference_df.itertuples()
            }
            selected_reference_labels = st.multiselect(
                "参考にする投稿を選択（複数可・未選択でもOK）",
                list(reference_options.keys()),
            )
            selected_reference_ids = [reference_options[label] for label in selected_reference_labels]
        else:
            st.caption("「📚 参考投稿ライブラリ」に投稿を保存すると、ここで文体の参考として選べるようになります。")

        if st.button("📝 指示文を作成する", type="primary"):
            reference_posts = db.get_reference_posts_by_ids(selected_reference_ids)
            st.session_state["ai_prompt"] = build_prompt(product, appeal_points, reference_posts)

        if "ai_prompt" in st.session_state:
            st.markdown("---")
            st.subheader("① この指示文をコピーしてAIチャットに貼り付けてください")
            # st.code は右上にコピー用のアイコンが表示されるため、コピー&ペーストがしやすい
            st.code(st.session_state["ai_prompt"], language=None)

            st.subheader("② AIから返ってきた紹介文をここに貼り付けてください")
            pasted_caption = st.text_area(
                "紹介文を貼り付け",
                height=200,
                key="caption_paste_area",
                placeholder="ここにAIチャットの回答をコピー&ペーストしてください",
            )
            st.caption("⚠️ この文章は下書きです。内容を必ず確認し、手動で楽天ROOMに投稿してください（自動投稿は行いません）。")

            if st.button("💾 この商品に紐づけて保存"):
                if pasted_caption.strip():
                    db.update_product_fields(selected_id, generated_caption=pasted_caption)
                    st.success("紹介文を保存しました（商品管理画面からも確認できます）。")
                else:
                    st.warning("貼り付けられた紹介文が空です。")


# =============================================================================
# ページ: 参考投稿ライブラリ
# =============================================================================

elif page == "📚 参考投稿ライブラリ":
    st.header("📚 参考投稿ライブラリ")
    st.write("文体・構成の参考にしたい「良い投稿」を保存しておく場所です。紹介文を作成するときに参考例として選べます。")
    st.warning(
        "⚠️ 楽天の規約でスクレイピング（投稿の自動収集）は禁止されています。"
        "ここに保存する投稿は、必ずあなた自身が楽天ROOMなどで実際に見て、"
        "手動でコピー&ペーストしたものに限ってください。"
    )

    with st.form("add_reference_form", clear_on_submit=True):
        new_content = st.text_area(
            "参考にしたい投稿の本文をコピー&ペーストしてください",
            height=150,
            placeholder="良いと思った投稿の文章をそのまま貼り付けてください",
        )
        new_note = st.text_input(
            "この投稿のどこが良いと思ったか（任意）",
            placeholder="例: 冒頭の問いかけが引き込まれる、絵文字の使い方が自然 など",
        )
        submitted = st.form_submit_button("📚 ライブラリに保存", type="primary")

    if submitted:
        if new_content.strip():
            db.insert_reference_post(new_content.strip(), new_note.strip())
            st.success("参考投稿を保存しました。")
            st.rerun()
        else:
            st.warning("投稿の本文が空です。")

    st.markdown("---")
    st.subheader("保存済みの参考投稿")

    reference_df = db.get_all_reference_posts()
    if reference_df.empty:
        st.info("まだ参考投稿が登録されていません。上のフォームから追加してください。")
    else:
        for row in reference_df.itertuples():
            with st.container(border=True):
                st.markdown(row.content)
                if row.note:
                    st.caption(f"💡 {row.note}")
                if st.button("🗑️ 削除", key=f"delete_ref_{row.id}"):
                    db.delete_reference_post(row.id)
                    st.success("削除しました。")
                    st.rerun()


# =============================================================================
# ページ: ランク維持トラッカー
# =============================================================================

elif page == "📅 ランク維持トラッカー":
    st.header("📅 ランク維持トラッカー")
    st.write("今月の「オリジナル写真投稿」「いいね・フォロー活動」の進捗をチェックボックスで記録できます。")

    today = date.today()
    year, month = today.year, today.month
    st.subheader(f"{year}年{month}月の進捗")

    tracker_df = db.get_month_tracker(year, month)

    photo_count = int(tracker_df["photo_posted"].sum())
    like_follow_count = int(tracker_df["like_follow_done"].sum())
    total_days = len(tracker_df)

    col1, col2 = st.columns(2)
    with col1:
        st.metric("オリジナル写真投稿 実施日数", f"{photo_count} / {total_days} 日")
        st.progress(photo_count / total_days if total_days else 0)
    with col2:
        st.metric("いいね・フォロー活動 実施日数", f"{like_follow_count} / {total_days} 日")
        st.progress(like_follow_count / total_days if total_days else 0)

    st.markdown("---")
    st.caption("今日までの日付のみ記録可能です。チェックを変更すると即座に保存されます。")

    today_iso = today.isoformat()

    # 見やすさのため、今日以前の日付だけを表示する（未来の日付は記録不要）
    visible_df = tracker_df[tracker_df["day_date"] <= today_iso].sort_values(
        "day_date", ascending=False
    )

    for row in visible_df.itertuples():
        col_date, col_photo, col_like = st.columns([2, 2, 2])
        with col_date:
            label = row.day_date
            if row.day_date == today_iso:
                label += "（today）"
            st.write(label)
        with col_photo:
            new_photo = st.checkbox(
                "📸 オリジナル写真投稿",
                value=bool(row.photo_posted),
                key=f"photo_{row.day_date}",
            )
        with col_like:
            new_like = st.checkbox(
                "❤️ いいね・フォロー活動",
                value=bool(row.like_follow_done),
                key=f"like_{row.day_date}",
            )

        # 変更があった場合のみDBを更新する（無駄な書き込みを避ける）
        if new_photo != bool(row.photo_posted) or new_like != bool(row.like_follow_done):
            db.set_day_tracker(row.day_date, new_photo, new_like)


# =============================================================================
# ページ: 設定
# =============================================================================

elif page == "⚙️ 設定":
    st.header("⚙️ 設定")
    st.write("楽天のアプリケーションIDを設定します。ここで入力した値はSQLiteデータベースに保存され、次回起動時も保持されます。")
    st.caption(
        "環境変数（RAKUTEN_APP_ID）が設定されている場合は、こちらの入力が空欄のときのフォールバックとして使用されます。"
    )

    st.subheader("楽天ウェブサービス")
    current_app_id = db.get_setting("rakuten_app_id", "")
    rakuten_app_id_input = st.text_input(
        "楽天アプリケーションID（applicationId）",
        value=current_app_id,
        type="password",
        help="https://webservice.rakuten.co.jp/ で取得したアプリIDを入力してください。",
    )
    if st.button("楽天設定を保存"):
        db.set_setting("rakuten_app_id", rakuten_app_id_input)
        st.success("保存しました。")

    st.markdown("---")
    st.subheader("紹介文生成AIについて")
    st.write(
        "紹介文の生成は「⚙️ 設定」でのAPIキー登録は不要です。"
        "「✨ 紹介文AIジェネレーター」画面で指示文を作成し、"
        "普段お使いのClaude.aiやChatGPT（無料枠でも構いません）にコピー&ペーストして使う方式のため、"
        "追加のAPI利用料は一切かかりません。"
    )
