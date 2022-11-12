/**
 * 确认弹窗
 * @param title {*} 标题
 * @param message {*} 内容，可以是字符串，或者html模板字符串
 * @param type {'success'|'info'|'error'|'warning'}
 * @param sure {*} 确认回调，自动移除组件
 * @param cancel {*} 取消回调，自动移除组件
 */
class ConfirmBox {
    constructor(title, message, type, sure, cancel) {
        var $content = $(`<div></div>`).html(message);
        this.contentObj = $content;

        $('body').css('position', 'relative');
        var el = $("<div/>");
        el.css({
            'position': 'fixed',
            'left': '10%',
            'bottom': '30%',
            'border': '1px solid',
            //'width': '300px',
            'z-index': '1000',
            'background': 'white'
        })

        function fillActionBtnStyle($btn) {
            $btn.css({
                'margin': '0 3px',
                'background': '#aaa',
                'color': 'white',
                'padding': '3px 5px',
                'cursor': 'pointer'
            }).hover(function () {
                $btn.css({
                    'background': '#555'
                })
            }, function () {
                $btn.css({
                    'background': '#aaa'
                })
            })
            return $btn;
        }

        var el_sure = $(`<button>确定</button>`);
        el_sure.click(function () {
            if (sure) {
                sure($content);
            }
            el.remove();
        })
        fillActionBtnStyle(el_sure);
        var el_cancel = $(`<button>取消</button>`);
        el_cancel.click(function () {
            if (cancel) cancel();
            el.remove();
        })
        fillActionBtnStyle(el_cancel);

        // 添加标题
        el.append(
            $(`<header>${title || '提示'}</header>`).css('background-image', 'linear-gradient(160deg, ' +
                { success: '#67C23A', warning: '#E6A23C', error: '#F56C6C', info: '#909399' }[type || 'info']
                + ' 20%,#aaa 80%)').css({
                    'height': '35px',
                    'line-height': '35px',
                    'font-weight': 'bold',
                    'text-align': 'left',
                    'padding-left': '10px',
                    'color': 'white'
                })
        ).append(
            $content.css({
                'padding': '0',
                'font-size': '.9rem',
                'min-height': '100px'
            })
        ).append(
            $('<footer/>')
                .css({
                    'padding': '2px 5px',
                    'text-align': 'right',
                    'background': '#eee'
                })
                .append(
                    el_sure
                ).append(
                    el_cancel
                )
        )

        $('body').append(el);
    }

    /**
     * 设置内容容器样式
     */
    setContentStyle(styleKey, styleValue) {
        this.contentObj.css(styleKey, styleValue);
        return this;
    }

    /**
     * 获取content对象
     */
    before(call) {
        if (call) call(this.contentObj)
        return this;
    }

    /**
     * 获取对象
     * @param {*} mark 传入指定的定位jq的查询关键字，比如 '#xxx' | '.xxx' | 等等jq可查的
     */
    getObject(mark) {
        return this.contentObj.find(mark)
    }
}

/**
 * 消息提示
 * @param msg 消息
 * @param type 提示类型
 * @param timeout 消失时间，默认800ms
 */
class MsgBox {
    constructor(msg, type, timeout) {
        $('body').css('position', 'relative');

        var el = $("<div/>").append(
            $("<span>" + msg + "</span>")
        ).css({
            'position': 'fixed',
            'right': '2vw',
            'top': '3vw',
            'width': '300px',
            'height': 'auto',
            'background': 'white',
            'color': 'red',
            'border': 'none',
            'border-radius': '10px',
            'text-align': 'center',
            'padding': '10px 15px',
            'overflow-wrap': 'break-word',
            'border': '1px solid',
            'border-left': '5px solid',
            ' z-index': '1000',
        });

        if (type) {
            el.css('color', { success: '#67C23A', warning: '#E6A23C', error: '#F56C6C', info: '#909399' }[type])
        }

        $('body').append(el);

        setTimeout(function () {
            el.remove()
        }, timeout || 800)
    }
}

/**
 * 加载列表
 */
class LoadList {
    constructor(container, ulId, url, key, label, done, rowClick) {
        const orgUl = `<ul id='${ulId}'></ul>`;
        const orgLi = `<li></li>`
        const map = new Map();
        this.post(url, {}, rows => {
            var ul = $(orgUl);
            rows.forEach(row => {
                map.set(row.id, row);
                ul.append(
                    $(orgLi).append(
                        $('<p/>').append($('<i/>')).append(
                            $(`<b id='${row[key]}'>${row[label]}</b>`).click(function (e) {
                                var me = e.target;
                                rowClick(map.get(me.id))
                            })
                        )
                    )
                )
            });
            container.append(ul);
        })
    }

    post(url, data, done) {
        var xhr = new XMLHttpRequest()
        xhr.timeout = 3000;
        xhr.ontimeout = function (event) {
            new MsgBox("请求超时！", 'error');
        }

        xhr.open('POST', url);
        xhr.setRequestHeader('content-type', 'application/json; charset=utf-8')
        xhr.send(JSON.stringify(data || {}));
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                if (done) {
                    var json = JSON.parse(xhr.responseText);
                    if (json.state === 'success') {
                        done(json.data)
                    }
                }
            }
        }
    }

    /**
     * 处理api，如果最前面有/则去掉。
     * @param {*} api 
     */
    urlFormat(api) {
        api.trim();
        if (/^\//g.test(api)) {
            api = api.substr(1);
        }
        return api;
    }
}

