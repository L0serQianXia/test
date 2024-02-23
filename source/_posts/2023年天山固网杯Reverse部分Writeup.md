---
title: 2023年天山固网杯Reverse方向部分Writeup
typora-root-url: 2023年天山固网杯Reverse部分Writeup
date: 2024-02-22 01:04:26
tags: 
- CTF
- wp
- Writeup
categories: Writeup
---

# Double

![image-20240221173151982](image-20240221173151982.png)

直接运行给出一个假flag和一个base64编码的flag(DASCTF{It_is_also_a_fake_flag!HaHaHaHa})

## 隐藏的PE文件

使用IDA查看

![image-20240221173536538](image-20240221173536538.png)

有一个很神秘的Buffer，指向：

![image-20240221173556755](image-20240221173556755.png)

见到MZ疑似是PE文件，向下滚动可发现如下内容：

```nasm
.data:0000000140003178 54                            db  54h ; T
.data:0000000140003179 00                            db    0
.data:000000014000317A 00                            db    0
.data:000000014000317B 00                            db    0
.data:000000014000317C 68                            db  68h ; h
.data:000000014000317D 00                            db    0
.data:000000014000317E 00                            db    0
.data:000000014000317F 00                            db    0
.data:0000000140003180 69                            db  69h ; i
.data:0000000140003181 00                            db    0
.data:0000000140003182 00                            db    0
.data:0000000140003183 00                            db    0
.data:0000000140003184 73                            db  73h ; s
.data:0000000140003185 00                            db    0
.data:0000000140003186 00                            db    0
.data:0000000140003187 00                            db    0
.data:0000000140003188 20                            db  20h
.data:0000000140003189 00                            db    0
.data:000000014000318A 00                            db    0
.data:000000014000318B 00                            db    0
.data:000000014000318C 70                            db  70h ; p
.data:000000014000318D 00                            db    0
.data:000000014000318E 00                            db    0
.data:000000014000318F 00                            db    0
.data:0000000140003190 72                            db  72h ; r
.data:0000000140003191 00                            db    0
.data:0000000140003192 00                            db    0
.data:0000000140003193 00                            db    0
.data:0000000140003194 6F                            db  6Fh ; o
.data:0000000140003195 00                            db    0
.data:0000000140003196 00                            db    0
.data:0000000140003197 00                            db    0
.data:0000000140003198 67                            db  67h ; g
.data:0000000140003199 00                            db    0
.data:000000014000319A 00                            db    0
.data:000000014000319B 00                            db    0
.data:000000014000319C 72                            db  72h ; r
.data:000000014000319D 00                            db    0
.data:000000014000319E 00                            db    0
.data:000000014000319F 00                            db    0
.data:00000001400031A0 61                            db  61h ; a
.data:00000001400031A1 00                            db    0
.data:00000001400031A2 00                            db    0
.data:00000001400031A3 00                            db    0
.data:00000001400031A4 6D                            db  6Dh ; m
.data:00000001400031A5 00                            db    0
.data:00000001400031A6 00                            db    0
.data:00000001400031A7 00                            db    0
.data:00000001400031A8 20                            db  20h
.data:00000001400031A9 00                            db    0
.data:00000001400031AA 00                            db    0
.data:00000001400031AB 00                            db    0
.data:00000001400031AC 63                            db  63h ; c
.data:00000001400031AD 00                            db    0
.data:00000001400031AE 00                            db    0
.data:00000001400031AF 00                            db    0
.data:00000001400031B0 61                            db  61h ; a
.data:00000001400031B1 00                            db    0
.data:00000001400031B2 00                            db    0
.data:00000001400031B3 00                            db    0
.data:00000001400031B4 6E                            db  6Eh ; n
.data:00000001400031B5 00                            db    0
.data:00000001400031B6 00                            db    0
.data:00000001400031B7 00                            db    0
.data:00000001400031B8 6E                            db  6Eh ; n
.data:00000001400031B9 00                            db    0
.data:00000001400031BA 00                            db    0
.data:00000001400031BB 00                            db    0
.data:00000001400031BC 6F                            db  6Fh ; o
.data:00000001400031BD 00                            db    0
.data:00000001400031BE 00                            db    0
.data:00000001400031BF 00                            db    0
.data:00000001400031C0 74                            db  74h ; t
...
```

