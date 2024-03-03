---
title: 易语言程序独立编译简要逆向及入口点的寻找
typora-root-url: E-Language-Compilation
date: 2024-03-03 21:10:31
tags:
- E Language
- re
categories: Reverse
---

这是一篇对由易语言独立编译导出文件的简要逆向分析记录，基于易语言5.9，技术有限，如有错误还望指出，谢谢！

## 程序准备

首先，我们准备一个十分简单的易语言程序，有一个窗口，其中有一个按钮，按下弹窗信息框提示“你好”

![image-20240303191742132](image-20240303191742132.png)

分别采用独立编译和静态编译得到文件

![image-20240303191827308](image-20240303191827308.png)

## 初步分析

### 区段

#### 静态编译

![image-20240303205246799](image-20240303205246799.png)

只有4个区段

#### 独立编译

![image-20240303205153854](image-20240303205153854.png)

比静态编译多一个区段，有两个名为.data的段，其中一个具有可执行属性

### 字符串

#### 静态编译

![image-20240303204434504](image-20240303204434504.png)

可正常搜索到程序的字符串

#### 独立编译

![image-20240303204504194](image-20240303204504194.png)

![image-20240303204518105](image-20240303204518105.png)

可以发现独立编译的字符串较少，无法直接搜索到程序中的字符串，不同独立编译的程序搜索字符串的结果大致是相同的

### 程序代码所在区段

#### 静态编译

![image-20240303204913399](image-20240303204913399.png)

![image-20240303204924177](image-20240303204924177.png)

代码在.text段中

#### 独立编译

下MessageBoxA断点，回溯到独立编译的可执行程序中，暂停在代码如下：

![image-20240303204655619](image-20240303204655619.png)

代码在.data段中

![image-20240303204815580](image-20240303204815580.png)

## 具体分析

独立编译程序的主函数反编译如下：

