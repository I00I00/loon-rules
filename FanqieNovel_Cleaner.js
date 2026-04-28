/*
番茄小说净化脚本 V1
适配目标：番茄小说 7.1.7
功能：
1. 删除广告字段
2. 删除福利 / 任务 / 金币 / 签到模块
3. 删除悬浮窗 / 弹窗 / banner
4. 删除阅读页推荐
5. 简化“我的”页入口

说明：
这是通用 JSON 净化脚本，接口变动后可能需要根据抓包继续补规则。
*/

let body = $response.body;

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
  "activityList"
];

// 需要删除的标题/文案关键词
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
  "邀请好友"
];

// 需要保留的字段名，避免误删正文
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
  "text"
];

function shouldRemoveByKey(key) {
  if (!key) return false;

  // 正文相关字段不要删
  if (keepKeys.includes(key)) return false;

  const lower = key.toLowerCase();
  return removeKeys.some(k => lower === k.toLowerCase() || lower.includes(k.toLowerCase()));
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
    "content",
    "button_text",
    "buttonText",
    "schema",
    "url",
    "type",
    "module_name",
    "moduleName"
  ];

  for (const f of textFields) {
    if (obj[f] && containsAny(obj[f], removeTextWords)) {
      return true;
    }
  }

  // 常见广告类型判断
  const typeText = String(obj.type || obj.card_type || obj.cardType || obj.cell_type || obj.cellType || "").toLowerCase();
  if (containsAny(typeText, ["ad", "advert", "welfare", "task", "reward", "coin", "promotion", "recommend"])) {
    return true;
  }

  return false;
}

function clean(obj, depth = 0) {
  if (depth > 30) return obj;

  if (Array.isArray(obj)) {
    const newArr = [];
    for (const item of obj) {
      if (shouldRemoveByValue(item)) continue;
      const cleaned = clean(item, depth + 1);
      if (cleaned === null || cleaned === undefined) continue;

      // 删除空对象
      if (typeof cleaned === "object" && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0) {
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

    // 一些常见开关字段直接关闭
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
      "showRecommend"
    ];

    for (const k of falseKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = false;
      }
    }

    // 一些常见数量字段归零
    const zeroKeys = [
      "ad_count",
      "adCount",
      "popup_count",
      "popupCount",
      "recommend_count",
      "recommendCount",
      "welfare_count",
      "welfareCount"
    ];

    for (const k of zeroKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = 0;
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
  console.log("FanqieNovel_Cleaner error: " + e);
}

$done({ body });
