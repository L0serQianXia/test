---
title: PolarCTF靶场Reverse方向中等难度Writeup（更新中）
typora-root-url: PolarCTF-Reverse-Medium-Writeup
date: 2024-02-24 22:44:52
tags:
- CTF
- wp
- Writeup
categories: Writeup
---

## JunkCode

![image-20240224215301405](image-20240224215301405.png)

加载进IDA

![image-20240224215249256](image-20240224215249256.png)

IDA并没有自动识别出函数，按P键

![image-20240224215328716](image-20240224215328716.png)

转到目标地址查看反汇编

```nasm
.text:00411ABE 33 C0                         xor     eax, eax
.text:00411AC0 85 C0                         test    eax, eax
.text:00411AC2 74 01                         jz      short near ptr loc_411AC4+1
.text:00411AC2
.text:00411AC4
.text:00411AC4                               loc_411AC4:                   ; CODE XREF: .text:00411AC2↑j
.text:00411AC4 E8 EB 01 E9 C7                call    near ptr 0C82A1CB4h
.text:00411AC4
.text:00411AC9 85 7C FF FF                   test    [edi+edi*8-1], edi
.text:00411ACD FF 00                         inc     dword ptr [eax]
.text:00411ACD
.text:00411ACD                               ; ---------------------------------------------------------------------------
.text:00411ACF 00                            db 0
.text:00411AD0 00 00 EB 0F 8B 85 7C FF FF FF+dd 0FEB0000h, 0FF7C858Bh, 0C083FFFFh, 7C858901h, 8DFFFFFFh, 0E850C445h, 0FFFFF59Bh, 3904C483h, 0FFFF7C85h
.text:00411AD0 83 C0 01 89 85 7C FF FF FF 8D+dd 8B1A73FFh, 0FFFF7C85h, 4CBE0FFFh, 0F183C405h, 7C958B02h, 88FFFFFFh, 0EBC4154Ch, 0C4458DC3h, 884D8D50h
.text:00411AD0 45 C4 50 E8 9B F5 FF FF 83 C4+dd 0F73AE851h, 0C483FFFFh, 75C08508h
.text:00411B24 0F 68                         db 0Fh, 68h
.text:00411B26 20 7C 41 00                   dd offset aFunny              ; "funny\r\n"
.text:00411B2A                               ; ---------------------------------------------------------------------------
.text:00411B2A E8 1C F5 FF FF                call    sub_41104B
.text:00411B2A
.text:00411B2F 83 C4 04                      add     esp, 4
.text:00411B32 EB 1E                         jmp     short loc_411B52
```

`00411AC2`处的跳转跳到了下一条指令的中间部分，而该跳转的条件是零标志位为1

上面的`xor eax, eax`将eax清空，然后`test eax, eax`将零标志位置1

可知这个跳转是必然会跳的，然而IDA将跳转指令后的一个字节（本应永不被执行）识别为了指令，导致后面的数据被解析错误

这里在IDA中先将`00411AC4`处的指令U键undefine掉，然后从`00411AC5`（跳转目标地址）处MakeCode（按C键），之后将00411AC4处的数据置为0x90（NOP）再MakeCode即可

![image-20240224220401747](image-20240224220401747.png)

截图上可发现`00411AC7`处同样有被跳过的数据，这个由于是必然跳过的，可以不将其转换为指令

之后回到函数头部按P键创建函数，即可反编译

```c
int __cdecl main_0(int argc, const char **argv, const char **envp)
{
  char v4; // [esp+0h] [ebp-154h]
  char v5; // [esp+0h] [ebp-154h]
  size_t i; // [esp+D0h] [ebp-84h]
  char Str1[60]; // [esp+DCh] [ebp-78h] BYREF
  char Str[24]; // [esp+118h] [ebp-3Ch] BYREF
  int v9; // [esp+130h] [ebp-24h]
  int v10; // [esp+134h] [ebp-20h]
  int v11; // [esp+138h] [ebp-1Ch]
  int v12; // [esp+13Ch] [ebp-18h]
  int v13; // [esp+140h] [ebp-14h]
  int v14; // [esp+144h] [ebp-10h]
  __int16 v15; // [esp+148h] [ebp-Ch]

  qmemcpy(Str, "dnceyhwli]amfg]kq]dwll{", 23);
  Str[23] = 127;
  v9 = 0;
  v10 = 0;
  v11 = 0;
  v12 = 0;
  v13 = 0;
  v14 = 0;
  v15 = 0;
  j_memset(Str1, 0, 0x32u);
  printf("please input flag\r\n", v4);
  scanf("%s", (char)Str1);
  for ( i = 0; i < j_strlen(Str); ++i )
    Str[i] ^= 2u;
  if ( !j_strcmp(Str1, Str) )
  {
    printf("funny\r\n", v5);
  }
  else
  {
    printf("%s\r\n", (char)Str1);
    printf("No\r\n", v5);
  }
  return system("pause");
}
```

代码中将输入内容与2异或，并与程序内字符串比较，这里将`dnceyhwli]amfg]kq]dwll{`与2异或即可得出flag

