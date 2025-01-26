---
title: 去除KineStop Pro的主题限制
typora-root-url: kinestop-pro-crack
date: 2025-01-26 20:01:16
tags:
- reverse
- android
- kinestop
categories: Reverse
---

# 去除KineStop Pro的主题限制

水一篇博客

## 去除主题限制

主要限制：只能使用默认主题。使用其他主题如图：

<img src="qq_pic_merged_1737893124724.jpg" alt="qq_pic_merged_1737893124724" style="zoom: 33%;" />

弹出购买提示，并且在几秒钟后切换到默认主题。

使用jadx打开，搜索框中勾选资源，搜索相关关键词：

![image-20250126200458149](image-20250126200458149.png)

发现该提示处，勾选代码，搜索`go_pro_justification`，转到`com.urbandroid.kinestop.MainActivity.showThemeDialog$lambda$28`，下图处：

![image-20250126201729318](image-20250126201729318.png)

发现这里通过`isTrail`方法判断了是否弹出该提示，如果`isTrail`返回false则不会弹出提示，所以只需要直接让`isTrail`方法返回false即可。

转到`com.urbandroid.kinestop.KineService$Companion.isTrial`处，使其直接返回0，如图所示：

<img src="Screenshot_20250126_202251.jpg" alt="Screenshot_20250126_202251" style="zoom: 33%;" />

完成后保存重打包签名即可，完成后限制已经解除：

<img src="qq_pic_merged_1737894265393.jpg" alt="qq_pic_merged_1737894265393" style="zoom:33%;" />

（完）
