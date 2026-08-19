/**
 * StarPulse 多语言
 * lang: 'zh' | 'en'
 */

const STRINGS = {
  zh: {
    meta_title: 'StarPulse 星汛 · 追星动态',
    meta_desc: '追星党实时娱乐动态，告诉你全球星圈发生了啥',
    brand_sub: '星汛',
    nav_news: '吃瓜前线',
    nav_community: '树洞',
    nav_map: '同好雷达',
    refresh: '刷一刷',
    login: '登录',
    profile: '我的资料',
    lang_switch: 'EN',

    news_kicker: 'LIVE · 实时',
    news_title: '今日星动',
    news_subtitle: '内娱韩圈日娱欧美泰腐GL — 闺蜜语气一句话告诉你发生了啥',
    news_loading: '帮你扫动态中…',
    news_refreshing: '正在刷最新动态…',
    news_loading_hint: '一句话告诉你发生了啥',
    news_empty: '这个标签下暂时没瓜，换一个试试',
    news_error: '动态暂时刷不出来',
    news_sync: '{time} 刚刷过 · 库内 {total} 条 · 10 分钟自动更新',
    news_toast_ok: '新增 {added} 条 · 共 {total} 条 ✦',
    news_toast_refresh: '已是最新 · 库内 {total} 条',
    news_toast_cache: '网络有点卡，先给你看缓存的',
    news_toast_server: '记得先 npm start 开服务',

    filter_all_region: '全域',
    filter_all_type: '全部',
    region_cn: '内娱',
    region_kr: '韩圈',
    region_jp: '日娱',
    region_us: '欧美',
    region_th: '泰腐/GL',
    type_celebrity: '日常',
    type_gossip: '八卦',
    type_release: '新活',
    type_drama: '影视',

    action_share: '转发',
    action_comment: '评论',
    action_like: '赞',
    feed_official_name: '星汛吃瓜组',
    feed_badge: '播',
    load_more_count: '还有 {n} 条',

    community_kicker: 'TREE HOLE',
    community_title: '树洞',
    community_subtitle: '图文视频随发 · 点赞评论转发 · 想说就说',
    community_create: '＋ 发树洞',
    community_topics: '热门话题',
    community_stats: '树洞数据',
    community_empty: '树洞还是空的 — 来做第一个倾诉的人',
    stat_posts: '帖子',
    stat_likes: '点赞',
    stat_comments: '评论',
    stat_authors: '作者',
    post_submit: '发布到树洞',
    post_modal_title: '发树洞',
    post_title_ph: '标题（可选）…',
    post_content_ph: '碎碎念、repo、想说不敢说的…',
    post_tags_ph: '#今日心情 #追星碎碎念',
    post_toast: '已发到树洞',
    post_toast_fail: '发布失败，稍后再试',

    map_kicker: 'RADAR',
    map_title: '同好雷达',
    map_subtitle: '拖拽平移 · 滚轮缩放 · 可放大至城市各区',
    map_drag_hint: '双指左右拖动平移 · 捏合或 ⌃+滚轮缩放',
    map_locate: '◎ 刷新定位',
    map_nearby: '附近同好',
    map_profile: '雷达资料',
    map_hint: '填好昵称和标签，同好才找得到你',
    map_legend_online: '在线同好',
    map_legend_offline: '近期活跃',
    map_legend_me: '我的位置',
    map_say_hi: '👋 打招呼',
    map_say_hi_toast: '已向 {name} 发送打招呼',
    map_locating: '正在获取位置...',
    map_locate_ok: '位置已更新：{city}',
    map_locate_fail: '定位失败，请检查权限或手动填城市',
    map_no_geo: '浏览器不支持定位',
    map_no_fans: '暂无同好数据',
    map_bio_empty: '这位同好还没有写简介~',
    map_online: '在线',
    map_offline: '近期活跃',
    map_you_here: '📍 你在这里',
    map_unknown: '未知',
    map_say_hi_demo: '（演示功能）',
    err_img_size: '单张图片不能超过 4MB',
    err_video_size: '视频不能超过 12MB',
    guest_alt: '未登录',

    login_title: '入站登记',
    login_desc: '登记昵称后即可发树洞、留评论、开雷达',
    login_nickname: '昵称',
    login_email: '邮箱（可选）',
    login_nickname_ph: '给自己取个名字',
    login_submit: '进入星汛',
    login_welcome: '欢迎入站，{name}',
    profile_saved: '资料已保存',

    label_nickname: '昵称',
    label_city: '所在城市',
    label_tags: '兴趣标签（逗号分隔）',
    label_bio: '个人简介',
    nickname_ph: '你的昵称',
    city_ph: '如：上海、首尔、曼谷',
    tags_ph: '如：K-pop, 内娱, 泰腐, GL',
    bio_ph: '介绍一下自己和喜欢的明星...',
    save_profile: '保存资料',

    comment_title: '评论',
    comment_ph: '写下你的评论...',
    comment_send: '发送',
    comment_emoji: '表情',
    comment_image: '发图片',
    comment_empty: '还没人说话，来抢沙发',
    comment_toast: '评论发出去了',
    err_comment_img_size: '评论图片不能超过 2MB',
    share_toast: '已复制，去发给闺蜜',

    upload_image: '＋ 图片',
    upload_video: '＋ 视频',
    label_title_opt: '标题（可选）',
    label_content: '内容',
    label_tags_input: '话题标签',

    footer: 'StarPulse 星汛 · 帮追星党实时盯全球娱乐动向 · 站内看完就行',

    time_just: '刚刚',
    time_mins: '{n} 分钟前',
    time_hours: '{n} 小时前',
    time_days: '{n} 天前',
  },
  en: {
    meta_title: 'StarPulse · Fan Updates',
    meta_desc: 'Real-time fan updates across global entertainment',
    brand_sub: 'Pulse',
    nav_news: 'Fan Feed',
    nav_community: 'Tree Hole',
    nav_map: 'Fan Radar',
    refresh: 'Refresh',
    login: 'Log in',
    profile: 'My profile',
    lang_switch: '中文',

    news_kicker: 'LIVE',
    news_title: 'Today in Fandom',
    news_subtitle: 'C-ent · K-pop · J-ent · Western · Thai BL/GL — quick fan-style updates',
    news_loading: 'Loading updates…',
    news_refreshing: 'Fetching latest…',
    news_loading_hint: 'Short updates, no links needed',
    news_empty: 'Nothing here — try another filter',
    news_error: 'Could not load updates',
    news_sync: 'Synced {time} · {total} in feed · refreshes every 10 min',
    news_toast_ok: '+{added} new · {total} total ✦',
    news_toast_refresh: 'Up to date · {total} in feed',
    news_toast_cache: 'Offline — showing cached feed',
    news_toast_server: 'Run npm start first',

    filter_all_region: 'All',
    filter_all_type: 'All',
    region_cn: 'C-ent',
    region_kr: 'K-pop',
    region_jp: 'J-ent',
    region_us: 'Western',
    region_th: 'Thai BL/GL',
    type_celebrity: 'Daily',
    type_gossip: 'Gossip',
    type_release: 'New drop',
    type_drama: 'Film & TV',

    action_share: 'Repost',
    action_comment: 'Comment',
    action_like: 'Like',
    feed_official_name: 'Pulse Scoop',
    feed_badge: '✓',

    load_more: 'Load more',
    load_more_count: '{n} more',

    community_kicker: 'TREE HOLE',
    community_title: 'Tree Hole',
    community_subtitle: 'Post text, pics, videos · like, comment, repost · say what you feel',
    community_create: '+ Post',
    community_topics: 'Hot topics',
    community_stats: 'Tree hole stats',
    community_empty: 'No posts yet — be the first to share',
    stat_posts: 'Posts',
    stat_likes: 'Likes',
    stat_comments: 'Comments',
    stat_authors: 'Authors',
    post_submit: 'Post to tree hole',
    post_modal_title: 'New post',
    post_title_ph: 'Optional title…',
    post_content_ph: 'Thoughts, recaps, things you want to say…',
    post_tags_ph: '#mood #fan thoughts',
    post_toast: 'Posted!',
    post_toast_fail: 'Could not post — try again',

    map_kicker: 'RADAR',
    map_title: 'Fan Radar',
    map_subtitle: 'Drag to pan · scroll to zoom · down to district level',
    map_drag_hint: 'Two-finger drag to pan · pinch or ⌃+scroll to zoom',
    map_locate: '◎ Update location',
    map_nearby: 'Nearby fans',
    map_profile: 'Your radar profile',
    map_hint: 'Add a nickname and tags so others can find you',
    map_legend_online: 'Online',
    map_legend_offline: 'Recently active',
    map_legend_me: 'You',
    map_say_hi: '👋 Say hi',
    map_say_hi_toast: 'Said hi to {name}',
    map_locating: 'Getting location…',
    map_locate_ok: 'Location updated: {city}',
    map_locate_fail: 'Location failed — check permission or enter city manually',
    map_no_geo: 'Geolocation not supported',
    map_no_fans: 'No fans nearby yet',
    map_bio_empty: 'No bio yet~',
    map_online: 'Online',
    map_offline: 'Recently active',
    map_you_here: '📍 You are here',
    map_unknown: 'Unknown',
    map_say_hi_demo: '(demo)',
    err_img_size: 'Images must be under 4MB',
    err_video_size: 'Videos must be under 12MB',
    guest_alt: 'Not logged in',

    login_title: 'Join StarPulse',
    login_desc: 'Pick a nickname to post, comment, and use the radar',
    login_nickname: 'Nickname',
    login_email: 'Email (optional)',
    login_nickname_ph: 'Pick a nickname',
    login_submit: 'Enter',
    login_welcome: 'Welcome, {name}',
    profile_saved: 'Profile saved',

    label_nickname: 'Nickname',
    label_city: 'City',
    label_tags: 'Interest tags (comma separated)',
    label_bio: 'Bio',
    nickname_ph: 'Your nickname',
    city_ph: 'e.g. Shanghai, Seoul, Bangkok',
    tags_ph: 'e.g. K-pop, BL, GL, C-ent',
    bio_ph: 'Tell others what you stan…',
    save_profile: 'Save profile',

    comment_title: 'Comments',
    comment_ph: 'Write a comment…',
    comment_send: 'Send',
    comment_emoji: 'Emoji',
    comment_image: 'Image',
    comment_empty: 'No comments yet — jump in',
    comment_toast: 'Comment posted',
    err_comment_img_size: 'Comment images must be under 2MB',
    share_toast: 'Copied — share with your friends',

    upload_image: '+ Image',
    upload_video: '+ Video',
    label_title_opt: 'Title (optional)',
    label_content: 'Content',
    label_tags_input: 'Tags',

    footer: 'StarPulse · Fan updates across global entertainment · read it all here',

    time_just: 'just now',
    time_mins: '{n}m ago',
    time_hours: '{n}h ago',
    time_days: '{n}d ago',
  },
};