```c
int __stdcall WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nShowCmd)
{
  HANDLE FileA; // eax
  void *v5; // edi
  _DWORD *v6; // esi
  _DWORD *v7; // esi
  const char *v8; // edi
  const char *v9; // esi
  signed int v10; // eax
  char *v11; // edi
  const char *v12; // esi
  const char *v13; // edi
  DWORD *v14; // esi
  DWORD v15; // edi
  char *v16; // esi
  HINSTANCE v17; // eax
  HMODULE LibraryA; // eax
  FARPROC GetNewSock; // eax
  const char *v21; // [esp-4h] [ebp-2ACh]
  char *String2; // [esp+0h] [ebp-2A8h]
  CHAR FileName[260]; // [esp+10h] [ebp-298h] BYREF
  CHAR Filename[260]; // [esp+114h] [ebp-194h] BYREF
  CHAR Source[52]; // [esp+218h] [ebp-90h] BYREF
  char Destination[52]; // [esp+24Ch] [ebp-5Ch] BYREF
  DWORD NumberOfBytesWritten; // [esp+280h] [ebp-28h] BYREF
  size_t Buffer[2]; // [esp+284h] [ebp-24h] BYREF
  DWORD NumberOfBytesRead; // [esp+28Ch] [ebp-1Ch] BYREF
  DWORD v30; // [esp+290h] [ebp-18h] BYREF
  int v31; // [esp+294h] [ebp-14h] BYREF
  void (__stdcall *v32)(int); // [esp+298h] [ebp-10h]
  DWORD v33; // [esp+29Ch] [ebp-Ch]
  LPVOID lpBuffer; // [esp+2A0h] [ebp-8h]
  LPCSTR lpText; // [esp+2A4h] [ebp-4h]
  HINSTANCE hInstancea; // [esp+2B0h] [ebp+8h]
  HINSTANCE hInstanceb; // [esp+2B0h] [ebp+8h]
  HINSTANCE hInstancec; // [esp+2B0h] [ebp+8h]
  const char *hInstanced; // [esp+2B0h] [ebp+8h]
  HINSTANCE hInstancee; // [esp+2B0h] [ebp+8h]

  lpText = 0;
  lpBuffer = 0;
  v32 = 0;
  GetModuleFileNameA(hInstance, Filename, 0x104u);
  FileA = CreateFileA(Filename, 0x80000000, 1u, 0, 3u, 0x80u, 0);
  v5 = FileA;
  if ( FileA == (HANDLE)-1 )
  {
    lpText = aCanTOpenFile;
    goto LABEL_47;
  }
  v33 = SetFilePointer(FileA, -8, 0, 2u);
  if ( v33 < 0x3E8 )
    goto LABEL_43;
  NumberOfBytesRead = 0;
  if ( !ReadFile(v5, Buffer, 8u, &NumberOfBytesRead, 0) || NumberOfBytesRead != 8 )
  {
    lpText = aFailedToReadDa;
    goto LABEL_45;
  }
  hInstancea = (HINSTANCE)Buffer[0];
  if ( Buffer[1] != -2103789659 || (int)Buffer[0] < 4 || (int)Buffer[0] >= (int)v33 )
  {
LABEL_43:
    lpText = aInvalidDataInT;
    goto LABEL_47;
  }
  lpBuffer = operator new(Buffer[0]);
  if ( !lpBuffer )
  {
LABEL_23:
    lpText = aInsufficientMe;
    goto LABEL_45;
  }
  v30 = 0;
  if ( SetFilePointer(v5, -8 - (_DWORD)hInstancea, 0, 2u) != -1
    && (v6 = lpBuffer, ReadFile(v5, lpBuffer, (DWORD)hInstancea, &v30, 0))
    && (HINSTANCE)v30 == hInstancea
    && *v6 == -2103789659 )
  {
    v7 = v6 + 1;
    if ( !GetTempPathA(0x104u, Filename) )
    {
      lpText = aCanTRetrieveTh;
      goto LABEL_45;
    }
    String2 = (char *)v7[1];
    hInstanceb = hInstancea - 3;
    v33 = *v7;
    v8 = (const char *)(v7 + 2);
    xor((_BYTE *)v7 + 8, (int)hInstanceb, (char)String2);
    if ( *((_BYTE *)v7 + 8) )
    {
      strcat(Filename, v8);
      v9 = &v8[strlen(v8) + 1];
    }
    else
    {
      wsprintfA(Source, "E_N%X", v33);
      strcat(Filename, Source);
      v9 = (char *)v7 + 9;
    }
    CreateDirectoryA(Filename, 0);
    strcat(Filename, ::Source);
    hInstancec = hInstanceb - 2;
    v10 = *((_DWORD *)v9 + 1);
    v31 = v10;
    if ( (int)hInstancec > 0 && *(_DWORD *)v9 == 54398733 && v10 > 0 )
    {
      v11 = (char *)operator new(v10);
      if ( v11 )
      {
        if ( decompress_data((int)v11, &v31, (int)(v9 + 8), (int)hInstancec) )
        {
          operator delete(v11);
          lpText = aFailedToDecomp;
        }
        else
        {
          operator delete(lpBuffer);
          lpBuffer = v11;
          v12 = v11;
          v33 = (DWORD)&v11[v31];
          Destination[0] = 0;
          if ( v11 >= &v11[v31] )
            goto LABEL_34;
          do
          {
            v13 = v12;
            hInstanced = v12;
            v21 = v12;
            v14 = (DWORD *)&v12[strlen(v12) + 1];
            if ( !_strcmpi(v21, ::String2) || !_strcmpi(v13, aKrnlnFne) )
              strcpy(Destination, v13);
            v15 = *v14;
            v16 = (char *)(v14 + 1);
            strcpy(FileName, Filename);
            strcat(FileName, hInstanced);
            v17 = (HINSTANCE)CreateFileA(FileName, 0x40000000u, 0, 0, 2u, 0x80u, 0);
            hInstancee = v17;
            if ( v17 != (HINSTANCE)-1 )
            {
              WriteFile(v17, v16, v15, &NumberOfBytesWritten, 0);
              CloseHandle(hInstancee);
            }
            v12 = &v16[v15];
          }
          while ( (unsigned int)v12 < v33 );
          if ( Destination[0] )
          {
            strcpy(FileName, Filename);
            strcat(FileName, Destination);
            LibraryA = LoadLibraryA(FileName);
            if ( LibraryA )
            {
              GetNewSock = GetProcAddress(LibraryA, ProcName);
              if ( GetNewSock )
              {
                v32 = (void (__stdcall *)(int))((int (__stdcall *)(int))GetNewSock)(1000);
                if ( !v32 )
                  lpText = aTheInterfaceOf;
              }
              else
              {
                lpText = aTheKernelLibra;
              }
            }
            else
            {
              lpText = aFailedToLoadKe;
            }
          }
          else
          {
LABEL_34:
            lpText = aNotFoundTheKer;
          }
        }
        goto LABEL_45;
      }
      goto LABEL_23;
    }
    lpText = aInvalidDataInT;
  }
  else
  {
    lpText = aFailedToReadFi;
  }
LABEL_45:
  if ( lpBuffer )
    operator delete(lpBuffer);
LABEL_47:
  if ( lpText )
    MessageBoxA(0, lpText, Caption, 0x10u);
  else
    v32(4231168);
  return 0;
}
```

