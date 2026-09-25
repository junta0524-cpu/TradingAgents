# -*- coding: utf-8 -*-
"""
database.py
-----------------------------------------------------------------------------
SQLite3を使ったデータ永続化を担当するモジュール。
このアプリで扱う3種類のデータをすべてここで管理する。

1. products      : 楽天商品検索APIで取得した商品情報と、投稿ステータスなどの管理項目
2. settings      : APIキーなど、UIの設定画面から入力する値（アプリケーションID、LLMのAPIキー等）
3. rank_tracker  : ランク維持のための日次チェックリスト（オリジナル写真投稿／いいね・フォロー活動）

他のモジュール（app.py等）はこのファイルの関数を呼び出すだけでよく、
SQL文を直接書かなくて済むようにラップしている。
"""

import sqlite3
import os
import calendar
from datetime import date

import pandas as pd

# データベースファイルの保存先。
# このファイル(database.py)と同じディレクトリに rakuten_room.db を作成する。
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "rakuten_room.db")


def get_connection() -> sqlite3.Connection:
    """
    SQLite3への接続を取得する。

    Streamlitはリクエストごとにスクリプトを再実行するため、
    毎回新しい接続を作って都度クローズする方式にしている（コネクションプールは使わない）。
    """
    conn = sqlite3.connect(DB_PATH)
    # 列名でアクセスできるようにする（例: row["item_name"]）
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """
    アプリ起動時に一度呼び出し、必要なテーブルが存在しなければ作成する。
    既にテーブルが存在する場合は何もしない（IF NOT EXISTS）。
    """
    conn = get_connection()
    cur = conn.cursor()

    # ---------------------------------------------------------------
    # 商品管理テーブル
    # ---------------------------------------------------------------
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name           TEXT NOT NULL,          -- 商品名
            price               INTEGER,                -- 価格（税込）
            item_url            TEXT UNIQUE,             -- 商品URL（重複登録防止のためUNIQUE制約）
            image_url           TEXT,                    -- 商品画像URL
            shop_name           TEXT,                    -- ショップ名
            post_status         TEXT DEFAULT '未投稿',    -- 投稿ステータス（未投稿 / 投稿済）
            has_original_photo  TEXT DEFAULT 'なし',      -- オリジナル写真の有無（あり / なし）
            memo                TEXT DEFAULT '',          -- 自由入力メモ
            generated_caption   TEXT DEFAULT '',          -- AIが生成した紹介文（最新版）
            created_at          TEXT DEFAULT (datetime('now', 'localtime'))
        )
        """
    )

    # ---------------------------------------------------------------
    # 設定テーブル（キー・バリュー形式でAPIキー等を保存する）
    # ---------------------------------------------------------------
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT
        )
        """
    )

    # ---------------------------------------------------------------
    # ランク維持トラッカー（日ごとのチェック状況）
    # ---------------------------------------------------------------
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS rank_tracker (
            day_date          TEXT PRIMARY KEY,   -- 対象日（YYYY-MM-DD）
            photo_posted      INTEGER DEFAULT 0,  -- オリジナル写真投稿を行ったか（0/1）
            like_follow_done  INTEGER DEFAULT 0   -- いいね・フォロー活動を行ったか（0/1）
        )
        """
    )

    # ---------------------------------------------------------------
    # 参考投稿ライブラリ（ユーザーが手動でコピーして保存した「良い投稿」の実例）
    # ---------------------------------------------------------------
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS reference_posts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            content     TEXT NOT NULL,             -- 投稿文の本文（手動でコピーしたもの）
            note        TEXT DEFAULT '',           -- なぜ良いと思ったかのメモ（任意）
            created_at  TEXT DEFAULT (datetime('now', 'localtime'))
        )
        """
    )

    conn.commit()
    conn.close()


# =============================================================================
# 商品管理（products）関連の関数
# =============================================================================

def insert_product(item: dict) -> bool:
    """
    商品情報を1件DBに登録する。

    item_url にUNIQUE制約を張っているため、既に同じ商品URLが登録済みの場合は
    INSERT OR IGNORE により無視される（重複登録を防止）。

    戻り値: 新規登録できた場合はTrue、既に存在していて無視された場合はFalse
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT OR IGNORE INTO products
            (item_name, price, item_url, image_url, shop_name)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            item.get("item_name", ""),
            item.get("price", 0),
            item.get("item_url", ""),
            item.get("image_url", ""),
            item.get("shop_name", ""),
        ),
    )
    conn.commit()
    inserted = cur.rowcount > 0
    conn.close()
    return inserted


def get_all_products() -> pd.DataFrame:
    """
    登録済みの商品を全件、新しい順（id降順）で取得しDataFrameとして返す。
    商品管理画面（st.data_editor）で表示・編集するために使う。
    """
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM products ORDER BY id DESC", conn)
    conn.close()
    return df


def get_product_by_id(product_id: int) -> dict | None:
    """指定したIDの商品情報を1件取得する。存在しなければNone。"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def update_product_fields(product_id: int, **fields) -> None:
    """
    指定した商品(product_id)の任意のカラムを更新する汎用関数。

    使用例:
        update_product_fields(3, post_status="投稿済", memo="反応が良かった")

    fieldsに渡されたキーがそのままカラム名として使われるため、
    呼び出し元（アプリ内部）以外からユーザー入力のカラム名を直接渡さないよう注意する。
    """
    if not fields:
        return

    # SQLインジェクション対策として、更新可能なカラムをホワイトリストで制限する
    allowed_columns = {
        "item_name",
        "price",
        "item_url",
        "image_url",
        "shop_name",
        "post_status",
        "has_original_photo",
        "memo",
        "generated_caption",
    }
    set_clauses = []
    values = []
    for key, value in fields.items():
        if key not in allowed_columns:
            continue
        set_clauses.append(f"{key} = ?")
        values.append(value)

    if not set_clauses:
        return

    values.append(product_id)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE products SET {', '.join(set_clauses)} WHERE id = ?",
        values,
    )
    conn.commit()
    conn.close()