间隔非常大的This Program cannot be run in DOS mode.

联想到题目名称可以推测这里肯定还有一个PE文件，可以用调试器转存一下内存映像中的.data段，删掉开头一点无用内容之后

![image-20240221174133690](image-20240221174133690.png)

下面需要做的就是把无用的00删掉，可以写脚本或者在编辑器里删

![image-20240221174809481](image-20240221174809481.png)

调试器里删考虑到直接删会乱掉，所以先填上特定字节，然后最后替换所有特定字节为空即可

![image-20240221174906271](image-20240221174906271.png)

## 分析藏匿的PE文件

保存后改后缀名可运行：

![image-20240221174947988](image-20240221174947988.png)

提示Wrong input

### 主函数分析

使用IDA打开

反编译结果如下：

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  unsigned __int8 *v3; // rbx
  __int64 v4; // rsi
  __int64 v5; // rdi
  int v6; // ebp
  __int64 v7; // rcx
  int v8; // r8d
  int v9; // eax
  unsigned __int64 v10; // rdx
  __int64 i; // r8
  int v12; // r9d
  _DWORD *v13; // rcx
  int v14; // eax
  __int64 v15; // r8
  __int64 v16; // r9
  int v17; // r11d
  _DWORD *v18; // r10
  signed __int64 v19; // rcx
  unsigned __int8 v20; // al
  const char *v21; // rcx
  int v23[4]; // [rsp+10h] [rbp-428h]
  int v24[256]; // [rsp+20h] [rbp-418h] BYREF

  sub_140001310(std::cout);
  v3 = input;
  scanf("%28s", input);
  v4 = -1i64;
  v5 = -1i64;
  do
    ++v5;
  while ( aDouble[v5] );
  memset(v24, 0, sizeof(v24));
  v6 = 0;
  v7 = 0i64;
  v8 = 2;
  do                                            // rc4_init
  {
    sbox[v7 + 2] = v8;
    sbox[v7] = v8 - 2;
    v7 += 4i64;
    v23[v7] = aDouble[(v8 - 2) % v5];
    sbox[v7 - 3] = v8 - 1;
    v23[v7 + 1] = aDouble[(v8 - 1) % v5];
    v23[v7 + 2] = aDouble[v8 % v5];
    v9 = v8 + 1;
    sbox[v7 - 1] = v8 + 1;
    v8 += 4;
    v23[v7 + 3] = aDouble[v9 % v5];
  }
  while ( v8 - 2 < 256 );
  LODWORD(v10) = 0;
  for ( i = 0i64; i < 256; ++i )
  {
    v12 = sbox[i];
    v10 = (v12 + v24[i] + v10) & 0x800000FF;
    if ( (v10 & 0x80000000) != 0i64 )
      v10 = ((v10 - 1) | 0xFFFFFF00) + 1;
    v13 = &sbox[v10];
    sbox[i] = *v13;
    *v13 = v12;
  }
  v14 = 0;
  v15 = 0i64;
  do
    ++v4;
  while ( input[v4] );
  if ( v4 > 0 )
  {
    v16 = 0i64;
    do
    {
      v14 = (v14 + 1) % 256;
      v17 = sbox[v14];
      v18 = &sbox[v14];
      v15 = (v17 + v15) & 0x800000FF;
      if ( v15 < 0 )
        v15 = ((v15 - 1) | 0xFFFFFF00) + 1;
      v10 = &sbox[v15];
      *v18 = *v10;
      *v10 = v17;
      input[v16++] ^= LOBYTE(sbox[(v17 + *v18) % 256]);// rc4_crypt
    }
    while ( v16 < v4 );
  }
  v19 = &to_compare - input;
  while ( 1 )
  {
    v20 = *v3;
    if ( *v3 != v3[v19] )                       // 实际比较的是用户输入和程序内部用于比较的字符串
      break;
    ++v3;
    if ( !v20 )
      goto LABEL_21;
  }
  v6 = v20 < v3[v19] ? -1 : 1;
