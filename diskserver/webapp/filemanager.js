// 此处指定服务地址和目标目录
const localConf = { port: serverport.port || 8082 };

/** 传输数据文件 */
const jsonPostLocalMutipartFormDat = function (url, file, callback, progress) {
  jsonPostLocalMutipartFormData(url, file, callback, localConf, progress);
};
/** 传输GET数据 */
const jsonGetLocalDat = function (url, params, callback) {
  jsonGetLocalData(url, params, callback, localConf);
};
/** 传输POST数据 */
const jsonPostLocalDat = function (url, params, callback) {
  jsonPostLocalData(url, params, callback, localConf);
};

$(function () {
  new Vue({
    el: "#app",
    data: {
      timer: null,
      drawFile: undefined,
      dataFiles: [],
      // 路由轨迹
      routeTaril: [],
      rootPath: undefined,
      // 服务的运行的IP地址
      realIp: undefined,
      currentRoute: undefined,
      uploadDialogVisible: false,
      renameDialogVisible: false,
      newFolderDialogVisible: false,
      renameEditor: {
        path: undefined,
        name: undefined,
      },
    },
    methods: {
      /**
       * 此处是针对文件添加链接，这样也是可以下载的，比那个通后台的下载采用的方式不一样；
       * 这里面暂时没有测试手机端，也就是linux下的目录的获取的问题，最好的方式是搞定win和linux
       * 下的路径的准确的获取的问题
       * TODO linux下目录的获取
       */
      getAhref(item) {
        return item.full;
      },
      getIp(callback) {
        jsonGetLocalDat("/ip.do", {}, (d) => {
          let data = d.data;
          this.currentRoute = data.rootPath;
          this.routeTaril.push(this.currentRoute);
          this.rootPath = data.rootPath;
          this.realIp = data.realIp;
          if (callback) callback();
        });
      },
      mainLoad() {
        jsonGetLocalDat("/list.do", {}, (d) => {
          this.dataFiles = getRows(d);
        });
      },
      reflushCurrent() {
        this.dataFiles = [];
        this.$nextTick(function () {
          this.folderLoad(this.currentRoute);
        }, 300);
      },
      // 进入目录，请求数据，加载出目录列表
      folderLoad(path) {
        if (path) {
          jsonGetLocalDat("/folder/list.do", { path: path }, (d) => {
            this.dataFiles = getRows(d);
          });
        } else {
          this.mainLoad();
        }
      },
      uploadFile(file, success, fally) {
        jsonPostLocalMutipartFormDat(
          "/upload.do",
          file,
          (d) => {
            new MsgBox(getCommonReqMessage(d), d.state);
            this.folderLoad(this.currentRoute);
            if (success) success();
          },
          (progress) => {
            //loaded,total,msg
            if (progress) {
              if (progress.loaded >= progress.total) {
                $("#showProcess").html("");
              } else {
                $("#showProcess").html(progress.msg);
              }
            } else {
              $("#showProcess").html("");
            }
          }
        );
        if (fally) fally();
      },
      getIconSrc(item) {
        let type = "file";
        type = item.isDirectory ? "folder" : "file";
        switch (type) {
          case "file":
            let ind = item.name.lastIndexOf(".");
            return "./icons/" + getFileType(item.name.substring(ind));
          case "folder":
            return "./icons/" + getFolderType(type);
        }
      },
      getBoolIcon(flag) {
        return flag
          ? "./icons/" + FILETYPE.get("true") + ".png"
          : "./icons/" + FILETYPE.get("false") + ".png";
      },
      deteleFile(info) {
        const self = this;
        new ConfirmBox(
          "提示",
          "此操作将永久删除该文件, 是否继续?",
          "warning",
          function () {
            jsonGetLocalDat(
              info.isFile ? "/delete/file.do" : "/delete/folder.do",
              { path: info.full },
              (d) => {
                new MsgBox(getCommonReqMessage(d), d.state);
                self.folderLoad(self.currentRoute);
              }
            );
          }
        );
      },
      getLocalUrl(u) {
        if (!u.startsWith("/")) {
          u = "/" + u;
        }
        return localUrl(u, localConf.port);
      },
      // 进路由（进入目录）
      recordRouteTaril(path) {
        if (path) {
          this.currentRoute = path;
          this.routeTaril.push(this.currentRoute);
          this.folderLoad(this.currentRoute);
        }
      },
      // 退路由（退回上级目录）
      recordRouteBack() {
        const self = this;
        function fn(self) {
          // 防止出错
          if (self.routeTaril.length == 0) {
            self.currentRoute = self.rootPath;
            self.routeTaril.push(self.currentRoute);
            self.mainLoad();
            return;
          }

          // 已经剩下最后一个直接就是顶层
          if (self.routeTaril.length == 1) {
            new MsgBox("已到最顶层！", "warning");
            return;
          }

          // 加载最后一个
          self.routeTaril.pop();
          var path = self.routeTaril[self.routeTaril.length - 1];
          self.currentRoute = path;
          self.folderLoad(path);
        }
        if (self.timer) clearTimeout(self.timer);
        self.timer = setTimeout(() => fn(self), 30);
      },
      /**
       * 下载文件
       */
      download(item) {
        // 注意： 这个地方目前只有pc可以下载正确，手机端显示不对，手机端变成了一个文件，
        // 而不是按照指定的名字来下载的。这个目前没有解决；
        downloadFile(
          "/file/download.do",
          item.full,
          item.name,
          localConf,
          (progress) => {
            if (progress) {
              if (progress.loaded >= progress.total) {
                $("#showProcess").html("");
              } else {
                $("#showProcess").html(progress.msg);
              }
            } else {
              $("#showProcess").html("");
            }
          }
        );
      },
      /**
       * 修改名字打开对话框
       */
      renameClick(item) {
        var self = this;
        var params = { name: item.name, path: item.full };
        var el = $(`
                <div style="margin:20px 30px;">
                    <dl>
                    <dt>名称</dt>
                    <dd><input type="text" name="name"/></dd>
                    </dl>
                </div>
                `);
        el.find("input[name=name]").val(item.name);
        new ConfirmBox("修改名称", el, "success", () => {
          params.name = el.find("input[name=name]").val();
          if (!params.name.trim()) {
            new MsgBox("目录名称不能为空！", "warning");
            return;
          }
          // 走创建
          jsonPostLocalDat("/file/rename.do", params, (d) => {
            new MsgBox(getCommonReqMessage(d), d.state);
            if (d.state === "success") {
              self.folderLoad(self.currentRoute);
            }
          });
        });
      },
      /**
       * 移动文件
       * @param {*} item 文件记录
       */
      moveFile(item) {
        var self = this;
        var params = { name: item.name, path: "" };
        var el = $(`
                <div style="margin:20px 30px;">
                    <dl>
                    <dt>移动的路径</dt>
                    <dd><input type="text" name="path"/></dd>
                    </dl>
                </div>
                `);
        el.find("input[name=path]").val(item.full);
        new ConfirmBox("移动文件", el, "success", () => {
          params.path = el.find("input[name=path]").val();
          if (!params.path.trim()) {
            new MsgBox("路径不能为空！", "warning");
            return;
          }
          // 走创建
          jsonPostLocalDat("/api/move.do", params, (d) => {
            new MsgBox(getCommonReqMessage(d), d.state);
            if (d.success) {
              self.folderLoad(self.currentRoute);
            } else {
              new MsgBox(d.msg, "warning");
            }
          });
        });
      },
      /**
       * 创建新的目录打开对话框
       */
      newFolderClick() {
        var self = this;
        var params = { name: undefined, path: this.currentRoute };
        var el = $(`
                <div style="margin:20px 30px;">
                    <dl>
                    <dt>输入名称</dt>
                    <dd><input type="text" name="name"/></dd>
                    </dl>
                </div>
                `);
        new ConfirmBox("创建新目录", el, "success", () => {
          params.name = el.find("input[name=name]").val();
          if (!params.name.trim()) {
            new MsgBox("目录名称不能为空！", "warning");
            return;
          }

          // 走创建
          jsonPostLocalDat("/folder/creat.do", params, (d) => {
            new MsgBox(getCommonReqMessage(d), d.state);
            if (d.state === "success") {
              self.folderLoad(self.currentRoute);
            }
          });
        });
      },

      // 拖放事件
      dropHandler(e) {
        e.preventDefault();
        e.target.style.borderColor = "#ccc";
        let fileList = e.dataTransfer.files;
        var arr = [];
        if (fileList.length > 0) {
          for (let i = 0; i < fileList.length; i++) {
            // 检测文件名有没有空格
            //                 if (fileList[i].name.indexOf(' ') > -1) {
            //                     new MsgBox(fileList[i].name + '文件名称不能包含空格。', 'error')
            //                     return false
            //                 }
            // 判断大小
            if (fileList[i].size / 1024 < 150000) {
              arr.push(fileList[i]);
            } else {
              new MsgBox(
                fileList[i].name + "超过150M，无法发送文件。",
                "error"
              );
            }
          }
          if (arr.length > 0) {
            this.uploadFile(arr[0]);
          }
        }
      },
      // 拖放事件，获取位置
      dragoverHandler(e) {
        //阻止浏览器默认打开文件的操作
        e.preventDefault();
        //拖入文件后边框颜色变红
        e.target.style.borderColor = "red";
      },
      dragleaveHandler(e) {
        e.target.style.borderColor = "#ccc";
      },
      clickUploadHandler(e) {
        let input = $(e.target).find("input[type=file]");
        input.click();
      },
      // 文件上传的input
      uploaderChangeHander(e) {
        const me = e.target;
        var file = e.target.files[0];
        if (file) {
          this.uploadFile(
            file,
            function () {
              me.value = "";
            },
            function () {
              me.value = "";
            }
          );
        }
      },
    },
    computed: {
      viewRoute() {
        var v = this.currentRoute;
        if (v) {
          var c = 1;
          for (; c > 0; c--) {
            if (v.startsWith(".")) {
              v = v.substr(1);
              c = c + 1;
            }
          }
          for (c = 1; c > 0; c--) {
            if (-1 != v.search("/")) {
              v = v.replace("/", "\\");
              c = c + 1;
            }
          }
        }

        return v;
      },
    },
    mounted() {},
    created() {
      const self = this;
      self.getIp((_) =>
        setTimeout(function () {
          self.mainLoad();
        }, 500)
      );
    },
  });
});