def delete_product(product_id: int) -> None:
    """指定したIDの商品をDBから削除する。"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()


# =============================================================================
# 設定（settings）関連の関数
# =============================================================================

def get_setting(key: str, default: str = "") -> str:
    """設定値を1件取得する。存在しない場合はdefaultを返す。"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cur.fetchone()
    conn.close()
    if row is None:
        return default
    return row["value"] if row["value"] is not None else default


def set_setting(key: str, value: str) -> None:
    """
    設定値を1件保存する。
    既に同じキーが存在する場合は値を上書きする（UPSERT）。
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """,
        (key, value),
    )
    conn.commit()
    conn.close()


# =============================================================================
# ランク維持トラッカー（rank_tracker）関連の関数
# =============================================================================

def get_month_tracker(year: int, month: int) -> pd.DataFrame:
    """
    指定した年月の1日から末日までの全日付について、
    チェック状況（未登録の日はすべて0扱い）をDataFrameで返す。

    表形式で「日付 / オリジナル写真投稿 / いいね・フォロー活動」の
    チェックボックスをレンダリングするために使用する。
    """
    conn = get_connection()
    df = pd.read_sql_query(
        "SELECT day_date, photo_posted, like_follow_done FROM rank_tracker",
        conn,
    )
    conn.close()

    # 対象月の全日付リストを作成する（例: 2024-06-01 〜 2024-06-30）
    days_in_month = calendar.monthrange(year, month)[1]
    all_dates = [date(year, month, d).isoformat() for d in range(1, days_in_month + 1)]

    base_df = pd.DataFrame({"day_date": all_dates})
    merged = base_df.merge(df, on="day_date", how="left")
    merged["photo_posted"] = merged["photo_posted"].fillna(0).astype(int).astype(bool)
    merged["like_follow_done"] = merged["like_follow_done"].fillna(0).astype(int).astype(bool)
    return merged


def set_day_tracker(day_date: str, photo_posted: bool, like_follow_done: bool) -> None:
    """
    指定した日付(day_date, 'YYYY-MM-DD')のチェック状況を保存する（UPSERT）。
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO rank_tracker (day_date, photo_posted, like_follow_done)
        VALUES (?, ?, ?)
        ON CONFLICT(day_date) DO UPDATE SET
            photo_posted = excluded.photo_posted,
            like_follow_done = excluded.like_follow_done
        """,
        (day_date, int(photo_posted), int(like_follow_done)),
    )
    conn.commit()
    conn.close()


# =============================================================================
# 参考投稿ライブラリ（reference_posts）関連の関数
# =============================================================================
#
# 楽天の規約でスクレイピング（投稿の自動収集）は禁止されているため、
# ここに保存する投稿はすべてユーザー自身が目で見て、手動でコピー&ペーストしたものに限る。
# あくまで「良い投稿の書き方の参考」として、紹介文の指示文作成時にAIへ渡すために使う。

def insert_reference_post(content: str, note: str = "") -> int:
    """
    参考にしたい投稿の本文をライブラリに1件追加する。
    戻り値: 追加した行のID。
    """
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO reference_posts (content, note) VALUES (?, ?)",
        (content, note),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def get_all_reference_posts() -> pd.DataFrame:
    """保存済みの参考投稿を全件、新しい順（id降順）で取得する。"""
    conn = get_connection()
    df = pd.read_sql_query(
        "SELECT * FROM reference_posts ORDER BY id DESC", conn
    )
    conn.close()
    return df


def get_reference_posts_by_ids(ids: list[int]) -> list[dict]:
    """指定したID群の参考投稿を取得する（紹介文の指示文作成時に使用）。"""
    if not ids:
        return []
    conn = get_connection()
    cur = conn.cursor()
    placeholders = ",".join("?" for _ in ids)
    cur.execute(
        f"SELECT * FROM reference_posts WHERE id IN ({placeholders})", ids
    )
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return rows


def update_reference_post(post_id: int, content: str, note: str) -> None:
    """参考投稿の内容・メモを更新する。"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE reference_posts SET content = ?, note = ? WHERE id = ?",
        (content, note, post_id),
    )
    conn.commit()
    conn.close()


def delete_reference_post(post_id: int) -> None:
    """参考投稿をライブラリから削除する。"""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM reference_posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