做的事情不多，主要是读自身的支持库并且写出，然后调用krnln.fnr中的GetNewSock函数，该函数返回一个指向函数的指针，然后使用参数0x409000调用它

读自身数据并且解压：

![image-20240303195617311](image-20240303195617311.png)

![image-20240303195706799](image-20240303195706799.png)

![image-20240303195737189](image-20240303195737189.png)

写出支持库到临时目录：

![image-20240303195827487](image-20240303195827487.png)

之后调用了krnln.fnr的GetNewSock函数并将返回值存在v32中：

![image-20240303195913335](image-20240303195913335.png)

最后调用返回的函数：

![image-20240303195957011](image-20240303195957011.png)

下面分析GetNewSock函数，函数反汇编如下：

```nasm
1005D8A0 | 55                     | push ebp                                |
1005D8A1 | 8BEC                   | mov ebp,esp                             |
1005D8A3 | 51                     | push ecx                                |
1005D8A4 | 8B45 08                | mov eax,dword ptr ss:[ebp+8]            |
1005D8A7 | 05 18FCFFFF            | add eax,FFFFFC18                        | 相当于eax + (-1000)
1005D8AC | 83F8 03                | cmp eax,3                               |
1005D8AF | 77 60                  | ja krnln.1005D911                       |
1005D8B1 | FF2485 1CD90510        | jmp dword ptr ds:[eax*4+1005D91C]       |
1005D8B8 | 8B0D 14981110          | mov ecx,dword ptr ds:[10119814]         |
1005D8BE | 41                     | inc ecx                                 |
1005D8BF | 894D 08                | mov dword ptr ss:[ebp+8],ecx            |
1005D8C2 | 8B55 08                | mov edx,dword ptr ss:[ebp+8]            |
1005D8C5 | B8 12E20210            | mov eax,<krnln.sub_1002E212>            | 1002E212:"U嬱j"
1005D8CA | 8BE5                   | mov esp,ebp                             |
1005D8CC | 5D                     | pop ebp                                 |
1005D8CD | C2 0400                | ret 4                                   |
1005D8D0 | 895D 08                | mov dword ptr ss:[ebp+8],ebx            |
1005D8D3 | 8B15 14981110          | mov edx,dword ptr ds:[10119814]         |
1005D8D9 | B9 00981110            | mov ecx,krnln.10119800                  |
1005D8DE | 8D42 01                | lea eax,dword ptr ds:[edx+1]            |
1005D8E1 | 50                     | push eax                                |
1005D8E2 | 8945 FC                | mov dword ptr ss:[ebp-4],eax            |
1005D8E5 | E8 A623FDFF            | call <krnln.sub_1002FC90>               |
1005D8EA | 8B45 08                | mov eax,dword ptr ss:[ebp+8]            |
1005D8ED | B9 00981110            | mov ecx,krnln.10119800                  |
1005D8F2 | 50                     | push eax                                |
1005D8F3 | E8 9823FDFF            | call <krnln.sub_1002FC90>               |
1005D8F8 | 8B55 FC                | mov edx,dword ptr ss:[ebp-4]            |
1005D8FB②| B8 12E20210            | mov eax,<krnln.sub_1002E212>            | 1002E212:"U嬱j"
1005D900 | 8BE5                   | mov esp,ebp                             |
1005D902 | 5D                     | pop ebp                                 |
1005D903 | C2 0400                | ret 4                                   |
1005D906 | B8 E0D70510            | mov eax,<krnln.sub_1005D7E0>            |
1005D90B | 8BE5                   | mov esp,ebp                             |
1005D90D | 5D                     | pop ebp                                 |
1005D90E | C2 0400                | ret 4                                   |
1005D911 | 33C0                   | xor eax,eax                             |
1005D913 | 8BE5                   | mov esp,ebp                             |
1005D915 | 5D                     | pop ebp                                 |
1005D916 | C2 0400                | ret 4                                   |
1005D919 | 8D                     | db 8D                                   |
1005D91A | 49                     | db 49                                   |
1005D91B | 00                     | db 0                                    |
1005D91C①| FBD80510               | dd 1005D8FB                             | 1005D8FB:sub_1005D8D0+2B
1005D920 | B8D80510               | dd 1005D8B8                             |
1005D924 | 06D90510               | dd 1005D906                             | 1005D906:sub_1005D906
1005D928 | D0D80510               | dd 1005D8D0                             | 1005D8D0:sub_1005D8D0
```

