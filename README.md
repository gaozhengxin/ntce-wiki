# 教资 Wiki（纯静态）

GitHub Pages 可直接部署的教师资格考试资料导航、Wiki、刷题与错题本。**无登录、无数据库、无第三方 JS 依赖**。

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

- `data/questions.json`：题目与答案，结构见 Wiki 的“导入题目”。
- `data/sources.json`：第三方来源索引及授权状态。
- `data/wiki.json` + `docs/*.md`：Markdown 知识库。
- `localStorage`：用户本地判断结果；主页提供 JSON 导入、导出。

## 内容边界

题库当前为空，资料来源另见 Wiki 索引。可访问的第三方真题和解析不等于可授权转载。本仓库不会复制收费题库、绕过访问限制或把第三方题目改写后冒充自创。

本项目中的原创站点代码和原创笔记采用 MIT 许可；第三方链接所指内容的版权不在本许可内。考试大纲和历年真题的分项链接见 Wiki。考纲和真题原件包位于 `downloads/ntce-originals.zip`，也可从首页下载。

## 后续导入

获得授权后向 `data/questions.json` 添加对象即可，建议按学段/年度分文件再由简单脚本合并。为真题保留来源页面、原始题号、准确日期、原题/回忆版、授权条款等元数据。
