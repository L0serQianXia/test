---
title: 手脱MoleBox2.36的学习
typora-root-url: Unpack-MoleBox2-36
date: 2024-02-18 20:43:03
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

将对应IAT指针的值修改为GetProcAddress的地址即可

![image-20240218013702714](image-20240218013702714.png)

![image-20240218013740675](image-20240218013740675.png)

（该文件来源于吾爱论坛的求助帖）

## 进一步探索

壳代码最终也会调用真正的API，能否通过壳的代码找到最终调用的API地址并还原到IAT？

![image-20240218201000942](image-20240218201000942.png)

这里假设我们的程序有如上的IAT，并且当前EIP在OEP处

我们在调试器中转到`004CB630`，直接将EIP设置到该处

```nasm
004CB630 | 55                     | push ebp                          |
004CB631 | 8BEC                   | mov ebp,esp                       |
004CB633 | 6A FF                  | push FFFFFFFF                     |
004CB635 | 68 F8D24B00            | push molebo.4BD2F8                |
004CB63A | 68 14F34B00            | push <molebo.sub_4BF314>          |
004CB63F | 64:A1 00000000         | mov eax,dword ptr fs:[0]          |
004CB645 | 50                     | push eax                          |
004CB646 | 64:8925 00000000       | mov dword ptr fs:[0],esp          |
004CB64D | 83EC 1C                | sub esp,1C                        |
004CB650 | 53                     | push ebx                          |
004CB651 | 56                     | push esi                          |
004CB652 | 57                     | push edi                          |
004CB653 | 8965 E8                | mov dword ptr ss:[ebp-18],esp     |
004CB656 | 8B75 0C                | mov esi,dword ptr ss:[ebp+C]      |
004CB659 | 8BC6                   | mov eax,esi                       |
004CB65B | C1E8 10                | shr eax,10                        |
004CB65E | 74 19                  | je molebo.4CB679                  |
004CB660 | 68 48444D00            | push molebo.4D4448                | 4D4448:"DllGetClassObject"
004CB665 | 56                     | push esi                          |
004CB666 | 6A 45                  | push 45                           |
004CB668 | E8 6F2AFFFF            | call <molebo.sub_4BE0DC>          |
004CB66D | 85C0                   | test eax,eax                      |
004CB66F | 75 08                  | jne molebo.4CB679                 |
004CB671 | 8B4D 08                | mov ecx,dword ptr ss:[ebp+8]      |
004CB674 | E8 E7A0FFFF            | call <molebo.sub_4C5760>          |
004CB679 | C745 FC 00000000       | mov dword ptr ss:[ebp-4],0        |
004CB680 | 56                     | push esi                          |
004CB681 | 8B4D 08                | mov ecx,dword ptr ss:[ebp+8]      |
004CB684 | 51                     | push ecx                          |
004CB685 | 6A 35                  | push 35                           |
004CB687 | E8 502AFFFF            | call <molebo.sub_4BE0DC>          |
004CB68C | 8BF0                   | mov esi,eax                       |
004CB68E | 8975 E4                | mov dword ptr ss:[ebp-1C],esi     |
004CB691 | 83CF FF                | or edi,FFFFFFFF                   |
004CB694 | 897D FC                | mov dword ptr ss:[ebp-4],edi      |
004CB697 | 85F6                   | test esi,esi                      |
004CB699 | 74 46                  | je molebo.4CB6E1                  |
```

发现代码如上，我们可以逐指令跟过去，进入每个CALL进行观察

到`004CB668`处的CALL F7进入：

```nasm
004BE0DC | 58                     | pop eax                                                  |
004BE0DD | 870424                 | xchg dword ptr ss:[esp],eax                              | [esp]:sub_4CB630+3D
004BE0E0 | C1E0 02                | shl eax,2                                                |
004BE0E3 | 8D80 71E14B00          | lea eax,dword ptr ds:[eax+<&CreateFileA>]                | eax+4BE171:sub_4BE168+2A
004BE0E9 | FF20                   | jmp dword ptr ds:[eax]                                   |
```

前两句代码将返回地址弹到eax中，此时栈顶为进入CALL前推入的0x45，程序在右移两位后与一处地址相加，得到了最终跳转的位置

![image-20240218202029883](image-20240218202029883.png)