可以看到实现了一个跳转表，不同参数跳转到不同的分支，这里参数是1000，会跳转到1005D91C①处指向的1005D8FB②处

```nasm
1005D8FB | B8 12E20210            | mov eax,<krnln.sub_1002E212>            | 
1005D900 | 8BE5                   | mov esp,ebp                             |
1005D902 | 5D                     | pop ebp                                 |
1005D903 | C2 0400                | ret 4                                   |
```

这里仅仅返回了一个函数地址，回到程序之后，会使用`0x409000`参数调用这个地址指向的函数

```nasm
1002E212 | 55                     | push ebp                                |
1002E213 | 8BEC                   | mov ebp,esp                             |
1002E215 | 6A 00                  | push 0                                  |
1002E217 | 6A 00                  | push 0                                  |
1002E219 | 8B45 08                | mov eax,dword ptr ss:[ebp+8]            |
1002E21C | 50                     | push eax                                |
1002E21D | B9 38971110            | mov ecx,krnln.10119738                  |
1002E222 | E8 A8F4FFFF            | call <krnln.sub_1002D6CF>               |
1002E227 | 5D                     | pop ebp                                 |
1002E228 | C2 0400                | ret 4                                   |
```

```nasm
1002D6CF | 55                     | push ebp                                |
1002D6D0 | 8BEC                   | mov ebp,esp                             |
1002D6D2 | 83EC 08                | sub esp,8                               |
1002D6D5 | 53                     | push ebx                                |
1002D6D6 | 56                     | push esi                                |
1002D6D7 | 57                     | push edi                                |
1002D6D8 | 894D F8                | mov dword ptr ss:[ebp-8],ecx            |
1002D6DB | FF15 D0730E10          | call dword ptr ds:[<&GetProcessHeap>]   |
1002D6E1 | 8B4D F8                | mov ecx,dword ptr ss:[ebp-8]            |
1002D6E4 | 8981 A8040000          | mov dword ptr ds:[ecx+4A8],eax          | 
1002D6EA | 8B55 F8                | mov edx,dword ptr ss:[ebp-8]            |
1002D6ED | 8B82 C4000000          | mov eax,dword ptr ds:[edx+C4]           |
1002D6F3 | 83C0 01                | add eax,1                               |
1002D6F6 | 8B4D F8                | mov ecx,dword ptr ss:[ebp-8]            |
1002D6F9 | 8981 C4000000          | mov dword ptr ds:[ecx+C4],eax           |
1002D6FF | 8B55 10                | mov edx,dword ptr ss:[ebp+10]           |
1002D702 | 52                     | push edx                                |
1002D703 | 8B45 0C                | mov eax,dword ptr ss:[ebp+C]            |
1002D706 | 50                     | push eax                                |
1002D707 | 8B4D 08                | mov ecx,dword ptr ss:[ebp+8]            |
1002D70A | 51                     | push ecx                                |
1002D70B | 8B4D F8                | mov ecx,dword ptr ss:[ebp-8]            |
1002D70E | E8 6D220300            | call <krnln.sub_1005F980>               |
1002D713①| FFD0                   | call eax                                | 入口
1002D715 | 8945 FC                | mov dword ptr ss:[ebp-4],eax            |
1002D718 | 8B55 F8                | mov edx,dword ptr ss:[ebp-8]            |
1002D71B | 8B82 C4000000          | mov eax,dword ptr ds:[edx+C4]           |
1002D721 | 83E8 01                | sub eax,1                               |
1002D724 | 8B4D F8                | mov ecx,dword ptr ss:[ebp-8]            |
1002D727 | 8981 C4000000          | mov dword ptr ds:[ecx+C4],eax           |
1002D72D | 8B45 FC                | mov eax,dword ptr ss:[ebp-4]            |
1002D730 | 5F                     | pop edi                                 |
1002D731 | 5E                     | pop esi                                 |
1002D732 | 5B                     | pop ebx                                 |
1002D733 | 8BE5                   | mov esp,ebp                             |
1002D735 | 5D                     | pop ebp                                 |
1002D736 | C2 0C00                | ret C                                   |
```