LABEL_21:
  v21 = "Congratulations!";	
  if ( v6 )
    v21 = "Wrong input...";
  printf(v21, v10, v15);
  return 0;
}
```

如果熟悉RC4加密可以轻易辨认出这里使用了RC4加密，最后比较输入字符串与程序中加密后flag是否相同

### 解密Flag方式一

可使用在线RC4解密工具进行解密，key为Double

![image-20240221233506176](image-20240221233506176.png)

![image-20240221233514902](image-20240221233514902.png)

### 解密Flag方式二

调试器中定位到xor这条指令，将被写入的地址处内容改为密文，然后修改RDI寄存器的值为密文的大小（原来是需要加密的明文的大小），之后运行到`00007FF6026B12A9`处即可观察到已解密的内容。

![image-20240221234218264](image-20240221234218264.png)

解密后：

![image-20240221234430260](image-20240221234430260.png)

最终flag为`DASCTF{D0uble_Mean4_D0uble!}`

![image-20240221233539860](image-20240221233539860.png)

# xoxi

## 相同的程序，不同的代码



IDA中打开跟到主函数后发现向外的一个跳转

```c
int __cdecl main_0(int argc, const char **argv, const char **envp)
{
  char v3; // dh
  _BYTE *v4; // ecx

  *v4 ^= v3;
  JUMPOUT(0x417FE9);
}
```

而跳转到的位置还没有被IDA识别为一个函数，于是进入反汇编视图

![image-20240221234738770](image-20240221234738770.png)

跳转到的位置并没有有效代码，暂时没有头绪，使用调试器看一下

![image-20240221234944480](image-20240221234944480.png)

我们在相同地址看到的代码截然不同，程序中的代码可能是加密的，调试器在某些时刻解密了这些代码，如何找出它们呢？在代码处下硬件写入断点并重新运行程序

## 寻找解密代码

重新运行发现，调试器立即停在了写入处，甚至还没有达到程序入口点

![image-20240221235440021](image-20240221235440021.png)

我们在IDA中观察此处的函数，使用G键 Jump to address输入`004123C3`后来到了`sub_412370`，我们将其重命名为`XorCrypt`

```c
int __cdecl XorCrypt(int a1, int a2, char a3)
{
  int result; // eax
  int i; // [esp+D0h] [ebp-8h]

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  for ( i = 0; ; ++i )
  {
    result = i;
    if ( i >= a2 )
      break;
    *(_BYTE *)(i + a1) ^= a3;
  }
  return result;
}
```

这里很明显是一个异或运算，结合调试器中代码处被写入，可以得出解密代码时这里被调用了，解密的密钥在参数a3中，继续查找交叉引用

来到下方函数：

```c
int __cdecl DecryptCode(int a1, char a2)
{
  int result; // eax
  int i; // [esp+E8h] [ebp-44h]
  char *Str1; // [esp+F4h] [ebp-38h]
  __int16 v5; // [esp+118h] [ebp-14h]

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  v5 = *(_WORD *)(*(_DWORD *)(a1 + 60) + a1 + 6);
  Str1 = (char *)(a1 + *(_DWORD *)(a1 + 60) + 248);
  for ( i = 0; ; ++i )
  {
    result = v5;
    if ( i >= v5 )
      break;
    if ( !j_strcmp(Str1, ".hello") )
      return j_XorCrypt(*((_DWORD *)Str1 + 3) + a1, *((_DWORD *)Str1 + 4), a2);
    Str1 += 40;
  }
  return result;
}
```

结合IDA的Segments窗口，我们可以推测，这里正在解密`.hello`区段中的数据，`XorCrypt`的第三个参数（解密密钥）来自参数a2，而`.hello`区段也正是我们代码所在的区段，我们将其重命名为`DecryptCode`

![image-20240221235831348](image-20240221235831348.png)

继续寻找交叉引用，来到	

```c
int DecryptWith102()
{
  HMODULE ModuleHandleW; // [esp+D0h] [ebp-8h]

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  ModuleHandleW = GetModuleHandleW(0);
  return j_DecryptCode((int)ModuleHandleW, 102);
}
```

这里可以清晰的看到，给`DecryptCode`函数传入了两个参数，第一个是当前模块的基址，第二个是解密的key，我们将其命名为DecryptWith102

继续向上查找交叉引用

```c
int __stdcall TlsCallback_0_0(int a1, int a2, int a3)
{
  HANDLE CurrentProcess; // eax
  BOOL pbDebuggerPresent; // [esp+D0h] [ebp-Ch] BYREF

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  pbDebuggerPresent = 0;
  CurrentProcess = GetCurrentProcess();
  CheckRemoteDebuggerPresent(CurrentProcess, &pbDebuggerPresent);
  if ( pbDebuggerPresent || IsDebuggerPresent() )
    exit(-1);
  sub_41130C();
  return j_DecryptWith102();
}
```

来到了这个名为`TlsCallback_0_0`的函数

## TLS回调函数

TLS（Thread Local Storage，线程局部存储）回调函数，每当创建/终止进程的线程时会自动调用执行，创建进程时创建的主线程也会调用TLS回调函数，就会导致TLS回调函数的代码在程序入口点之前执行

这里正是利用了TLS技术的特性，在程序的入口点之前执行了代码，调试器中可以看到解密后的代码，因为它已执行了TLS函数，而IDA中并没有，所以IDA中才会显示加密的数据

## 利用IDA Python解密代码

我们已经知道了，关键处的代码被异或102加密了，这里我们使用IDA Python编写一段脚本来解密这些数据

这里Scripting language选择Python，解密距离参考该区段大小

![image-20240222001859906](image-20240222001859906.png)

```python
sea = idc.get_screen_ea()

