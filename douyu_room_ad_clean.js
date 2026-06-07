/*
Douyu Room Ad Cleaner for Loon
目标：净化斗鱼播放页/直播间接口里下发的广告字段，如 banner、popup、float、promotion、advert 等。
说明：脚本只处理 JSON 响应；不会处理视频流本身。
*/

(function () {
  const url = ($request && $request.url) || "";
  const body = ($response && $response.body) || "";
  const headers = ($response && $response.headers) || {};

  if (!body) return $done({});

  function getHeader(obj, name) {
    const n = name.toLowerCase();
    for (const k in obj) {
      if (String(k).toLowerCase() === n) return String(obj[k]);
    }
    return "";
  }

  const contentType = getHeader(headers, "content-type");
  const maybeJson = /json|javascript|text\/plain/i.test(contentType) || /^[\s\r\n]*[\{\[]/.test(body);
  if (!maybeJson) return $done({});

  let json;
  try {
    json = JSON.parse(body);
  } catch (e) {
    return $done({});
  }

  let changed = false;

  const AD_KEY_RE = /(^|_|\b)(ad|ads|adv|advert|advertise|advertisement|banner|popup|pop|splash|float|promotion|promote|marketing|commercial|material|creative|sponsor|union_ad|adx|feed_ad|room_ad|live_ad)(_|$|\b)/i;
  const SAFE_KEY_RE = /^(addr|address|addtime|adapter|addition|admin|advance|advantage|load|shadow|head|header|badge|padding|gradient)$/i;
  const AD_VALUE_RE = /(adimg|\/ad\/|\/ads\/|advert|advertise|promotion|promote|banner|splash|popup|popad|adx|doubleclick|gdt|pangolin|bytedance|tanx|alimama|ksad|sponsor)/i;
  const AD_ENDPOINT_RE = /(^|\/|_|-)(ad|ads|adv|advert|advertise|advertisement|banner|popup|pop|splash|float|promotion|promote|marketing|commercial|sponsor|adx)(\/|_|-|\.|\?|=|&|$)/i;

  function isObject(v) {
    return v && typeof v === "object" && !Array.isArray(v);
  }

  function shouldDropKey(key) {
    const k = String(key || "");
    return AD_KEY_RE.test(k) && !SAFE_KEY_RE.test(k);
  }

  function emptyLike(v) {
    if (Array.isArray(v)) return [];
    if (isObject(v)) return {};
    if (typeof v === "string") return "";
    if (typeof v === "number") return 0;
    if (typeof v === "boolean") return false;
    return null;
  }

  function looksLikeAdObject(o) {
    if (!isObject(o)) return false;

    let hit = 0;
    let hasJumpOrMaterial = false;

    for (const k in o) {
      const lk = String(k).toLowerCase();
      const v = o[k];

      if (shouldDropKey(lk)) hit += 2;

      if (/^(jump_url|click_url|landing_url|target_url|link|url|pic|image|img|cover|material_url|creative_url)$/i.test(lk)) {
        if (typeof v === "string" && /^https?:\/\//i.test(v)) hasJumpOrMaterial = true;
        if (typeof v === "string" && AD_VALUE_RE.test(v)) hit += 2;
      }

      if (/^(type|kind|scene|slot|pos|position|source|from)$/i.test(lk)) {
        if (typeof v === "string" && AD_VALUE_RE.test(v)) hit += 2;
      }

      if (/^(duration|show_time|close_time|display_time|countdown|interval)$/i.test(lk)) {
        hit += 1;
      }

      if (typeof v === "string" && AD_VALUE_RE.test(v)) hit += 1;
    }

    return hit >= 4 || (hit >= 2 && hasJumpOrMaterial);
  }

  function forceEmptyAdPayload(root) {
    changed = true;

    if (Array.isArray(root)) return [];

    if (isObject(root)) {
      const keys = Object.keys(root);
      const dataKeys = [
        "data", "result", "list", "items", "item", "ads", "ad", "adv",
        "advert", "advertise", "advertisement", "banner", "banners",
        "popup", "pop", "float", "splash", "promotion", "promote",
        "marketing", "material", "creative", "sponsor"
      ];

      let touched = false;
      for (const k of dataKeys) {
        if (Object.prototype.hasOwnProperty.call(root, k)) {
          root[k] = emptyLike(root[k]);
          touched = true;
        }
      }

      // 常见接口格式：{error:0,msg:"ok",data:[...]} / {code:0,data:{...}}
      if (!touched) {
        for (const k of keys) {
          if (shouldDropKey(k) || looksLikeAdObject(root[k])) {
            root[k] = emptyLike(root[k]);
            touched = true;
          }
        }
      }

      // 如果整个接口就是广告接口但没有可识别字段，返回空对象更稳。
      if (!touched && keys.length <= 3) return {};

      return root;
    }

    return emptyLike(root);
  }

  function clean(value, parentKey) {
    if (Array.isArray(value)) {
      const out = [];
      for (const item of value) {
        if (looksLikeAdObject(item)) {
          changed = true;
          continue;
        }
        out.push(clean(item, parentKey));
      }
      return out;
    }

    if (isObject(value)) {
      if (looksLikeAdObject(value)) {
        changed = true;
        return {};
      }

      const out = {};
      for (const k in value) {
        const v = value[k];

        if (shouldDropKey(k)) {
          out[k] = emptyLike(v);
          changed = true;
          continue;
        }

        if (looksLikeAdObject(v)) {
          changed = true;
          continue;
        }

        out[k] = clean(v, k);
      }
      return out;
    }

    if (typeof value === "string" && parentKey && shouldDropKey(parentKey) && AD_VALUE_RE.test(value)) {
      changed = true;
      return "";
    }

    return value;
  }

  try {
    let result;

    if (AD_ENDPOINT_RE.test(url)) {
      result = forceEmptyAdPayload(json);
    } else {
      result = clean(json, "");
    }

    if (!changed) return $done({});

    // 修改 body 后删除长度/压缩头，避免客户端解析异常。
    for (const k in headers) {
      const lk = String(k).toLowerCase();
      if (lk === "content-length" || lk === "content-encoding") {
        delete headers[k];
      }
    }

    $done({
      body: JSON.stringify(result),
      headers: headers
    });
  } catch (e) {
    $done({});
  }
})();
