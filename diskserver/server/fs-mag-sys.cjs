/**
 * NodeJs Web Servers
 */
const mcFs = require("fs");
const mcUrl = require("url");
const mcPath = require("path");
const mcOs = require("os");
const mcCrypto = require("crypto");
const mcHttp = require("http");
const mcChildProcess = require("child_process");
const { syncBuiltinESMExports } = require("module");
const V_TRUE = [true, "true", 1, "1"];
const CACHE = new Map();
const CMD = new Map();
const SysRoutes = {};
const SysRouteMap = new Map();
var SysLoaded = false;
// 系统使用核心配置
var SysCfg = {};
var SysServer = {};
var cliReq, cliRes, routeFileLastTs;
// 定义了默认配置
const SysDefCfg = {
  host: "127.0.0.1",
  port: 80, // server port
  root: defResourceRoot(), // resource root
  index: "index.html", // index.html
  apiContentPath: "/", // api prefix
  apiSuffix: defApiSuffix(), // api suffix
  apiPrefix: "", // api prefix
  useNatIp: false, //
  allowHeaders: defAllowHeader(),
  browser: false,
  extRouteFile: "",
  extRouteObjName: "exports",
  extRouteEnable: false,
  logEnable: false,
  //资源路径拦截
  resIntercepter: null
};

// 需要暴露的方法有
const App = {
  defApiSuffix,
  defResourceRoot,
  defAllowHeader,
  getAppParams,
  runApp,
  runInstance,
  getMediaType,
  isAudioMediaType,
  isImageMediaType,
  isVideoMediaType,
  responseData,
  responseEmpty,
  responseError,
  responseNotFound,
  responseResource,
  defineResponse,
  leftRemoveDelimiter,
  leftWithDelimiter,
  bothRemoveDelimiter,
  bothWithDelimiter,
  rightRemoveDelimiter,
  rightWithDelimiter,
  md5_hex,
  route,
  getIPAdress,
  getQuery,
  store,
  storeContain,
  storeGet,
  storeRemove,
  log,
  validator,
  uploadToDir,
  getReqHeaders,
  getSysCfg,
  getRoot,
  getPort,
  getFs,
  concatPath,
  existsPath,
  defineResponse,
  urlDelimiterFormat,
  handleParamsInvoke,
};

function handleParamsInvoke(rule = {}, call) {
  getQuery()
    .then((ps) => {
      validator(
        rule,
        ps,
        () => call(ps),
        (msg) => responseError(msg)
      );
    })
    .catch((msg) => responseError(msg));
}

/**
 * 获取当前的时间的标准格式串
 *
 * @returns {yyyy-MM-dd HH:mm:ss.SSS}
 */
function nowStdStr() {
  const dt = new Date();
  const y = dt.getFullYear(),
    M = dt.getMonth() + 1,
    d = dt.getDate(),
    h = dt.getHours(),
    m = dt.getMinutes(),
    s = dt.getSeconds(),
    ms = dt.getMilliseconds();
  return `${y}-${M}-${d} ${h}:${m}:${s}.${ms}`;
}

function defApiSuffix() {
  return ".do";
}

function defResourceRoot() {
  return __dirname;
}

function defAllowHeader() {
  return "X-Requested-With,content-type";
}

function getFs() {
  return mcFs;
}

function concatPath(a = "", b = "") {
  return mcPath.join(a, b);
}

/**
 * 返回新对象，取配置值
 * @returns cfg info
 */
function getSysCfg() {
  return Object.assign({}, SysCfg);
}

function getPort() {
  return SysCfg.port
}

function store(key = "0", value = "0") {
  CACHE.set(key, value);
}

function storeRemove(key = "0") {
  return CACHE.delete(key);
}

function storeGet(key) {
  return CACHE.get(key);
}

function storeContain(key) {
  return CACHE.has(key);
}

