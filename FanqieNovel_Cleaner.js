/*
番茄小说净化脚本 V7.1
适配目标：番茄小说 7.1.7

设计原则：
1. 登录/验证码/风控链路直接放行，不改响应。
2. 只温和清理广告、福利、红包、金币、悬浮窗、推荐字段。
3. 针对 ByteGecko 福利红包资源做空返回。
4. 尽量避免误删小说正文、章节内容、书籍基础信息。
*/

let body = $response.body || "";
let url = ($request && $request.url) ? $request.url : "";

// ==================================================
// 0. 登录 / 验证码 / 风控 / 支付 / 设置链路保护
// ==================================================

const passThroughUrlWords = [
  "passport",
  "login",
  "logout",
  "sms",
  "mobile",
  "captcha",
  "verify",
  "verification",
  "auth",
  "account",
  "user/login",
  "user/mobile",
  "security",
  "bdturing",
  "mssdk",
  "xlog",
  "applog",
  "rtlog",
  "settings",
  "service/settings",
  "gateway-u",
  "tp-pay",
  "pay",
  "wallet",
  "order",
  "purchase",
  "token",
  "refresh_token",
  "device",
  "install",
  "activation"
];

function containsAny(text, words) {
  if (!text) return false;
  text = String(text).toLowerCase();
  return words.some(w => text.includes(String(w).toLowerCase()));
}

if (containsAny(url, passThroughUrlWords)) {
  $done({});
}

// ==================================================
// 1. ByteGecko 红包 / 金币 / 福利 / 挂件资源精准空返回
// ==================================================

const byteGeckoBlockWords = [
  "luckycat",
  "gold_box",
  "goldbox",
  "redpacket",
  "red_packet",
  "reward",
  "pendant",
  "welfare",
  "coin",
  "bonus",
  "task",
  "video_box_redpacket",
  "video_pendant",
  "hide_reward_union",
  "redpacket_increase",
  "gold_box_static",
  "ugflow-resource",
  "growth/luckycat"
];

if (containsAny(url, byteGeckoBlockWords)) {
  $done({
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: "{}"
  });
}

// ==================================================
// 2. JSON 判断
// ==================================================

