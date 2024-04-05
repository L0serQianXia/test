---
title: 展开译文时，绕过古诗文网的登录
typora-root-url: gushiwen-fanyishow
date: 2024-04-05 23:00:19
tags:
- re
- web
- 古诗文网
categories: Misc
---

# 绕过古诗文网的登录

以《庖丁解牛》为例，翻到下面的“展开阅读全文”时跳转到登录页面

![image-20240405220839426](image-20240405220839426.png)

跳转页面如下图：

![image-20240405220942496](image-20240405220942496.png)

## 登录绕过

F12打开开发者工具，定位到展开的按钮，注意到调用了函数`fanyiShow`

![image-20240405221044996](image-20240405221044996.png)

搜索fanyiShow

![image-20240405221131209](image-20240405221131209.png)

发现js中的代码

![image-20240405221207953](image-20240405221207953.png)

首先判断了Cookie中是否存在`gsw2017user`的值，如果不存在会跳转到登录

那么就尝试设置一下这个Cookie

![image-20240405221415062](image-20240405221415062.png)

在控制台中输入

```javascript
setCookie('gsw2017user', 'QianXia')
```

回车之后返回到页面，单击展开按钮发现已经可以显示内容

![image-20240405221632260](image-20240405221632260.png)

## 公众号二维码图片绕过

但显而易见的，会覆盖一个扫码关注微信号的提示

定位一下这个元素

![image-20240405221742654](image-20240405221742654.png)

搜索它的id：`threeWeixin2`

![image-20240405223129386](image-20240405223129386.png)

主要看一下fadeIn处的代码就可以

![image-20240405223234284](image-20240405223234284.png)

判断条件是`gsw2017user`为null，`login`不为null，还有一个`erweimaShow`的值需要为0才会显示这个二维码

![image-20240405223345602](image-20240405223345602.png)

这里通过设置单击事件，调用`showErweima`（显示二维码的函数）的

这个`gsw2017user`变量的值是getCookie得来的，这里的代码在我们设置Cookie之前执行，所以它获取到的值为null，这个跳转才会进入

那么这里思路就比较多，比如设置一下`gsw2017user`的值，或者改一下`erweimaShow`的值，再或者修改`tickerStr`的值等等

我这里就在控制台中设置了一下`erweimaShow`的值，将其修改为1，然后单击就不会弹出这个二维码图片了

```javascript
erweimaShow = 1
```

![image-20240405224038435](image-20240405224038435.png)

## 油猴脚本

```javascript
// ==UserScript==
// @name         绕过古诗文网登录展开译文
// @namespace    https://l0serqianxia.github.io/blog/
// @version      2024-04-05
// @description  绕过古诗文网登录，显示译文等内容
// @author       QianXia
// @match        https://so.gushiwen.cn/shiwenv_*.aspx
// @icon         https://so.gushiwen.cn/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    document.cookie = 'gsw2017user=QianXia'
    erweimaShow = 1
})();
```

（完）
