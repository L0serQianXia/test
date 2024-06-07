---
title: 基于易语言编写的MBR锁机程序密码分析实例
typora-root-url: e-language-mbrlocker-password
date: 2024-06-02 23:58:12
tags:
- re
- Reverse
- E Language
- MBRLocker
- malware
- malicious
- KillMBR
categories: Reverse
---

# 基于易语言编写的MBR锁机程序（MBRLocker）密码分析实例

## 前言

本文讨论的MBR锁（MBRLocker）皆为易语言编写，通常伪装为游戏辅助，主要行为是将0柱面、0磁头、1扇区的MBR中的引导代码替换掉，使其不能直接引导系统，而是显示一个不友好的界面，要求用户输入正确的密码后才能引导系统。

本文讨论内容仅限锁机密码的获取，对于部分样本针对系统或其他程序的破坏，不在本文讨论范围之内。

本文通过几个实例，讨论了获取这类恶意程序的锁机密码的分析，**并不会**讨论过多细节。技术有限，有错误指出还望指出和交流，谢谢！

## 一般方法

### 沙箱分析法

上传至微步，观察“可能通过修改硬盘RAW来安装引导型病毒（Bootkit）”这一项行为，其中包含的明文信息按顺序是锁机密码、锁机提示和原始的锁机提示。如下图所示：

![image-20240602175909145](image-20240602175909145.png)

这里原始的锁机提示是指锁机函数默认的锁机提示。

该种方法针对无名模块的部分固定密码样本有效。

### 动态分析法

部分基于易语言编写的MBR锁机程序，会调用他人预先编写好的函数，将诸如锁机提示和锁机密码等参数传递给这些锁机函数。因此，通常情况下只要定位到锁机函数，就可以找到锁机密码。

要如何定位锁机函数呢？一种方法是直接搜索相关的字符串，特别是在那些包含锁机提示的字符串信息附近，因为锁机函数的调用往往紧随其后。对于加壳的程序，一个策略是在`GetVersionExA`函数上设置断点。通常，易语言程序在首次在此处暂停时已完成了解码过程。此时，回到用户代码段即可搜索字符串。

另一种定位锁机函数的方法是设置断点，在直接读写MBR操作时，通常会调用`CreateFile`和`WriteFile`函数。我们可以在这些函数上设断点，并检查目标文件路径是否类似`\\.\PhysicalDrive0`。一旦确认，即可跟踪至用户代码部分，调用`WriteFile`的那一点很可能是执行锁机操作的函数。继续执行直到返回至上一层调用，便能观察到传递给该函数的具体参数。

该种方法面对的最大挑战通常是调试器检测和虚拟机检测。

## 固定密码

### 实例

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

## 动态密码

这里的动态密码指的是，锁机程序会为用户随机生成ID，而锁机密码由该ID参与计算得出。

### 实例1

