/** 全球娱乐动态种子数据 + 模拟实时生成器 */

const REGIONS = {
  cn: { label: '内娱', tag: 'CN', badge: 'badge-cn' },
  kr: { label: '韩圈', tag: 'KR', badge: 'badge-kr' },
  jp: { label: '日娱', tag: 'JP', badge: 'badge-jp' },
  us: { label: '欧美', tag: 'US', badge: 'badge-us' },
  th: { label: '泰兰德', tag: 'TH', badge: 'badge-th' },
};

const TYPES = {
  celebrity: { label: '日常', badge: 'badge-celebrity' },
  gossip: { label: '八卦', badge: 'badge-gossip' },
  release: { label: '新活', badge: 'badge-release' },
};

const IMAGES = {
  cn: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=340&fit=crop',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=340&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=340&fit=crop',
  ],
  kr: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=340&fit=crop',
    'https://images.unsplash.com/photo-1571330735066-03aaa9429dde?w=600&h=340&fit=crop',
  ],
  jp: [
    'https://images.unsplash.com/photo-1574269909862-786e1be974d3?w=600&h=340&fit=crop',
  ],
  us: [
    'https://images.unsplash.com/photo-1429962710888-269df81c2092?w=600&h=340&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=340&fit=crop',
  ],
  th: [
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&h=340&fit=crop',
  ],
};

const TEMPLATES = [
  { region: 'cn', type: 'celebrity', title: '{name}现身{place}，粉丝现场应援引热议', summary: '今日{place}出现大量粉丝聚集，{name}工作室随后发布声明感谢粉丝支持。' },
  { region: 'cn', type: 'gossip', title: '网传{name}将加盟{company}新综艺，官方暂未回应', summary: '多家营销号爆料{name}或将担任{company}全新季播综艺常驻嘉宾，目前双方均未正式官宣。' },
  { region: 'cn', type: 'release', title: '{name}全新单曲《{song}》正式上线各大音乐平台', summary: '{name}时隔{time}再发新歌，歌曲由{company}制作，上线首小时播放量破百万。' },
  { region: 'kr', type: 'celebrity', title: '{group}成员{name}个人活动预告释出', summary: '{name}通过官方 SNS 发布个人活动预告，引发全球粉丝热烈讨论。' },
  { region: 'kr', type: 'gossip', title: '{company}被曝新一轮回归计划，{group}或于下月 comeback', summary: '韩媒报道 {company} 正在筹备旗下多组艺人回归，{group} 新专辑已进入最后制作阶段。' },
  { region: 'kr', type: 'release', title: '{group}迷你专辑《{song}》预售破纪录', summary: '据 Hanteo Chart 数据，{group} 新专辑预售量创团体历史新高。' },
  { region: 'jp', type: 'celebrity', title: '日本歌手{name}宣布{place}巡演加场', summary: '{name} 因门票秒罄，宣布在 {place} 追加两场演出，引发粉丝狂欢。' },
  { region: 'jp', type: 'release', title: '人气动漫《{song}》剧场版定档，声优{name}回归', summary: '官方宣布剧场版将于下月上映，{name} 继续担任主角配音。' },
  { region: 'us', type: 'celebrity', title: 'Hollywood 巨星 {name} 确认出席{place}电影节', summary: '{name} 将携新片亮相 {place} 电影节红毯，这也是其时隔{time}再度出席。' },
  { region: 'us', type: 'gossip', title: '{company} 高层变动引发业界关注，或影响{name}合约', summary: '据外媒报道，{company} 近期人事震荡，多名艺人合约走向成焦点。' },
  { region: 'us', type: 'release', title: '{name} 新专辑《{song}》空降 Billboard 榜首', summary: '{name} 最新专辑首周销量突破 50 万，登顶 Billboard 200 榜单。' },
  { region: 'th', type: 'celebrity', title: '泰星 {name} 社交媒体粉丝突破千万', summary: '泰国人气演员 {name} Instagram 粉丝数正式突破 1000 万，成为泰娱新里程碑。' },
  { region: 'th', type: 'gossip', title: '{name}与{name2}再度同框，CP 粉沸腾', summary: '两人共同出席品牌活动，互动自然引 CP 粉热议，相关话题登上泰国推特趋势。' },
  { region: 'th', type: 'release', title: '泰剧《{song}》定档播出，{name}领衔主演', summary: '备受期待的泰剧《{song}》官宣定档，由 {name} 与 {name2} 联袂主演。' },
];

const NAMES = {
  cn: ['王一博', '肖战', '赵丽颖', '杨幂', '易烊千玺', '迪丽热巴', '成毅', '白鹿', '檀健次', '赵露思'],
  kr: ['Jimin', 'Jungkook', 'Karina', 'Winter', 'Sana', 'Felix', 'Wonyoung', 'Mark', 'Minji', 'Hanni'],
  jp: ['米津玄师', 'YOASOBI', '新海诚', 'LiSA', 'RADWIMPS', 'Ado', 'King & Prince'],
  us: ['Taylor Swift', 'Beyoncé', 'Timothée Chalamet', 'Zendaya', 'Billie Eilish', 'Dua Lipa', 'Bad Bunny'],
  th: ['Bright', 'Win', 'Billkin', 'PP Krit', 'Mile', 'Apo', 'Gemini', 'Fourth'],
};

const COMPANIES = {
  cn: ['乐华娱乐', '嘉行传媒', '哇唧唧哇', '时代峰峻', '欢瑞世纪'],
  kr: ['HYBE', 'SM Entertainment', 'JYP', 'YG Entertainment', 'CJ ENM'],
  jp: ['Sony Music', 'Avex', 'Johnny\'s', 'Aniplex'],
  us: ['Universal Music', 'Warner Bros', 'Disney', 'Netflix', 'Columbia Pictures'],
  th: ['GMMTV', 'Channel 3', 'Nadao Bangkok', 'One31'],
};

