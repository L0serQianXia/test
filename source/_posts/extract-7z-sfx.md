---
title: 解包7z自解压文件
typora-root-url: extract-7z-sfx
date: 2099-05-04 00:55:07
tags: 
- re
- 7z
categories: Misc
---

# 解包7z自解压文件

## 前言

有时，我们会遇到7z SFX文件，这样的文件使用ExeInfoPE扫描后得到如图结果：

![image-20240504194253840](/image-20240504194253840.png)

![image-20240504194306410](/image-20240504194306410.png)

两张图片都提示是SFX文件，但两个文件略有不同，第一个图片中的文件，使用了[olegscherbakov.github.io](https://olegscherbakov.github.io/7zSFX/)的制作工具，而第二个文件则使用了7z原生的制作



https://olegscherbakov.github.io/7zSFX/files/7z_splitter_1017.7z