let currentLang = 'zh';

function getLang() {
  return currentLang;
}

function t(key, vars = {}) {
  const str = STRINGS[currentLang]?.[key] ?? STRINGS.zh[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

function setLang(lang) {
  if (!STRINGS[lang]) return;
  currentLang = lang;
  set('locale', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('meta_title');
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = t('meta_desc');
  applyStaticI18n();
  document.dispatchEvent(new CustomEvent('locale-change', { detail: { lang } }));
}

function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) langBtn.textContent = t('lang_switch');
}

function initI18n() {
  currentLang = get('locale', 'zh');
  if (!STRINGS[currentLang]) currentLang = 'zh';
  setLang(currentLang);

  document.getElementById('lang-btn')?.addEventListener('click', () => {
    setLang(currentLang === 'zh' ? 'en' : 'zh');
  });
}

function regionLabel(region) {
  return t(`region_${region}`);
}

function typeLabel(type) {
  return t(`type_${type}`);
}

function feedOfficialName() {
  return t('feed_official_name');
}

const HOT_TOPICS = {
  zh: [
    '# 今日心情',
    '# 追星碎碎念',
    '# 想说不敢说的',
    '# 现场repo',
    '# CP 脑补',
    '# 泰腐 GL',
    '# 深夜emo',
    '# 求安利',
  ],
  en: [
    '# today\'s mood',
    '# fan thoughts',
    '# unpopular opinion',
    '# event recap',
    '# ship brain',
    '# Thai BL/GL',
    '# late night feels',
    '# rec me something',
  ],
};

function getHotTopics() {
  return HOT_TOPICS[currentLang] || HOT_TOPICS.zh;
}
