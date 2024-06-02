---
title: 分析易语言编写的MBR锁的锁机密码
typora-root-url: e-language-mbrlocker-password
date: 2024-06-02 23:58:12
tags:
- re
- Reverse
- E Language
- MBRLocker
categories: Reverse
---

# 分析几例易语言编写的MBR锁（MBRLocker）的密码

未完，先挖好坑。

## 前言

本文讨论的MBR锁（MBRLocker）皆为易语言编写，通常伪装为游戏辅助，主要行为是将0柱面、0磁头、1扇区的MBR中的引导代码替换掉，使其不能直接引导系统，而是显示一个不友好的界面，要求用户输入正确的密码后才能引导系统。

本文讨论内容仅限锁机密码的获取，对于部分样本针对系统或其他程序的破坏，不在本文讨论范围之内。

本文通过几个实例，讨论了这类恶意程序的锁机密码的获取，**并不会**讨论过多细节。技术有限，有错误指出还望指出和交流，谢谢！

## 固定密码

### ~~一般方法~~

#### ~~沙箱分析法~~

~~上传至微步，观察“可能通过修改硬盘RAW来安装引导型病毒（Bootkit）”这一项行为，其中包含的明文信息按顺序是锁机密码、锁机提示和原始的锁机提示。如下图所示：~~

~~![image-20240602175909145](image-20240602175909145.png)~~

~~这里原始的锁机提示是指锁机函数默认的锁机提示。~~

~~该种方法仅对少部分样本有效，取决于写入的锁机代码中密码等信息是否明文保存。~~

#### ~~动态分析法~~

~~易语言编写的MBR锁机，有些是调用他人已写好的函数，并将锁机提示、锁机密码等信息作为参数传进锁机函数。因此，通常情况下只要定位到锁机函数，就可以找到锁机密码。~~

~~如何定位锁机函数？可以直接搜索字符串，字符串信息中寻找锁机提示，通常锁机函数的调用就在下面。~~

~~或者下断点，直接读写MBR同样需要调用CreateFile函数和WriteFile函数，通常我们可以对这两个函数下断点，判断目标文件名是否类似`\\.\PhysicalDrive0`，如果是，就可以转到用户代码，调用WriteFile的函数通常就是锁机函数，再运行到返回，回到上层调用，就可以看到传入的参数。~~

~~加壳的情况：针对易语言程序的解码，可以对GetVersionExA函数下断点，通常第一次断住时已解码。~~

通用性较差，做了两个例子发现适用的有点少。

### 实例1

