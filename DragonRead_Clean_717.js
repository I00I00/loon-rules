/*
番茄小说 / DragonRead 强净化脚本 7.1.7

目标：
1. 去广告
2. 去底部福利 Tab
3. 去红包 / 金币 / 福利 / 任务
4. 去悬浮窗 / 挂件 / 弹窗
5. 简化“我的”页面
6. 清理阅读页推荐 / 章末推荐
7. 保护手机号登录 / 验证码 / 风控链路

说明：
- 如果某些底部 Tab 是 App 本地写死，JS 只能清理服务端下发内容，不能 100% 删除本地 UI。
- 如果登录异常，先关闭插件或删除插件里的 [Script] 段。
*/

let body = $response.body || "";
let url = ($request && $request.url) ? $request.url : "";

function done(resp) {
  $done(resp || {});
}

function lower(s) {
  return String(s || "").toLowerCase();
}

function containsAny(text, words) {
  text = lower(text);
  return words.some(w => text.includes(lower(w)));
}

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
  "log",
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
  "activation",
  "risk",
  "cert",
  "realname"
];

if (containsAny(url, passThroughUrlWords)) {
  done({});
} else {
  main();
}

function main() {
  // ==================================================
  // 1. ByteGecko 红包 / 福利 / 挂件资源空返回
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
    done({
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: "{}"
    });
    return;
  }

  // ==================================================
  // 2. 非 JSON 不处理
  // ==================================================

  if (!isJson(body)) {
    done({});
    return;
  }

  try {
    let obj = JSON.parse(body);
    obj = clean(obj);
    body = JSON.stringify(obj);
    done({ body });
  } catch (e) {
    console.log("DragonRead Cleaner error: " + e);
    done({});
  }
}

function isJson(str) {
  if (!str || typeof str !== "string") return false;
  const s = str.trim();
  return (s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"));
}

// ==================================================
// 3. 强净化词库
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
  "adMaterial",
  "ad_material",
  "adSlot",
  "ad_slot",
  "adExtra",
  "ad_extra",

  // 福利 / 金币 / 红包 / 任务
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
  "cash",
  "money",
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
  "red_packet",
  "redPacket",
  "bonus",

  // 弹窗 / 悬浮窗 / 挂件
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
  "guide_popup",
  "guidePopup",

  // 推荐 / 运营位 / 活动
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

  // 底部 Tab / 我的页入口
  "bottom_tab",
  "bottomTab",
  "tab_welfare",
  "tabWelfare",
  "welfare_tab",
  "welfareTab",
  "mine_operation",
  "mineOperation",
  "mine_banner",
  "mineBanner",
  "mine_card",
  "mineCard",
  "entrance",
  "entrance_list",
  "entranceList",
  "shortcut",
  "shortcut_list",
  "shortcutList"
];

const removeTextWords = [
  // 广告
  "广告",
  "推广",
  "赞助",
  "商业化",

  // 福利 / 金币 / 红包
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
  "现金奖励",

  // 悬浮 / 挂件
  "悬浮",
  "挂件",
  "红包挂件",
  "金币挂件",

  // 推荐
  "推荐阅读",
  "猜你喜欢",
  "大家都在看",
  "热门推荐",
  "书荒推荐",
  "为你推荐",
  "继续推荐",
  "相关推荐",
  "看过还看",
  "读者还看",

  // 我的页无用入口
  "我的福利",
  "我的金币",
  "金币收益",
  "现金收益",
  "任务中心",
  "福利任务",
  "邀请赚钱",
  "天天赚钱",
  "看视频赚钱"
];

// 正文 / 基础字段保护
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
  "coverUrl",
  "read_count",
  "readCount",
  "word_count",
  "wordCount"
];

// 阅读正文相关 URL，减少误伤
const conservativeUrlWords = [
  "chapter/content",
  "reader/chapter",
  "reading/book",
  "novel/book",
  "book/detail",
  "book/info",
  "book/v1",
  "content"
];

function isConservativeUrl() {
  return containsAny(url, conservativeUrlWords);
}

function shouldRemoveByKey(key) {
  if (!key) return false;
  if (keepKeys.includes(key)) return false;

  const k = lower(key);

  // 正文接口里，少删推荐字段，避免页面结构异常
  if (isConservativeUrl()) {
    const protectInReader = [
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
    if (protectInReader.includes(k)) return false;
  }

  return removeKeys.some(r => {
    r = lower(r);
    return k === r || k.includes(r);
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
    "tabName",
    "label",
    "tag"
  ];

  for (const f of textFields) {
    if (obj[f] && containsAny(obj[f], removeTextWords)) {
      return true;
    }
  }

  const typeText = lower(
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
    obj.tab_type ||
    obj.tabType ||
    ""
  );

  if (
    containsAny(typeText, [
      "ad",
      "advert",
      "welfare",
      "task",
      "reward",
      "coin",
      "gold",
      "cash",
      "promotion",
      "activity",
      "popup",
      "float",
      "pendant",
      "luckycat",
      "bonus",
      "redpacket",
      "bottom_welfare",
      "welfare_tab"
    ])
  ) {
    return true;
  }

  if (!isConservativeUrl()) {
    if (containsAny(typeText, ["recommend"])) return true;
  }

  return false;
}

function clean(obj, depth = 0) {
  if (depth > 45) return obj;

  if (Array.isArray(obj)) {
    const arr = [];

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

      arr.push(cleaned);
    }

    return arr;
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

    // 关闭显示开关
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
      "showBonus",
      "show_bottom_tab",
      "showBottomTab",
      "show_welfare_tab",
      "showWelfareTab"
    ];

    for (const k of falseKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = false;
      }
    }

    // 数量归零
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
      "bonusCount",
      "red_packet_count",
      "redPacketCount"
    ];

    for (const k of zeroKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        obj[k] = 0;
      }
    }

    // 列表置空
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
      "operation_list",
      "entranceList",
      "entrance_list",
      "shortcutList",
      "shortcut_list",
      "mineOperationList",
      "mine_operation_list",
      "mineBannerList",
      "mine_banner_list"
    ];

    if (!isConservativeUrl()) {
      emptyArrayKeys.push(
        "recommendList",
        "recommend_list",
        "relatedRecommend",
        "related_recommend",
        "bookRecommend",
        "book_recommend",
        "novelRecommend",
        "novel_recommend",
        "guessYouLike",
        "guess_you_like"
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