壳自己维护着一张类似IAT的表，用于壳代码里对一些API的调用，当前要调用函数是lstrcmpiA，这是否是此处真正调用的API？

我们回到用户代码中，继续向下，因为在`004CB687`处还有一个向外的调用，进入该CALL

![image-20240218202211142](image-20240218202211142.png)

发现这次调用的地址是`GetProcAddress`，我们要确定该函数是否为真正调用的API地址，要根据壳函数的返回值来判断

```nasm
004CB680 | 56                     | push esi                                        |
004CB681 | 8B4D 08                | mov ecx,dword ptr ss:[ebp+8]                    |
004CB684 | 51                     | push ecx                                        |
004CB685 | 6A 35                  | push 35                                         |
004CB687 | E8 502AFFFF            | call <molebo.sub_4BE0DC>                        |
004CB68C | 8BF0                   | mov esi,eax                                     |
004CB68E | 8975 E4                | mov dword ptr ss:[ebp-1C],esi                   |
004CB691 | 83CF FF                | or edi,FFFFFFFF                                 |
004CB694 | 897D FC                | mov dword ptr ss:[ebp-4],edi                    |
004CB697 | 85F6                   | test esi,esi                                    |
004CB699 | 74 46                  | je molebo.4CB6E1                                |
```

回到壳代码，我们看到这里将返回值存在了esi寄存器中，然后判断esi的值是否为0，先来到该函数的结尾处

```nasm
004CB6D9 | 897D FC                | mov dword ptr ss:[ebp-4],edi                    |
004CB6DC | E8 18000000            | call molebo.4CB6F9                              |
004CB6E1 | 8BC6                   | mov eax,esi                                     |
004CB6E3 | 8B4D F0                | mov ecx,dword ptr ss:[ebp-10]                   |
004CB6E6 | 64:890D 00000000       | mov dword ptr fs:[0],ecx                        |
004CB6ED | 5F                     | pop edi                                         |
004CB6EE | 5E                     | pop esi                                         |
004CB6EF | 5B                     | pop ebx                                         |
004CB6F0 | 8BE5                   | mov esp,ebp                                     |
004CB6F2 | 5D                     | pop ebp                                         |
004CB6F3 | C2 0800                | ret 8                                           |
```

这个函数中只有`004CB6F3`处是返回，`004CB6E1`处对返回值进行赋值，是esi寄存器的值，我们可以大致猜测GetProcAddress为IAT中真正调用的API

![image-20240218202555562](image-20240218202555562.png)

注：最终结果仍为猜测，直接设置EIP不能确保环境与实际调用环境相同，并且壳的跳转函数不仅是一种形式，因此此种方式得到结果仅作参考

## 进二步探索

这里使用IDA的反汇编视图进行分析，我们将加壳后文件加载进IDA，在经历了一些跳转之后，我们来到如下

```nasm
.adata:004BC2D8                               loc_4BC2D8:                   ; CODE XREF: start:loc_4BB04A↑j
.adata:004BC2D8 60                            pusha
.adata:004BC2D9 E8 4F 00 00 00                call    sub_4BC32D
.adata:004BC2D9
.adata:004BC2D9                               ; ---------------------------------------------------------------------------
.adata:004BC2DE E8 28                         dw 28E8h
.adata:004BC2E0 86 FF                         db 86h, 0FFh
.adata:004BC2E2 C7 B8                         dw 0B8C7h
...
```

`sub_4BC32D`如下：

```nasm
.adata:004BC32D                               sub_4BC32D proc near          ; CODE XREF: start+12D1↑p
.adata:004BC32D E8 BE F6 FF FF                call    sub_4BB9F0           
.adata:004BC32D                                                             
.adata:004BC32D                                                             
.adata:004BC32D                                                            
.adata:004BC32D                                                             
.adata:004BC32D
.adata:004BC32D                               sub_4BC32D endp
.adata:004BC32D
.adata:004BC32D                               ; ---------------------------------------------------------------------------
.adata:004BC332 CE 9C 01 00                   dd 19CCEh
.adata:004BC336 42                            db  42h ; B
.adata:004BC337 DB                            db 0DBh
.adata:004BC338 00                            db    0
.adata:004BC339 00                            db    0
...
```

`sub_4BB9F0`如下：

