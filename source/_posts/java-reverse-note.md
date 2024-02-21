---
title: Java逆向笔记
typora-root-url: java-reverse-note
date: 2099-02-21 16:52:23
tags: Java
categories: Reverse
---

# Java逆向笔记

## 概述

Java作为一门跨平台的语言，需要将源码编译为类（class）文件后在Java虚拟机上运行。

反编译 (Decompile)，是一个与编译 (Compile) 相对的过程，即将已编译的程序还原到未编译的状态。该技术多用于Java、C#这种编译后产生中间指令的程序设计语言所创建的程序。

在Java中可用CFR、FernFlower、Jad等工具实现Java代码的反编译，这些工具具有将JVM字节码转换为Java伪代码的能力，以提高理解字节码的效率。

同时要注意的是，即使在Java这类编译产生中间指令的语言，反编译的伪代码也并不是总是准确的，它们在某些经过混淆的情况下，可能会存在输出的反编译代码存在逻辑错误的问题。

## 工具

### Java反编译引擎：

CFR（[http://www.benf.org/other/cfr/](http://www.benf.org/other/cfr/)）

FernFlower（[https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine](https://github.com/JetBrains/intellij-community/tree/master/plugins/java-decompiler/engine)）

……

### 集成式的逆向工具：

Recaf: [The modern Java bytecode editor](https://github.com/Col-E/Recaf)

Jadx: [Dex to Java decompiler](https://github.com/skylot/jadx)

Bytecode Viewer: [A Java 8+ Jar & Android APK Reverse Engineering Suite (Decompiler, Editor, Debugger & More)](https://github.com/Konloch/bytecode-viewer)