调试器中跟出来1002D713①处的call调用，转到了易程序的入口点

![image-20240303202529649](image-20240303202529649.png)

由于之前程序有问题这里重新编译了，地址不一样

![image-20240303204006543](image-20240303204006543.png)

进入到入口点之后已经可以搜索到字符串了

![image-20240303204120054](image-20240303204120054.png)

转到这里并在函数首下断点，回到窗口点击按钮，发现程序被断住

![image-20240303204158938](image-20240303204158938.png)

## 独立编译入口点

### 方法1

根据具体分析中对WinMain函数流程的分析，想要找到独立编译程序入口点，可以搜索字符串Error

![image-20240303210004890](image-20240303210004890.png)

转到该处，上方不远有一个`call eax`指令

![image-20240303210042870](image-20240303210042870.png)

可在此处下断，运行

断住后，F7步进，进入到krnln.fnr模块中，步进该函数唯一一条函数调用

![image-20240303210201569](image-20240303210201569.png)

进入函数后，运行到`call eax`处

![image-20240303210318757](image-20240303210318757.png)

F7步进即可进入易语言程序入口

![image-20240303210419291](image-20240303210419291.png)

### 方法2

初步分析中已知，运行时的程序代码在一个名为.data的区段中，该区段还具有执行属性，不要断错了

在程序载入后直接下内存执行断点即可

![image-20240303211154185](image-20240303211154185.png)

然后F9运行

![image-20240303210951492](image-20240303210951492.png)

已经来到易语言程序入口点
（完）