```nasm
.adata:004BB9F0                               ; 这里栈应该为
.adata:004BB9F0                               ; 004BC332
.adata:004BB9F0                               ; 004BC2DE
.adata:004BB9F0                               ; ...
.adata:004BB9F0                               ;
.adata:004BB9F0                               ; Attributes: noreturn
.adata:004BB9F0
.adata:004BB9F0                               ; void __cdecl __noreturn sub_4BB9F0(int)
.adata:004BB9F0                               sub_4BB9F0 proc near          ; CODE XREF: sub_4BC32D↓p
.adata:004BB9F0
.adata:004BB9F0                               a2= dword ptr  4
.adata:004BB9F0
.adata:004BB9F0 8B 44 24 04                   mov     eax, [esp+a2]
.adata:004BB9F4 50                            push    eax                   ; esp+4读到的是004BC2DE，然后将其压栈
.adata:004BB9F4                                                             ; 此时栈为
.adata:004BB9F4                                                             ; 004BC2DE
.adata:004BB9F4                                                             ; 004BC332
.adata:004BB9F4                                                             ; 004BC2DE
.adata:004BB9F5 8B 44 24 04                   mov     eax, [esp+4]
.adata:004BB9F9 50                            push    eax                   ; 这里esp+4读到004BC332，然后将其压栈
.adata:004BB9F9                                                             ; 此时栈为
.adata:004BB9F9                                                             ; 004BC332
.adata:004BB9F9                                                             ; 004BC2DE
.adata:004BB9F9                                                             ; 004BC332
.adata:004BB9F9                                                             ; 004BC2DE
.adata:004BB9FA E8 B1 FD FF FF                call    sub_4BB7B0            ; 上面两条push即为该函数的参数
.adata:004BB9FA
.adata:004BB9FA                               sub_4BB9F0 endp
.adata:004BB9FA
```

直至这里仍在调用其他的函数，但代码已经明显比上面更多了，上面的两层调用在call之下都有许多数据，它们是被加密的指令，在当前函数，将上两层调用的返回地址作为参数给进了`sub_4BB7B0`

该函数非常精彩，里面先对两个参数中的一个指向的加密数据解密，代码如下：

```nasm
.adata:004BB7EE 6A 00                         push    0                     ; lpModuleName
.adata:004BB7F0 FF 15 00 B0 4B 00             call    ds:GetModuleHandleA
.adata:004BB7F0
.adata:004BB7F6 68 40 D4 00 00                push    0D440h
.adata:004BB7FB 6A 40                         push    PAGE_EXECUTE_READWRITE
.adata:004BB7FD 8B F0                         mov     esi, eax
.adata:004BB7FF FF D7                         call    edi                   ; LocalAlloc
.adata:004BB7FF
.adata:004BB801 8B 7D 0C                      mov     edi, [ebp+ptr_004BC2DE] ; 这里根据上层调用的传参重命名了参数，传参应该是指向加密数据的地址
.adata:004BB804 89 45 F8                      mov     [ebp+buffer], eax     ; LocalAlloc申请到的内存空间地址
.adata:004BB807 8D 87 EA FB FF FF             lea     eax, [edi-416h]       ; 计算结果为004BBEC8，同样指向一堆加密数据
.adata:004BB80D 8B C8                         mov     ecx, eax
.adata:004BB80F 8D 90 00 04 00 00             lea     edx, [eax+400h]       ; 004BBEC8+400=4BC2C8，指向这堆加密数据的末尾部分
.adata:004BB815 3B C2                         cmp     eax, edx
.adata:004BB817 73 18                         jnb     short loc_4BB831      ; jump if 004BBEC8 >= 004BC2C8，不应该跳转
.adata:004BB817
.adata:004BB819
.adata:004BB819                               loc_4BB819:                   ; CODE XREF: sub_4BB7B0+7F↓j
.adata:004BB819 69 C0 0D 66 19 00             imul    eax, 19660Dh
.adata:004BB81F 8B 19                         mov     ebx, [ecx]            ; 从004BBEC8开始解密数据
.adata:004BB821 05 75 F3 6E 3C                add     eax, 3C6EF375h
.adata:004BB826 33 D8                         xor     ebx, eax
.adata:004BB828 89 19                         mov     [ecx], ebx            ; 异或
.adata:004BB82A 83 C1 04                      add     ecx, 4
.adata:004BB82D 3B CA                         cmp     ecx, edx
.adata:004BB82F 72 E8                         jb      short loc_4BB819      ; jump if 当前解密位置 < 加密数据末尾部分
.adata:004BB82F
```

