---
title: 分析希沃白板5.2.4启动图片所在路径
typora-root-url: seewo-startup-banner
date: 2024-06-30 18:29:29
tags: 
- re
- Reverse
- Seewo
categories: Misc
---

# 分析希沃白板5.2.4启动图片所在路径

## 前言

版本是5.2.4.8086

![image-20240630170415297](image-20240630170415297.png)

出于学习目的，仅供娱乐。

## 启动观察

按照网络上的方法，替换`C:\Program Files (x86)\Seewo\EasiNote5\EasiNote5_5.2.4.8086\Main\Resources\Startup\SplashScreen.png`的图片，运行希沃白板，启动界面如下：

![image-20240630171633502](image-20240630171633502.png)

可以发现没有效果。

但如果我们仔细观察，发现下方的版权声明部分日期不一样（下图为SplashScreen.png）：

![image-20240630171849150](image-20240630171849150.png)

推测希沃白板的启动已经不使用这张图片了

## 文件监控

先考虑仍从文件中加载图片的情况，完全退出希沃白板进程后，使用进程监控工具监控启动时读取的文件，可以注意到一条路径为.png结尾的文件的监控条目：

![image-20240630172216745](image-20240630172216745.png)

推测这是新的启动图片路径，使用自己的图片替换掉这张图片，再次启动，观察启动图片已被替换：

![image-20240630172342382](image-20240630172342382.png)

所以启动图片路径为`%APPDATA%\Seewo\EasiNote5\Resources\Banner\Banner.png`

知道了启动图片路径后，可尝试根据名称搜索相关代码，可观察到，如果Banner.png存在，就优先使用Banner.png作为启动图片，否则使用SplashScreen.png：

![image-20240630174230231](image-20240630174230231.png)

## 自动恢复的情况

有时会发现希沃白板的启动图片又被修改回原始图片（不讨论重启系统恢复）

### 出现情况

目前测试是在登录账号页面（下图）出现前会恢复启动图片，以白板模式启动（加参数`-m Display -iwb`）未发现会自动恢复图片：

![image-20240630180810293](image-20240630180810293.png)

### 行为监控

利用进程行为监控软件，可以观察到对Banner.png有删除的行为，和对一个tmp文件的重命名行为：

![image-20240630175721715](image-20240630175721715.png)

可以看到这里将.tmp文件重命名为了Banner.png

![image-20240630175730023](image-20240630175730023.png)

实际上上图行为列表中过滤了网络行为，如果取消筛选是可以看到存在下载的。.tmp文件即为下载的原始启动图片文件。

### 分析

可以在另一个dll中搜索到字符串`Banner.png`，是一个名为`DownloadBanner`的方法，一路跟随到一个Task，其中有校验本地Banner.png的逻辑，与服务器上的哈希值比较，判断是否应该删除本地并下载服务器的Banner.png，如下图：

![image-20240630182402143](image-20240630182402143.png)

网络获取信息如下：

![image-20240630182556344](image-20240630182556344.png)

### 如何解决？

最简单的方式当然是将Banner.png设置为只读。不讨论修改希沃白板本身的情况。

## 结论

提供两种可能的方案供参考：

- 替换`%APPDATA%\Seewo\EasiNote5\Resources\Banner\Banner.png`并将其属性设置为只读
- 如果使用参数启动（`-m Display -iwb`）可以替换`C:\Program Files (x86)\Seewo\EasiNote5\EasiNote5_5.2.4.8086\Main\Resources\Startup\SplashScreen.png`并删除`%APPDATA%\Seewo\EasiNote5\Resources\Banner\Banner.png`（未测试长期稳定性）

（完）
