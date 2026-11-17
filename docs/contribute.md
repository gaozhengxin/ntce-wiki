# 导入题目与版权说明

题库保存在 `data/questions.json`，每道题至少需包括唯一 `id`、`stage`、`subject`、`kind`、`question` 和 `answer`。

```json
{
  "id": "2026-s1-primary-001",
  "year": 2026,
  "semester": "上半年",
  "stage": "小学",
  "subject": "综合素质",
  "kind": "简答",
  "origin": "licensed-past-paper",
  "topic": "教师职业理念",
  "question": "已获授权的题干",
  "options": [],
  "answer": "已获授权的答案",
  "sourceUrl": "https://example.com/source",
  "license": "CC BY 4.0 或书面授权编号"
}
```

题目、选项、参考答案作为一个对象保存，客户端使用统一的隐藏/显示机制，不用为不同题型开发独立判分逻辑。

- `origin: original`：自编例题，不得标称真题。
- `origin: licensed-past-paper`：授权真题，需要提供来源与转载许可。
- `origin: public-domain`：已确认公有领域的材料，需要有核查依据。
- 第三方仅可访问的文章或试卷：先记录到 `data/sources.json`，**不可默认为开放许可**。

提交前运行 `python3 scripts/validate.py`。
