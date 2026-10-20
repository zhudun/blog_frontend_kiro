# 札记

个人博客的前端。文章公开阅读，只有作者登录后可以写、改、删。没有注册、关注、点赞和评论。

站点名字和简介在 `blog/js/site.js` 的 `SITE` 里改。

## 页面

- `blog/index.html` 文章列表，可按分类和关键词筛选
- `blog/post.html` 文章正文，支持 Markdown 和公式
- `blog/write.html` 写作。需要先登录
- `blog/login.html` 作者登录
- `blog/about.html` 关于

接口前缀在 `blog/js/api.js` 的 `API_BASE_URL`，默认是 `/blog/api`。