const GROUPS = {
  kr: ['BTS', 'BLACKPINK', 'aespa', 'NewJeans', 'Stray Kids', 'SEVENTEEN', 'IVE', '(G)I-DLE'],
};

const PLACES = ['北京', '上海', '首尔', '东京', '洛杉矶', '曼谷', '纽约', '巴黎', '香港', '台北'];
const SONGS = ['星光', 'Moonlight', 'Forever Young', 'Neon Dreams', 'Heartbeat', 'Eclipse', 'Starlight'];
const TIMES = ['两年', '一年', '三年', '半年'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(tpl) {
  const region = tpl.region;
  const names = NAMES[region] || NAMES.cn;
  const name = pick(names);
  const name2 = pick(names.filter(n => n !== name)) || name;
  const company = pick(COMPANIES[region] || COMPANIES.cn);
  const group = region === 'kr' ? pick(GROUPS.kr) : name;

  return tpl.title
    .replace(/\{name\}/g, name)
    .replace(/\{name2\}/g, name2)
    .replace(/\{company\}/g, company)
    .replace(/\{group\}/g, group)
    .replace(/\{place\}/g, pick(PLACES))
    .replace(/\{song\}/g, pick(SONGS))
    .replace(/\{time\}/g, pick(TIMES));
}

function fillSummary(tpl) {
  const region = tpl.region;
  const names = NAMES[region] || NAMES.cn;
  const name = pick(names);
  const name2 = pick(names.filter(n => n !== name)) || name;
  const company = pick(COMPANIES[region] || COMPANIES.cn);
  const group = region === 'kr' ? pick(GROUPS.kr) : name;

  return tpl.summary
    .replace(/\{name\}/g, name)
    .replace(/\{name2\}/g, name2)
    .replace(/\{company\}/g, company)
    .replace(/\{group\}/g, group)
    .replace(/\{place\}/g, pick(PLACES))
    .replace(/\{song\}/g, pick(SONGS))
    .replace(/\{time\}/g, pick(TIMES));
}

const SOURCES = {
  cn: ['微博娱乐', '豆瓣小组', '娱乐头条', '新浪娱乐'],
  kr: ['Soompi', 'AllKpop', 'Dispatch', 'StarNews'],
  jp: ['Oricon', 'natalie', 'Billboard JAPAN'],
  us: ['Billboard', 'Variety', 'Hollywood Reporter', 'TMZ'],
  th: ['Khao Sod', 'Sanook', 'MThai'],
};

function generateNewsItem(offsetMinutes = 0) {
  const tpl = pick(TEMPLATES);
  const region = tpl.region;
  const imgs = IMAGES[region] || IMAGES.cn;

  return {
    id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: fillTemplate(tpl),
    summary: fillSummary(tpl),
    region,
    type: tpl.type,
    source: pick(SOURCES[region]),
    image: pick(imgs),
    timestamp: Date.now() - offsetMinutes * 60 * 1000,
    isNew: offsetMinutes < 30,
  };
}

function generateInitialNews(count = 24) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(generateNewsItem(i * 15 + Math.floor(Math.random() * 10)));
  }
  return items.sort((a, b) => b.timestamp - a.timestamp);
}


/** 模拟同好用户（地图展示） */
const DEMO_FANS = [
  { id: 'fan-1', nickname: '星星追光者', city: '上海', lat: 31.23, lng: 121.47, tags: ['内娱', 'K-pop'], bio: '追星人，喜欢王一博和 aespa', online: true },
  { id: 'fan-2', nickname: 'SeoulLover', city: '首尔', lat: 37.57, lng: 126.98, tags: ['K-pop', '韩综'], bio: 'BTS Army forever 💜', online: true },
  { id: 'fan-3', nickname: '泰腐女孩', city: '曼谷', lat: 13.76, lng: 100.50, tags: ['泰腐', 'GL'], bio: 'BrightWin 锁死！', online: false },
  { id: 'fan-4', nickname: 'Swiftie_13', city: '纽约', lat: 40.71, lng: -74.01, tags: ['欧美', 'Taylor Swift'], bio: 'Eras Tour 看了三场', online: true },
  { id: 'fan-5', nickname: '动漫控', city: '东京', lat: 35.68, lng: 139.69, tags: ['日娱', '动漫'], bio: '新海诚每一部都不错过', online: false },
  { id: 'fan-6', nickname: '内娱情报站', city: '北京', lat: 39.90, lng: 116.40, tags: ['内娱', '八卦'], bio: '专注内娱第一手资讯', online: true },
  { id: 'fan-7', nickname: 'LA_Stan', city: '洛杉矶', lat: 34.05, lng: -118.24, tags: ['欧美', '影视'], bio: 'Zendaya & Timothée 粉丝', online: false },
  { id: 'fan-8', nickname: '香港追星族', city: '香港', lat: 22.32, lng: 114.17, tags: ['内娱', '港娱'], bio: '粤语区追星日常分享', online: true },
  { id: 'fan-9', nickname: '台北小天后', city: '台北', lat: 25.03, lng: 121.57, tags: ['内娱', '台娱'], bio: '林俊杰 & 周杰伦', online: false },
  { id: 'fan-10', nickname: 'ParisFashion', city: '巴黎', lat: 48.86, lng: 2.35, tags: ['欧美', '时尚'], bio: '红毯造型分析师', online: true },
];
