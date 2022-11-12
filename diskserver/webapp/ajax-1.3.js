$.ajaxSetup({ cache: false });


function getCommonReqMessage(data) {
  if(data.success) {
    data.state = 'success';
    return '执行成功'
  } else {
    data.state = 'error';
    console.error(data.msg)
    return '执行失败'
  }
}

function formatArrayByCR(param, arr) {
  for (let v of arr) {
    param += v + "\n";
  }
}

function jsonGetData(url, params, callback) {
  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: params,
    success: function (data) {
      console.debug(data);
      callback(data);
    },
    error: function (e) {
      if (e) console.log(e);
    }
  });
}

function jsonPostData(url, params, callback) {
  $.ajax({
    url: url,
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(params),
    success: function (data) {
      console.debug(data);
      callback(data);
    },
    error: function (e) {
      if (e) console.log(e);
    }
  });
}

function localUrl(url, port) {
  port = port ? ':' + port : '';
  let meHostName = window.location.hostname, meHostStr = "http://";
  if ("" === meHostName || 'localhost' === meHostName || '127.0.0.1' === meHostName) {
    meHostStr = meHostStr + 'localhost'
  } else {
    meHostStr = meHostStr + meHostName
  }
  return `${meHostStr}${port}${url}`
}

/**
 * 基本本地文件的模拟请求
 * @param url
 * @param params
 * @param callback
 * @param conf 配置项
 * {
 *      port: 本地模拟的请求的端口
 * }
 */
function jsonGetLocalData(url, params, callback, conf) {
  jsonGetData(localUrl(url, conf.port), params, callback);
}

/**
 * 基本本地文件的模拟请求
 * @param url
 * @param params
 * @param callback
 * @param conf 配置项
 * {
 *      port: 本地模拟的请求的端口
 * }
 */
function jsonPostLocalData(url, file, callback, conf) {
  jsonPostData(localUrl(url, conf.port), file, callback);
}


function jsonPostMutipartFormData(url, file, callback, progress) {
  const xhr = new XMLHttpRequest();
  xhr.open("post", url, true);
  xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
  xhr.setRequestHeader('Accept-Language', 'zh-CN,zh;q=0.9');
  xhr.setRequestHeader('Content-Type', 'multipart/form-data; charset=utf-8');
  xhr.addEventListener('error', e => {
    console.error(e);
  });
  xhr.upload.onprogress = function (event) {
    if (event.lengthComputable) {
      if (progress) progress({
        msg: "正在上传数据( " + (event.loaded/1024).toFixed(2) + "KB/" + (event.total/1024).toFixed(2) + "KB), 请等候上传完成 ...",
        loaded: event.loaded,
        total: event.total
      })
    }
  };
  let formDate = new FormData();
  formDate.append('file', file);
  xhr.addEventListener('load', function (e) {
    try {
      if (xhr.status === 200) {
        const json = eval('(' + e.target.response + ')');
        if (callback) callback(json);
      }
    } catch (e) {
      console.error(e);
    }
  })
  xhr.send(formDate);
}

/**
 * 上传文件
 * 采用formData来模拟form表单然后通过xhr发送出去
 * 返回值为json格式数据
 * @param {*} url
 * @param {*} file
 * @param {*} callback
 * @param {*} conf
 */
function jsonPostLocalMutipartFormData(url, file, callback, conf, progress) {
  jsonPostMutipartFormData(localUrl(url, conf.port), file, callback, progress);
}

function getRows(d) {
  return d.data && d.data.length > 0 ? d.data : [];
}

function getRow(d) {
  return d.data && d.data.length > 0 ? d.data[0] : undefined;
}

function glId() {
  const date = new Date();
  return parseInt(`${date.getFullYear()}${(date.getMonth() + 1)}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`);
}

/**
 * 获取短数字 id
 */
function gsId() {
  const date = new Date();
  return parseInt(date.getTime() / 1000 - 1563414027);
}

/**
 * 专门的下载的xur原生请求
 * @param url
 * @param path
 * @param name
 * @param conf
 */
function downloadFile(url, path, name, conf, progress) {
  var xhr = new XMLHttpRequest();
  xhr.onprogress = function (event) {
    if (event.lengthComputable) {
      if(progress) progress({
        msg: '正在从服务器获取数据(' + (event.loaded/1024).toFixed(2) +'KB/' + (event.total/1024).toFixed(2) + 'KB), 请等待...',
        loaded: event.loaded,
        total: event.total
      })
    }
  }
  xhr.open("get", localUrl(url, conf.port) + "?path=" + path + '&ts=' + new Date().getTime(), true);
  xhr.responseType = "blob";
  xhr.onload = function () {
    if (xhr.status === 200) {
      const url = window.URL.createObjectURL(xhr.response)
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };
  xhr.send();
}

/**
 * 文件类型后缀对应图标名称表，目前，图标的后缀采用png格式！
 * @type {Map<any, any>}
 */
const FILETYPE = new Map([
  ['folder', 'folder'],
  ['true', 'true'],
  ['false', 'false'],
  // pdf
  ['.pdf', 'pdf'],
  // 图片
  ['.png', 'img'],
  ['.jpg', 'img'],
  ['.gif', 'img'],
  ['.ico', 'img'],
  // word
  ['.doc', 'doc'],
  ['.docx', 'doc'],
  // 音频
  ['.mp3', 'vol'],
  ['.aac', 'vol'],
  // 视频
  ['.rm', 'rmvb'],
  ['.rmvb', 'rmvb'],
  ['.mp4', 'vdo'],
  ['.mkv', 'vdo'],
  ['.avc', 'vdo'],
  ['.java', 'java'],
  ['.js', 'js'],
  ['.css', 'css'],
  ['.html', 'html'],
  ['.conf', 'conf'],
  ['.jar', 'jar'],
  ['.license', 'license'],
  ['.txt', 'txt'],
  ['.xls', 'xls'],
  ['.xlsx', 'xls'],
  ['.ppt', 'ppt'],
  ['.db', 'db'],
  ['.rar', 'rar'],
  ['.zip', 'zip'],
  ['.gz', 'gz'],
  ['.tar', 'tar'],
  ['.iso', 'iso'],
  ['.gho', 'gho'],
  ['.exe', 'exe'],
  ['.cmd', 'cmd']
]);

/**
 * 根据后缀，获取文件图标
 * @param suffix
 * @returns {string}
 */
function getFileType(suffix) {
  let v = FILETYPE.get(suffix.toLowerCase());
  return v ? v + '.png' : 'file.png'
}

/**
 * 获取默认文件夹的图标
 * @returns {string}
 */
function getFolderType() {
  return FILETYPE.get('folder') + '.png';
}

/**
 * 获取本机的ip地址
 * @returns {string}
 */
function getIPAdress(os) {
  var interfaces = os.networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}