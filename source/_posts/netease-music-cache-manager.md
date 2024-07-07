---
title: 网易云音乐缓存管理器，提取并解密缓存文件，获得MP3格式音乐文件
typora-root-url: netease-music-cache-manager
date: 2024-07-07 23:59:42
tags:
- C#
- Coding
- Reverse
- Re
- CloudMusic
- Cache
- Xor
- Decrypt
categories:
- Reverse
---

# 网易云音乐缓存文件提取并解密

## 文章更新

| 更新时间             | 更新内容                                |
| -------------------- | --------------------------------------- |
| 2024年7月7日23:59:42 | 文章发布，NeteaseMusicCacheManager v1.0 |

## 成品

成品下载：[NeteaseMusicCacheManager v1.0.exe](https://wwo.lanzoub.com/iqEki23tzvlc)

![image-20240707234901588](image-20240707234901588.png)

## 前言

演示版本较低，新版理论通用

![image-20240707221305372](image-20240707221305372.png)

## 缓存文件路径

### 原理

行为监控排除后，可以观察到一个名为cache_path的文件

![image-20240707231629641](image-20240707231629641.png)

虽然网易云音乐没有从其中读取数据，但它却将缓存路径写入其中

![image-20240707231731395](image-20240707231731395.png)

这里的路径为`C:\Users\QianXia\AppData\Local\NetEase\CloudMusic\Cache\Cache`

也可通过网易云音乐中的设置获取及修改。

### 相关代码

![image-20240707233909063](image-20240707233909063.png)

这里读取了cache_path文件，获取了缓存目录。

需要注意的是，读取文本时编码为Unicode。

## 缓存文件

### 解密

#### 原理

在网易云音乐中播放一首歌曲后，可观察到类似下方的文件

![image-20240707232254999](image-20240707232254999.png)

其中占用空间最大的就该是音乐文件，实际并不可播放，网易云音乐对此进行了加密

使用十六进制编辑器可观察到大量`0xA3`字节：

![image-20240707232420497](image-20240707232420497.png)

可考虑是异或加密，尝试用0xA3字节与文件中每个字节异或

![image-20240707232545384](image-20240707232545384.png)

010 Editor中菜单栏Tools->Hex Operations->Binary Xor...

![image-20240707232629257](image-20240707232629257.png)

选择Unsigned Byte，操作数填入A3，格式选择Hex，并单击OK

![image-20240707232709546](image-20240707232709546.png)

可观察到出现了MP3的文件头，保存并修改后缀为MP3即可播放

![image-20240707232826361](image-20240707232826361.png)

#### 相关代码

![image-20240707234029983](image-20240707234029983.png)

这里主要将整个文件逐字节与0xA3异或，获得解密后文件，并写出。

### 缓存文件名

以上小节的文件名为例，缓存文件名为“1399616170-320-bbabdf90bfa0b25de0a0209eb9f90317.uc”，中间使用“-”分隔，分隔后为

- 1399616170
- 320
- bbabdf90bfa0b25de0a0209eb9f90317

根据长度、组成字符和工具检测信息等可推测，第一串数字为歌曲ID，第二串数字为码率，第三串是歌曲的MD5校验值

![image-20240707233241385](image-20240707233241385.png)

![image-20240707233414795](image-20240707233414795.png)

- 1399616170——歌曲ID
- 320——码率
- bbabdf90bfa0b25de0a0209eb9f90317——MD5校验值

## 歌曲信息获取

缓存文件中并不包含歌曲名称、歌曲作者等内容，可利用文件名中的歌曲ID作为参数，提供给网易云音乐相关的API获取歌曲信息。

## 相关项目

完整代码可见GitHub链接：[网易云音乐缓存管理器](https://github.com/L0serQianXia/NeteaseMusicCacheManager)

成品下载：[NeteaseMusicCacheManager v1.0.exe](https://wwo.lanzoub.com/iqEki23tzvlc)

基于.NET Framework 4.5，播放按钮调用的是系统关联的音乐播放器，获取按钮会扫描缓存路径下所有后缀名为.uc的文件，并通过网易云音乐相关API获取音乐信息。

![image-20240707235122013](image-20240707235122013.png)

![image-20240707235228771](image-20240707235228771.png)

![image-20240707235250173](image-20240707235250173.png)

## 参考资料

[基本的异或加密 · 逆向工程入门指南 (gitbooks.io)](https://wizardforcel.gitbooks.io/re-for-beginners/content/Part-IX/Chapter-84.html)

[网易云音乐缓存文件解密](https://www.52pojie.cn/thread-1556228-1-4.html)

（完）
