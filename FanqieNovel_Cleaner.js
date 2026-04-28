/*
番茄小说净化脚本 V3
适配目标：番茄小说 7.1.7

新增：
1. 针对 ByteGecko 下发的红包/金币/福利/挂件资源做空返回
2. 清理 JSON 接口里的广告、福利、任务、推荐、悬浮窗字段
3. 尽量避免误删小说正文
*/

let body = $response.body;
let url = $request.url || "";

function isJson(str) {
  if (!str || typeof str !== "string") return false;
  const s = str.trim();
  return (s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"));
}

function containsAny(text, words) {
  if (!text) return false;
  text = String(text).toLowerCase();
  return words.some(w => text.includes(w.toLowerCase()));
}

// ==================================================
// 1. 针对抓包命中的 ByteGecko 静态资源直接空返回
// ==================================================
const resourceBlockWords = [
  "luckycat",
  "gold_box",
  "redpacket",
  "reward",
  "pendant",
  "welfare",
  "coin",
  "bonus",
  "task",
  "video_box_redpacket",
  "video_pendant",
  "hide_reward_union",
  "redpacket_increase"
];

if (containsAny(url, resourceBlockWords)) {
  $done({ body: "{}" });
}

// ==================================================
// 2. 常规 JSON 字段净化
// ==================================================
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
  "marketingInfo"
];

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
  "看视频领奖励"
];

const keepKeys = [
  "content",
  "chapter_content",
  "chapterContent",
  "book_name",
  "bookName",
  "title",
  "author",
  "chapter",
  "chapter_id",
  "chapterId",
  "paragraph",
  "paragraphs",
  "text",
  "abstract",
  "summary",
  "book_id",
  "bookId",
  "item_id",
  "itemId"
];

function shouldRemoveByKey(key) {
  if (!key) return false;
  if (keepKeys.includes(key)) return false;

  const lower = key.toLowerCase();

  return removeKeys.some(k => {
    const rk = k.toLowerCase();
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
    "resourceName"
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
      "recommend",
      "activity",
      "popup",
      "float",
      "pendant",
      "luckycat",
      "bonus"
    ])
  ) {
    return true;
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
      "enableReward"
    ];

    for (const k of falseKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = false;
      }
    }

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
      "coinCount"
    ];

    for (const k of zeroKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = 0;
      }
    }

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
      "recommendList",
      "recommend_list",
      "activityList",
      "activity_list",
      "operationList",
      "operation_list"
    ];

    for (const k of emptyArrayKeys) {
      if (Array.isArray(obj[k])) {
        obj[k] = [];
      }
    }

    return obj;
  }

  return obj;
}

try {
  if (isJson(body)) {
    let obj = JSON.parse(body);
    obj = clean(obj);
    body = JSON.stringify(obj);
  }
} catch (e) {
  console.log("FanqieNovel_Cleaner V3 error: " + e);
}

$done({ body });