伪代码中17行`Str[23] = 127;`这个\x7F不是可打印字符，IDA没有将其和上面的字符串放在一起反编译出来，脚本中要加上

参考脚本：

```python
flag = "dnceyhwli]amfg]kq]dwll{\x7F"
flag_ = ""
for i in range(len(flag)):
    flag_ += chr(ord(flag[i]) ^ 2)
print(flag_)
```

flag为`flag{junk_code_is_funny}`

## RevMethod

**截止该文章发布时，该题目存在感染型病毒，运行前需要注意清除病毒**

![image-20240224221500433](image-20240224221500433.png)

运行程序给了我们一大堆flag，然后问我们真正的flag是什么

IDA反编译如下：

```c
int __cdecl main_0(int argc, const char **argv, const char **envp)
{
  unsigned int v3; // eax
  char v5; // [esp+0h] [ebp-218h]
  char v6; // [esp+0h] [ebp-218h]
  int j; // [esp+D0h] [ebp-148h]
  int i; // [esp+DCh] [ebp-13Ch]
  char v9[264]; // [esp+E8h] [ebp-130h] BYREF
  int v10; // [esp+1F0h] [ebp-28h]
  char v11[24]; // [esp+1FCh] [ebp-1Ch] BYREF

  __CheckForDebuggerJustMyCode(&unk_41D006);
  v3 = time64(0);
  srand(v3);
  strcpy(v11, "abcdef0123456789");
  v10 = 0;
  j_memset(v9, 0, 0x100u);
  for ( i = 0; i < 100; ++i )
  {
    for ( j = 0; j < 32; ++j )
      v9[j] = v11[rand() % 16];
    printf("\"flag{%s}\", \r\n", (char)v9);     // 产生随机的flag格式的字符串
  }
  printf("What is the true flag???\r\n", v5);
  scanf("%s", (char)v9);
  if ( v9[0] == *(&byte_41A000 + 160)
    && v9[1] == *(&byte_41A000 + 561)
    && v9[2] == *(&byte_41A000 + 962)
    && v9[3] == *(&byte_41A000 + 1363)
    && v9[4] == *(&byte_41A000 + 1764)
    && v9[5] == *(&byte_41A000 + 2565)
    && v9[6] == *(&byte_41A000 + 2566) )
  {
    printf("Just is it!!!", v6);
  }
  return 0;
}
```

可以发现，程序输出的flag格式的字符串都是随机生成的

`byte_41A000`处存储了一大堆flag，它们是不变的，但是也不会被输出

![image-20240224221818714](image-20240224221818714.png)

根据flag格式，输入的前5个字符是不变的，都是`flag{`，也就是说程序中判断v9从下标0到下标4这些比较都不需要关心，只需要看下标5和下标6即可

```c
  if ( v9[0] == *(&byte_41A000 + 160)
    && v9[1] == *(&byte_41A000 + 561)
    && v9[2] == *(&byte_41A000 + 962)
    && v9[3] == *(&byte_41A000 + 1363)
    && v9[4] == *(&byte_41A000 + 1764)
    && v9[5] == *(&byte_41A000 + 2565)
    && v9[6] == *(&byte_41A000 + 2566) )
  {
    printf("Just is it!!!", v6);
  }
```

可以发现，下标5和下标6比较的内容在地址上是连在一起的，转为十六进制是0xA05和0xA06，用0x41A000加上0xA05，可以找到对应的flag

![image-20240224222349064](image-20240224222349064.png)

IDA带我们转到了这里，输入到程序中

![image-20240224222413427](image-20240224222413427.png)

flag为`flag{cdb10e38735935eae8a6989e372bd598}`

## 逆一下子

![image-20240224222704278](image-20240224222704278.png)

打开是一个GUI程序，菜单中有一个flag，但是点不了

### 解法1

可以用Resource Hacker将这个菜单修改一下

![image-20240224223047977](image-20240224223047977.png)

这里有一个INACTIVE，我们将其删掉并且编译

![image-20240224223112681](image-20240224223112681.png)

此时已经可以点击，然后将其保存

![image-20240224223141044](image-20240224223141044.png)

弹了个信息框，标题把连字符去掉再用flag包起来就是flag

### 解法2

窗口过程函数里会有处理菜单点击的代码，IDA打开

![image-20240224223356008](image-20240224223356008.png)

双击进入

![image-20240224223428935](image-20240224223428935.png)

这个弹窗的标题把连字符去掉再用flag包起来就是flag

flag为`flag{c68dd2625b9125411ba71f3d810341c4}`

## 可以为师

![image-20240224223540659](image-20240224223540659.png)

这个是菜单里的关于点不了，解法1与“逆一下子”题目相同，但是使用ida可以发现代码复杂了不少，有虚函数表之类内容，于是这里用了解法1

![image-20240224224056492](image-20240224224056492.png)

得到一个信息框，由于MessageBox函数先输入内容后输入标题，猜测flag为{a5dd39834f606a4c00cc83d507c5e599}，提交提示正确

flag为`flag{a5dd39834f606a4c00cc83d507c5e599}`
