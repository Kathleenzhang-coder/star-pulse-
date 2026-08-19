# StarPulse 星汛 · 全球娱乐情报

面向追星群体的娱乐情报站 — **真实 RSS 聚合**，不是模拟数据。

## 启动方式（必须）

资讯来自 Google 新闻、allkpop 等公开 RSS，需要本地服务拉取：

```bash
cd star-pulse
npm install
npm start
```

浏览器打开 **http://127.0.0.1:5174**

> 不要直接双击 `index.html`，否则 RSS 接口无法访问。

## 三大板块

| 板块 | 说明 |
|------|------|
| **情报局** | 内娱 / 韩圈 / 日娱 / 欧美 / 泰兰德 真实资讯，点击跳转原文 |
| **安利墙** | 发帖（图文视频）、点赞、评论、转发 |
| **同好雷达** | 地图发现附近追星搭子（模糊定位） |

## 资讯来源

- Google 新闻 RSS（中/日/美/泰等区域搜索）
- allkpop Lab RSS（韩圈）
- 每 10 分钟自动缓存刷新，也可点 ⟳ 手动同步

## 文件结构

```
star-pulse/
├── server.js          # RSS 聚合服务
├── package.json
├── index.html
├── css/main.css
└── js/                # 前端逻辑
```
