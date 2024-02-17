/* ----

# Kico Style 1.0
# By: Dreamer-Paul
# Last Update: 2020.4.10

一个可口的极简响应式前端框架。

本代码为奇趣保罗原创，并遵守 MIT 开源协议。欢迎访问我的博客：https://paugram.com

---- */

Array.prototype.remove = function (value) {
    var index = this.indexOf(value);
    if(index > -1) this.splice(index, 1);
};

(function (global, setting) {
    var KStyle = function (a, b) {
        return KStyle.fn.init(a, b);
    };

    KStyle.fn = KStyle.prototype = {
        construtor: KStyle,
        init: function (a, b) {
            a = KStyle.selectAll(a);

            a.each = function (fn){
                return KStyle.each(a, fn);
            };

            a.image = function () {
                return KStyle.image(a);
            };

            a.lazy = function (bg) {
                return KStyle.lazy(a, bg);
            };

            a.scrollTo = function (offset) {
                return KStyle.scrollTo(a, offset);
            };

            a.empty = function () {
                return KStyle.each(a, function (item) { KStyle.empty(item); });
            }

            return a;
        }
    };

    // 批量处理
    KStyle.each = function (data, fn) {
        for(var i = 0; i < data.length; i++){
            fn(data[i], i, data);
        }
    };

    // 创建对象
    KStyle.create = function (tag, prop) {
        var obj = document.createElement(tag);

        if(prop){
            if(prop.id)    obj.id = prop.id;
            if(prop.src)   obj.src = prop.src;
            if(prop.href)  obj.href = prop.href;
            if(prop.class) obj.className = prop.class;
            if(prop.text)  obj.innerText = prop.text;
            if(prop.html)  obj.innerHTML = prop.html;

            if(prop.child){
                if(prop.child.constructor === Array){
                    KStyle.each(prop.child, (i) => {
                        obj.appendChild(i);
                    });
                }
                else{
                    obj.appendChild(prop.child);
                }
            }

            if(prop.attr){
                if(prop.attr.constructor === Array){
                    KStyle.each(prop.attr, (i) => {
                        obj.setAttribute(i.name, i.value);
                    });
                }
                else if(prop.attr.constructor === Object){
                    obj.setAttribute(prop.attr.name, prop.attr.value);
                }
            }

            if(prop.parent) prop.parent.appendChild(obj);
        }

        return obj;
    };

    // 选择对象
    KStyle.select = function (obj) {
        switch(typeof obj){
            case "object": return obj; break;
            case "string": return document.querySelector(obj); break;
        }
    };

    KStyle.selectAll = function (obj) {
        switch(typeof obj){
            case "object": return obj; break;
            case "string": return document.querySelectorAll(obj); break;
        }
    };

    // 清空子元素
    KStyle.empty = function (obj) {
        while(obj.firstChild){
            obj.removeChild(obj.firstChild);
        }
    }

    // 弹窗
    var notice = {
        wrap: KStyle.create("notice"),
        list: []
    };

    KStyle.notice = function (content, attr) {
        var item = KStyle.create("div", {class: "ks-notice", html: "<span class='content'>" + content + "</span>", parent: notice.wrap});

        notice.list.push(item);

        if(!document.querySelector("body > notice")) document.body.appendChild(notice.wrap);

        if(attr && attr.time){
            setTimeout(notice_remove, attr.time);
        }
        else{
            var close = KStyle.create("span", {class: "close", parent: item});

            close.onclick = notice_remove;
        }

        if(attr && attr.color){
            item.classList.add(attr.color);
        }

        function notice_remove() {
            item.classList.add("remove");
            notice.list.remove(item);

            setTimeout(function () {
                try{
                    notice.wrap.removeChild(item);
                    item = null;
                }
                catch(err) {}

                if(document.querySelector("body > notice") && notice.list.length === 0){
                    document.body.removeChild(notice.wrap);
                }
            }, 300);
        }
    };
	
	// 抄来的图片缩放
	let scale = 1
	let offset = { left: 0, top: 0 }
	let origin = 'center'
	let initialData = { offset: {}, origin: 'center', scale: 1 }
	let startPoint = { x: 0, y: 0 } // 记录初始触摸点位
	let isTouching = false // 标记是否正在移动
	let isMove = false // 正在移动中，与点击做区别
	let touches = new Map() // 触摸点数组
	let lastDistance = 0
	let lastScale = 1 // 记录下最后的缩放值
	let scaleOrigin = { x: 0, y: 0, }
	
	if(document.getElementById('post-context') !== null) {
		document.getElementById('post-context').addEventListener('click', function (e) {
			e.preventDefault()
			if (e.target instanceof Image) {
				originalEl = e.target
				cloneEl = originalEl.cloneNode(true)
				originalEl.style.opacity = 0
				openPreview()
			}
		})
	}


	const { innerWidth: winWidth, innerHeight: winHeight } = window
	let cloneEl = null
	let originalEl = null

	function openPreview() {
	  scale = 1
	  const { offsetWidth, offsetHeight } = originalEl
	  const { top, left } = originalEl.getBoundingClientRect()
	  // 创建蒙层
	  const mask = document.createElement('div')
	  mask.classList.add('modal')
	  // 添加在body下
	  document.body.appendChild(mask)
	  // 注册事件
	  mask.addEventListener("click", clickFunc)
	  mask.addEventListener('mousewheel', zoom, { passive: false })
	  registerListener()
	  // 遮罩点击事件
	  function clickFunc() {
		//setTimeout(() => {
		  if (isMove) {
			isMove = false
		  } else {
			changeStyle(cloneEl, ['transition: all .3s', `left: ${left}px`, `top: ${top}px`, `transform: translate(0,0)`, `width: ${offsetWidth}px`])
			//setTimeout(() => {
			  document.body.removeChild(this)
			  originalEl.style.opacity = 1
			  mask.removeEventListener('click', clickFunc)
			//}, 300)
			unregisterListener()
		  }
		//}, 100)
	  }
	  // 添加图片
	  changeStyle(cloneEl, [`left: ${left}px`, `top: ${top}px`, 'cursor: pointer'])
	  mask.appendChild(cloneEl)
	  // 移动图片到屏幕中心位置
	  const originalCenterPoint = { x: offsetWidth / 2 + left, y: offsetHeight / 2 + top }
	  const winCenterPoint = { x: winWidth / 2, y: winHeight / 2 }
	  const offsetDistance = { left: winCenterPoint.x - originalCenterPoint.x + left, top: winCenterPoint.y - originalCenterPoint.y + top }
	  const diffs = { left: ((adaptScale() - 1) * offsetWidth) / 2, top: ((adaptScale() - 1) * offsetHeight) / 2 }
	  changeStyle(cloneEl, ['transition: all 0.3s', `width: ${offsetWidth * adaptScale() + 'px'}`, `transform: translate(${offsetDistance.left - left - diffs.left}px, ${offsetDistance.top - top - diffs.top}px)`])
	  // 消除偏差
	  //setTimeout(() => {
		changeStyle(cloneEl, ['transition: all 0s', `left: 0`, `top: 0`, `transform: translate(${offsetDistance.left - diffs.left}px, ${offsetDistance.top - diffs.top}px)`])
		offset = { left: offsetDistance.left - diffs.left, top: offsetDistance.top - diffs.top } // 记录值
		record()
	  //}, 300)
	}

	// 滚轮缩放
	const zoom = (event) => {
	  if (!event.deltaY) {
		return
	  }
	  event.preventDefault()
	  origin = `${event.offsetX}px ${event.offsetY}px`
	  // 缩放执行
	  if (event.deltaY < 0) {
		scale += 0.1 // 放大
	  } else if (event.deltaY > 0) {
		scale >= 0.2 && (scale -= 0.1) // 缩小
	  }
	  if (scale < initialData.scale) {
		reduction()
	  }
	  offset = getOffsetCorrection(event.offsetX, event.offsetY)
	  changeStyle(cloneEl, ['transition: all .15s', `transform-origin: ${origin}`, `transform: translate(${offset.left + 'px'}, ${offset.top + 'px'}) scale(${scale})`])
	}

	// 获取中心改变的偏差
	function getOffsetCorrection(x = 0, y = 0) {
	  const touchArr = Array.from(touches)
	  if (touchArr.length === 2) {
		const start = touchArr[0][1]
		const end = touchArr[1][1]
		x = (start.offsetX + end.offsetX) / 2
		y = (start.offsetY + end.offsetY) / 2
	  }
	  origin = `${x}px ${y}px`
	  const offsetLeft = (scale - 1) * (x - scaleOrigin.x) + offset.left
	  const offsetTop = (scale - 1) * (y - scaleOrigin.y) + offset.top
	  scaleOrigin = { x, y }
	  return { left: offsetLeft, top: offsetTop }
	}
	
	function func_pointerdown(e) {
		  //e.preventDefault()
		  touches.set(e.pointerId, e) // TODO: 点击存入触摸点
		  isTouching = true
		  startPoint = { x: e.clientX, y: e.clientY }
		  if (touches.size === 2) { // TODO: 判断双指触摸，并立即记录初始数据
			lastDistance = getDistance()
			lastScale = scale
		  }
	}
	
	function func_pointerup(e) {
	  touches.delete(e.pointerId) // TODO: 抬起移除触摸点
	  if (touches.size <= 0) {
		isTouching = false
		if('ontouchstart' in document.documentElement) {
			isMove = false
		} else {
			setTimeout(() => {
				isMove = false
			}, 300);
		}
	  } else {
		const touchArr = Array.from(touches)
		// 更新点位
		startPoint = { x: touchArr[0][1].clientX, y: touchArr[0][1].clientY }
	  }
	}
	
	function func_pointermove(e){
	  e.preventDefault()
	  if (isTouching) {
		isMove = true
		if (touches.size < 2) { // 单指滑动
		  offset = {
			left: offset.left + (e.clientX - startPoint.x),
			top: offset.top + (e.clientY - startPoint.y),
		  }
		  changeStyle(cloneEl, ['transition: all 0s', `transform: translate(${offset.left + 'px'}, ${offset.top + 'px'}) scale(${scale})`, `transform-origin: ${origin}`])
		  // 更新点位
		  startPoint = { x: e.clientX, y: e.clientY }
		} else {
		  // 双指缩放
		  touches.set(e.pointerId, e)
		  const ratio = getDistance() / lastDistance
		  scale = ratio * lastScale
		  offset = getOffsetCorrection()
		  if (scale < initialData.scale) {
			reduction()
		  }
		  changeStyle(cloneEl, ['transition: all 0s', `transform: translate(${offset.left + 'px'}, ${offset.top + 'px'}) scale(${scale})`, `transform-origin: ${origin}`])
		}
	  }
	}
	
	function func_pointercancel(e) {
		  touches.clear() // 可能存在特定事件导致中断，真机操作时 pointerup 在某些边界情况下不会生效，所以需要清空
	}
		
	function registerListener(){
		// 操作事件
		window.addEventListener('pointerdown', func_pointerdown)
		window.addEventListener('pointerup', func_pointerup)
		window.addEventListener('pointermove', func_pointermove)
		window.addEventListener('pointercancel', func_pointercancel)
	}
	
	function unregisterListener(){
		// 操作事件
		window.removeEventListener('pointerdown', func_pointerdown)
		window.removeEventListener('pointerup', func_pointerup)
		window.removeEventListener('pointermove', func_pointermove)
		window.removeEventListener('pointercancel', func_pointercancel)
	}

	// 修改样式，减少回流重绘
	function changeStyle(el, arr) {
	  const original = el.style.cssText.split(';')
	  original.pop()
	  el.style.cssText = original.concat(arr).join(';') + ';'
	}

	// 计算自适应屏幕的缩放值
	function adaptScale() {
	  const { offsetWidth: w, offsetHeight: h } = originalEl
	  let scale = 0
	  scale = winWidth / w
	  if (h * scale > winHeight - 80) {
		scale = (winHeight - 80) / h
	  }
	  return scale
	}

	// 获取距离
	function getDistance() {
	  const touchArr = Array.from(touches)
	  if (touchArr.length < 2) {
		return 0
	  }
	  const start = touchArr[0][1]
	  const end = touchArr[1][1]
	  return Math.hypot(end.x - start.x, end.y - start.y)
	}

	// 记录初始化数据
	function record() {
	  initialData = Object.assign({}, { offset, origin, scale })
	}

	// 还原记录，用于边界处理
	let timer = null
	function reduction() {
	  timer && clearTimeout(timer)
	  timer = setTimeout(() => {
		offset = initialData.offset
		origin = initialData.origin
		scale = initialData.scale
		changeStyle(cloneEl, [`transform: translate(${offset.left + 'px'}, ${offset.top + 'px'}) scale(${scale})`, `transform-origin: ${origin}`])
	  }, 300)
	}
	// 抄来的图片浏览结束
	
    // AJAX
    KStyle.ajax = function (prop) {
        if(!prop.url) prop.url = document.location.href;
        if(!prop.method) prop.method = "GET";

        if(prop.method === "POST"){
            var data = new FormData();

            for(var d in prop.data){
                data.append(d, prop.data[d]);
            }
        }
        else if(prop.method === "GET"){
            var url = prop.url + "?";

            for(var d in prop.data){
                url += d + "=" + prop.data[d] + "&";
            }

            prop.url = url.substr(0, url.length - 1);
        }

        var request = new XMLHttpRequest();
        request.open(prop.method, prop.url);
        if(prop.crossDomain){ request.setRequestHeader("X-Requested-With", "XMLHttpRequest"); }

        if(prop.header){
            for(var i in prop.header){
                request.setRequestHeader(prop.header[i][0], prop.header[i][1]);
            }
        }

        request.send(data);

        request.onreadystatechange = function () {
            if(request.readyState === 4){
                if(request.status === 200 || request.status === 304){
                    if(prop.type){
                        switch(prop.type){
                            case "text": prop.success(request.responseText); break;
                            case "json": prop.success(JSON.parse(request.response)); break;
                        }
                    }
                    else{
                        prop.success ? prop.success(request) : console.log(prop.method + " 请求发送成功");
                    }
                }
                else{
                    prop.failed ? prop.failed(request) : console.log(prop.method + " 请求发送失败");
                }

                request = null;
            }
        };

        return request;
    };

    // 平滑滚动
    KStyle.scrollTo = function (el, offset) {
        el = KStyle.selectAll(el);

        el.forEach(function (t) {
            t.onclick = function (e) {
                var l = e.target.pathname;
                var c = window.location.pathname;

                var t = e.target.href.match(/#[\s\S]+/);
                if(t) t = ks.select(t[0]);

                if(c === l){
                    e.preventDefault();

                    var top = t ? (offset ? t.offsetTop - offset : t.offsetTop) : 0;

                    "scrollBehavior" in document.documentElement.style ? global.scrollTo({top: top, left: 0, behavior: "smooth"}) : global.scrollTo(0, top);
                }
                else{
                    console.log(c, l);
                }
            }
        })
    };

    global.ks = KStyle;

    console.log("%c Kico Style %c https://paugram.com ","color: #fff; margin: 1em 0; padding: 5px 0; background: #3498db;","margin: 1em 0; padding: 5px 0; background: #efefef;");
})(window);