解密后数据如下：

```
004BBEC8        27 48 45 52 45 49 53 42 4F 4F 54 43 4F 44  ..'HEREISBOOTCOD  
004BBED6  45 27 00 00 00 00 00 00 00 00 05 00 00 00 2E 74  E'.............t  
004BBEE6  65 78 74 00 00 00 9E B8 07 00 00 10 00 00 00 60  ext....¸.......`  
004BBEF6  04 00 00 10 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BBF06  00 00 20 00 00 60 2E 72 64 61 74 61 00 00 EE 32  .. ..`.rdata..î2  
004BBF16  01 00 00 D0 07 00 00 70 00 00 00 70 04 00 00 00  ...Ð...p...p....  
004BBF26  00 00 00 00 00 00 00 00 00 00 40 00 00 40 2E 64  ..........@..@.d  
004BBF36  61 74 61 00 00 00 A8 19 02 00 00 10 09 00 00 60  ata...¨........`  
004BBF46  00 00 00 E0 04 00 00 00 00 00 00 00 00 00 00 00  ...à............  
004BBF56  00 00 40 00 00 C0 2E 72 73 72 63 00 00 00 58 59  ..@..À.rsrc...XY  
004BBF66  00 00 00 00 00 00 00 60 00 00 00 40 05 00 00 00  .......`...@....  
004BBF76  00 00 00 00 00 00 00 00 00 00 40 00 00 40 2E 74  ..........@..@.t  
004BBF86  65 78 74 00 00 00 A0 CA 01 00 00 90 0B 00 00 10  ext... Ê........  
004BBF96  01 00 00 A0 05 00 00 00 00 00 00 00 00 00 00 00  ... ............  
004BBFA6  00 00 20 00 00 E0 00 00 00 00 00 00 00 00 00 00  .. ..à..........  
004BBFB6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BBFC6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BBFD6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BBFE6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BBFF6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC006  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC016  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC026  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC036  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC046  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC056  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC066  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC076  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC086  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC096  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC0A6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC0B6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC0C6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC0D6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC0E6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC0F6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC106  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC116  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC126  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC136  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC146  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC156  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC166  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC176  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC186  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC196  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC1A6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC1B6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC1C6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC1D6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC1E6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC1F6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC206  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC216  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC226  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC236  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC246  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC256  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC266  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC276  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC286  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC296  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC2A6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC2B6  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................  
004BC2C6  00 00 00                                         ...  
```

不难发现，这是一个节区头

接着看代码：

```nasm
.adata:004BB831                               loc_4BB831:                   ; CODE XREF: sub_4BB7B0+67↑j
.adata:004BB831 8B 5D 08                      mov     ebx, [ebp+ptr_004BC332]
.adata:004BB834 81 C7 06 FC FF FF             add     edi, 0FFFFFC06h       ; 4BC2DE + FFFFFC06 = 4BBEE4，指向的是.text区段
.adata:004BB83A 89 7D E4                      mov     [ebp+ptr_004BBEE4], edi
.adata:004BB83D BA 01 00 00 00                mov     edx, 1
.adata:004BB83D
.adata:004BB842
.adata:004BB842                               loc_4BB842:                   ; CODE XREF: sub_4BB7B0+AD↓j
.adata:004BB842                                                             ; sub_4BB7B0+B1↓j
.adata:004BB842 8B 47 FC                      mov     eax, [edi-4]          ; 4BBEE0，这里是区段数量：5
.adata:004BB845 2B C2                         sub     eax, edx
.adata:004BB847 42                            inc     edx
.adata:004BB848 8D 04 80                      lea     eax, [eax+eax*4]
.adata:004BB84B 8B 4C C7 0C                   mov     ecx, [edi+eax*8+0Ch]  ; 读区段的所占内存大小（VirtualSize）
.adata:004BB84F 8D 04 C7                      lea     eax, [edi+eax*8]      ; edi+eax*8指向IMAGE_SECTION_HEADER结构体开头
.adata:004BB852 8B 40 08                      mov     eax, [eax+8]          ; RVA
.adata:004BB855 03 C1                         add     eax, ecx
.adata:004BB857 03 CE                         add     ecx, esi              ; esi指向模块基址，前面的GetModuleHandle获取
.adata:004BB859 03 C6                         add     eax, esi              ; 解压后段末尾
.adata:004BB85B 3B CB                         cmp     ecx, ebx
.adata:004BB85D 73 E3                         jnb     short loc_4BB842      ; 4BBEE0，这里是区段数量：5
.adata:004BB85D
.adata:004BB85F 3B D8                         cmp     ebx, eax
.adata:004BB861 73 DF                         jnb     short loc_4BB842      ; 4BBEE0，这里是区段数量：5
.adata:004BB861
.adata:004BB863 8D 4B 0C                      lea     ecx, [ebx+0Ch]        ; 004BC332+C=4BC33E
.adata:004BB866 8B D3                         mov     edx, ebx
.adata:004BB868 83 E1 FC                      and     ecx, 0FFFFFFFCh       ; 4BC33C
.adata:004BB86B 3B C8                         cmp     ecx, eax
.adata:004BB86D 73 19                         jnb     short loc_4BB888      ; jump if 4BC33C > 解压后段末尾
```

