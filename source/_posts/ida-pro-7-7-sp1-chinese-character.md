---
title: IDA Pro7.7 SP1反编译窗口显示中文字符
typora-root-url: ida-pro-7-7-sp1-chinese-character
date: 2024-04-27 20:39:32
tags: 
- IDA
- Reverse
- re
categories:
- Reverse
---
# IDA Pro 7.7.220118 (SP1)中文函数名设置及显示的相关问题

IDA来自[IDA Pro 7.7.220118 (SP1) 全插件绿色版](https://www.52pojie.cn/thread-1584115-1-1.html)

参考[IDA7.5支持中文函数命名的办法](https://www.52pojie.cn/thread-1414525-1-1.html)针对IDA7.7做出修改

首先参考上面文章中提到的方法允许中文字符的设置，然后修改ida64.dll和ida.dll以解决其将中文字符替换为下划线的问题，修改方法都在上面的文章里，这里就不再贴了。

## 修改后效果

![image-20240427205920781](image-20240427205920781.png)

## 修改内容

### ida64.dll


| Address          | Length | Original bytes | Patched bytes |      |
| ---------------- | ------ | -------------- | :------------ | ---- |
| 00000001001A61BC | 0x3    | C6 03 5F       | 90 90 90      |      |

### ida.dll

| Address          | Length | Original bytes | Patched bytes |      |
| ---------------- | ------ | -------------- | :------------ | ---- |
| 000000010019F2BC | 0x3    | C6 03 5F       | 90 90 90      |      |

## 修改后文件

下载：[https://www.lanzoub.com/ihq2d1wqgz3e](https://www.lanzoub.com/ihq2d1wqgz3e) 

密码：fxyq