for i in range(0x00,0x1600):
        b = idc.get_wide_byte(sea+i)
        decoded_byte = b ^ 102
        ida_bytes.patch_byte(sea+i,decoded_byte)
```

从当前选定处开始向下加密0x1600个字节，所以在解密前要将当前位置选好，选在区段的开头处，然后单击Run

![image-20240222002005952](image-20240222002005952.png).

运行后手动转换一下代码，然后删除一下函数并让IDA重新识别它

![image-20240222002118012](image-20240222002118012.png)

之后在函数头部按P键（即上面的Create function）即可

![image-20240222002150281](image-20240222002150281.png)

## 主函数分析

解密后反编译得出如下代码：

```c
int __cdecl main_0(int argc, const char **argv, const char **envp)
{
  FILE *v3; // eax
  size_t v4; // eax
  int i; // [esp+250h] [ebp-494h]
  char Str2[28]; // [esp+25Ch] [ebp-488h] BYREF
  char input_2[264]; // [esp+278h] [ebp-46Ch] BYREF
  char Str1[264]; // [esp+380h] [ebp-364h] BYREF
  char input_1[4]; // [esp+488h] [ebp-25Ch] BYREF
  int v11; // [esp+48Ch] [ebp-258h]
  int v12; // [esp+490h] [ebp-254h]
  int v13; // [esp+494h] [ebp-250h]
  int v14; // [esp+498h] [ebp-24Ch]
  char to_compare[35]; // [esp+4A4h] [ebp-240h]
  char v16[3]; // [esp+4C7h] [ebp-21Dh] BYREF
  char v17[264]; // [esp+4D4h] [ebp-210h] BYREF
  char v18[260]; // [esp+5DCh] [ebp-108h] BYREF

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  j_memset(v18, 0, 0x100u);
  j_memset(v17, 0, 0x100u);
  to_compare[0] = -89;                          // 加密后flag
  to_compare[1] = -38;
  to_compare[2] = -6;
  to_compare[3] = 99;
  to_compare[4] = -122;
  to_compare[5] = -16;
  to_compare[6] = -1;
  to_compare[7] = 45;
  to_compare[8] = 1;
  to_compare[9] = 68;
  to_compare[10] = 24;
  to_compare[11] = -88;
  to_compare[12] = 29;
  to_compare[13] = -34;
  to_compare[14] = -29;
  to_compare[15] = 8;
  to_compare[16] = -110;
  to_compare[17] = -65;
  to_compare[18] = 127;
  to_compare[19] = 24;
  to_compare[20] = 68;
  to_compare[21] = -71;
  to_compare[22] = 22;
  to_compare[23] = -31;
  to_compare[24] = -37;
  to_compare[25] = -27;
  to_compare[26] = -15;
  to_compare[27] = -109;
  to_compare[28] = -4;
  to_compare[29] = 40;
  to_compare[30] = -98;
  to_compare[31] = 37;
  to_compare[32] = -109;
  to_compare[33] = -65;
  to_compare[34] = -17;
  qmemcpy(v16, "oE6", sizeof(v16));             // 观察反汇编得知，这里地址是连在一起的，同样属于加密后flag
  *(_DWORD *)input_1 = 0;
  v11 = 0;
  v12 = 0;
  v13 = 0;
  v14 = 0;
  j_memset(Str1, 0, 0x100u);
  j_memset(input_2, 0, 0xFFu);
  puts("Please input the DASCTF_key:");
  v3 = _acrt_iob_func(0);
  fgets(input_1, 13, v3);
  v4 = j_strlen(input_1);
  func_1(input_1, Str1, v4);
  strcpy(Str2, "Qi6ogADjNAnMWjuL");
  if ( j_strcmp(Str1, Str2) )
  {
    puts("the key1 is wrong!");
    exit(0);
  }
  puts("Please input your flag:");
  scanf("%s", input_2);
  if ( j_strlen(input_2) != 38 )
  {
    printf("flag length is wrong!");
    exit(0);
  }
  func_2(v17, v18, input_1, 12);
  func_3(v18, input_2, 38, input_1);
  for ( i = 0; i < 38; ++i )
  {
    if ( input_2[i] != to_compare[i] )
    {
      printf("flag is wrong!");
      exit(0);
    }
  }
  printf("ok you get the flag!");
  return 0;
}
```

大概分析得知，有两处输入，第一处输入在经过func_1的处理后与`Qi6ogADjNAnMWjuL`进行比较，第二处经过func_3的处理后与`to_compare`比较

### 密码1

先观察func_1

![image-20240222002937841](image-20240222002937841.png)

（图片里的常量被重新组织过）

双击查看常量

![image-20240222003005275](image-20240222003005275.png)

清晰地发现base64码表，于是我们将`Qi6ogADjNAnMWjuL`进行base64解码

![image-20240222003059297](image-20240222003059297.png)

得出的内容并不是可打印字符，可能解码的文字编码不对，但flag中使用非ASCII字符的情况较小，考虑是base64换表，同样在调试器中转到此处

![image-20240222003417205](image-20240222003417205.png)

同样在入口点处时，此处的码表已经被换掉，这里回想TLS函数中的另一个函数调用

```c
int __stdcall TlsCallback_0_0(int a1, int a2, int a3)
{
  HANDLE CurrentProcess; // eax
  BOOL pbDebuggerPresent; // [esp+D0h] [ebp-Ch] BYREF

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  pbDebuggerPresent = 0;
  CurrentProcess = GetCurrentProcess();
  CheckRemoteDebuggerPresent(CurrentProcess, &pbDebuggerPresent);
  if ( pbDebuggerPresent || IsDebuggerPresent() )
    exit(-1);
  sub_41130C();
  return j_DecryptWith102();
}
```

`sub_41130C`这个函数我们还没有看过，它可能就是用于换表的函数

```c
void *sub_411B10()
{
  size_t v0; // eax
  int k; // [esp+D0h] [ebp-94h]
  int v3; // [esp+DCh] [ebp-88h]
  int v4; // [esp+E8h] [ebp-7Ch]
  int j; // [esp+F4h] [ebp-70h]
  int i; // [esp+100h] [ebp-64h]
  char Str[76]; // [esp+10Ch] [ebp-58h] BYREF
  int v8; // [esp+158h] [ebp-Ch]

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  srand(0x66u);
  v8 = 64;
  j_memset(Str, 0, 0x41u);
  for ( i = 0; i < 64; ++i )
    dword_41D188[i] = i;
  for ( j = v8 - 1; j > 0; --j )
  {
    v4 = rand() % (j + 1);
    v3 = dword_41D188[j];
    dword_41D188[j] = dword_41D188[v4];
    dword_41D188[v4] = v3;
  }
  for ( k = 0; k < 64; ++k )
    Str[k] = aAbcdefghijklmn[dword_41D188[k]];
  v0 = j_strlen(Str);
  return j_memcpy(aAbcdefghijklmn, Str, v0);
}
```

最后的`j_memcpy(aAbcdefghijklmn, Str, v0);`很明显地指出了它对base64码表做了替换

这里我们用修改后的码表解一下`Qi6ogADjNAnMWjuL`

![image-20240222003750180](image-20240222003750180.png)

解码得`dasctf_world`

![image-20240222003941794](image-20240222003941794.png)

第一个密码验证通过

### 真正的flag

flag验证如下：

```c
  puts("Please input your flag:");
  scanf("%s", input_2);
  if ( j_strlen(input_2) != 38 )
  {
    printf("flag length is wrong!");
    exit(0);
  }
  func_2(v17, v18, input_1, 12);
  func_3(v18, input_2, 38, input_1);
  for ( i = 0; i < 38; ++i )
  {
    if ( input_2[i] != to_compare[i] )
    {
      printf("flag is wrong!");
      exit(0);
    }
  }
  printf("ok you get the flag!");
  return 0;
}
```

首先我们输入的flag为38位，然后对我们第二次输入的内容进行变换后与to_compare比较，这里我们需要研究的是它的变换算法

下为func_2：

```c
void *__cdecl rc4_init(int a1, int sBox, int key, unsigned int len)
{
  void *result; // eax
  char v5; // [esp+D3h] [ebp-135h]
  char v6[264]; // [esp+DCh] [ebp-12Ch] BYREF
  int v7; // [esp+1E4h] [ebp-24h]
  int v8; // [esp+1F0h] [ebp-18h]
  int i; // [esp+1FCh] [ebp-Ch]

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  v8 = 0;
  v7 = 0;
  result = j_memset(v6, 0, 0x100u);
  for ( i = 0; i < 256; ++i )
  {
    *(i + a1) = i;
    *(i + sBox) = i;
    v6[i] = *(key + i % len);
    result = (i + 1);
  }
  for ( i = 0; i < 256; ++i )
  {
    v8 = (v6[i] + v8 + *(i + sBox)) % 256;
    v7 = (*(i + a1) + v7 + *(i + sBox)) % 256;
    v5 = *(i + sBox);
    *(i + sBox) = *(v8 + sBox);
    *(v8 + sBox) = *(v7 + sBox);
    *(v7 + sBox) = v5;
    result = (i + 1);
  }
  return result;
}
```

（已对照公开的RC4的C语言实现进行重命名）

我们会发现和Double的算法很像，都是RC4，这里是初始化

下为func_3：

```c
int __cdecl rc4_crypt(int sBox, int data, unsigned int len, int a4)
{
  unsigned int i; // [esp+D0h] [ebp-44h]
  char v6; // [esp+DFh] [ebp-35h]
  int v7; // [esp+E8h] [ebp-2Ch]
  int v8; // [esp+100h] [ebp-14h]
  int v9; // [esp+10Ch] [ebp-8h]

  __CheckForDebuggerJustMyCode(&unk_41F0A4);
  v9 = 0;
  v8 = 0;
  v7 = 0;
  for ( i = 0; i < len; ++i )
  {
    v9 = (v9 + 1) % 256;
    v8 = (v8 + *(v9 + sBox)) % 256;
    v7 = (*(v8 + sBox) + v7 + *(v9 + sBox)) % 256;
    v6 = *(v9 + sBox);
    *(v9 + sBox) = *(v8 + sBox);
    *(v8 + sBox) = *(v7 + sBox);
    *(v7 + sBox) = v6;
    *(i + data) ^= *(a4 + i % 12) ^ *((*(v7 + sBox) + *(v8 + sBox) + *(v9 + sBox)) % 256 + sBox);
  }
  return data;
}
```

（已对照公开的RC4的C语言实现进行重命名）

这里同样是RC4，但是与正常的RC4不同，这里的异或语句较为复杂

Double题中RC4的异或语句：`input[v16++] ^= LOBYTE(sbox[(v17 + *v18) % 256]);`

而这里的明显复杂得多：`input[i] ^= a4[i %12] ^ (sBox[v7] + sBox[v8] + sBox[v9]) % 256 + sBox;`（已转换为类似形式的代码）

这样就不能用在线RC4解密工具了，但是还可以替换掉需要加密的文本，将密文作为参数调用该函数，即可得到明文

![image-20240222010145305](image-20240222010145305.png)

调试器中运行到rc4加密处，将需要加密的字符串的地址修改为密文的地址，然后步过函数调用

![image-20240222010300107](image-20240222010300107.png)

密文已被解密`DASCTF{wow_you_will_love_the_function}`

![image-20240222010339152](image-20240222010339152.png)

# 总结

## Double

考察了PE文件的识别和RC4算法的识别

## xoxi

考察了TLS回调函数，换表Base64，变异RC4算法
