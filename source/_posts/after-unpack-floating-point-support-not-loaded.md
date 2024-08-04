---
title: 记脱壳后运行报R6002 floating point support not loaded错误
typora-root-url: after-unpack-floating-point-support-not-loaded
date: 2024-08-04 16:00:07
tags:
- re
- vc++
- r6002
- unpack
categories: Reverse
---

# 记脱壳后运行报R6002 floating point support not loaded错误

## 问题描述

![image-20240804160803659](image-20240804160803659.png)

脱壳前程序可以正常运行，脱壳后在使用某些功能时弹出VC++的错误弹窗，描述为floating point support not loaded.

## 解决问题

先说解决方案：

将`__IsNonwritableInCurrentImage`函数的返回值设置为1

定位这个函数可以搜索特征码4D 5A，目的位置距离函数头部很近，且函数不大。大概长这样：

![image-20240804172510427](image-20240804172510427.png)

在此处下断点运行，断住后上一层调用为`__IsNonwritableInCurrentImage`函数。

## 复现

编写一段包含浮点计算的代码，易语言示例：

![image-20240804162020458](image-20240804162020458.png)

分别使用不同链接器进行链接，这里从vc6测试到vc2013，编译加壳后脱壳，得到如下文件：

![image-20240804165027277](image-20240804165027277.png)

经测试，vc8、vc9、vc2010和vc2013链接的文件脱壳后调用浮点运算都会运行时错误，vc6和vc7则不会。

### _cinit函数

#### vc6和vc7

![image-20240804165406529](image-20240804165406529.png)

vc6和vc7只判断了指向`__fpmath`的指针不为空，就会初始化`__fpmath`

#### vc8、vc9、vc2010、vc2013

![image-20240804170202019](image-20240804170202019.png)

vc8、vc9、vc2010和vc2013都判断了指向`__fpmath`的指针不为空，并且指针所在区段没有写入属性，才会执行`__fpmath`函数。

## 定位问题所在

弹窗后，在调试器中暂停，调用堆栈中定位到用户代码，逐层调用检查。

发现这里有一个退出，先跳过。EIP设置到下一条指令，随后正常单步调试。

![image-20240804174319345](image-20240804174319345.png)

继续回到上层调用。之后会来到一个较大的库函数，调用的函数由`decode_pointer`返回：

![image-20240804174615081](image-20240804174615081.png)

观察传入的参数：

![image-20240804174712920](image-20240804174712920.png)

默认的值指向`__fptrap`这个函数，也就是我们刚刚报错的函数。

检查它的交叉引用，会定位到一个名为`__cfltcvt_init`的函数，`__fpmath`函数调用了它，而`__fpmath`又被`__cinit`调用

最终看到这里的代码逻辑：

![image-20240804175111612](image-20240804175111612.png)

PS：这个运行时错误也可能会借着其他库函数报出来，不同程序在出现这个错误的时候分析过程可能与上方的不一致。

## 实例下载

[文章用到的所有文件.zip](https://wwo.lanzoub.com/iKivV26ii25c)

## 参考

[加壳对运行时库中浮点操作支持问题-加壳脱壳-看雪](https://bbs.kanxue.com/thread-198649.htm)

[程序加壳后报R6002，和浮点库相关，各位帮忙啊-加壳脱壳-看雪](https://bbs.kanxue.com/thread-122656.htm)

[脱壳后运行显示"foating point support not loaded"-加壳脱壳-看雪](https://bbs.kanxue.com/thread-87206-1.htm)

[脱upx壳踩的一些坑 - bodong - 博客园](https://www.cnblogs.com/bodong/p/16474385.html)

## 拓展资料

非本文原因导致的该错误：[R6002- floating point support not loaded问题的一种解决方法](https://www.52pojie.cn/thread-1459539-1-1.html)

利用初始化浮点支持机制出的题：[[结束\][第一阶段◇第三题]看雪论坛.腾讯公司2008软件安全技术竞赛-4)腾讯公司2008软件安全竞赛-看雪](https://bbs.kanxue.com/thread-74200.htm)