这里看不太清，没有证据表明这里是解压后段末尾，调试器里针对这个例子两个jnb没有跳转

接下来是继续解密：

```nasm
.adata:004BB86F                               loc_4BB86F:                   ; CODE XREF: sub_4BB7B0+D6↓j
.adata:004BB86F 69 D2 0D 66 19 00             imul    edx, 19660Dh
.adata:004BB875 8B 31                         mov     esi, [ecx]
.adata:004BB877 81 C2 75 F3 6E 3C             add     edx, 3C6EF375h
.adata:004BB87D 33 F2                         xor     esi, edx
.adata:004BB87F 89 31                         mov     [ecx], esi            ; 解密4BC33C处代码
.adata:004BB881 83 C1 04                      add     ecx, 4
.adata:004BB884 3B C8                         cmp     ecx, eax
.adata:004BB886 72 E7                         jb      short loc_4BB86F
.adata:004BB886
```

解密后部分数据：

```
004BC33A  A0 C1 FD 56 7F E9 59 97 01 00 E9 54 F0 F1 FF 4C   ÁýV.éY...éTðñÿL  
004BC34A  CB CB DB E9 52 E4 6D FF 62 E9 E7 55 45 23 E9 50  ËËÛéRämÿbéçUE#éP  
004BC35A  FF 86 72 EB 5D 40 2A FB F4 FF 8B D2 29 DE D7 79  ÿ.rë]@*ûôÿ.Ò)Þ×y  
004BC36A  D0 B7 FF 41 D1 E9 20 00 00 00 80 FF B7 E5 84 36  Ð·ÿAÑé ....ÿ·å.6  
004BC37A  16 6B 6F 7F FF 96 0B 07 D8 3A 76 11 57 FF 00 FA  .ko.ÿ...Ø:v.Wÿ.ú  
004BC38A  F9 CA A1 C2 92 A1 FF A6 81 09 8C 8F 21 A6 8B FF  ùÊ¡Â.¡ÿ¦....!¦.ÿ  
004BC39A  56 3E 40 DD CC 37 2A 5E FF 95 DA DA B2 9D A7 A9  V>@ÝÌ7*^ÿ.ÚÚ².§©  
004BC3AA  8B FF 0F D1 E5 92 17 2A 70 D8 FF 6B 06 1D D1 98  .ÿ.Ñå..*pØÿk..Ñ.  
004BC3BA  7D F6 C1 FF 5B 96 10 06 30 DD 33 AD FF C7 62 B0  }öÁÿ[...0Ý3.ÿÇb°  
...
```

这里数据很乱，仍是加密的数据，继续向下

