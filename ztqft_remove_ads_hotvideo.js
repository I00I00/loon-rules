/*
中泰齐富通 hotVideo 广告项过滤
用途：过滤 /homepage/hotVideo?auth=CustomTitle 返回数据中 cover/url 指向 /resource/ad/ 的条目。
适用：Loon http-response 脚本，requires-body=1。
说明：只处理 hotVideo 响应体，不拦截登录、行情、交易、资讯主接口。
*/

let body = $response.body || "";

try {
  const obj = JSON.parse(body);
  const data = obj && obj.data;

  if (data && Array.isArray(data.videoList)) {
    data.videoList = data.videoList.filter((item) => {
      const cover = String((item && item.cover) || "");
      const url = String((item && item.url) || "");
      const playUrl = String((item && item.playUrl) || "");

      return !/\/resource\/ad\//i.test(cover)
        && !/\/resource\/ad\//i.test(url)
        && !/\/resource\/ad\//i.test(playUrl);
    });
  }

  $done({ body: JSON.stringify(obj) });
} catch (e) {
  $done({ body });
}
