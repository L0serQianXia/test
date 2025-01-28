---
title: 分析一个Jenxcus vbe蠕虫病毒样本
typora-root-url: decode-a-vbe-file
date: 2025-01-28 16:28:50
tags:
- reverse
- vbe
- malware
- vbscript
- usb-worm
- autorun
- remote-control
- hex-decoding
- base64-decoding
- static-analysis
- jenxcus
categories: Reverse
---

# 分析一个Jenxcus vbe蠕虫病毒样本

## 前言

样本来源：[U盘病毒angry birds.vbe - 吾爱破解 - 52pojie.cn](https://www.52pojie.cn/forum.php?mod=viewthread&tid=814827)

## 行为分析

观察到移动到启动目录，并添加注册表自启：

![image-20250128160102422](image-20250128160102422.png)

![image-20250128160111186](image-20250128160111186.png)

启动了移动后的脚本（PID：12176），当前脚本进程退出（PID8340：ProcessExit）：

![image-20250128160247758](image-20250128160247758.png)

新的脚本进程有持续的网络行为：

![image-20250128160325166](image-20250128160325166.png)

插入U盘，发现感染U盘的迹象：

![image-20250128160717875](image-20250128160717875.png)

## 静态分析

### 解除加密

打开发现脚本不可读，从0接触到一个混淆的vbe文件，当然是在网络搜索vbe混淆，找到[VBS强力加密工具(直接加密成乱码)](https://www.52pojie.cn/thread-147071-1-1.html)

根据帖子中的效果图，发现加密后代码有相似处：

![image-20250128150323452](image-20250128150323452-1738051658609-3.png)

帖子中的加密脚本：

```vb
 '本工具用于加密vbs的脚本
 '采用ASCII,hex+xor,Encoder 三重加密。
 '第三重Encoder加密后，只能使用VBE后缀。
 'VBS不支持Encoder编码。
 ' 1.0 比较合适新人加密解密练习用
 ' 1.1 修复了网友Yu2n测试中发现的BUG
 '****************************************************
 'Version: 1.1
 'Date : 2012-05-02
 'Author:乱码
 '源码献上，欢迎翻版，写出更加强力的加密。
 '****************************************************
 Set argv = WScript.Arguments
 If argv.Count = 0 Then
     MsgBox "请把要加密的文件拖到我身上！", 64+4096, "乱码领域"
     WScript.Quit
 End If
 
 Set fso = CreateObject("Scripting.FileSystemObject")
 Randomize
 pass = Int(Rnd*12)+20 '异或加密有效范围20-31，所以随机生成好了。
 data = fso.OpenTextFile(argv(0), 1).ReadAll
 data = "d=" & Chr(34) & ASCdata(data) & Chr(34)
 data = data & vbCrLf & ":M=Split(D):For each O in M:N=N&chr(O):Next:execute N"
 data = Replace(data, " ", ",")
 fso.OpenTextFile(argv(0) & "_加密.vbe", 2, True).Write Encoder(EncHexXorData(data))
 MsgBox "加密完毕,文件生成到：" & vbCrLf & vbCrLf & argv(0) & "_加密.vbs", 64+4096, "乱码领域VBS加密"
 
 Function EncHexXorData(data)
     EncHexXorData = "x=""" & EncHexXor(data) & """:For i=1 to Len(x) Step 2:s=s&Chr(CLng(""&H""&Mid(x,i,2)) Xor " & pass & "):Next:Execute Replace(s,"","","" "")"
 End Function
 
 Function Encoder(data) '加密3
     Encoder = CreateObject("Scripting.Encoder").EncodeScriptFile(".vbs", data, 0, "VBScript")
 End Function
 
 Function EncHexXor(x) '加密2
     For i = 1 To Len(x)
         EncHexXor = EncHexXor & Hex(Asc(Mid(x, i, 1)) Xor pass)
     Next
 End Function
 
 Function ASCdata(Data) '加密1
     num = Len(data)
     newdata = ""
     For j = 1 To num
         If j = num Then
             newdata = newdata&Asc(Mid(data, j, 1))
         Else
             newdata = newdata&Asc(Mid(data, j, 1)) & " "
         End If
     Next
     ASCdata = newdata
 End Function
```

（来源：[VBS强力加密工具(直接加密成乱码)](https://www.52pojie.cn/thread-147071-1-1.html)）

观察上方加密脚本代码发现，最外层使用了`Scripting.Encoder`的`EncodeScriptFile`

在网上搜索资料，得到微软曾发布过的解码脚本：[TechNet Encode and Decode a VB script](https://web.archive.org/web/20200318064315/https://gallery.technet.microsoft.com/Encode-and-Decode-a-VB-a480d74c)

直接拖入发现报错：

![image-20250128150649671](image-20250128150649671-1738051658610-4.png)

脚本前方还有垃圾内容，将第一行的内容删掉后保存，重新拖入

处理完成后在同目录下生成一个同名称但.vbs后缀的文件，该文件为解码后文件

![image-20250128150819687](image-20250128150819687-1738051658610-5.png)

打开看到混淆器的水印，下面是大段加密代码。

![image-20250128150929094](image-20250128150929094-1738051658610-7.png)

![image-20250128150920201](image-20250128150920201-1738051658610-6.png)

观察可知，上方代码进行了hex解码和base64解码，CyberChef中执行：

![a](image-20250128151034348.png)

### 分析

#### 持久化

首先，初次运行判断是否通过U盘感染了该设备，并写在注册表中：

![image-20250128161209273](image-20250128161209273.png)

添加自启，并判断当前运行目录与系统中持久化目录是否相同，如果不相同，则运行持久化目录中的脚本。

持久化目录为%userprofile%，如果获取不成功则使用%temp%

![image-20250128162044231](image-20250128162044231.png)

#### 检测U盘

随后进入一个5s一次的循环中，循环检测是否有新接入的可移动设备，如果有，则将自身复制到根目录，并设置隐藏和系统属性。随后将其中根目录下所有文件隐藏，并创建快捷方式，指向原文件或原目录。运行快捷方式的同时会运行蠕虫病毒：

![image-20250128161411924](image-20250128161411924.png)

#### 远控

循环体中的远控部分，指令包括远程执行命令、远程更新脚本、信息获取等：

![image-20250128161446274](image-20250128161446274.png)

#### 信息获取

请求中包含用户信息：

![image-20250128161548495](image-20250128161548495.png)

## 样本IoC

| SHA256                                                       |
| ------------------------------------------------------------ |
| aeda9949e5563e09fbd67945d6adfd746b0af9462c3e012f4326c98501190fc3 |

## 总结

病毒会将自身移动到启动目录，并添加注册表以实现自启动。启动后，原始脚本进程退出，新的脚本进程会持续进行网络活动。插入U盘后，病毒会感染U盘，并在U盘中创建隐藏的快捷方式，指向病毒文件。

病毒会判断是否通过U盘感染设备，并写入注册表。病毒还会添加自启动项，并检测是否有新接入的可移动设备。如果有，病毒会将自身复制到U盘根目录，并隐藏文件。此外，病毒还包含远程控制功能，能够执行远程命令、更新脚本和获取用户信息等。

（完）