```nasm
.adata:004BB888                               loc_4BB888:                   ; CODE XREF: sub_4BB7B0+BD↑j
.adata:004BB888 8B 73 04                      mov     esi, [ebx+4]          ; [004BC336]=DB42
.adata:004BB88B 8B 0B                         mov     ecx, [ebx]            ; [004BC332]=19CCE
.adata:004BB88D 8B 53 08                      mov     edx, [ebx+8]          ; [004BC33A]这里数据后两个字节是加密的
.adata:004BB890 56                            push    esi                   ; 分配长度：DB42
.adata:004BB891 6A 40                         push    PAGE_EXECUTE_READWRITE
.adata:004BB893 89 4D 08                      mov     [ebp+ptr_004BC332], ecx
.adata:004BB896 89 75 F0                      mov     [ebp+buffer2_length], esi
.adata:004BB899 89 55 EC                      mov     [ebp+var_14], edx
.adata:004BB89C FF 55 F4                      call    [ebp+ptr_LocalAlloc]
.adata:004BB89C
.adata:004BB89F 8B F8                         mov     edi, eax
.adata:004BB8A1 85 FF                         test    edi, edi
.adata:004BB8A3 89 7D 0C                      mov     [ebp+ptr_004BC2DE], edi
.adata:004BB8A6 74 08                         jz      short loc_4BB8B0      ; 内存申请的验证，失败会报错
.adata:004BB8A6
.adata:004BB8A8 81 FE 00 00 01 00             cmp     esi, 10000h
.adata:004BB8AE 76 0E                         jbe     short loc_4BB8BE
.adata:004BB8AE
.adata:004BB8B0
.adata:004BB8B0                               loc_4BB8B0:                   ; CODE XREF: sub_4BB7B0+F6↑j
.adata:004BB8B0 6A 00                         push    0
.adata:004BB8B2 6A 00                         push    0
.adata:004BB8B4 6A 00                         push    0
.adata:004BB8B6 68 FF 00 00 EF                push    0EF0000FFh
.adata:004BB8BB FF 55 FC                      call    [ebp+ptr_RaiseException]
.adata:004BB8BB
.adata:004BB8BE
.adata:004BB8BE                               loc_4BB8BE:                   ; CODE XREF: sub_4BB7B0+FE↑j
.adata:004BB8BE 8B CE                         mov     ecx, esi
.adata:004BB8C0 8D 73 0C                      lea     esi, [ebx+0Ch]        ; 解密后的数据 4BC33E
.adata:004BB8C3 8B C1                         mov     eax, ecx
.adata:004BB8C5 8B 55 0C                      mov     edx, [ebp+ptr_004BC2DE] ; 这个是申请到的内存
.adata:004BB8C8 C1 E9 02                      shr     ecx, 2                ; 复制长度：36D0
.adata:004BB8CB F3 A5                         rep movsd                     ; edi是上面申请到的内存，从解密后的数据复制36D0个字到申请到的内存处
.adata:004BB8CD 8B C8                         mov     ecx, eax
.adata:004BB8CF 83 E1 03                      and     ecx, 3
.adata:004BB8D2 F3 A4                         rep movsb                     ; 复制剩下的2字节
.adata:004BB8D4 8B 75 08                      mov     esi, [ebp+ptr_004BC332]
.adata:004BB8D7 8B 4D F0                      mov     ecx, [ebp+buffer2_length]
.adata:004BB8DA 56                            push    esi                   ; 19CCE
.adata:004BB8DB 53                            push    ebx                   ; 004BC332
.adata:004BB8DC 51                            push    ecx                   ; 申请内存长度
.adata:004BB8DD 8B 4D F8                      mov     ecx, [ebp+buffer]
.adata:004BB8E0 52                            push    edx                   ; 申请到的内存起始地址
.adata:004BB8E1 E8 4A FD FF FF                call    sub_4BB630            ; 这个函数同样用于解密
```

这里又申请了一处内存地址，将esi的值右移两位作为复制字节数，并从`4BC33E`将解密后的数据复制到申请到的内存区域

最后的`sub_4BB630`函数又进行了解密操作，在执行完这个函数之后，`004BC332`已经可以反汇编代码了

继续向下：

