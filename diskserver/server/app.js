
const { runInstance, getFs, getRoot, concatPath, getPort } = require("./fs-mag-sys.cjs")

// 当前文件所在的路径
const runPort = 8070, rootPath = __dirname;
console.log("Server Root: " + __dirname)

// 生成端口所在的json，页面获取到就知道向那个端口发送请求了
getFs().writeFile(
    concatPath(getRoot(), "sp.json"),
    `const serverport = {"port":${parseInt(getPort()) + 0}}`,
    () => { }
);

// 等待一会，然后再启动
setTimeout(function () {
    runInstance({
        //host: '192.168.31.242',
        useNatIp: true,
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
        // 做资源的重定向
        resIntercepter: path => path.startsWith("/html") ? path.replace("/html", "") : path,
    });
}, 50);