function getMediaTypeDefinetion() {
  return {
    ".*": "application/octet-stream",
    ".avi": "video/avi",
    ".bmp": "application/x-bmp",
    ".css": "text/css",
    ".dll": "application/x-msdownload",
    ".doc": "application/msword",
    ".dtd": "text/xml",
    ".dwf": "Model/vnd.dwf",
    ".dwg": "application/x-dwg",
    ".exe": "application/x-msdownload",
    ".gif": "image/gif",
    ".htm": "text/html",
    ".html": "text/html",
    ".ico": "image/x-icon",
    ".img": "application/x-img",
    ".java": "text/plain",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "application/x-javascript",
    ".jsp": "text/html",
    ".m3u": "audio/mpegurl",
    ".md": "text/plain",
    ".mp3": "audio/mp3",
    ".mp4": "video/mpeg4",
    ".pdf": "application/pdf",
    ".py": "text/plain",
    ".png": "image/png",
    ".ppt": "application/vnd.ms-powerpoint",
    ".svg": "image/svg+xml",
    ".swf": "application/x-shockwave-flash",
    ".tiff": "image/tiff",
    ".tld": "text/xml",
    ".tsd": "text/xml",
    ".txt": "text/plain",
    ".vml": "text/xml",
    ".vsd": "application/x-vsd",
    ".wav": "audio/wav",
    ".wma": "audio/x-ms-wma",
    ".wsdl": "text/xml",
    ".xhtml": "text/html",
    ".xls": "application/vnd.ms-excel",
    ".xml": "text/xml",
    ".xsd": "text/xml",
    ".conf": "text/plain",
    ".properties": "text/plain",
  };
}

const mediaType = getMediaTypeDefinetion();

function getMediaType(suffix) {
  suffix = suffix.toLowerCase();
  const val = mediaType[suffix] || mediaType[".html"];
  return /(xml|text|html|htm|plain|js|css|md|py|java)/gi.test(val)
    ? val + ";charset=utf-8"
    : val;
}

function isAudioMediaType(suffix) {
  suffix = suffix.toLowerCase();
  const val = mediaType[suffix];
  return /(audio|mp3|wma)/gi.test(val);
}

function isImageMediaType(suffix) {
  suffix = suffix.toLowerCase();
  const val = mediaType[suffix];
  return /(png|jpg|image)/gi.test(val);
}

function isVideoMediaType(suffix) {
  suffix = suffix.toLowerCase();
  const val = mediaType[suffix];
  return /(video)/gi.test(val);
}

function log(...log) {
  if (SysCfg.logEnable) {
    if (log.length < 2) console.log(log[0]);
    else console.log(log);
  }
}

function allowCros(req, res) {
  const userAgent = req.headers["user-agent"];
  const accessControlRequestHeaders =
    req.headers["access-control-request-headers"];
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("etag", "" + new Date().getTime());
  res.setHeader("User-Agent", "" + userAgent);

  let accessCAHeaders = [];
  for (let h of SysCfg.allowHeaders.split(",")) {
    if (new RegExp(h, "ig").test(accessControlRequestHeaders)) {
      accessCAHeaders.push(h.toLowerCase());
    }
  }
  if (accessCAHeaders.length > 0) {
    res.setHeader("Access-Control-Allow-Headers", accessCAHeaders.toString());
  }
}

function responseEmpty() {
  cliRes.statusCode = 204;
  cliRes.end(null);
}

function responseData(data = {}, msg = "Success", success = true) {
  const ts = new Date().getTime();
  cliRes.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  });
  cliRes.end(JSON.stringify({ success, data, msg, ts }));
}

/**
 * 完全自定义的数据响应，结构由用户自行设计
 * @param {*} data
 */
function defineResponse(data = {}) {
  cliRes.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
  });
  cliRes.end(JSON.stringify(data));
}

function responseNotFound(success = false, msg = "Not Found .") {
  const ts = new Date().getTime();
  cliRes.writeHead(404, {
    "Content-Type": "application/json; charset=utf-8",
  });
  cliRes.end(JSON.stringify({ success, msg, ts }));
}

function responseError(
  msg = "Occur something unkonwn error .",
  success = false
) {
  const ts = new Date().getTime();
  cliRes.writeHead(500, {
    "Content-Type": "application/json; charset=utf-8",
  });
  cliRes.end(JSON.stringify({ success, msg, ts }));
}

function responeAsyncContentHtml(p, size) {
  try {
    const contentType = getMediaType(p.substr(p.lastIndexOf("."), p.length));
    log(p, contentType);
    cliRes.setHeader("Content-Type", contentType);
    cliRes.setHeader("Content-Length", size);
    mcFs.createReadStream(p).pipe(cliRes);
  } catch (e) {
    responseError("Resource Response Had Error");
  }
}

