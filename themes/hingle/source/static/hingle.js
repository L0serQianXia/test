/* ----

# Hingle Theme
# By: Dreamer-Paul
# Last Update: 2021.10.25

一个简洁大气，含夜间模式的 Hexo 博客模板。

本代码为奇趣保罗原创，并遵守 MIT 开源协议。欢迎访问我的博客：https://paugram.com

---- */

var Paul_Hingle = function (config) {
    var body = document.body;
    var content = ks.select(".post-content:not(.is-special), .page-content:not(.is-special)");

    // 菜单按钮
    this.header = function () {
        var menu = document.getElementsByClassName("head-menu")[0];

        ks.select(".toggle-btn").onclick = function () {
            menu.classList.toggle("active");
        };

        ks.select(".light-btn").onclick = this.night;

        var search = document.getElementsByClassName("search-btn")[0];
        var bar = document.getElementsByClassName("head-search")[0];

        search.addEventListener("click", function () {
            bar.classList.toggle("active");
        })
    };

    // 关灯切换
    this.night = function () {
        if(body.classList.contains("dark-theme")){
            body.classList.remove("dark-theme");
            document.cookie = "night=false;" + "path=/;" + "max-age=21600";
        }
        else{
            body.classList.add("dark-theme");
            document.cookie = "night=true;" + "path=/;" + "max-age=21600";
        }
    };

    // 目录树
    this.tree = function () {
        var id = 1;
        var wrap = ks.select(".wrap");
        var headings = content.querySelectorAll("h1, h2, h3, h4, h5, h6");

        if(headings.length > 0){
            body.classList.add("has-trees");

            var trees = ks.create("section", {
                class: "article-list",
                html: "<h4><span class=\"title\">目录</span></h4>"
            });

            ks.each(headings, function (t) {
                var cls, text = t.innerText;

                t.id = "title-" + id;

                switch (t.tagName){
                    case "H2": cls = "item-2"; break;
                    case "H3": cls = "item-3"; break;
                    case "H4": cls = "item-4"; break;
                    case "H5": cls = "item-5"; break;
                    case "H6": cls = "item-6"; break;
                }

                trees.appendChild(ks.create("a", {class: cls, text: text, href: "#title-" + id}));

                id++;
            });

            wrap.appendChild(trees);

            function toggle_tree() {
                var buttons = ks.select("footer .buttons");
                var btn = ks.create("a", {class: "toggle-list"});
                buttons.appendChild(btn);

                btn.addEventListener("click", function () {
                    trees.classList.toggle("active");
                })
            }
            toggle_tree();
        }
    };

    // 自动添加外链
    this.links = function () {
        var l = content.getElementsByTagName("a");

        if(l){
            ks.each(l, function (t) {
                t.target = "_blank";
            });
        }
    };

    this.comment_list = function () {
        ks(".comment-content [href^='#comment']").each(function (t) {
            var item = ks.select(t.getAttribute("href"));

            t.onmouseover = function () {
                item.classList.add("active");
            };

            t.onmouseout = function () {
                item.classList.remove("active");
            };
        });
    };

    // 返回页首
    this.to_top = function () {
        var btn = document.getElementsByClassName("to-top")[0];
        var scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

        scroll >= window.innerHeight / 2 ? btn.classList.add("active") : btn.classList.remove("active");
    };

    this.header();

    if(content){
        this.tree();
        this.links();
        this.comment_list();
    }

    // 返回页首
    window.addEventListener("scroll", this.to_top);

    // 如果开启自动夜间模式
    if(config.night){
        var hour = new Date().getHours();

        if(document.cookie.indexOf("night") === -1 && (hour <= 5 || hour >= 22)){
            document.body.classList.add("dark-theme");
            document.cookie = "night=true;" + "path=/;" + "max-age=21600";
        }
    }
    else if(document.cookie.indexOf("night") !== -1){
        if(document.cookie.indexOf("night=true") !== -1){
            document.body.classList.add("dark-theme");
        }
        else{
            document.body.classList.remove("dark-theme");
        }
    }

    // 如果开启复制内容提示
    if(config.copyright){
        document.oncopy = function () {
            ks.notice("复制内容请注明来源并保留版权信息！", {color: "yellow", overlay: true})
        };
    }

    //
    // ! Hexo 特别功能
    //

    // Hexo 百度搜索
    this.hexo_search = function () {
        var form = ks.select(".head-search"), input = ks.select(".head-search input");

        form.onsubmit = function (ev) {
            ev.preventDefault();

            window.open("https://www.baidu.com/s?wd=site:" + location.host + " " + input.value.trim());
        }        
    }

    this.hexo_search();
};

