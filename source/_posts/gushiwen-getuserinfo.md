---
title: 绕过古诗文网播放朗读时的登录
typora-root-url: gushiwen-getuserinfo
date: 2024-06-27 22:59:16
tags:
categories:
---

# 绕过古诗文网播放朗读时的登录

## 前言

上一篇：[展开译文时，绕过古诗文网的登录](/blog/2024/04/05/gushiwen-fanyishow/)

上一篇已经绕过了展开译文的登录，本篇是在上一篇基础上继续绕过播放朗读时要求的登录，需要先按照上一篇操作后进行本文的操作，否则不能成功绕过。

这里绕过登录不止适用于播放朗读，还适用于展开文章拼音。

## 绕过朗读时的播放

### 尝试绕过

以《石钟山记》为例，当点击原文下方的播放按钮时，会跳转到一个登录界面。

在开发者工具中定位到跳转地址，可以看到指向JavaScript的一个函数：

![image-20240627230549552](image-20240627230549552.png)

搜索一下，发现`skinso20240229.js`文件中有该函数

![image-20240627230948024](image-20240627230948024.png)

转到文件，可以看到1072行有跳转网页的代码：

![image-20240627231052893](image-20240627231052893.png)

但跳转条件是返回文本为“未登录”，是否说明如果没有登录网站就不会返回音频资源？

幸运的是，跳转了之后NDM仍探测到了MP3资源，说明服务器并未做校验，而是返回了音频资源，那为什么仍会跳转？

![image-20240627231641945](image-20240627231641945.png)

在函数首下断点，发现不会被断下。

怀疑不是这里导致的跳转，全局搜索跳转目的地址：`/user/login.aspx`

![image-20240627231233985](image-20240627231233985.png)

可以看到在另一个名为`listenerPlay,js`的文件中还存在跳转，在这三处引用都下断点。

重新点击播放按钮，发现已经被断住：

![image-20240627231401611](image-20240627231401611.png)

说明这里才是跳转代码，根据调用堆栈定位上层函数：

![image-20240627231502721](image-20240627231502721.png)

发现该函数的返回值与另一个函数的返回值共同决定了下面的弹窗代码，而该函数似乎没有影响其他值，那么就尝试重定义一下该函数。

刷新页面，在控制台中输入以下内容：

```javascript
getUserInfo = function(){return true;}
```

点击播放按钮，发现已经可以播放：

![image-20240627232543470](image-20240627232543470.png)

### 完全绕过了吗？

在我们多次播放后（>10次），网页弹出了一个开通会员窗口。

![image-20240627232615819](image-20240627232615819.png)

伴随着每次调试输出的播放次数，在第11次播放时弹出了支付窗口。

如果仔细查看了`getUserInfo`上层调用的代码，可以看到该函数和`getPlayShowPay`函数共同决定了一个条件判断的走向，如果满足条件就会弹窗：

![image-20240627233056045](image-20240627233056045.png)

根据“/pay/userPay.aspx”推测这里弹出的是支付页面，而条件是`getUserInfo`函数返回真，`getPlayShowPay`函数返回假才会弹出支付。

我们尝试重定义`getUserInfo`函数，使其返回假：

```javascript
getUserInfo = function(){return false;}
```

可见，由于第一个条件不满足，第二个条件不再执行，就已经不再输出播放次数，也不会弹出支付窗口：

![image-20240627233418533](image-20240627233418533.png)

## 油猴脚本

根据本文内容，对上一篇的油猴脚本做出修改，如下：

```javascript
// ==UserScript==
// @name         绕过古诗文网登录展开译文
// @namespace    https://l0serqianxia.github.io/blog/
// @version      2024-06-27
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
    getUserInfo = function(){return false;}
})();
```

（完）