```nasm
.adata:004BB919                               loc_4BB919:                   ; CODE XREF: sub_4BB7B0+159↑j
.adata:004BB919 8B 7D E8                      mov     edi, [ebp+ptr_kernel32_base]
.adata:004BB91C 6A FF                         push    0FFFFFFFFh
.adata:004BB91E 68 04 B1 4B 00                push    offset aFlushinstructi ; "FlushInstructionCache"
.adata:004BB923 57                            push    edi
.adata:004BB924 E8 57 04 00 00                call    get_proc_address
.adata:004BB924
.adata:004BB929 6A FF                         push    0FFFFFFFFh
.adata:004BB92B 68 F0 B0 4B 00                push    offset aGetcurrentproc ; "GetCurrentProcess"
.adata:004BB930 57                            push    edi
.adata:004BB931 A3 20 EB 4C 00                mov     ds:ptr_FlushInstructionCache, eax
.adata:004BB936 E8 45 04 00 00                call    get_proc_address
.adata:004BB936
.adata:004BB93B 8B F8                         mov     edi, eax
.adata:004BB93D A1 20 EB 4C 00                mov     eax, ds:ptr_FlushInstructionCache
.adata:004BB942 83 C4 18                      add     esp, 18h
.adata:004BB945 85 C0                         test    eax, eax
.adata:004BB947 75 0E                         jnz     short loc_4BB957      ; 判断是否获取到函数地址，失败会报错
.adata:004BB947
.adata:004BB949 6A 00                         push    0
.adata:004BB94B 6A 00                         push    0
.adata:004BB94D 6A 00                         push    0
.adata:004BB94F 68 FC 00 00 EF                push    0EF0000FCh
.adata:004BB954 FF 55 FC                      call    [ebp+ptr_RaiseException]
.adata:004BB954
.adata:004BB957
.adata:004BB957                               loc_4BB957:                   ; CODE XREF: sub_4BB7B0+197↑j
.adata:004BB957 FF D7                         call    edi                   ; GetCurrentProcess
.adata:004BB957
.adata:004BB959 56                            push    esi                   ; 19CCE
.adata:004BB95A 53                            push    ebx                   ; 004BC332
.adata:004BB95B 50                            push    eax                   ; 当前进程的句柄（GetCurrentProcess返回值）
.adata:004BB95C A3 84 F2 4C 00                mov     ds:current_process_id, eax
.adata:004BB961 FF 15 20 EB 4C 00             call    ds:ptr_FlushInstructionCache ; 刷新指令缓存，因为前面更新了代码
.adata:004BB961                                                             ; 下面开始执行解密后代码
```

这里刷新指令缓存

> 如果应用程序在内存中生成或修改代码，则应调用 **FlushInstructionCache** 。 CPU 无法检测到更改，并可能执行它缓存的旧代码。
>
> ——MSDN

在这之下到函数尾部的代码就是执行解密后的壳代码了，可见分析了这么多，也仅仅是分析了解密壳代码的代码，还没有真正开始分析壳代码

在完成壳代码的解密后，我们可以将程序dump出来，继续在IDA中进行分析

这里壳调用API使用了类似表的东西，借助了函数和传入的偏移计算后得到调用API在表中的偏移，以下是由动态分析得知：

![image-20240218135441805](image-20240218135441805.png)

该函数结束后，返回上一层调用

```nasm
.adata:004BB9F0 8B 44 24 04                   mov     eax, [esp+arg_0]
.adata:004BB9F4 50                            push    eax
.adata:004BB9F5 8B 44 24 04                   mov     eax, [esp+4]
.adata:004BB9F9 50                            push    eax
.adata:004BB9FA E8 B1 FD FF FF                call    sub_4BB7B0
.adata:004BB9FA
.adata:004BB9FF 58                            pop     eax
.adata:004BBA00 E8 DB 0B 00 00                call    sub_4BC5E0
.adata:004BBA00
.adata:004BBA05 87 04 24                      xchg    eax, [esp-4+arg_0]
.adata:004BBA08 58                            pop     eax
.adata:004BBA09 89 44 24 24                   mov     [esp-8+arg_28], eax
.adata:004BBA0D 61                            popa
.adata:004BBA0E 58                            pop     eax
.adata:004BBA0F 58                            pop     eax
.adata:004BBA10 FF D0                         call    eax
.adata:004BBA10
.adata:004BBA12 E8 09 EC 00 00                call    sub_4CA620
.adata:004BBA12
```

我们应该可以发现`004BBA10`略有眼熟，这就是我们ESP定律找到的popa处，也就是从壳跳转到OEP的代码

这么看来这个壳大致分三步，首先解密壳代码，然后解密原程序，最后跳到原程序的入口点

然后不会了，这里留着以后有能力了再回来写

## 参考资料

[手脱MoleBox(学习历程) - 『脱壳破解区』 - 吾爱破解 - LCG - LSG |安卓破解|病毒分析|www.52pojie.cn](https://www.52pojie.cn/thread-603801-1-1.html)

## 例子下载

[MoleBox2.36.exe](/blog/static/attachment/MoleBox2.36.exe)