function responseResource(uri) {
  downLoadResource(uri);
}

function existsPath(path) {
  return mcFs.existsSync(path);
}

/**
 * see resource
 * @param {*} p resources url
 */
function downLoadResource(p) {
  try {
    let decodeP = p;
    if (/(%[0-9A-Z][0-9A-Z])+/.test(p)) {
      decodeP = decodeURI(p);
    }

    if (mcFs.existsSync(decodeP)) {
      let stats = mcFs.statSync(decodeP);
      if (stats && stats.isFile()) {
        responeAsyncContentHtml(decodeP, stats.size);
      }
    } else {
      responseNotFound();
    }
  } catch (e) {
    try {
      log(e);
      let stats = mcFs.statSync("505.html");
      if (stats && stats.isFile()) {
        responeAsyncContentHtml(p, stats.size);
      }
    } catch (ex) {
      responseNotFound();
    } finally {
      responseNotFound();
    }
  }
}

// 将bool,int,float等参数进行转换
function prepareServerCfg() {
  SysCfg.port = parseInt(SysCfg.port);
  SysCfg.useNatIp = V_TRUE.includes(SysCfg.useNatIp);
  SysCfg.browser = V_TRUE.includes(SysCfg.browser);
  SysCfg.extRouteEnable = V_TRUE.includes(SysCfg.extRouteEnable);

  // Dynamicy Route
  if (SysCfg.extRouteEnable && SysCfg.extRouteFile) {
    _readRouteFile(() => _addRouteFileChangeTrigger());
  }
}

function _readRouteFile(call) {
  // 预处理一下路由文件，默认和application保持一致
  let stats = mcFs.statSync(SysCfg.extRouteFile);
  if (stats.isFile()) {
    call();
  }
}

function leftWithDelimiter(api) {
  if (/^\//g.test(api)) {
    return api;
  }
  return "/" + api;
}

function leftRemoveDelimiter(api) {
  if (/^\//g.test(api)) {
    return api.substr(1);
  }
  return api;
}

function rightWithDelimiter(api) {
  if (/\/$/g.test(api)) {
    return api;
  }
  return api + "/";
}

function rightRemoveDelimiter(api) {
  if (/\/$/g.test(api)) {
    return api.substr(0, api.length - 1);
  }
  return api;
}

function bothWithDelimiter(api) {
  return rightWithDelimiter(leftWithDelimiter(api));
}

function bothRemoveDelimiter(api) {
  return rightRemoveDelimiter(leftRemoveDelimiter(api));
}

/**
 * 不同的协议取出url
 * @param {*} url
 * @returns
 */
