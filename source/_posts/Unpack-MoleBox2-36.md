---
title: 手脱MoleBox2.36的学习
typora-root-url: Unpack-MoleBox2-36
date: 2024-02-18 20:47:03
tags: unpack
categories: Reverse
---

网上已经有许多资料研究MoleBox这个壳，这里同样记录一下研究这个壳的过程

![image-20240218004859005](image-20240218004859005.png)

## OEP

找到OEP并不困难，ESP定律即可

![image-20240218013839364](image-20240218013839364.png)

在pushad后栈顶下硬件访问断点，之后运行停在`004BBA0E`

![image-20240218013922858](image-20240218013922858.png)

此处的eax即为OEP

![image-20240218013943590](image-20240218013943590.png)

![image-20240218014027564](image-20240218014027564.png)

## 修复IAT

来到原始入口点尝试修复IAT，发现有许多无效的指针

![image-20240218010758073](image-20240218010758073.png)

这些是壳对IAT的加密，可以在调试器中找第一个无效的指针下断点

这里在`0047D174`（rva:0007D174）下硬件写入断点然后重新运行程序

运行几次会在无关的地点断住

![image-20240218010409132](image-20240218010409132.png)

可以看到这里周围还没有有效的地址指针，这里还不是解密IAT的地方

直到运行到`0404BAE`处，这里对[edi]写入后被硬件断点断住

![image-20240218010924224](image-20240218010924224.png)

这里我们看到写入的值是有效的指针，我们再运行一次

![image-20240218010952247](image-20240218010952247.png)

程序被断在`004C5214`的后一条代码，此处`0047D174`的值已经被改变了，即壳对IAT的加密，这里指向的是壳的代码，由壳跳转向真正的API调用

我们已经发现了对IAT再加密的指令，我们可以将其NOP掉，使其不能在IAT解密后进行加密

记录这里的地址，然后重新运行程序，当我们断在其初次解密时就可以转到`004C5214`将其NOP掉

![image-20240218011620384](image-20240218011620384.png)

然后在OEP设置断点，直接运行到OEP即可脱壳修复

## 特殊处理

参考的其他资料到NOP掉再次加密IAT这里结束了，但是这里的例子还有一处无效的指针

![image-20240218011711597](image-20240218011711597.png)

我们仍然尝试找一下写入这里的代码，对`0047D2B0`下硬件写入断点并重新运行，在壳代码解密后，要记得将`004C5214`NOP掉，以确保我们只有这一个地址需要修复

![image-20240218012218385](image-20240218012218385.png)

这里我们发现，这个地址在第一次被写入的时候就已经被写入了指向壳代码的指针，我们如何发现真正的API地址？先继续跟下去