function isJson(str) {
  if (!str || typeof str !== "string") return false;
  const s = str.trim();
  return (s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"));
}

// 非 JSON 不处理，直接放行
if (!isJson(body)) {
  $done({});
}

// ==================================================
// 3. 清理规则
// ==================================================

// 需要删除的字段名
const removeKeys = [
  // 广告
  "ad",
  "ads",
  "ad_list",
  "adList",
  "advert",
  "advertise",
  "advertisement",
  "ad_info",
  "adInfo",
  "ad_data",
  "adData",
  "ad_item",
  "adItem",
  "ad_items",
  "adItems",
  "splash_ad",
  "splashAd",
  "feed_ad",
  "feedAd",
  "banner_ad",
  "bannerAd",
  "insert_ad",
  "insertAd",
  "interstitial_ad",
  "interstitialAd",
  "commercial",
  "commercial_info",
  "commercialInfo",
  "adMaterial",
  "ad_material",
  "adSlot",
  "ad_slot",
  "adExtra",
  "ad_extra",

  // 福利 / 金币 / 任务
  "welfare",
  "welfare_info",
  "welfareInfo",
  "benefit",
  "benefits",
  "coin",
  "coins",
  "gold",
  "gold_coin",
  "goldCoin",
  "gold_box",
  "goldBox",
  "task",
  "tasks",
  "task_list",
  "taskList",
  "signin",
  "sign_in",
  "signIn",
  "checkin",
  "check_in",
  "checkIn",
  "reward",
  "rewards",
  "reward_video",
  "rewardVideo",
  "incentive",
  "incentive_video",
  "incentiveVideo",
  "luckycat",
  "lucky_cat",
  "luckyCat",

  // 弹窗 / 悬浮窗
  "popup",
  "pop_up",
  "popUp",
  "dialog",
  "modal",
  "toast_ad",
  "float",
  "floating",
  "float_window",
  "floatWindow",
  "float_layer",
  "floatLayer",
  "pendant",
  "widget",
  "bubble",
  "red_packet",
  "redPacket",
  "bonus",
  "bonus_info",
  "bonusInfo",

  // 推荐 / 运营位
  "recommend",
  "recommendation",
  "recommend_list",
  "recommendList",
  "related_recommend",
  "relatedRecommend",
  "book_recommend",
  "bookRecommend",
  "novel_recommend",
  "novelRecommend",
  "guess_you_like",
  "guessYouLike",
  "promotion",
  "promotions",
  "promote",
  "operation",
  "operation_list",
  "operationList",
  "activity",
  "activities",
  "activity_list",
  "activityList",
  "marketing",
  "marketing_info",
  "marketingInfo",
  "bottom_tab",
  "bottomTab",
  "tab_welfare",
  "tabWelfare"
];

// 文案关键词，匹配到则删除对应模块
const removeTextWords = [
  "广告",
  "福利",
  "金币",
  "赚钱",
  "现金",
  "红包",
  "签到",
  "任务",
  "看视频",
  "激励视频",
  "领金币",
  "领福利",
  "福利中心",
  "赚钱任务",
  "天天领",
  "悬浮",
  "推荐阅读",
  "猜你喜欢",
  "大家都在看",
  "热门推荐",
  "书荒推荐",
  "为你推荐",
  "继续推荐",
  "看书赚钱",
  "金币商城",
  "邀请好友",
  "新人福利",
  "阅读奖励",
  "开宝箱",
  "宝箱",
  "领现金",
  "提现",
  "福利页",
  "福利入口",
  "红包雨",
  "翻倍",
  "视频奖励",
  "看视频领奖励",
  "福利任务",
  "金币任务",
  "现金奖励"
];

// 正文和基础字段，尽量不要误删
const keepKeys = [
  "content",
  "chapter_content",
  "chapterContent",
  "book_name",
  "bookName",
  "book_title",
  "bookTitle",
  "title",
  "author",
  "author_name",
  "authorName",
  "chapter",
  "chapter_id",
  "chapterId",
  "chapter_title",
  "chapterTitle",
  "paragraph",
  "paragraphs",
  "text",
  "abstract",
  "summary",
  "book_id",
  "bookId",
  "item_id",
  "itemId",
  "genre",
  "category",
  "cover",
  "cover_url",
  "coverUrl"
];

// 某些 URL 下不要删除推荐字段，避免书籍详情页结构崩
const conservativeUrlWords = [
  "book/detail",
  "book/info",
  "chapter/content",
  "reader/chapter",
  "reading/book",
  "novel/book"
];

function shouldConservativeClean() {
  return containsAny(url, conservativeUrlWords);
}

function normalizeKey(key) {
  return String(key || "").toLowerCase();
}

function shouldRemoveByKey(key) {
  if (!key) return false;

  // 正文字段保护
  if (keepKeys.includes(key)) return false;

  const lower = normalizeKey(key);

  // 在正文/书籍详情接口里，recommend 相关不做过度删除，避免页面空白
  if (shouldConservativeClean()) {
    const riskyInDetail = [
      "recommend",
      "recommendation",
      "recommend_list",
      "recommendlist",
      "related_recommend",
      "relatedrecommend",
      "book_recommend",
      "bookrecommend",
      "novel_recommend",
      "novelrecommend",
      "guess_you_like",
      "guessyoulike"
    ];
    if (riskyInDetail.includes(lower)) return false;
  }

  return removeKeys.some(k => {
    const rk = normalizeKey(k);
    return lower === rk || lower.includes(rk);
  });
}

function shouldRemoveByValue(obj) {
  if (!obj || typeof obj !== "object") return false;

  const textFields = [
    "title",
    "name",
    "desc",
    "description",
    "sub_title",
    "subTitle",
    "text",
    "button_text",
    "buttonText",
    "schema",
    "url",
    "type",
    "module_name",
    "moduleName",
    "card_name",
    "cardName",
    "component_name",
    "componentName",
    "resource_name",
    "resourceName",
    "tab_name",
    "tabName"
  ];

  for (const f of textFields) {
    if (obj[f] && containsAny(obj[f], removeTextWords)) {
      return true;
    }
  }

  const typeText = String(
    obj.type ||
    obj.card_type ||
    obj.cardType ||
    obj.cell_type ||
    obj.cellType ||
    obj.module_type ||
    obj.moduleType ||
    obj.component_type ||
    obj.componentType ||
    obj.resource_type ||
    obj.resourceType ||
    ""
  ).toLowerCase();

  if (
    containsAny(typeText, [
      "ad",
      "advert",
      "welfare",
      "task",
      "reward",
      "coin",
      "promotion",
      "activity",
      "popup",
      "float",
      "pendant",
      "luckycat",
      "bonus",
      "redpacket"
    ])
  ) {
    return true;
  }

  // 保守模式下，不因为 recommend 类型直接删，避免详情页异常
  if (!shouldConservativeClean()) {
    if (containsAny(typeText, ["recommend"])) return true;
  }

  return false;
}

function clean(obj, depth = 0) {
  if (depth > 40) return obj;

  if (Array.isArray(obj)) {
    const newArr = [];

    for (const item of obj) {
      if (shouldRemoveByValue(item)) continue;

      const cleaned = clean(item, depth + 1);
      if (cleaned === null || cleaned === undefined) continue;

      if (
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned).length === 0
      ) {
        continue;
      }

      newArr.push(cleaned);
    }

    return newArr;
  }

  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (shouldRemoveByKey(key)) {
        delete obj[key];
        continue;
      }

      if (shouldRemoveByValue(obj[key])) {
        delete obj[key];
        continue;
      }

      obj[key] = clean(obj[key], depth + 1);
    }

    // 常见显示开关关闭
    const falseKeys = [
      "show_ad",
      "showAd",
      "has_ad",
      "hasAd",
      "enable_ad",
      "enableAd",
      "is_ad",
      "isAd",
      "show_welfare",
      "showWelfare",
      "show_float",
      "showFloat",
      "show_popup",
      "showPopup",
      "enable_popup",
      "enablePopup",
      "show_recommend",
      "showRecommend",
      "show_pendant",
      "showPendant",
      "show_reward",
      "showReward",
      "show_task",
      "showTask",
      "enable_welfare",
      "enableWelfare",
      "enable_reward",
      "enableReward",
      "show_red_packet",
      "showRedPacket",
      "show_bonus",
      "showBonus"
    ];

    for (const k of falseKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = false;
      }
    }

    // 常见数量字段归零
    const zeroKeys = [
      "ad_count",
      "adCount",
      "popup_count",
      "popupCount",
      "recommend_count",
      "recommendCount",
      "welfare_count",
      "welfareCount",
      "reward_count",
      "rewardCount",
      "task_count",
      "taskCount",
      "coin_count",
      "coinCount",
      "bonus_count",
      "bonusCount"
    ];

    for (const k of zeroKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = 0;
      }
    }

    // 常见列表置空
    const emptyArrayKeys = [
      "adList",
      "ad_list",
      "ads",
      "bannerList",
      "banner_list",
      "popupList",
      "popup_list",
      "welfareList",
      "welfare_list",
      "taskList",
      "task_list",
      "activityList",
      "activity_list",
      "operationList",
      "operation_list"
    ];

    // 非保守接口下，推荐列表也可以置空
    if (!shouldConservativeClean()) {
      emptyArrayKeys.push(
        "recommendList",
        "recommend_list",
        "relatedRecommend",
        "related_recommend",
        "bookRecommend",
        "book_recommend"
      );
    }

    for (const k of emptyArrayKeys) {
      if (Array.isArray(obj[k])) {
        obj[k] = [];
      }
    }

    return obj;
  }

  return obj;
}

// ==================================================
// 4. 执行
// ==================================================

try {
  let obj = JSON.parse(body);
  obj = clean(obj);
  body = JSON.stringify(obj);
  $done({ body });
} catch (e) {
  console.log("FanqieNovel_Cleaner V7.1 error: " + e);
  $done({});
}