function getRelativeUrl(url) {
  //
  if (/^(http|file:)/g.test(url)) {
    const str = url.substr(8);
    if (/\//.test(str)) return str.substr(str.indexOf("/") + 1);
    return "";
  }
  // ws
  if (/^ws:/g.test(url)) {
    const str = url.substr(5);
    if (/\//.test(str)) return str.substr(str.indexOf("/") + 1);
    return "";
  }
  // /XXX >>  XXX
  if (/^\//.test(url)) return url.substr(1);

  return url;
}

/**
 * 用户命令解析填充
 * @param {*} ps
 * @param {*} opts
 * @returns
 */
function fetchCommands(ps = [], opts = {}) {
  process.on("uncaughtException", function (err) {
    log("Caught exception: " + err.name, err.message);
    console.debug(err);

    // 重启服务
    if (/EINVAL/gi.test(err.message)) {
      // 不可逆则将进程杀掉
      process.exit();
    }
  });

  if (ps.length < 1) return;

  const cfg = {};

  ps.map((x) => {
    if (/=/.test(x)) {
      const arr = x.split("=");
      const k = arr[0].trim();
      const v = arr[1].trim();
      CMD.set(k, v);
      const cfgKey = k.substr(k.lastIndexOf("-") + 1);
      cfg[cfgKey] = v;
    } else {
      CMD.set(x.trim(), x.trim());
    }
  });

  if (CMD.get("start")) {
    start(Object.assign({}, cfg, opts));
  }
}

/**
 * 是否是访问的api
 * @param {*} api
 * @returns
 */
function isVistApi(api) {
  let ckApi = api;
  let regStr = "";
  // url 中带入的参数剔除掉，获取到需要检查的api的请求串
  if (/\?/.test(api)) {
    ckApi = api.substr(0, api.lastIndexOf("?"));
  }

  // 可以指定一个专门用于url前缀的路径，直接识别成api，不用检查后缀
  const str = "^/" + bothRemoveDelimiter(SysCfg.apiPrefix) + "/";
  // log(">> ApiPrefix:" + str, api);
  const breg = new RegExp(str);
  if (breg.test(ckApi)) {
    return true;
  }

  // 如果需要支持多种类型的请求的url的后缀的识别方式则这样定义
  if (/,/.test(SysCfg.apiSuffix)) {
    const arr = SysCfg.apiSuffix.split(",");
    if (arr.length < 1) {
      return false;
    }
    // 构建正则表达式 /(.xhr|.do$)/ig
    regStr = regStr + "(";
    arr.map((x) => {
      regStr = regStr + x.trim() + "|";
    });
    regStr = regStr.substr(0, regStr.length - 1);
    regStr = regStr + ")";
  } else {
    regStr = SysCfg.apiSuffix;
  }
  const reg = new RegExp(regStr + "$", "ig");
  return reg.test(ckApi);
}

/**
 * 用于将文件上传到指定的位置, 当然,这个还基于该文件所在目录而定的
 *
 * @param {*} dir 存储位置
 */
function uploadToDir(dir) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let num = 0;
    if (!dir) {
      reject("dir can't empty");
      return;
    }

    cliReq.on("data", function (chunk) {
      chunks.push(chunk);
      num += chunk.length;
    });

    cliReq.on("end", function () {
      const buffer = Buffer.concat(chunks, num);
      let rems = [];
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] == 13 && buffer[i + 1] == 10) {
          rems.push(i);
        }
      }
      const attachparamter = buffer.slice(rems[0] + 2, rems[1]).toString();
      const filename = attachparamter.match(/filename=".*"/g)[0].split('"')[1];
      const name = attachparamter.match(/name=".*"/g)[0].split('"')[1];
      const content = buffer.slice(rems[3] + 2, rems[rems.length - 2]);
      const address = rightRemoveDelimiter(dir) + leftWithDelimiter(filename);

      log(address, name, filename);

      mcFs.writeFile(address, content, function (err) {
        if (err) {
          reject("Upload File Fail !");
        } else {
          resolve({
            name: name,
            filename: filename,
            size: num,
            suffix: "." + filename.split(".")[1],
            addr: address,
            ts: new Date().getTime(),
            msg: "Upload File Success !",
          });
        }
      });
    });
  });
}

/**
 * 参数校验
 *
 * @param {*} rule
 * @param {*} params
 * @param {*} done
 * @param {*} err
 */
function validator(rule, params, done, err) {
  let msg = "";
  for (const p of Object.keys(rule)) {
    const r = rule[p],
      pv = params[p];
    if (pv) {
      if (r["minlength"] && r["minlength"] > 0 && pv.length < r["minlength"]) {
        msg = r["minlength_message"] || `[${p}]: ` + r["minlength"];
        break;
      }
      if (r["maxlength"] && r["maxlength"] > 0 && pv.length > r["maxlength"]) {
        msg = r["maxlength_message"] || `[${p}]: ` + r["maxlength"];
        break;
      }
      if (r["min"] && r["min"] > 0 && parseInt(pv) < r["min"]) {
        msg = r["min_message"] || `[${p}]: ` + r["min"];
        break;
      }
      if (r["max"] && r["max"] > 0 && parseInt(pv) > r["max"]) {
        msg = r["max_message"] || `[${p}]: ` + r["max"];
        break;
      }
      if (r["validator"] && !r["validator"]()) {
        msg = r["validator_message"] || `[${p}]: is Not Pass`;
        break;
      }
    } else {
      if (true == r["required"]) {
        msg = r["required_message"] || `[${p}]: is required`;
        break;
      }
    }
  }
  if (msg) {
    if (err) {
      err();
    }
    return;
  }
  if (done) {
    done();
  }
}

/**
 * 字符串进行字符串转换处理,用于加密，不能解密。
 *
 * @param {*} str
 * @returns
 */