```nasm
004C4B69 | 8B45 F8                | mov eax,dword ptr ss:[ebp-8]      |
004C4B6C | 8B00                   | mov eax,dword ptr ds:[eax]        |
004C4B6E | 85C0                   | test eax,eax                      |
004C4B70 | 74 69                  | je molebo.4C4BDB                  |
004C4B72 | 8B4D F4                | mov ecx,dword ptr ss:[ebp-C]      |
004C4B75 | 8B51 F8                | mov edx,dword ptr ds:[ecx-8]      |
004C4B78 | 85D2                   | test edx,edx                      |
004C4B7A | 75 07                  | jne molebo.4C4B83                 |
004C4B7C | 8A4D FE                | mov cl,byte ptr ss:[ebp-2]        |
004C4B7F | 84C9                   | test cl,cl                        |
004C4B81 | 74 2D                  | je molebo.4C4BB0                  |
004C4B83 | A9 00000080            | test eax,80000000                 |
004C4B88 | 75 12                  | jne molebo.4C4B9C                 |
004C4B8A | 8B55 0C                | mov edx,dword ptr ss:[ebp+C]      |
004C4B8D | 8D4410 02              | lea eax,dword ptr ds:[eax+edx+2]  |
004C4B91 | 50                     | push eax                          | API name
004C4B92 | 53                     | push ebx                          | module base
004C4B93 | 6A 35                  | push 35                           |
004C4B95 | E8 4295FFFF            | call <molebo.sub_4BE0DC>          | 返回写入的地址
004C4B9A | EB 12                  | jmp molebo.4C4BAE                 |
004C4B9C | 25 FFFF0000            | and eax,FFFF                      |
004C4BA1 | 50                     | push eax                          |
004C4BA2 | 53                     | push ebx                          |
004C4BA3 | 6A 35                  | push 35                           |
004C4BA5 | E8 3295FFFF            | call <molebo.sub_4BE0DC>          |
004C4BAA | 85C0                   | test eax,eax                      |
004C4BAC | 74 02                  | je molebo.4C4BB0                  |
004C4BAE | 8907                   | mov dword ptr ds:[edi],eax        | 写入
004C4BB0 | 8A45 0B                | mov al,byte ptr ss:[ebp+B]        |
004C4BB3 | 84C0                   | test al,al                        |
004C4BB5 | 74 11                  | je molebo.4C4BC8                  |
004C4BB7 | 8B0D 0CF44C00          | mov ecx,dword ptr ds:[4CF40C]     | 004CF40C:&"EXECUTABLE"
004C4BBD | 56                     | push esi                          | esi:"KERNEL32.dll"
004C4BBE | 51                     | push ecx                          |
004C4BBF | 57                     | push edi                          |
004C4BC0 | E8 FB050000            | call <molebo.sub_4C51C0>          | 加密的处理
004C4BC5 | 83C4 0C                | add esp,C                         |
004C4BC8 | 8B4D F8                | mov ecx,dword ptr ss:[ebp-8]      |
004C4BCB | 8B47 04                | mov eax,dword ptr ds:[edi+4]      |
004C4BCE | 83C7 04                | add edi,4                         |
004C4BD1 | 83C1 04                | add ecx,4                         |
004C4BD4 | 85C0                   | test eax,eax                      |
004C4BD6 | 894D F8                | mov dword ptr ss:[ebp-8],ecx      |
004C4BD9 | 75 8E                  | jne molebo.4C4B69                 |
```

在跟了一个CALL之后，我们大概可以分析出以上内容，壳在解密IAT前会将API的名称和所在模块的基址作为参数送到一个CALL中，由这个CALL计算出一个写入IAT的值

了解以上之后，我们在出问题的IAT指针的前一个指针上下硬件写入断点

![image-20240218012754160](image-20240218012754160.png)

之后重新运行程序，同样在壳代码解密后先需要NOP掉对IAT再加密的指令，之后运行到对`0047D2AC`的写入就可以了

![image-20240218013018569](image-20240218013018569.png)

在这里我们需要慢慢单步跟下去，再次来到`004C4B95`处，已经是获取下一条API地址的时候了

![image-20240218013247334](image-20240218013247334.png)

我们可以看到这里给进去的API名称是`GetProcAddress`

我们再次单步

![image-20240218013351897](image-20240218013351897.png)

与获取其他API地址不同，它直接返回了壳代码的地址

但我们已经知道了API的名字，可以手动查找一下API的地址，并且手动写入IAT中

在OEP下断点，运行停在OEP后，在调试器中转到`GetPrcoAddress`

![image-20240218013518621](image-20240218013518621.png)

![image-20240218013607024](image-20240218013607024.png)

将对应IAT的值修改为GetProcAddress的地址即可

![image-20240218013702714](image-20240218013702714.png)

![image-20240218013740675](image-20240218013740675.png)

（该文件来源于52的求助帖）

## 进一步探索

壳代码最终也会调用真正的API，能否通过壳的代码找到最终调用的API地址并还原到IAT？

## 参考资料

[手脱MoleBox(学习历程) - 『脱壳破解区』 - 吾爱破解 - LCG - LSG |安卓破解|病毒分析|www.52pojie.cn](https://www.52pojie.cn/thread-603801-1-1.html)

## 例子下载

[MoleBox2.36.exe](/blog/static/attachment/MoleBox2.36.exe)

