/*
 * QQ音乐 我的/更多页精简脚本 for Loon
 * 作用：从 QQ音乐接口 JSON 响应中删除指定入口。
 * 注意：只能处理服务端下发的 JSON UI 模块；App 本地写死的入口无法通过 Loon 删除。
 */

const removeTitles = [
  "装扮中心",
  "成就勋章",
  "梦幻农场",
  "歌曲加热",
  "定时关闭",
  "听歌识曲",
  "导入外部歌单",
  "清理占用空间",
  "模式与自定义",
  "未成年人模式",
  "移动用户免流送会员",
  "免流量听歌送会员",
  "腾讯视频VIP福利",
  "组件中心",
  "铃声专区",
  "智能设备会员专区",
  "创作者中心",
  "帮助与反馈"
];

const textKeys = [
  "title",
  "name",
  "text",
  "label",
  "desc",
  "subTitle",
  "subtitle",
  "mainTitle",
  "jump_title",
  "moduleTitle",
  "module_name",
  "item_title",
  "button_text"
];

function pickText(obj) {
  if (!obj || typeof obj !== "object") return "";
  return textKeys
    .map((key) => (typeof obj[key] === "string" ? obj[key] : ""))
    .join(" ");
}

function shouldRemove(obj) {
  const text = pickText(obj);
  return removeTitles.some((title) => text.includes(title));
}

function clean(value) {
  if (Array.isArray(value)) {
    return value
      .map(clean)
      .filter((item) => !shouldRemove(item));
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      value[key] = clean(value[key]);
    }
  }

  return value;
}

let body = $response.body;

try {
  const contentType = ($response.headers && ($response.headers["Content-Type"] || $response.headers["content-type"])) || "";
  if (contentType && !/json|javascript|text/i.test(contentType)) {
    $done({ body });
  } else {
    const json = JSON.parse(body);
    body = JSON.stringify(clean(json));
    $done({ body });
  }
} catch (err) {
  console.log("QQMusic Mine Clean skipped: " + err.message);
  $done({ body });
}
