# 个人博客后台 API 接口文档

> 当前站点按个人使用：`/auth/register` 已关闭。公开阅读已发布文章，写文章使用作者账号登录。收藏、关注、点赞、评论接口仍在，页面不再使用。

> 本文档为前端开发提供完整的后台接口说明，包含数据库设计、API接口、请求/响应格式及示例。

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [数据库设计](#3-数据库设计)
4. [统一响应格式](#4-统一响应格式)
5. [认证机制](#5-认证机制)
6. [API接口详情](#6-api接口详情)
   - [用户认证](#61-用户认证)
   - [用户管理](#62-用户管理)
   - [文章管理](#63-文章管理)
   - [分类管理](#64-分类管理)
   - [标签管理](#65-标签管理)
   - [评论管理](#66-评论管理)
   - [收藏管理](#67-收藏管理)
   - [关注管理](#68-关注管理)
   - [文章点赞](#69-文章点赞)
   - [文件上传](#610-文件上传)

---

## 1. 项目概述

这是一个基于 Spring Boot 的个人博客后台系统，提供完整的博客功能支持：

- 用户注册、登录、资料管理
- 文章的增删改查、分类、标签
- 评论系统（支持嵌套回复、点赞、举报）
- 收藏和关注功能
- 文件上传功能

---

## 2. 技术架构

| 技术 | 说明 |
|------|------|
| Spring Boot | 后端框架 |
| Spring Security | 安全认证 |
| MyBatis-Plus | ORM框架 |
| MySQL | 数据库 |
| JWT | Token认证 |
| Swagger/OpenAPI | API文档 |

---

## 3. 数据库设计

### 3.1 数据库表概览

| 表名 | 说明 |
|------|------|
| blog_users | 用户表 |
| blog_posts | 文章表 |
| blog_categories | 分类表 |
| blog_tags | 标签表 |
| blog_post_tags | 文章-标签关联表 |
| blog_comments | 评论表 |
| blog_comment_likes | 评论点赞表 |
| blog_comment_reports | 评论举报表 |
| blog_post_likes | 文章点赞表 |
| blog_favorites | 收藏表 |
| blog_following | 关注表 |
| blog_notifications | 通知表 |
| blog_post_views | 文章浏览记录表 |

### 3.2 核心表结构

#### 用户表 (blog_users)
```sql
- id: bigint (主键)
- name: varchar(50) -- 用户名
- email: varchar(100) -- 邮箱（唯一）
- password: varchar(255) -- 密码（加密存储）
- role: enum('user','admin') -- 角色
- avatar: varchar(255) -- 头像URL
- bio: text -- 个人简介
- github_url: varchar(255) -- GitHub链接
- twitter_url: varchar(255) -- Twitter链接
- website_url: varchar(255) -- 个人网站
- created_at: timestamp -- 创建时间
- updated_at: timestamp -- 更新时间
- deleted: tinyint(1) -- 是否删除
```

#### 文章表 (blog_posts)
```sql
- id: bigint (主键)
- title: varchar(190) -- 文章标题
- slug: varchar(150) -- URL友好标识符（唯一）
- content: text -- 文章内容（Markdown格式）
- excerpt: text -- 文章摘要
- cover_image: varchar(255) -- 封面图片URL
- author_id: bigint -- 作者ID
- category_id: bigint -- 分类ID
- featured: tinyint(1) -- 是否特色文章
- status: enum('draft','published') -- 文章状态
- read_time: int -- 预计阅读时间(分钟)
- views: int -- 浏览量
- like_count: int -- 点赞数
- favorite_count: int -- 收藏数
- created_at: timestamp -- 创建时间
- updated_at: timestamp -- 更新时间
- deleted: tinyint(1) -- 是否删除
```

#### 分类表 (blog_categories)
```sql
- id: bigint (主键)
- name: varchar(50) -- 分类名称
- slug: varchar(50) -- URL友好标识符（唯一）
- description: text -- 分类描述
- created_at: timestamp
- updated_at: timestamp
- deleted: tinyint(1)
```

#### 标签表 (blog_tags)
```sql
- id: bigint (主键)
- name: varchar(50) -- 标签名称
- slug: varchar(50) -- URL友好标识符（唯一）
- created_at: timestamp
- updated_at: timestamp
- deleted: tinyint(1)
```

#### 评论表 (blog_comments)
```sql
- id: bigint (主键)
- content: text -- 评论内容
- post_id: bigint -- 文章ID
- user_id: bigint -- 用户ID
- parent_id: bigint -- 父评论ID（用于嵌套回复）
- likes: int -- 点赞数
- status: enum('pending','approved','rejected') -- 评论状态
- created_at: timestamp
- updated_at: timestamp
- deleted: tinyint(1)
```

#### 收藏表 (blog_favorites)
```sql
- id: bigint (主键)
- post_id: bigint -- 文章ID
- user_id: bigint -- 用户ID
- created_at: timestamp
- UNIQUE KEY (post_id, user_id)
```

#### 关注表 (blog_following)
```sql
- id: bigint (主键)
- follower_id: bigint -- 关注者ID
- author_id: bigint -- 被关注作者ID
- created_at: timestamp
- UNIQUE KEY (follower_id, author_id)
```

---

## 4. 统一响应格式

所有API接口返回统一的JSON格式：

```json
{
    "code": 200,
    "message": "操作成功",
    "data": { ... }
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 状态码 |
| message | String | 提示信息 |
| data | Object/Array | 返回数据 |

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证（未登录或Token过期） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 分页响应格式

分页接口返回的data结构：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "records": [...],
        "total": 100,
        "size": 10,
        "current": 1,
        "pages": 10
    }
}
```

| 字段 | 说明 |
|------|------|
| records | 数据列表 |
| total | 总记录数 |
| size | 每页数量 |
| current | 当前页码 |
| pages | 总页数 |

---

## 5. 认证机制

### 5.1 JWT Token认证

系统使用JWT（JSON Web Token）进行身份认证。

**认证流程：**
1. 用户登录成功后，服务器返回JWT Token
2. 前端将Token存储在localStorage或Cookie中
3. 后续请求在Header中携带Token

**请求头格式：**
```
Authorization: Bearer <token>
```

### 5.2 权限角色

| 角色 | 说明 |
|------|------|
| USER | 普通用户 |
| ADMIN | 管理员 |

### 5.3 接口权限标识

- 🔓 公开接口：无需登录
- 🔐 需要认证：需要登录
- 👑 管理员接口：需要ADMIN角色

---

## 6. API接口详情

### 6.1 用户认证

#### 6.1.1 用户注册 🔓

**请求**
```
POST /api/auth/register
Content-Type: application/json
```

**请求体**
```json
{
    "name": "用户名",
    "email": "user@example.com",
    "password": "password123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 用户名，2-50字符 |
| email | String | 是 | 邮箱，需符合邮箱格式 |
| password | String | 是 | 密码，6-20字符 |

**响应**
```json
{
    "code": 200,
    "message": "注册成功",
    "data": {
        "id": 1,
        "name": "用户名",
        "email": "user@example.com",
        "role": "user",
        "avatar": null,
        "bio": null,
        "social": null,
        "createdAt": "2025-01-04T10:00:00"
    }
}
```

---

#### 6.1.2 用户登录 🔓

**请求**
```
POST /api/auth/login
Content-Type: application/json
```

**请求体**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**响应**
```json
{
    "code": 200,
    "message": "登录成功",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "name": "用户名",
            "email": "user@example.com",
            "role": "user",
            "avatar": "https://example.com/avatar.jpg"
        }
    }
}
```

---

#### 6.1.3 获取当前用户信息 🔐

**请求**
```
GET /api/auth/user
Authorization: Bearer <token>
```

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 1,
        "name": "用户名",
        "email": "user@example.com",
        "role": "user",
        "avatar": "https://example.com/avatar.jpg",
        "bio": "个人简介",
        "social": {
            "github": "https://github.com/username",
            "twitter": "https://twitter.com/username",
            "website": "https://example.com"
        },
        "createdAt": "2025-01-04T10:00:00"
    }
}
```

---

### 6.2 用户管理

#### 6.2.1 更新用户资料 🔐

**请求**
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**
```json
{
    "name": "新用户名",
    "avatar": "https://example.com/new-avatar.jpg",
    "bio": "这是我的个人简介",
    "githubUrl": "https://github.com/username",
    "twitterUrl": "https://twitter.com/username",
    "websiteUrl": "https://mywebsite.com"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 否 | 用户名，2-50字符 |
| avatar | String | 否 | 头像URL |
| bio | String | 否 | 个人简介，最多500字符 |
| githubUrl | String | 否 | GitHub链接 |
| twitterUrl | String | 否 | Twitter链接 |
| websiteUrl | String | 否 | 个人网站 |

**响应**
```json
{
    "code": 200,
    "message": "更新成功",
    "data": {
        "id": 1,
        "name": "新用户名",
        "email": "user@example.com",
        "role": "user",
        "avatar": "https://example.com/new-avatar.jpg",
        "bio": "这是我的个人简介",
        "social": {
            "github": "https://github.com/username",
            "twitter": "https://twitter.com/username",
            "website": "https://mywebsite.com"
        },
        "createdAt": "2025-01-04T10:00:00"
    }
}
```

---

#### 6.2.2 修改密码 🔐

**请求**
```
PUT /api/users/password
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**
```json
{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| currentPassword | String | 是 | 当前密码 |
| newPassword | String | 是 | 新密码，6-20字符 |

**响应**
```json
{
    "code": 200,
    "message": "密码修改成功",
    "data": null
}
```

---

#### 6.2.3 获取用户已点赞的评论ID列表 🔐

**请求**
```
GET /api/users/likes?commentIds=1,2,3,4,5
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| commentIds | String | 是 | 评论ID列表，逗号分隔 |

**响应**
```json
{
    "code": 200,
    "message": "获取成功",
    "data": {
        "likedCommentIds": [1, 3, 5]
    }
}
```

---

### 6.3 文章管理

#### 6.3.1 获取文章列表 🔓

**请求**
```
GET /api/posts
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| limit | Integer | 否 | 每页数量，默认10 |
| categoryId | Long | 否 | 分类ID筛选 |
| tagId | Long | 否 | 标签ID筛选 |
| authorId | Long | 否 | 作者ID筛选 |
| featured | Boolean | 否 | 是否特色文章 |
| status | String | 否 | 文章状态：draft/published |
| sortBy | String | 否 | 排序字段：createdAt/views/likes |
| order | String | 否 | 排序方式：asc/desc |
| keyword | String | 否 | 关键词搜索 |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "records": [
            {
                "id": 1,
                "title": "Spring Boot 入门教程",
                "slug": "spring-boot-getting-started",
                "content": "# Spring Boot 入门教程...",
                "excerpt": "Spring Boot 是由 Pivotal 团队提供的全新框架...",
                "coverImage": "https://picsum.photos/800/400?random=1",
                "category": "教程",
                "categoryId": 3,
                "tags": ["Java", "Spring", "后端"],
                "author": {
                    "id": 1,
                    "name": "作者名",
                    "avatar": "https://example.com/avatar.jpg",
                    "bio": "作者简介"
                },
                "featured": true,
                "status": "published",
                "readTime": 10,
                "views": 52,
                "createdAt": "2025-03-08T20:39:15",
                "updatedAt": "2025-03-08T20:39:15"
            }
        ],
        "total": 100,
        "size": 10,
        "current": 1,
        "pages": 10
    }
}
```

---

#### 6.3.2 获取文章详情 🔓

**请求**
```
GET /api/posts/{slug}
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| slug | path | String | 是 | 文章的URL友好标识符 |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 1,
        "title": "Spring Boot 入门教程",
        "slug": "spring-boot-getting-started",
        "content": "# Spring Boot 入门教程\n\n这是一篇 Spring Boot 入门教程...",
        "excerpt": "Spring Boot 是由 Pivotal 团队提供的全新框架...",
        "coverImage": "https://picsum.photos/800/400?random=1",
        "category": "教程",
        "categoryId": 3,
        "tags": ["Java", "Spring", "后端"],
        "author": {
            "id": 1,
            "name": "作者名",
            "avatar": "https://example.com/avatar.jpg",
            "bio": "作者简介"
        },
        "featured": true,
        "status": "published",
        "readTime": 10,
        "views": 52,
        "createdAt": "2025-03-08T20:39:15",
        "updatedAt": "2025-03-08T20:39:15"
    }
}
```

---

#### 6.3.3 创建文章 🔐

**请求**
```
POST /api/posts/insert
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**
```json
{
    "title": "我的新文章",
    "content": "# 文章标题\n\n文章内容...",
    "excerpt": "文章摘要",
    "coverImage": "https://example.com/cover.jpg",
    "categoryId": 1,
    "tags": [1, 2, 3],
    "featured": false,
    "status": "draft"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 文章标题 |
| content | String | 是 | 文章内容（支持Markdown） |
| excerpt | String | 否 | 文章摘要 |
| coverImage | String | 否 | 封面图片URL |
| categoryId | Long | 是 | 分类ID |
| tags | Long[] | 否 | 标签ID数组 |
| featured | Boolean | 否 | 是否特色文章，默认false |
| status | String | 否 | 状态：draft/published，默认draft |

**响应**
```json
{
    "code": 200,
    "message": "文章创建成功",
    "data": {
        "id": 10,
        "title": "我的新文章",
        "slug": "my-new-article-1234",
        "content": "# 文章标题\n\n文章内容...",
        "excerpt": "文章摘要",
        "coverImage": "https://example.com/cover.jpg",
        "category": "技术",
        "categoryId": 1,
        "tags": ["Java", "Spring"],
        "author": {
            "id": 1,
            "name": "作者名",
            "avatar": "https://example.com/avatar.jpg",
            "bio": "作者简介"
        },
        "featured": false,
        "status": "draft",
        "readTime": 5,
        "views": 0,
        "createdAt": "2025-01-04T10:00:00",
        "updatedAt": "2025-01-04T10:00:00"
    }
}
```

---

#### 6.3.4 更新文章 🔐

**请求**
```
PUT /api/posts/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 文章ID |

**请求体**
```json
{
    "title": "更新后的标题",
    "content": "# 更新后的内容\n\n...",
    "excerpt": "更新后的摘要",
    "coverImage": "https://example.com/new-cover.jpg",
    "categoryId": 2,
    "tags": [1, 3],
    "featured": true,
    "status": "published"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | 是 | 文章标题 |
| content | String | 是 | 文章内容 |
| excerpt | String | 否 | 文章摘要 |
| coverImage | String | 否 | 封面图片URL |
| categoryId | Long | 是 | 分类ID |
| tags | Long[] | 否 | 标签ID数组 |
| featured | Boolean | 否 | 是否特色文章 |
| status | String | 否 | 状态：draft/published |

**响应**
```json
{
    "code": 200,
    "message": "文章更新成功",
    "data": {
        "id": 10,
        "title": "更新后的标题",
        "slug": "my-new-article-1234",
        "content": "# 更新后的内容\n\n...",
        "excerpt": "更新后的摘要",
        "coverImage": "https://example.com/new-cover.jpg",
        "category": "生活",
        "categoryId": 2,
        "tags": ["Java", "教程"],
        "author": {
            "id": 1,
            "name": "作者名",
            "avatar": "https://example.com/avatar.jpg",
            "bio": "作者简介"
        },
        "featured": true,
        "status": "published",
        "readTime": 5,
        "views": 10,
        "createdAt": "2025-01-04T10:00:00",
        "updatedAt": "2025-01-04T12:00:00"
    }
}
```

---

#### 6.3.5 删除文章 🔐

**请求**
```
DELETE /api/posts/{id}
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 文章ID |

**响应**
```json
{
    "code": 200,
    "message": "文章删除成功",
    "data": null
}
```

> 注意：只能删除自己创建的文章，管理员可以删除任何文章。

---

### 6.4 分类管理

#### 6.4.1 获取所有分类 🔓

**请求**
```
GET /api/categories
```

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": [
        {
            "id": 1,
            "name": "技术",
            "slug": "technology",
            "count": 25
        },
        {
            "id": 2,
            "name": "生活",
            "slug": "life",
            "count": 10
        },
        {
            "id": 3,
            "name": "教程",
            "slug": "tutorial",
            "count": 15
        },
        {
            "id": 4,
            "name": "资讯",
            "slug": "news",
            "count": 8
        }
    ]
}
```

---

### 6.5 标签管理

#### 6.5.1 获取所有标签 🔓

**请求**
```
GET /api/tags
```

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": [
        {
            "id": 1,
            "name": "Java",
            "slug": "java",
            "count": 20
        },
        {
            "id": 2,
            "name": "Spring",
            "slug": "spring",
            "count": 15
        },
        {
            "id": 3,
            "name": "MySQL",
            "slug": "mysql",
            "count": 8
        }
    ]
}
```

---

#### 6.5.2 新增标签 🔐

**请求**
```
POST /api/tags/insert
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**
```json
{
    "name": "新标签",
    "slug": "new-tag"
}
```

**响应**
```json
{
    "code": 200,
    "message": "标签新增成功",
    "data": null
}
```

---

### 6.6 评论管理

#### 6.6.1 获取文章评论列表 🔓

**请求**
```
GET /api/posts/{postId}/comments
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| postId | path | Long | 是 | 文章ID |
| page | query | Integer | 否 | 页码，默认1 |
| limit | query | Integer | 否 | 每页数量，默认10 |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "comments": [
            {
                "id": 1,
                "content": "这篇教程非常详细，对初学者很有帮助！",
                "postId": 1,
                "userId": 2,
                "parentId": null,
                "likes": 5,
                "status": "approved",
                "createdAt": "2025-03-08T20:39:15",
                "user": {
                    "id": 2,
                    "name": "用户名",
                    "avatar": "https://example.com/avatar.jpg"
                },
                "replies": [
                    {
                        "id": 3,
                        "content": "同意，写得很好！",
                        "postId": 1,
                        "userId": 3,
                        "parentId": 1,
                        "likes": 2,
                        "status": "approved",
                        "createdAt": "2025-03-09T10:00:00",
                        "user": {
                            "id": 3,
                            "name": "另一个用户",
                            "avatar": "https://example.com/avatar2.jpg"
                        },
                        "replies": []
                    }
                ]
            }
        ],
        "pagination": {
            "total": 50,
            "page": 1,
            "limit": 10,
            "pages": 5
        }
    }
}
```

---

#### 6.6.2 发表评论 🔐

**请求**
```
POST /api/posts/{postId}/comments
Authorization: Bearer <token>
Content-Type: application/json
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| postId | path | Long | 是 | 文章ID |

**请求体**
```json
{
    "content": "这是一条评论内容",
    "parentId": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | String | 是 | 评论内容 |
| parentId | Long | 否 | 父评论ID，用于回复评论 |

**响应**
```json
{
    "code": 200,
    "message": "评论发表成功",
    "data": {
        "id": 10,
        "content": "这是一条评论内容",
        "postId": 1,
        "userId": 1,
        "parentId": null,
        "likes": 0,
        "status": "pending",
        "createdAt": "2025-01-04T10:00:00",
        "user": {
            "id": 1,
            "name": "用户名",
            "avatar": "https://example.com/avatar.jpg"
        },
        "replies": []
    }
}
```

---

#### 6.6.3 删除评论 🔐

**请求**
```
DELETE /api/comments/{id}
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 评论ID |

**响应**
```json
{
    "code": 200,
    "message": "评论删除成功",
    "data": null
}
```

> 注意：只能删除自己发表的评论，管理员可以删除任何评论。

---

#### 6.6.4 评论点赞 🔐

**请求**
```
POST /api/comments/{commentId}/like
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| commentId | path | Long | 是 | 评论ID |

**响应**
```json
{
    "code": 200,
    "message": "点赞成功",
    "data": {
        "isLiked": true,
        "likes": 10
    }
}
```

> 说明：同一用户对同一评论重复点击会切换点赞状态（点赞/取消点赞）。

---

#### 6.6.5 举报评论 🔐

**请求**
```
POST /api/comments/{commentId}/report
Authorization: Bearer <token>
Content-Type: application/json
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| commentId | path | Long | 是 | 评论ID |

**请求体**
```json
{
    "reason": "这条评论包含不当内容，具体原因是..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reason | String | 是 | 举报原因，10-500字符 |

**响应**
```json
{
    "code": 200,
    "message": "举报成功",
    "data": {
        "id": 1,
        "commentId": 5,
        "userId": 1,
        "reason": "这条评论包含不当内容，具体原因是...",
        "status": "pending",
        "createdAt": "2025-01-04T10:00:00"
    }
}
```

---

#### 6.6.6 获取评论列表（管理接口） 🔐

**请求**
```
GET /api/comments
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| postId | Long | 否 | 文章ID（与userId至少提供一个） |
| userId | Long | 否 | 用户ID（与postId至少提供一个） |
| status | String | 否 | 评论状态：pending/approved/rejected |
| page | Integer | 否 | 页码，默认1 |
| limit | Integer | 否 | 每页数量，默认10 |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "records": [
            {
                "id": 1,
                "content": "评论内容",
                "postId": 1,
                "userId": 2,
                "parentId": null,
                "likes": 5,
                "status": "approved",
                "createdAt": "2025-03-08T20:39:15",
                "user": {
                    "id": 2,
                    "name": "用户名",
                    "avatar": "https://example.com/avatar.jpg"
                },
                "replies": []
            }
        ],
        "total": 100,
        "size": 10,
        "current": 1,
        "pages": 10
    }
}
```

---

### 6.7 收藏管理

#### 6.7.1 获取用户收藏列表 🔐

**请求**
```
GET /api/favorites
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| limit | Integer | 否 | 每页数量，默认10 |
| sortBy | String | 否 | 排序字段 |
| order | String | 否 | 排序方式：asc/desc |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "records": [
            {
                "id": 1,
                "createdAt": "2025-01-04T10:00:00",
                "post": {
                    "id": 1,
                    "title": "Spring Boot 入门教程",
                    "slug": "spring-boot-getting-started",
                    "excerpt": "Spring Boot 是由 Pivotal 团队提供的全新框架...",
                    "coverImage": "https://picsum.photos/800/400?random=1",
                    "category": "教程",
                    "categoryId": 3,
                    "tags": ["Java", "Spring"],
                    "author": {
                        "id": 1,
                        "name": "作者名",
                        "avatar": "https://example.com/avatar.jpg",
                        "bio": "作者简介"
                    },
                    "featured": true,
                    "status": "published",
                    "readTime": 10,
                    "views": 52,
                    "createdAt": "2025-03-08T20:39:15",
                    "updatedAt": "2025-03-08T20:39:15"
                }
            }
        ],
        "total": 20,
        "size": 10,
        "current": 1,
        "pages": 2
    }
}
```

---

#### 6.7.2 添加收藏 🔐

**请求**
```
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**
```json
{
    "postId": 1
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| postId | Long | 是 | 文章ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 5,
        "createdAt": "2025-01-04T10:00:00",
        "post": {
            "id": 1,
            "title": "Spring Boot 入门教程",
            "slug": "spring-boot-getting-started",
            ...
        }
    }
}
```

---

#### 6.7.3 取消收藏 🔐

**请求**
```
DELETE /api/favorites/{id}
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 文章ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "deleted": true
    }
}
```

---

#### 6.7.4 检查收藏状态 🔐

**请求**
```
GET /api/favorites/check/{id}
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 文章ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "favorited": true
    }
}
```

---

### 6.8 关注管理

#### 6.8.1 获取关注列表 🔐

**请求**
```
GET /api/following
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| limit | Integer | 否 | 每页数量，默认10 |
| sortBy | String | 否 | 排序字段 |
| order | String | 否 | 排序方式：asc/desc |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "records": [
            {
                "id": 1,
                "createdAt": "2025-01-04T10:00:00",
                "author": {
                    "id": 2,
                    "name": "作者名",
                    "username": "author_username",
                    "avatar": "https://example.com/avatar.jpg",
                    "bio": "作者简介",
                    "postCount": 25,
                    "followerCount": 100,
                    "recentPosts": [
                        {
                            "id": 1,
                            "title": "最新文章标题",
                            "slug": "latest-post"
                        },
                        {
                            "id": 2,
                            "title": "另一篇文章",
                            "slug": "another-post"
                        }
                    ]
                }
            }
        ],
        "total": 15,
        "size": 10,
        "current": 1,
        "pages": 2
    }
}
```

---

#### 6.8.2 添加关注 🔐

**请求**
```
POST /api/following
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**
```json
{
    "authorId": 2
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| authorId | Long | 是 | 作者ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 5,
        "createdAt": "2025-01-04T10:00:00",
        "author": {
            "id": 2,
            "name": "作者名",
            "username": "author_username",
            "avatar": "https://example.com/avatar.jpg",
            "bio": "作者简介",
            "postCount": 25,
            "followerCount": 101,
            "recentPosts": [...]
        }
    }
}
```

---

#### 6.8.3 取消关注 🔐

**请求**
```
DELETE /api/following/{id}
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 作者ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "deleted": true
    }
}
```

---

#### 6.8.4 检查关注状态 🔐

**请求**
```
GET /api/following/check/{id}
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 作者ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "following": true
    }
}
```

---

### 6.9 文章点赞

#### 6.9.1 获取用户对文章的操作状态 🔐

**请求**
```
GET /api/posts/{id}/user-actions
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 文章ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "liked": true,
        "likeCount": 25
    }
}
```

---

#### 6.9.2 点赞文章 🔐

**请求**
```
POST /api/posts/{id}/like
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 文章ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "liked": true,
        "likeCount": 26
    }
}
```

---

#### 6.9.3 取消点赞文章 🔐

**请求**
```
DELETE /api/posts/{id}/like
Authorization: Bearer <token>
```

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| id | path | Long | 是 | 文章ID |

**响应**
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "liked": false,
        "likeCount": 25
    }
}
```

---

### 6.10 文件上传

#### 6.10.1 上传图片 🔐

**请求**
```
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 图片文件 |

**响应**
```json
{
    "code": 200,
    "message": "图片上传成功",
    "data": {
        "url": "https://example.com/uploads/images/2025/01/04/abc123.jpg"
    }
}
```

> 支持的图片格式：jpg, jpeg, png, gif, webp

---

## 7. 前端开发建议

### 7.1 请求封装示例

```javascript
// axios 请求封装示例
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

// 请求拦截器 - 添加Token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器 - 统一处理错误
api.interceptors.response.use(
    response => response.data,
    error => {
        if (error.response?.status === 401) {
            // Token过期，跳转登录
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

### 7.2 API调用示例

```javascript
// 用户登录
const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.code === 200) {
        localStorage.setItem('token', res.data.token);
        return res.data.user;
    }
    throw new Error(res.message);
};

// 获取文章列表
const getPosts = async (params) => {
    const res = await api.get('/posts', { params });
    return res.data;
};

// 创建文章
const createPost = async (postData) => {
    const res = await api.post('/posts/insert', postData);
    return res.data;
};

// 上传图片
const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
};
```

### 7.3 状态管理建议

建议使用 Vuex/Pinia (Vue) 或 Redux/Zustand (React) 管理以下全局状态：

- 用户登录状态和信息
- Token存储
- 全局加载状态
- 错误提示

### 7.4 路由权限控制

```javascript
// 路由守卫示例
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    
    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else {
        next();
    }
});
```

---

## 8. 常见问题

### Q1: Token过期怎么处理？
A: 当收到401状态码时，清除本地Token并跳转到登录页面。

### Q2: 如何处理分页？
A: 使用返回的pagination信息，current为当前页，pages为总页数，total为总记录数。

### Q3: 文章内容格式是什么？
A: 文章内容使用Markdown格式存储，前端需要使用Markdown解析库（如marked.js）渲染。

### Q4: 如何实现评论嵌套显示？
A: 评论返回的replies字段包含子评论列表，可递归渲染实现嵌套效果。

### Q5: 图片上传大小限制？
A: 建议前端限制图片大小不超过5MB，后端也有相应限制。

---

## 9. 更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2025-01-04 | 初始版本，包含完整API文档 |

---

> 文档由后端自动生成，如有疑问请联系后端开发人员。
