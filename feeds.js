/** RSS 源配置 — 新闻 + 社交平台（经 Google News 检索） */

const FEEDS = [
  // —— 内娱 ——
  {
    region: 'cn', platform: 'news', source: 'Google · 内娱',
    url: 'https://news.google.com/rss/search?q=%E6%98%8E%E6%98%9F+%E8%89%BA%E4%BA%BA+%E7%BB%BC%E8%89%BA+%E5%A8%B1%E4%B9%90&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'news', source: 'Google · 影视',
    url: 'https://news.google.com/rss/search?q=%E7%94%B5%E5%BD%B1+%E7%94%B5%E8%A7%86+%E5%89%A7%E9%9B%86+%E6%98%8E%E6%98%9F&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'news', source: 'Google · 电影',
    url: 'https://news.google.com/rss/search?q=%E7%94%B5%E5%BD%B1+%E4%B8%8A%E6%98%A0+%E7%A5%A8%E6%88%BF+%E5%86%85%E5%9C%B0&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'news', source: 'Google · 电视剧',
    url: 'https://news.google.com/rss/search?q=%E7%94%B5%E8%A7%86%E5%89%A7+%E7%83%AD%E6%92%AD+%E5%AE%9A%E6%A1%A3+%E5%9B%BD%E5%89%A7&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'weibo', source: '微博 · 明星',
    url: 'https://news.google.com/rss/search?q=site:weibo.com+%E6%98%8E%E6%98%9F+%E5%A8%B1%E4%B9%90&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'weibo', source: '微博 · 八卦',
    url: 'https://news.google.com/rss/search?q=site:weibo.com+%E5%85%AB%E5%8D%A6+%E7%BB%BC%E8%89%BA&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'douyin', source: '抖音 · 明星',
    url: 'https://news.google.com/rss/search?q=site:douyin.com+%E6%98%8E%E6%98%9F+%E5%A8%B1%E4%B9%90&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'douyin', source: '抖音 · 热搜',
    url: 'https://news.google.com/rss/search?q=%E6%8A%96%E9%9F%B3+%E6%98%8E%E6%98%9F+%E7%83%AD%E6%90%9C&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'xhs', source: '小红书 · 追星',
    url: 'https://news.google.com/rss/search?q=%E5%B0%8F%E7%BA%A2%E4%B9%A6+%E6%98%8E%E6%98%9F+%E8%BF%BD%E6%98%9F&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'cn', platform: 'xhs', source: '小红书 · 娱乐',
    url: 'https://news.google.com/rss/search?q=site:xiaohongshu.com+%E5%A8%B1%E4%B9%90+%E6%98%8E%E6%98%9F&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },

  // —— 韩圈 ——
  {
    region: 'kr', platform: 'news', source: 'allkpop',
    url: 'https://www.allkpop.com/rss_xml/lab.php',
  },
  {
    region: 'kr', platform: 'news', source: 'Google · K-pop',
    url: 'https://news.google.com/rss/search?q=K-pop+OR+K-drama+celebrity&hl=en&gl=KR&ceid=KR:en',
    urlZh: 'https://news.google.com/rss/search?q=K-pop+%E9%9F%A9%E6%B5%81+%E9%9F%A9%E5%A8%B1&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'kr', platform: 'news', source: 'Google · 韩剧',
    url: 'https://news.google.com/rss/search?q=K-drama+Korean+drama+series+Netflix&hl=en&gl=KR&ceid=KR:en',
    urlZh: 'https://news.google.com/rss/search?q=%E9%9F%A9%E5%89%A7+%E9%9F%A9%E5%9B%BD%E7%94%B5%E8%A7%86%E5%89%A7&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'kr', platform: 'instagram', source: 'Instagram · K-pop',
    url: 'https://news.google.com/rss/search?q=site:instagram.com+K-pop+idol&hl=en&gl=US&ceid=US:en',
    urlZh: 'https://news.google.com/rss/search?q=site:instagram.com+K-pop&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'kr', platform: 'x', source: 'X · K-pop',
    url: 'https://news.google.com/rss/search?q=(site:x.com+OR+site:twitter.com)+K-pop+idol&hl=en&gl=US&ceid=US:en',
    urlZh: 'https://news.google.com/rss/search?q=(site:x.com+OR+site:twitter.com)+K-pop&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },

  // —— 日娱 ——
  {
    region: 'jp', platform: 'news', source: 'Google · 日娱',
    url: 'https://news.google.com/rss/search?q=Japan+entertainment+celebrity+OR+%E8%8A%B8%E8%83%BD&hl=ja&gl=JP&ceid=JP:ja',
    urlZh: 'https://news.google.com/rss/search?q=%E6%97%A5%E6%9C%AC+%E5%A8%B1%E4%B9%90+%E8%89%BA%E4%BA%BA&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'jp', platform: 'news', source: 'Google · 日剧',
    url: 'https://news.google.com/rss/search?q=Japan+drama+series+movie+film&hl=en&gl=JP&ceid=JP:en',
    urlZh: 'https://news.google.com/rss/search?q=%E6%97%A5%E5%89%A7+%E6%97%A5%E6%9C%AC%E7%94%B5%E5%BD%B1&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'jp', platform: 'instagram', source: 'Instagram · J-ent',
    url: 'https://news.google.com/rss/search?q=site:instagram.com+Japan+actor+celebrity&hl=en&gl=JP&ceid=JP:en',
    urlZh: 'https://news.google.com/rss/search?q=site:instagram.com+%E6%97%A5%E6%9C%AC+%E8%89%BA%E4%BA%BA&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'jp', platform: 'x', source: 'X · 日娱',
    url: 'https://news.google.com/rss/search?q=(site:x.com+OR+site:twitter.com)+Japan+celebrity&hl=en&gl=JP&ceid=JP:en',
    urlZh: 'https://news.google.com/rss/search?q=(site:x.com+OR+site:twitter.com)+%E6%97%A5%E6%9C%AC+%E5%A8%B1%E4%B9%90&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },

  // —— 欧美 ——
  {
    region: 'us', platform: 'news', source: 'Google · Entertainment',
    url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en',
    urlZh: 'https://news.google.com/rss/search?q=%E6%AC%A7%E7%BE%8E+%E5%A8%B1%E4%B9%90+%E6%98%8E%E6%98%9F&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'us', platform: 'news', source: 'Google · Hollywood',
    url: 'https://news.google.com/rss/search?q=Hollywood+celebrity+entertainment&hl=en-US&gl=US&ceid=US:en',
    urlZh: 'https://news.google.com/rss/search?q=%E5%A5%BD%E8%8E%B1%E5%9D%9E+%E6%98%8E%E6%98%9F&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'us', platform: 'news', source: 'Google · 电影',
    url: 'https://news.google.com/rss/search?q=Hollywood+movie+film+box+office&hl=en-US&gl=US&ceid=US:en',
    urlZh: 'https://news.google.com/rss/search?q=%E6%AC%A7%E7%BE%8E+%E7%94%B5%E5%BD%B1+%E4%B8%8A%E6%98%A0&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'us', platform: 'news', source: 'Google · 美剧',
    url: 'https://news.google.com/rss/search?q=TV+series+season+Netflix+HBO+streaming&hl=en-US&gl=US&ceid=US:en',
    urlZh: 'https://news.google.com/rss/search?q=%E7%BE%8E%E5%89%A7+%E8%8B%B1%E5%89%A7+%E6%96%B0%E7%89%87&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'us', platform: 'instagram', source: 'Instagram · 欧美',
    url: 'https://news.google.com/rss/search?q=site:instagram.com+celebrity+Hollywood&hl=en&gl=US&ceid=US:en',
    urlZh: 'https://news.google.com/rss/search?q=site:instagram.com+%E6%98%8E%E6%98%9F&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'us', platform: 'x', source: 'X · 欧美',
    url: 'https://news.google.com/rss/search?q=(site:x.com+OR+site:twitter.com)+celebrity+entertainment&hl=en&gl=US&ceid=US:en',
    urlZh: 'https://news.google.com/rss/search?q=(site:x.com+OR+site:twitter.com)+%E6%98%8E%E6%98%9F&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },

  // —— 泰腐 GL ——
  {
    region: 'th', platform: 'news', source: 'Google · Thai BL',
    url: 'https://news.google.com/rss/search?q=Thai+BL+boys+love+GMMTV+CP+Bright+Win&hl=en&gl=TH&ceid=TH:en',
    urlZh: 'https://news.google.com/rss/search?q=%E6%B3%B0%E5%9B%BD+BL+%E6%B3%B0%E8%85%90+CP&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'th', platform: 'news', source: 'Google · Thai GL',
    url: 'https://news.google.com/rss/search?q=Thai+GL+girls+love+Yuri+CP+GL+series&hl=en&gl=TH&ceid=TH:en',
    urlZh: 'https://news.google.com/rss/search?q=%E6%B3%B0%E5%9B%BD+GL+%E7%99%BE%E5%90%88+CP&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'th', platform: 'news', source: 'Google · 泰剧',
    url: 'https://news.google.com/rss/search?q=Thai+drama+BL+series+GMMTV&hl=en&gl=TH&ceid=TH:en',
    urlZh: 'https://news.google.com/rss/search?q=%E6%B3%B0%E5%89%A7+BL+%E6%B3%B0%E5%9B%BD%E7%94%B5%E8%A7%86%E5%89%A7&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'th', platform: 'instagram', source: 'Instagram · 泰腐GL',
    url: 'https://news.google.com/rss/search?q=site:instagram.com+Thai+BL+CP&hl=en&gl=TH&ceid=TH:en',
    urlZh: 'https://news.google.com/rss/search?q=site:instagram.com+%E6%B3%B0%E5%9B%BD+BL&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
  {
    region: 'th', platform: 'x', source: 'X · 泰腐GL',
    url: 'https://news.google.com/rss/search?q=(site:x.com+OR+site:twitter.com)+Thai+BL+CP&hl=en&gl=TH&ceid=TH:en',
    urlZh: 'https://news.google.com/rss/search?q=(site:x.com+OR+site:twitter.com)+%E6%B3%B0%E5%9B%BD+BL&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
  },
];

module.exports = { FEEDS };