function transSerial(str) {
  const key =
    "012#34[56]78*9A&DE&FG>HI-JKmnr(BCstuvM)NOk|lwx:y<zPQ_R^STo+pqUVW'XY;Zab,cdef/g?hij.";
  const a = key.split("");
  let s = "",
    b,
    b1,
    b2,
    b3;
  for (let i = 0; i < str.length; i++) {
    b = str.charCodeAt(i);
    b1 = b % L;
    b = (b - b1) / L;
    b2 = b % L;
    b = (b - b2) / L;
    b3 = b % 1;
    s += a[b3] + a[b2] + a[b1];
  }
  return s;
}

/**
 * 生成str的md5字符串
 *
 * @param {*} str
 * @returns
 */
function md5_hex(str) {
  return mcCrypto.createHash("md5").update(str).digest("hex");
}

/**
 * 获取请求参数,一种时GET,另一种时requestBody
 */
function getQuery() {
  return new Promise((resolve, reject) => {
    try {
      let result = { type: cliReq.method.toUpperCase() };
      const { query, pathname } = mcUrl.parse(cliReq.url, true);
      result.pathname = pathname;
      if ("GET" === result.type) {
        resolve(Object.assign({}, result, query));
      } else {
        let chunks = [],
          num = 0;
        cliReq.on("data", (chunk) => {
          chunks.push(chunk);
          num += chunk.length;
        });
        cliReq.on("end", () => {
          let buffer = Buffer.concat(chunks, num);
          resolve(Object.assign({}, result, JSON.parse(buffer.toString())));
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 获取本机的ip地址
 * @returns {string}
 */
function getIPAdress() {
  const interfaces = mcOs.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        return alias.address;
      }
    }
  }
  return "127.0.0.1";
}

/**
 * 获取访问的根目录,如果要绝对地址,带一个入参true
 *
 * @param {*} isAbs
 */
function getRoot() {
  return SysCfg.root;
}

/**
 * 检测路由文件是否存在
 */
function _addRouteFileChangeTrigger() {
  function runner() {
    let stats = mcFs.statSync(SysCfg.extRouteFile);
    if (routeFileLastTs === "ts:" + stats.mtimeMs) {
      return;
    }
    routeFileLastTs = "ts:" + stats.mtimeMs;
    const routeFileContent = mcFs
      .readFileSync(SysCfg.extRouteFile)
      .toString();

    const msg = `INFO :: ${nowStdStr()} API Has Update.`;

    const callback = eval(`;(function(){
       let ${SysCfg.extRouteObjName} = {};
       ${routeFileContent};
       log('${msg}');
       return ${SysCfg.extRouteObjName};
     })`);

    // invoke methods and give exports for bind;
    const mm = callback() || {};

    // here is route.js repalce
    for (const name of Object.keys(mm)) {
      route(leftWithDelimiter(name), mm[name]);
    }
  }
  // 先加载一次（避免程序启动，api还没有初始化完毕）
  runner();
  // 然后设置定时器
  setInterval(function () {
    runner();
  }, 1000);
}

function urlDelimiterFormat(s) {
  return s ? s.split(/(\\\\|\\|\/|\/\/)/gi)
    .filter((x) => !/(\\|\/)/.test(x))
    .join("/") : s;
}

function pathStartRelative(p) {
  return p.startsWith(".") ? mcPath.join(__dirname, p) : p
}

function setDefaultPathIfAbsent(cfgKey) {
  if (cfgKey) {
    SysCfg[cfgKey] = pathStartRelative(urlDelimiterFormat(SysCfg[cfgKey] ?? __dirname))
  }
}

/**
 * 运行服务
 *
 * @param {*} cfg
 */
function start(cfg) {
  // 创建http服务
  SysServer = mcHttp.createServer((request, response) => { });

  // 配置合并在一起
  SysCfg = Object.assign({}, SysDefCfg, cfg);

  setDefaultPathIfAbsent("root");
  setDefaultPathIfAbsent("extRouteFile")

  // 配置合并后进行数据类型转换，并进行路由初始化操作
  prepareServerCfg();

  const HOST = SysCfg["useNatIp"] ? getIPAdress() : SysCfg["host"];

  // 监听服务端口
  SysServer.listen(SysCfg["port"], HOST, () => {
    console.log("Server running at http://" + HOST + ":" + SysCfg["port"]);

    //根据全局对象process输出不同的启动命令
    if (SysCfg.browser) {
      let cmd = null;
      if (process.platform === "win32") {
        cmd = "start";
      } else if (process.platform === "linux") {
        cmd = "xdg-open";
      }
      // mac
      else if (process.platform === "darwin") {
        cmd = "open";
      }
      const cc = `${cmd} http://${HOST}:${SysCfg["port"]}/`;
      mcChildProcess.exec(cc);
    }
  });

  // 绑定请求处理函数
  SysServer.on("request", (request, response) =>
    requestHandler(request, response)
  );

  // add config info view.
  route("_app_cfg_.do", (_) => responseData(SysCfg));
}

function route(path, call) {
  if (path && call instanceof Function) {
    SysRoutes[path] = function () {
      call(App, cliReq);
    };
    SysRouteMap.set(path, SysRoutes[path]);
  }
}

/**
 * 返回header值或者返回一个header对象
 *
 * @param {*} h
 * @returns when h exists return header[h] or not return headers
 */
function getReqHeaders(h) {
  return h ? cliReq.headers[h] : cliReq.headers;
}

/**
 * 处理请求的监听和处理， 得益于js是单线程的，因此，这里共享了请求
 * @param {*} req
 * @param {*} res
 */
function requestHandler(req, res) {
  cliReq = req;
  cliRes = res;

  allowCros(req, res);

  // 放行options请求
  if (req.method.toUpperCase() === "OPTIONS") {
    responseEmpty();
    return;
  }

  req.on("error", (err) => log(err.stack));

  const { pathname } = mcUrl.parse(req.url, true);

  let url = pathname;
  // 以 / 结束的url处理
  if (/^\/$/.test(pathname)) {
    const fileFrom = rightWithDelimiter(SysCfg?.webapp ?? SysCfg.root);
    responseHtml(fileFrom, bothRemoveDelimiter(SysCfg.index));
  } else {
    url = "/" + getRelativeUrl(url);
    if (isVistApi(url)) {
      if ("/" !== SysCfg.apiContentPath) {
        fullUrl = fullUrl.replace(SysCfg.apiContentPath, "");
        fullUrl = leftWithDelimiter(fullUrl);
      } else {
        fullUrl = leftWithDelimiter(url);
      }
      log(`INFO :: ${nowStdStr()} Vist API [${fullUrl}]`);
      const call = SysRoutes[fullUrl];
      if (call && call instanceof Function) {
        call();
      } else {
        responseNotFound();
      }
    } else {
      if (SysCfg.resIntercepter) {
        responseHtml(SysCfg.root, SysCfg.resIntercepter(pathname, SysCfg.root));
      } else {
        responseHtml(SysCfg.root, pathname);
      }
    }
  }
}

function responseHtml(fileFrom, pathname = "") {
  // 资源，需要根据路径来进行处理
  const url = mcPath.join(fileFrom, pathname);
  log("vist resource: " + url);
  downLoadResource(url);
}

function getAppParams(arr = []) {
  var args = process.argv.slice(2);
  if (arr) {
    args = [...args, ...arr];
  }
  return args;
}

/**
 * 通过提供完整的命令行字符串数组方式创建实例
 * @param {*} arr
 */
function runApp(arr = []) {
  if (!SysLoaded) {
    SysLoaded = true;
    fetchCommands(arr);
  }
}

/**
 * 通过直接的配置项来创建实例
 * @param {*} options
 */
function runInstance(options) {
  fetchCommands(["start"], options);
}

// 如果引入了module
if (module) module.exports = App;

function debugInstance() {
  // debug test
  runInstance({
    //host: '192.168.31.242',
    useNatIp: false,
    // export port
    port: 8070,
    // log print
    logEnable: true,
    // open dync api
    extRouteEnable: true,
    // namespace obj
    extRouteObjName: "data",
    // api
    extRouteFile: "./api.js",
    // auto open browser
    browser: true,
    // load root path
    root: "../webapp",
    // api prefix
    apiPrefix: '/api',
    // 做资源的重定向
    resIntercepter(path) {
      return path.startsWith("/html") ? path.replace("/html", "") : path
    }
  });

  // 生成端口所在的json，页面获取到就知道向那个端口发送请求了
  getFs().writeFile(
    concatPath(SysCfg.root, "sp.json"),
    `const serverport = {"port":${parseInt(SysCfg.port) + 0}}`,
    () => { }
  );
}
