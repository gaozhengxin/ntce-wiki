# 教师资格题库（纯静态）

GitHub Pages 可直接部署的教师资格考试资料导航、真题索引、刷题与错题本。**无登录、无数据库、无第三方 JS 依赖**。

## 本地预览

```sh
python3 scripts/validate.py
python3 -m http.server 8000
```

访问 <http://localhost:8000/>。请勿直接双击 HTML 文件，因为浏览器对 `file://` 下的 `fetch` 有限制。

## GitHub Pages 部署

1. 将本目录推送至 GitHub 仓库的 `main` 分支。
2. 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
3. `.github/workflows/pages.yml` 会在 push 后验证题库并发布静态文件。
4. 站点地址通常是 `https://<用户名>.github.io/<仓库名>/`。

也可以将目录交给 Cloudflare Pages，构建命令留空，输出目录 `/`。

## 数据文件

- `data/questions.json`：题目与答案，保留原卷题号和来源。
- `data/sources.json`：第三方来源索引及授权状态。
- `data/paper-index.json`：逐卷收录范围与缺口。
- `localStorage`：用户本地判断结果；主页提供 JSON 导入、导出。

## 内容边界

试题和参考答案可在资料页的试卷原件中查阅。

考试大纲和历年真题可以在资料页逐份查看和下载，也可以下载 `downloads/ntce-originals.zip`。本项目的原创代码和笔记采用 MIT 许可，第三方原件沿用其各自的权利声明。

## 后续导入

获得授权后向 `data/questions.json` 添加对象即可，建议按学段/年度分文件再由简单脚本合并。为真题保留来源页面、原始题号、准确日期、原题/回忆版、授权条款等元数据。