// 请保留版权说明
if(window.console && window.console.log){
    console.log("%c Hingle %c https://paugram.com ","color: #fff; margin: 1em 0; padding: 5px 0; background: #6f9fc7;","margin: 1em 0; padding: 5px 0; background: #efefef;");
}

// 奇奇怪怪的蜘蛛网背景 有点晃眼不要了
// !function () {
//     function n(n, e, t) {
//         return n.getAttribute(e) || t
//     }
//  
//     function e(n) {
//         return document.getElementsByTagName(n)
//     }
//  
//     function t() {
//         var t = e("script"), o = t.length, i = t[o - 1];
//         return {l: o, z: n(i, "zIndex", -1), o: n(i, "opacity", .5), c: n(i, "color", "0,0,0"), n: n(i, "count", 99)}
//     }
//  
//     function o() {
//         a = m.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth, c = m.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
//     }
//  
//     function i() {
//         r.clearRect(0, 0, a, c);
//         var n, e, t, o, m, l;
//         s.forEach(function (i, x) {
//             for (i.x += i.xa, i.y += i.ya, i.xa *= i.x > a || i.x < 0 ? -1 : 1, i.ya *= i.y > c || i.y < 0 ? -1 : 1, r.fillRect(i.x - .5, i.y - .5, 1, 1), e = x + 1; e < u.length; e++) n = u[e], null !== n.x && null !== n.y && (o = i.x - n.x, m = i.y - n.y, l = o * o + m * m, l < n.max && (n === y && l >= n.max / 2 && (i.x -= .03 * o, i.y -= .03 * m), t = (n.max - l) / n.max, r.beginPath(), r.lineWidth = t / 2, r.strokeStyle = "rgba(" + d.c + "," + (t + .2) + ")", r.moveTo(i.x, i.y), r.lineTo(n.x, n.y), r.stroke()))
//         }), x(i)
//     }
//  
//     var a, c, u, m = document.createElement("canvas"), d = t(), l = "c_n" + d.l, r = m.getContext("2d"),
//         x = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (n) {
//             window.setTimeout(n, 1e3 / 45)
//         }, w = Math.random, y = {x: null, y: null, max: 2e4};
//     m.id = l, m.style.cssText = "position:fixed;top:0;left:0;z-index:" + d.z + ";opacity:" + d.o, e("body")[0].appendChild(m), o(), window.onresize = o, window.onmousemove = function (n) {
//         n = n || window.event, y.x = n.clientX, y.y = n.clientY
//     }, window.onmouseout = function () {
//         y.x = null, y.y = null
//     };
//     for (var s = [], f = 0; d.n > f; f++) {
//         var h = w() * a, g = w() * c, v = 2 * w() - 1, p = 2 * w() - 1;
//         s.push({x: h, y: g, xa: v, ya: p, max: 6e3})
//     }
//     u = s.concat([y]), setTimeout(function () {
//         i()
//     }, 100)
// }();

// 奇怪的点击效果
 (function () {
	var a_idx = 0;
	window.onclick = function (event) {
		var a = new Array("1", "e", "L", "A", "7", "8", "r", "H", "s", "s", "q", "1", "s", "A", "=", "=");

		var heart = document.createElement("b"); //创建b元素
		heart.onselectstart = new Function('event.returnValue=false'); //防止拖动

		document.body.appendChild(heart).innerHTML = a[a_idx]; //将b元素添加到页面上
		a_idx = (a_idx + 1) % a.length;
		heart.style.cssText = "position: fixed;left:-100%;"; //给p元素设置样式

		var f = 16, // 字体大小
			x = event.clientX - f / 2, // 横坐标
			y = event.clientY - f, // 纵坐标
			c = randomColor(), // 随机颜色
			a = 1, // 透明度
			s = 1.2; // 放大缩小

		var timer = setInterval(function () { //添加定时器
			if (a <= 0) {
				document.body.removeChild(heart);
				clearInterval(timer);
			} else {
				heart.style.cssText = "font-size:16px;cursor: default;position: fixed;color:" +
					c + ";left:" + x + "px;top:" + y + "px;opacity:" + a + ";transform:scale(" +
					s + ");";

				y--;
				a -= 0.016;
				s += 0.002;
			}
		}, 15)

	}
	// 随机颜色
	function randomColor() {

		return "rgb(" + (~~(Math.random() * 255)) + "," + (~~(Math.random() * 255)) + "," + (~~(Math
		.random() * 255)) + ")";

	}
}());
