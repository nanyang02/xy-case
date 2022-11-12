const {
  responseData,
  getSysCfg,
  responseError,
  getFs,
  log,
  concatPath,
  getIPAdress,
  handleParamsInvoke,
  store,
  uploadToDir,
  existsPath,
  storeGet,
  urlDelimiterFormat,
  responseResource
} = require("./fs-mag-sys.cjs");

const fs = getFs();
const rootPath = getSysCfg().root;
const realIp = getIPAdress();

const aliasRoot = "/html";

function visualRootTransReal(visualPath) {
  if (visualPath.startsWith(aliasRoot)) {
    return concatPath(rootPath, visualPath.replace(aliasRoot, ""))
  }
  return visualPath;
}

// 扫描文件并生成必要的文件信息用于页面展示
function scanPathFiles(folder, last) {
  let result = [];
  fs.readdir(folder, (err, files) => {
    if (err) {
      log(err);
      responseError("读取失败");
    }
    for (let name of files) {
      try {
        // 同步获取文件信息（可能抛出异常，此处有异常则知己跳过即可）
        const full = concatPath(folder, name);
        let stats = fs.statSync(full);
        let flag = stats.isDirectory();
        let info = { isFile: !flag, isDirectory: flag, name, full: urlDelimiterFormat(concatPath(last ? last : aliasRoot, name)) };
        if (!flag) {
          info.size = stats.size;
        }
        result.push(info);
      } catch (e) {
        log(e);
      }
    }
    responseData(result, "加载成功");
  });
}

// 缓存当前进入的目录，作为上传的目录
function cacheUploadDir(dir) {
  store("uploadDir", dir);
  //log("Update uploadDir: " + dir)
}

// 获取应该上传的目录
function getCacheUploadDir() {
  return storeGet("uploadDir");
}

function resIntercepter(path) {
  return path.startsWith("/html") ? path.replace("/html", "") : path
}

function removeFile() {
  try {
    fs.rmSync(ps.path);
    return Promise.resolve({})
  } catch (e) {
    log(e)
    return Promise.reject(e)
  }
}

data = {
  "ip.do": function () {
    cacheUploadDir(rootPath);
    log(getCacheUploadDir());
    responseData({ rootPath: aliasRoot, realIp });
  },
  "list.do": function () {
    scanPathFiles(rootPath);
  },
  "/folder/list.do": function () {
    handleParamsInvoke({ path: { required: true, min: 1 } }, ({ path }) => {
      const last = path;
      path = visualRootTransReal(path)
      cacheUploadDir(path);
      scanPathFiles(path, last);
    });
  },
  "upload.do": function () {
    uploadToDir(getCacheUploadDir(), aliasRoot)
      .then((info) => responseData(info, null))
      .catch((msg) => responseError(msg));
  },
  "/file/download.do": function () {
    handleParamsInvoke({
      path: { required: true, min: 1 }
    }, ({ path }) => {
      responseResource(concatPath(rootPath, resIntercepter(path)))
    })
  },
  "/folder/creat.do": function () {
    handleParamsInvoke({ name: { required: true, min: 1 } }, ({ name }) => {
      fs.mkdirSync(concatPath(getCacheUploadDir(), name));
      responseData(null, "success");
    });
  },
  "/delete/file.do": function () {
    handleParamsInvoke({ path: { required: true, min: 1 } }, ({ path }) => {
      removeFile(visualRootTransReal(path))
        .then(() => responseData(null, "success"))
        .catch(() => responseError("remove fail"))
    });
  },
  "/delete/folder.do": function () {
    handleParamsInvoke({ path: { required: true, min: 1 } }, ({ path }) => {
      try {
        path = visualRootTransReal(path)
        fs.rmdirSync(path);
        responseData(null, "success");
      } catch (e) {
        log(e)
        responseError("remove fail")
      }
    });
  },
  "/file/rename.do": function () {
    handleParamsInvoke(
      {
        path: { required: true, min: 1 },
        name: { required: true, min: 1 },
      },
      ({ path, name }) => {
        path = visualRootTransReal(path)
        fs.renameSync(path, concatPath(getCacheUploadDir(), name));
        responseData(null, "success");
      }
    );
  },
  "/api/move.do": function () {
    handleParamsInvoke(
      {
        path: { required: true, min: 1 },
        name: { required: true, min: 1 },
      },
      ({ path, name }) => {
        path = visualRootTransReal(path)
        const b = existsPath(path)
        if(b) {
          responseError("目录已存在，无法移动！")
        } else {
          fs.renameSync(concatPath(getCacheUploadDir(), name), path);
          responseData(null, "success");
        }
      }
    );
  },
};