样本来源：[MBR病毒,似乎是加了壳](https://www.52pojie.cn/thread-1754187-1-4.html)

此样本为一般方法中沙箱分析法的示例样本，这里采用动态分析法分析。

锁机界面：

![image-20240602203840737](image-20240602203840737.png)

查壳：

![image-20240602204204875](image-20240602204204875.png)

se壳，会检测虚拟机，根据[绕过SE的虚拟机检测](https://www.52pojie.cn/thread-598022-1-1.html)修改后可在虚拟机里调试。

加载后在WriteFile函数下断，第一次断住是锁机程序保存原引导代码，此时我们就可以回到用户代码，如下图：

![image-20240602211527111](image-20240602211527111.png)

根据上下文及数据可推测大致意图，步过这个调用，会断在WriteFile函数，写入数据如下图：

![image-20240602211651552](image-20240602211651552.png)

可见是锁机代码，继续返回到锁机函数之后运行到锁机函数的返回。

![image-20240602212031880](image-20240602212031880.png)

传入了四个参数，字符串“wocaonima”和“noshab”可能是密码，逐个尝试或根据上方写入的锁机代码中观察哪个字符串在锁机代码中，即为锁机密码。

### 实例2

样本来源：[硬盘逻辑锁，求助](https://www.52pojie.cn/thread-1653940-1-11.html)

## 动态密码

这里的动态密码指的是，锁机程序会为用户生成一个ID，而锁机密码由该ID参与计算得出。

### 实例1

样本来源：[锁机求帮忙分析密码](https://www.52pojie.cn/thread-1662199-1-10.html)

锁机页面：

![d4d2fea8b9dd8b2d374eb99aac89e8aa](d4d2fea8b9dd8b2d374eb99aac89e8aa.png)

se壳，会检测虚拟机，根据[绕过SE的虚拟机检测](https://www.52pojie.cn/thread-598022-1-1.html)修改后可在虚拟机里调试。

对GetVersionExA函数下断后运行，断住后转到401000，进行字符串搜索，可发现锁机提示，结果如下：

![image-20240602234851885](image-20240602234851885.png)

转到该处，并在此处下断点后运行，断在此处，可利用E-Debug等插件分析易语言相关函数调用，反汇编如下：

![image-20240603000700929](image-20240603000700929.png)

首先开启线程，添加用户锁，不在本文讨论范围内。

随后是生成3个随机数，作为ID：

```nasm
00401161    6A 00           push 0x0
00401163    6A 00           push 0x0
00401165    6A 00           push 0x0
00401167    68 01000000     push 0x1
0040116C    BB D0E04000     mov ebx,offset <生死内部.置随机数种子(模糊)>
00401171    E8 07CA0000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
00401176    83C4 10         add esp,0x10
00401179    68 01030080     push 0x80000301
0040117E    6A 00           push 0x0
00401180    68 E8030000     push 0x3E8
00401185    68 01030080     push 0x80000301
0040118A    6A 00           push 0x0
0040118C    68 01000000     push 0x1
00401191    68 02000000     push 0x2
00401196    BB 10E14000     mov ebx,offset <生死内部.取随机数>
0040119B    E8 DDC90000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
004011A0    83C4 1C         add esp,0x1C
004011A3    68 01030080     push 0x80000301
004011A8    6A 00           push 0x0
004011AA    50              push eax
004011AB    68 01000000     push 0x1
004011B0    BB 60E34000     mov ebx,offset <生死内部.到数值>
004011B5    E8 C3C90000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
004011BA    83C4 10         add esp,0x10
004011BD    8945 D0         mov dword ptr ss:[ebp-0x30],eax
004011C0    8955 D4         mov dword ptr ss:[ebp-0x2C],edx
004011C3    DD45 D0         fld qword ptr ss:[ebp-0x30]
004011C6    E8 41FEFFFF     call 生死内部.0040100C
004011CB    8945 FC         mov dword ptr ss:[ebp-0x4],eax           ; id1
004011CE    68 01030080     push 0x80000301
004011D3    6A 00           push 0x0
004011D5    68 E8030000     push 0x3E8
004011DA    68 01030080     push 0x80000301
004011DF    6A 00           push 0x0
004011E1    68 01000000     push 0x1
004011E6    68 02000000     push 0x2
004011EB    BB 10E14000     mov ebx,offset <生死内部.取随机数>
004011F0    E8 88C90000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
004011F5    83C4 1C         add esp,0x1C
004011F8    68 01030080     push 0x80000301
004011FD    6A 00           push 0x0
004011FF    50              push eax
00401200    68 01000000     push 0x1
00401205    BB 60E34000     mov ebx,offset <生死内部.到数值>
0040120A    E8 6EC90000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
0040120F    83C4 10         add esp,0x10
00401212    8945 D0         mov dword ptr ss:[ebp-0x30],eax
00401215    8955 D4         mov dword ptr ss:[ebp-0x2C],edx
00401218    DD45 D0         fld qword ptr ss:[ebp-0x30]
0040121B    E8 ECFDFFFF     call 生死内部.0040100C
00401220    8945 F8         mov dword ptr ss:[ebp-0x8],eax           ; id2
00401223    68 01030080     push 0x80000301
00401228    6A 00           push 0x0
0040122A    68 E8030000     push 0x3E8
0040122F    68 01030080     push 0x80000301
00401234    6A 00           push 0x0
00401236    68 01000000     push 0x1
0040123B    68 02000000     push 0x2
00401240    BB 10E14000     mov ebx,offset <生死内部.取随机数>
00401245    E8 33C90000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
0040124A    83C4 1C         add esp,0x1C
0040124D    68 01030080     push 0x80000301
00401252    6A 00           push 0x0
00401254    50              push eax
00401255    68 01000000     push 0x1
0040125A    BB 60E34000     mov ebx,offset <生死内部.到数值>
0040125F    E8 19C90000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
00401264    83C4 10         add esp,0x10
00401267    8945 D0         mov dword ptr ss:[ebp-0x30],eax
0040126A    8955 D4         mov dword ptr ss:[ebp-0x2C],edx
0040126D    DD45 D0         fld qword ptr ss:[ebp-0x30]
00401270    E8 97FDFFFF     call 生死内部.0040100C
00401275    8945 F4         mov dword ptr ss:[ebp-0xC],eax           ; id3
```

分别存在ebp-0x4、ebp-0x8和ebp-0xC三处。

随后将它们转为文本：

```nasm
00401296    68 01030080     push 0x80000301
0040129B    6A 00           push 0x0
0040129D    FF75 FC         push dword ptr ss:[ebp-0x4]
004012A0    68 01000000     push 0x1
004012A5    BB 60EE4000     mov ebx,offset <生死内部.到文本>
004012AA    E8 CEC80000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
004012AF    83C4 10         add esp,0x10
004012B2    8945 E0         mov dword ptr ss:[ebp-0x20],eax
004012B5    8B45 E0         mov eax,dword ptr ss:[ebp-0x20]
004012B8    50              push eax
004012B9    8B5D F0         mov ebx,dword ptr ss:[ebp-0x10]
004012BC    85DB            test ebx,ebx
004012BE    74 09           je X生死内部.004012C9
004012C0    53              push ebx
004012C1    E8 B1C80000     call 生死内部.0040DB77                       ; jmp 到 offset <生死内部.释放内存>
004012C6    83C4 04         add esp,0x4
004012C9    58              pop eax
004012CA    8945 F0         mov dword ptr ss:[ebp-0x10],eax             ; id1存入[ebp-0x10]
004012CD    68 01030080     push 0x80000301
004012D2    6A 00           push 0x0
004012D4    FF75 F8         push dword ptr ss:[ebp-0x8]
004012D7    68 01000000     push 0x1
004012DC    BB 60EE4000     mov ebx,offset <生死内部.到文本>
004012E1    E8 97C80000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
004012E6    83C4 10         add esp,0x10
004012E9    8945 E0         mov dword ptr ss:[ebp-0x20],eax
004012EC    8B45 E0         mov eax,dword ptr ss:[ebp-0x20]
004012EF    50              push eax
004012F0    8B5D EC         mov ebx,dword ptr ss:[ebp-0x14]
004012F3    85DB            test ebx,ebx
004012F5    74 09           je X生死内部.00401300
004012F7    53              push ebx
004012F8    E8 7AC80000     call 生死内部.0040DB77                       ; jmp 到 offset <生死内部.释放内存>
004012FD    83C4 04         add esp,0x4
00401300    58              pop eax
00401301    8945 EC         mov dword ptr ss:[ebp-0x14],eax             ; id2存入[ebp-0x14]
00401304    68 01030080     push 0x80000301
00401309    6A 00           push 0x0
0040130B    FF75 F4         push dword ptr ss:[ebp-0xC]
0040130E    68 01000000     push 0x1
00401313    BB 60EE4000     mov ebx,offset <生死内部.到文本>
00401318    E8 60C80000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
0040131D    83C4 10         add esp,0x10
00401320    8945 E0         mov dword ptr ss:[ebp-0x20],eax
00401323    8B45 E0         mov eax,dword ptr ss:[ebp-0x20]
00401326    50              push eax
00401327    8B5D E8         mov ebx,dword ptr ss:[ebp-0x18]             ; id3存入[ebp-0x18]
0040132A    85DB            test ebx,ebx
0040132C    74 09           je X生死内部.00401337
0040132E    53              push ebx
0040132F    E8 43C80000     call 生死内部.0040DB77                       ; jmp 到 offset <生死内部.释放内存>
00401334    83C4 04         add esp,0x4
00401337    58              pop eax
00401338    8945 E8         mov dword ptr ss:[ebp-0x18],eax
```

id1、id2、id3转文本后分别存入ebp-0x10、ebp-0x14和ebp-0x18中。

随后是利用id计算密码：

```nasm
0040133B    DB45 F8         fild dword ptr ss:[ebp-0x8]              ; load id2
0040133E    DD5D DC         fstp qword ptr ss:[ebp-0x24]
00401341    DD45 DC         fld qword ptr ss:[ebp-0x24]
00401344    DB45 F4         fild dword ptr ss:[ebp-0xC]              ; load id3
00401347    DD5D D4         fstp qword ptr ss:[ebp-0x2C]
0040134A    DC45 D4         fadd qword ptr ss:[ebp-0x2C]             ; calc id2+id3
0040134D    DD5D CC         fstp qword ptr ss:[ebp-0x34]
00401350    DB45 FC         fild dword ptr ss:[ebp-0x4]              ; load id1
00401353    DD5D C4         fstp qword ptr ss:[ebp-0x3C]
00401356    DD45 C4         fld qword ptr ss:[ebp-0x3C]
00401359    DC4D CC         fmul qword ptr ss:[ebp-0x34]             ; =id1*(id2+id3)
0040135C    DD5D BC         fstp qword ptr ss:[ebp-0x44]             ; store
0040135F    68 01060080     push 0x80000601
00401364    FF75 C0         push dword ptr ss:[ebp-0x40]
00401367    FF75 BC         push dword ptr ss:[ebp-0x44]
0040136A    68 01000000     push 0x1
0040136F    BB 60EE4000     mov ebx,offset <生死内部.到文本>
00401374    E8 04C80000     call 生死内部.0040DB7D                       ; jmp 到 offset <生死内部.核心支持库命令>
00401379    83C4 10         add esp,0x10
0040137C    8945 B8         mov dword ptr ss:[ebp-0x48],eax
0040137F    8B45 B8         mov eax,dword ptr ss:[ebp-0x48]
00401382    50              push eax
00401383    8B5D E4         mov ebx,dword ptr ss:[ebp-0x1C]
00401386    85DB            test ebx,ebx
00401388    74 09           je X生死内部.00401393
0040138A    53              push ebx
0040138B    E8 E7C70000     call 生死内部.0040DB77                       ; jmp 到 offset <生死内部.释放内存>
00401390    83C4 04         add esp,0x4
00401393    58              pop eax
00401394    8945 E4         mov dword ptr ss:[ebp-0x1C],eax
```

算法是`password=id1*(id2+id3)`，将结果保存到ebp-0x44中（数值），转文本后保存到ebp-0x1C。

随后是把锁机提示拼接起来：

```nasm
004013C6    FF75 E8         push dword ptr ss:[ebp-0x18]
004013C9    68 A0AB4800     push 生死内部.0048ABA0                       ; -
004013CE    FF75 EC         push dword ptr ss:[ebp-0x14]
004013D1    68 A0AB4800     push 生死内部.0048ABA0                       ; -
004013D6    FF75 F0         push dword ptr ss:[ebp-0x10]
004013D9    68 A2AB4800     push 生死内部.0048ABA2                       ; FUCK YOU   By LunXian qq1976676515\r\nID:
004013DE    B9 06000000     mov ecx,0x6
004013E3    E8 B6FCFFFF     call 生死内部.0040109E
004013E8    83C4 18         add esp,0x18
004013EB    8945 E0         mov dword ptr ss:[ebp-0x20],eax
```

到这里我们可以验算一下，

![image-20240603002219739](image-20240603002219739.png)

这里生成的id1是219，id2是396，id3是780，代入上方式子password=219*(396+780)

![image-20240603002320195](image-20240603002320195.png)

可以看到计算结果与堆栈中的数值相同，可判断算法正确。

继续向下就是枯燥的锁机过程了，已求出算法就不继续向下看了。

### 实例2

样本来源：[电脑被锁机](https://www.52pojie.cn/thread-1610093-1-13.html)

### 实例3

样本来源：[关于一个随机密码的硬盘锁的问题](https://www.52pojie.cn/thread-1607064-1-9.html)

### 实例4

样本来源：[求助大佬一款随机硬盘锁软件 求破解 电脑已中毒](https://www.52pojie.cn/thread-1688781-1-10.html)

## 参考资料

[主引导记录 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/zh-cn/主引导记录)

[绕过SE的虚拟机检测 - 『脱壳破解区』 - 吾爱破解 - LCG - LSG |安卓破解|病毒分析|www.52pojie.cn](https://www.52pojie.cn/thread-598022-1-1.html)
