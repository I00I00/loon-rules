/*
中泰齐富通广告过滤脚本
用途：
1. 过滤 /homepage/hotVideo?auth=CustomTitle 返回体中 cover/url/playUrl 指向 /resource/ad/ 的广告项；
2. 兼容后续接口结构变化：递归扫描数组对象，只删除明显携带广告资源路径的对象；
3. 不处理登录、行情、交易接口，避免误伤核心业务。

适用：Loon http-response 脚本，requires-body=1。
*/

let body = $response.body || "";

// 只命中非常明确的广告资源路径，避免误杀普通资讯/功能入口。
const AD_RESOURCE_RE = /(?:\/resource\/ad\/|\/qidongye\/)/i;

function hasAdResource(value) {
  if (value == null) return false;

  if (typeof value === "string") {
    try {
      const decoded = decodeURIComponent(value);
      return AD_RESOURCE_RE.test(value) || AD_RESOURCE_RE.test(decoded);
    } catch (_) {
      return AD_RESOURCE_RE.test(value);
    }
  }

  if (Array.isArray(value)) {
    return value.some(hasAdResource);
  }

  if (typeof value === "object") {
    return Object.keys(value).some((key) => hasAdResource(value[key]));
  }

  return false;
}

function clean(value, inArray) {
  if (Array.isArray(value)) {
    const next = [];
    for (const item of value) {
      if (hasAdResource(item)) continue;
      const cleaned = clean(item, true);
      if (cleaned !== undefined) next.push(cleaned);
    }
    return next;
  }

  if (value && typeof value === "object") {
    if (inArray && hasAdResource(value)) return undefined;

    for (const key of Object.keys(value)) {
      const child = value[key];

      // 对非数组里的单个广告资源字符串，直接置空，避免保留广告图地址。
      if (typeof child === "string" && hasAdResource(child)) {
        value[key] = "";
        continue;
      }

      const cleaned = clean(child, false);
      if (cleaned === undefined) {
        delete value[key];
      } else {
        value[key] = cleaned;
      }
    }
  }

  return value;
}

try {
  const obj = JSON.parse(body);
  const cleaned = clean(obj, false);
  $done({ body: JSON.stringify(cleaned) });
} catch (e) {
  $done({ body });
}