样本来源：[锁机求帮忙分析密码](https://www.52pojie.cn/thread-1662199-1-10.html)

锁机页面：

![d4d2fea8b9dd8b2d374eb99aac89e8aa](d4d2fea8b9dd8b2d374eb99aac89e8aa.png)

se壳，会检测虚拟机，根据[绕过SE的虚拟机检测](https://www.52pojie.cn/thread-598022-1-1.html)修改后可在虚拟机里调试。

对`GetVersionExA`函数下断后运行，断住后转到401000，进行字符串搜索，可发现锁机提示，结果如下：

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

算法是`Password=id1*(id2+id3)`，将结果保存到ebp-0x44中（数值），转文本后保存到ebp-0x1C。

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

这里生成的id1是219，id2是396，id3是780，代入上方式子`Password=219*(396+780)=257544`

可以看到计算结果与堆栈中的数值相同，可判断算法正确。

继续向下就是枯燥的锁机过程了，已求出算法就不继续向下看了。

### 实例2

样本来源：[电脑被锁机](https://www.52pojie.cn/thread-1610093-1-13.html)

锁机界面：

![image-20240606164507069](image-20240606164507069.png)

se壳，但是似乎没有检测虚拟机，但有调试器检测，需要自己过一下。

加载进入OD，过掉壳的虚拟机检测后对`GetVersionExA`下断点，运行首次断住时，转到401000处进行字符串搜索，可以发现锁机提示，如下图：

![image-20240606150752306](image-20240606150752306.png)

跟随到该字符串所引用处，函数代码如下：

```nasm
004010CB | 55                     | push ebp                               |
004010CC | 8BEC                   | mov ebp,esp                            |
004010CE | 81EC 20000000          | sub esp,20                             |
004010D4 | C745 FC 00000000       | mov dword ptr ss:[ebp-4],0             |
004010DB | C745 F8 00000000       | mov dword ptr ss:[ebp-8],0             |
004010E2 | C745 F4 00000000       | mov dword ptr ss:[ebp-C],0             |
004010E9 | 6A 00                  | push 0                                 |
004010EB | 6A 00                  | push 0                                 |
004010ED | 6A 00                  | push 0                                 |
004010EF | 68 01000000            | push 1                                 |
004010F4 | BB B0DA4000            | mov ebx,<诗云mini.置随机数种子_模糊>             |
004010F9 | E8 77C50000            | call 诗云mini.40D675                     |
004010FE | 83C4 10                | add esp,10                             |
00401101 | 68 01030080            | push 80000301                          |
00401106 | 6A 00                  | push 0                                 |
00401108 | 68 C0E1E400            | push E4E1C0                            |
0040110D | 68 01030080            | push 80000301                          |
00401112 | 6A 00                  | push 0                                 |
00401114 | 68 10270000            | push 2710                              |
00401119 | 68 02000000            | push 2                                 |
0040111E | BB F0DA4000            | mov ebx,<诗云mini.取随机数>                  |
00401123 | E8 4DC50000            | call 诗云mini.40D675                     |
00401128 | 83C4 1C                | add esp,1C                             |
0040112B | 8945 FC                | mov dword ptr ss:[ebp-4],eax           | 随机数存入0x4处
0040112E | DB45 FC                | fild st(0),dword ptr ss:[ebp-4]        | 计算ID
00401131 | DD5D EC                | fstp qword ptr ss:[ebp-14],st(0)       |
00401134 | DD45 EC                | fld st(0),qword ptr ss:[ebp-14]        |
00401137 | DC0D 58BD4800          | fmul st(0),qword ptr ds:[48BD58]       | [0x48BD58]=5941788
0040113D | DD5D E4                | fstp qword ptr ss:[ebp-1C],st(0)       | ID=RandNum*5941788
00401140 | 68 01060080            | push 80000601                          |
00401145 | FF75 E8                | push dword ptr ss:[ebp-18]             |
00401148 | FF75 E4                | push dword ptr ss:[ebp-1C]             |
0040114B | 68 01000000            | push 1                                 |
00401150 | BB E0E64000            | mov ebx,<诗云mini.到文本_模糊>                |
00401155 | E8 1BC50000            | call 诗云mini.40D675                     |
0040115A | 83C4 10                | add esp,10                             |
0040115D | 8945 E0                | mov dword ptr ss:[ebp-20],eax          |
00401160 | 8B45 E0                | mov eax,dword ptr ss:[ebp-20]          |
00401163 | 50                     | push eax                               |
00401164 | 8B5D F8                | mov ebx,dword ptr ss:[ebp-8]           |
00401167 | 85DB                   | test ebx,ebx                           |
00401169 | 74 09                  | je 诗云mini.401174                       |
0040116B | 53                     | push ebx                               |
0040116C | E8 FEC40000            | call 诗云mini.40D66F                     |
00401171 | 83C4 04                | add esp,4                              |
00401174 | 58                     | pop eax                                |
00401175 | 8945 F8                | mov dword ptr ss:[ebp-8],eax           | ID转文本后存到0x8处
00401178 | DB45 FC                | fild st(0),dword ptr ss:[ebp-4]        | 计算锁机密码
0040117B | DD5D EC                | fstp qword ptr ss:[ebp-14],st(0)       |
0040117E | DD45 EC                | fld st(0),qword ptr ss:[ebp-14]        |
00401181 | DC25 60BD4800          | fsub st(0),qword ptr ds:[48BD60]       | [0x48BD60]=541788
00401187 | DD5D E4                | fstp qword ptr ss:[ebp-1C],st(0)       | Password=RandNum-541788
0040118A | 68 01060080            | push 80000601                          |
0040118F | FF75 E8                | push dword ptr ss:[ebp-18]             |
00401192 | FF75 E4                | push dword ptr ss:[ebp-1C]             |
00401195 | 68 01000000            | push 1                                 |
0040119A | BB E0E64000            | mov ebx,<诗云mini.到文本_模糊>                |
0040119F | E8 D1C40000            | call 诗云mini.40D675                     |
004011A4 | 83C4 10                | add esp,10                             |
004011A7 | 8945 E0                | mov dword ptr ss:[ebp-20],eax          |
004011AA | 8B45 E0                | mov eax,dword ptr ss:[ebp-20]          |
004011AD | 50                     | push eax                               |
004011AE | 8B5D F4                | mov ebx,dword ptr ss:[ebp-C]           |
004011B1 | 85DB                   | test ebx,ebx                           |
004011B3 | 74 09                  | je 诗云mini.4011BE                       |
004011B5 | 53                     | push ebx                               |
004011B6 | E8 B4C40000            | call 诗云mini.40D66F                     |
004011BB | 83C4 04                | add esp,4                              |
004011BE | 58                     | pop eax                                |
004011BF | 8945 F4                | mov dword ptr ss:[ebp-C],eax           | 密码转文本后存到0xC处
004011C2 | 68 68BD4800            | push 诗云mini.48BD68                     | 48BD68:"\r\n       o8o              o8o\r\n    o8888888o        o8888888o \r\n    88| . |88        88| . |88\r\n    (| -_- |)        (| -_- |)\r\n    0\\  =  /0        0\\  =  /0\r\n  ___/'==='\\___    ___/'==='\\___\r\n.' \\||     ||/ '..' \\||     ||/ '."
004011C7 | FF75 F8                | push dword ptr ss:[ebp-8]              |
004011CA | 68 4DBE4800            | push 诗云mini.48BE4D                     | 48BE4D:"jie suo + QQ 3635152601\r\nid"
004011CF | B9 03000000            | mov ecx,3                              |
004011D4 | E8 96FEFFFF            | call <诗云mini.文本相加>                     |
004011D9 | 83C4 0C                | add esp,C                              |
004011DC | 8945 F0                | mov dword ptr ss:[ebp-10],eax          | 拼接出锁机提示后，存放进0x10
004011DF | C745 EC 00000000       | mov dword ptr ss:[ebp-14],0            |
004011E6 | 6A 00                  | push 0                                 |
004011E8 | FF75 EC                | push dword ptr ss:[ebp-14]             |
004011EB | C745 E8 00000000       | mov dword ptr ss:[ebp-18],0            |
004011F2 | 6A 00                  | push 0                                 |
004011F4 | FF75 E8                | push dword ptr ss:[ebp-18]             |
004011F7 | 6A 01                  | push 1                                 |
004011F9 | 68 C2000000            | push C2                                |
004011FE | 8D45 F4                | lea eax,dword ptr ss:[ebp-C]           |
00401201 | 50                     | push eax                               | 锁机密码
00401202 | 8D45 F0                | lea eax,dword ptr ss:[ebp-10]          |
00401205 | 50                     | push eax                               | 锁机提示
00401206 | E8 9C010000            | call <诗云mini.Lock>                     | 锁机函数
0040120B | 8B5D F0                | mov ebx,dword ptr ss:[ebp-10]          |
0040120E | 85DB                   | test ebx,ebx                           |
00401210 | 74 09                  | je 诗云mini.40121B                       |
00401212 | 53                     | push ebx                               |
00401213 | E8 57C40000            | call 诗云mini.40D66F                     |
00401218 | 83C4 04                | add esp,4                              |
0040121B | E8 94560000            | call <诗云mini.TriggerBSOD>              | 蓝屏
00401220 | 8B5D F8                | mov ebx,dword ptr ss:[ebp-8]           |
00401223 | 85DB                   | test ebx,ebx                           |
00401225 | 74 09                  | je 诗云mini.401230                       |
00401227 | 53                     | push ebx                               |
00401228 | E8 42C40000            | call 诗云mini.40D66F                     |
0040122D | 83C4 04                | add esp,4                              |
00401230 | 8B5D F4                | mov ebx,dword ptr ss:[ebp-C]           |
00401233 | 85DB                   | test ebx,ebx                           |
00401235 | 74 09                  | je 诗云mini.401240                       |
00401237 | 53                     | push ebx                               |
00401238 | E8 32C40000            | call 诗云mini.40D66F                     |
0040123D | 83C4 04                | add esp,4                              |
00401240 | 8BE5                   | mov esp,ebp                            |
00401242 | 5D                     | pop ebp                                |
00401243 | C3                     | ret                                    |
```

首先取随机数，并将随机数置于偏移为0x4的变量（ebp-0x4）处，该随机数下称`RandNum`：

![image-20240606163429214](image-20240606163429214.png)

计算锁机界面显示的ID，`ID=RandNum*5941788`，并将转文本后的ID存储到偏移为0x8的变量（ebp-0x8）处：

![image-20240606163531984](image-20240606163531984.png)

计算锁机密码，算法为 `Password=RandNum-541788`，并将密码存于0xC变量（ebp-0xC）处，代码如下：

![image-20240606163606865](image-20240606163606865.png)

随后拼接锁机提示，存放0x10处（ebp-0x10）变量：

![image-20240606163632708](image-20240606163632708.png)

最后调用锁机函数，并使计算机蓝屏，以重启使锁机生效。

![image-20240606163708390](image-20240606163708390.png)

根据以上分析，得出以下关键算法：

- `ID=RandNum*5941788`
- `Password=RandNum-541788`

推出`Password=ID/5941788-541788`

将开头截图中的ID代入，得出`Password=101955140292/5941788-541788=-524629`，密码即为-524629

### 实例3

样本来源：[求助大佬一款随机硬盘锁软件 求破解 电脑已中毒](https://www.52pojie.cn/thread-1688781-1-10.html)

锁机界面：

![04807e751026955cdb4d5ceca3287732](04807e751026955cdb4d5ceca3287732.png)

可以看到锁机界面给了4个随机数：ID1、ID2、UID和UID2（未加与数字之间的分隔符）。

软件界面：

![image-20240606170152778](image-20240606170152778.png)

直接打开软件没有触发锁机，而是有信息框和一个功能界面，有六个按钮，按任何一个都会触发锁机。

无壳，利用IDA反编译，对照锁机界面还原变量关系：

![image-20240606171210154](image-20240606171210154.png)

变量重命名：

![image-20240606171131165](image-20240606171131165.png)

这里的password变量是根据最后传入锁机函数中的参数推断出：

![image-20240606171352912](image-20240606171352912.png)

根据上面代码，可推出密码算法：

`Password=(ID1*15+500-63) * UID * (ID2*15+500-63) * UID2`

开头的锁机密码计算为：`Password=(111*15+500-63)*14*(902*15+500-63)*10=4110208760`

但是这个密码输入进去是不正确的，因为实际上的密码计算有溢出。因此，计算器模式使用程序员，把大小调整为DWORD后，显示的数值是正确的密码。

![image-20240606173551447](image-20240606173551447.png)

密码即为-184758536

### 实例4

样本来源：[关于一个随机密码的硬盘锁的问题](https://www.52pojie.cn/thread-1607064-1-9.html)

锁机界面：

![image-20240606174554586](image-20240606174554586.png)

给出了6个ID，使用“-”号分隔，分别命名为ID1、ID2、ID3、ID4、ID5和ID6。

IDA反编译，观察算法：

![image-20240606175208901](image-20240606175208901.png)

可以看到，程序根据ID1来决定使用不同算法，这里共计有18种算法。

上面例子中，ID1是41，找到对应的算法：

![image-20240606211337565](image-20240606211337565.png)

可以看到，算法是`Password=ID3*(ID4+ID5)*ID3*(ID4+ID5)*ID2*(ID4+ID5)=ID2*ID3^2*(ID4+ID5)^3`

代入上式，得`Password=84*85^2*110^3=807783900000`

这里的密码算法比较多，就不一一罗列了，具体可以反编译对应分析。

## 参考资料

[主引导记录 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/zh-cn/主引导记录)

[绕过SE的虚拟机检测 - 『脱壳破解区』 - 吾爱破解 - LCG - LSG |安卓破解|病毒分析|www.52pojie.cn](https://www.52pojie.cn/thread-598022-1-1.html)

## 恶意文件哈希

| 文件名                   | SHA256                                                       |
| ------------------------ | ------------------------------------------------------------ |
| YEMiNi辅助1.8.6.exe      | 56806A9EC79086CF15BE7CF5DB747D0257E056CB10BE9FA38AF9A8D3EFD730B4 |
| 生死内部免费版.exe       | 31033784D589590860C4033DAC82B978FCEF4C95928AA5E83D81A419C330A2F7 |
| 诗云Mini辅助1.1.0(1).exe | 309D691A9EC940229DF2306EE542D5856A9AA4D7F4D756BFE1FBB89F15D9A3B5 |
| 北巷栀酒丨驱动DLL2.5.exe | 87E5F6215E6E6D73FC8FFBB9FDD37E96963579DDD2C4B2A23AD29CEEC7EE91E0 |
| hh (1).exe               | 67A47E1BD2BCE040123D3ABAFC5C229A65AC5C9964079C8B971EC1B2EE555A36 |
