"""Account persona and fortune-telling reference data (zodiac signs, tarot deck)."""

from dataclasses import dataclass


@dataclass
class Persona:
    """The account's fixed character — kept stable across every generated post
    so the feed reads as one consistent voice rather than generic AI output.
    """

    name: str = "月詠(つくよみ)"
    tone: str = "落ち着いた大人の口調。断定しすぎず、寄り添うように語りかける。絵文字は要点の区切りに1〜2個まで。"
    specialty: str = "西洋占星術・タロット"
    catchphrase: str = "今日のあなたに、そっと寄り添う一言を。"
    cta: str = "あなたの星座はどれ？リプで教えてね🔮"

    def system_prompt(self) -> str:
        return (
            f"あなたは占い師アカウント「{self.name}」です。専門は{self.specialty}。"
            f"口調: {self.tone} 一人称は「私」。"
            "占い結果は断定表現(「絶対」「必ず」「100%」等)を使わず、"
            "読者の行動のヒントになるような前向きな言葉で締めること。"
        )


ZODIAC_SIGNS = [
    {"name": "牡羊座", "range": "3/21-4/19", "element": "火", "keyword": "行動力"},
    {"name": "牡牛座", "range": "4/20-5/20", "element": "地", "keyword": "安定"},
    {"name": "双子座", "range": "5/21-6/21", "element": "風", "keyword": "好奇心"},
    {"name": "蟹座", "range": "6/22-7/22", "element": "水", "keyword": "共感"},
    {"name": "獅子座", "range": "7/23-8/22", "element": "火", "keyword": "自信"},
    {"name": "乙女座", "range": "8/23-9/22", "element": "地", "keyword": "誠実"},
    {"name": "天秤座", "range": "9/23-10/23", "element": "風", "keyword": "調和"},
    {"name": "蠍座", "range": "10/24-11/21", "element": "水", "keyword": "情熱"},
    {"name": "射手座", "range": "11/22-12/21", "element": "火", "keyword": "自由"},
    {"name": "山羊座", "range": "12/22-1/19", "element": "地", "keyword": "堅実"},
    {"name": "水瓶座", "range": "1/20-2/18", "element": "風", "keyword": "独創性"},
    {"name": "魚座", "range": "2/19-3/20", "element": "水", "keyword": "直感"},
]

# Major Arcana only — enough variety for a daily one-card pull without the
# added complexity (and inconsistent meanings) of the full 78-card deck.
TAROT_MAJOR_ARCANA = [
    {"name": "愚者", "upright": "新しい始まり・自由な一歩", "reversed": "無謀・準備不足"},
    {"name": "魔術師", "upright": "才能の発揮・行動のタイミング", "reversed": "空回り・準備不足"},
    {"name": "女教皇", "upright": "直感・静かな洞察", "reversed": "情報不足・思い込み"},
    {"name": "女帝", "upright": "豊かさ・受容", "reversed": "浪費・依存"},
    {"name": "皇帝", "upright": "リーダーシップ・安定", "reversed": "頑固・支配欲"},
    {"name": "教皇", "upright": "助言・伝統", "reversed": "形式主義・停滞"},
    {"name": "恋人", "upright": "選択・調和", "reversed": "迷い・すれ違い"},
    {"name": "戦車", "upright": "前進・勝利", "reversed": "暴走・方向性の喪失"},
    {"name": "力", "upright": "内なる強さ・忍耐", "reversed": "自信喪失・力の空回り"},
    {"name": "隠者", "upright": "内省・一人の時間", "reversed": "孤立・視野の狭さ"},
    {"name": "運命の輪", "upright": "転機・好機の到来", "reversed": "停滞・タイミングのずれ"},
    {"name": "正義", "upright": "公正・バランス", "reversed": "偏り・判断の誤り"},
    {"name": "吊るされた男", "upright": "忍耐・視点の転換", "reversed": "徒労・停滞"},
    {"name": "死神", "upright": "終わりと再生・切り替え", "reversed": "変化への抵抗"},
    {"name": "節制", "upright": "調和・バランスの回復", "reversed": "不摂生・過不足"},
    {"name": "悪魔", "upright": "誘惑への気づき・解放の兆し", "reversed": "執着・依存からの脱却"},
    {"name": "塔", "upright": "急な変化・気づき", "reversed": "変化への抵抗・混乱"},
    {"name": "星", "upright": "希望・癒し", "reversed": "自信喪失・理想とのズレ"},
    {"name": "月", "upright": "不安・不確かさへの気づき", "reversed": "不安の解消・真実の判明"},
    {"name": "太陽", "upright": "成功・活力", "reversed": "一時的な曇り・エネルギー不足"},
    {"name": "審判", "upright": "再生・目覚め", "reversed": "後悔・決断の先延ばし"},
    {"name": "世界", "upright": "完成・達成", "reversed": "未完了・区切りの先延ばし"},
]
