---
title: PolarCTF靶场Reverse方向中等难度Writeup
typora-root-url: PolarCTF-Reverse-Medium-Writeup
date: 2024-02-25 00:44:52
updateTime: 2024-09-22 15:20:00
tags:
- PolarCTF
- CTF
- wp
- Writeup
- re
categories: 
- Writeup
- PolarCTF
---

# PolarCTF靶场Reverse方向中等难度

这里是中等难度题目的个人解析，分析题目代码多采用IDA的F5伪代码

| 更新时间           | 更新内容                                                 |
| ------------------ | -------------------------------------------------------- |
| 2024年4月13日23:30 | 添加解析：猜猜我在哪、易位（2024春季个人挑战赛）         |
| 2024年6月2日14:55  | 添加解析：EasyGo、c2（2024夏季个人挑战赛）               |
| 2024年9月22日15:20 | 添加解析：RE_jar、语言不通禁止入内（2024秋季个人挑战赛） |

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

## 左右为难

![image-20240224230217819](image-20240224230217819.png)

迷宫题，IDA反编译:

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  int v3; // ecx
  char v4; // al
  char v5; // dl
  char v7[132]; // [esp+8h] [ebp-88h] BYREF

  strcpy(
    v7,
    "00000000000000000@00000111000000010011110101110001001000010101000100111001110110010000100000001001111110000000$00000000000000000");
  v3 = 0;
  do
  {
    v4 = v7[v3++];
    byte_41D2CF[v3] = v4;
  }
  while ( v4 );
  x = 1;
  y = 1;
  puts("Welcome to the maze of my heart!\r\nPlease use 'wasd' control yourself, good luck!\r\nPress ary key to start:");
  ((void (*)(void))sub_404DF7)();
  sub_401010("Please input your route:", (char)"pause");
  while ( 1 )
  {
    switch ( (unsigned __int8)j___fgetchar() )
    {
      case 'a':
        --x;
        break;
      case 'd':
        ++x;
        break;
      case 's':
        ++y;
        break;
      case 'w':
        --y;
        break;
      default:
        continue;
    }
    v5 = byte_41D2D0[16 * y + x];
    if ( v5 == '0' )
      break;
    if ( v5 == '$' )
      success();
    byte_41D2D0[16 * y + x] = '@';
  }
  sub_401010("You lose!!!\r\n", v7[0]);
  return 0;
}
```

可以看到，16个字符为一行，把地图拿出来划分好，碰到$为成功，@为目前所在位置，碰到0失败

```
0000000000000000
0@00000111000000
0100111101011100
0100100001010100
0100111001110110
0100001000000010
01111110000000$0
0000000000000000
```

依照地图可以写出路线

```
sssssdddddwwaawwdddwddsssddwwddssdss
```

![image-20240224230918581](image-20240224230918581.png)

flag为`flag{f787a0b786068936636c1e10e246a297}`

## 混淆Code？

![image-20240224233333266](image-20240224233333266.png)

IDA中反编译

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  int j; // [rsp+28h] [rbp-58h]
  int i; // [rsp+2Ch] [rbp-54h]

  _main();
  puts("Input :");
  gets(input_flag);
  Check_Length();
  Strlen();
  for ( i = 0; i < strlen(input_flag); ++i )
  {
    for ( j = 0; j < strlen(input_flag); ++j )
    {
      if ( (j & 1) != 0 )
        flag[100 * j + i] = i + 98;
      else
        flag[100 * i + j] = j + 97;
    }
  }
  if ( !tick )
    X();
  check();
  return 0;
}
```

先看check函数

```c
__int64 check(void)
{
  int *v0; // rdx
  __int64 v2; // [rsp+0h] [rbp-80h] BYREF
  _WORD v3[8]; // [rsp+20h] [rbp-60h] BYREF
  int v4; // [rsp+80h] [rbp+0h]
  int v5; // [rsp+84h] [rbp+4h] BYREF
  int i; // [rsp+8Ch] [rbp+Ch]

  strcpy((char *)v3, "`lfgc-y`b}v!");
  HIBYTE(v3[6]) = 0;
  v3[7] = 0;
  memset(&v2 + 6, 0, 0x50ui64);
  v4 = 0;
  v0 = &v5;
  for ( i = 0; i < x; ++i )
  {
    v0 = (int *)i;
    if ( *((_BYTE *)v3 + i) != input_flag[i] )
    {
      printf("Error!");
      return 0i64;
    }
  }
  printf(aRight, v0);
  return 1i64;
}
```

里面将一串固定字符串与我们的输入进行比较

```c
__int64 X(void)
{
  __int64 result; // rax
  int i; // [rsp+Ch] [rbp-4h]

  for ( i = 0; ; ++i )
  {
    result = (unsigned int)(x - 1);
    if ( (int)result <= i )
      break;
    input_flag[i] ^= j++;
  }
  return result;
}
```

X函数对我们的输入字符串进行了变换

![image-20240224233444038](image-20240224233444038.png)

j是全局变量，而且只有该函数中引用，初始值为8

而这个名为x的全局变量，在Strlen函数中写入

```c
__int64 Strlen(void)
{
  __int64 result; // rax
  int i; // [rsp+Ch] [rbp-4h]

  for ( i = 0; ; ++i )
  {
    result = (unsigned __int8)input_flag[i];
    if ( !(_BYTE)result )
      break;
    ++x;
  }
  return result;
}
```

我们可以看到，x最终的值为输入内容的长度

回看上面对输入字符串变换的函数（X函数）中的代码

```c
result = (unsigned int)(x - 1);
if ( (int)result <= i )
  break;
```

这里显示，我们并不对最后一个字符做变换

了解以上信息，我们仍困惑于main函数的如下代码：

```c
for ( i = 0; i < strlen(input_flag); ++i )
{
    for ( j = 0; j < strlen(input_flag); ++j )
    {
      if ( (j & 1) != 0 )
        flag[100 * j + i] = i + 98;
      else
        flag[100 * i + j] = j + 97;
    }
}
if ( !tick )
	X();
```

这个tick变量在Check_Length函数中被赋值

```c
size_t Check_Length(void)
{
  size_t result; // rax

  result = strlen(input_flag);
  if ( result != 37 )
    tick = 0;
  return result;
}
```

如果我们输入字符串的长度不为37最终就会执行X函数，否则就不会执行（X函数就是变换字符串的函数）

而名为flag的全局变量在IDA的交叉引用中并未找到其他调用

![image-20240224234002620](image-20240224234002620.png)

![image-20240224234013442](image-20240224234013442.png)

可以看到flag变量大小为2740h，此处没有其他变量，即使是for循环写入最大值3737（E99h）也不会影响到其他变量，所以我们暂时不管他

先将下面的字符串做异或，得出明文

```c
strcpy((char *)v3, "`lfgc-y`b}v!");
```

```python
flag = "`lfgc-y`b}v!"
flag_ = ""
j = 8
for i in range(len(flag)):
    if len(flag) - 1 <= i:
        flag_ += flag[i]
        break
    flag_ += chr(ord(flag[i]) ^ j)
    j += 1
print(flag_)
```

输出结果为`hello world!`

![image-20240224235026590](image-20240224235026590.png)

flag为`flag{fc3ff98e8c6a0d3087d515c0473f8677}`

### 小结

程序首先判断输入字符串（后称input_flag）长度是否为37，如果是则最终不会执行input_flag的变换（X函数），但是如果这样，在最后的check函数中的对比必然不成功，因为对比密文是12个字节，而input_flag是37个字节，在密文的12个字节之后都是\x00，而input_flag的12个字节后不可能为\x00；如果input_flag长度不为37，则进行input_flag的变换，之后check函数中可以成功比较。main函数中间的for循环对flag变量的赋值可能是垃圾代码，大概照应了题目名字吧

## Java_Tools

查看MANIFEST.MF文件可知主类为main.java.Test

![image-20240224235751420](image-20240224235751420.png)

反编译如下：

```java
package main.java;

import java.util.Scanner;

public class Test {
   public static void main(String[] args) {
      Scanner in = new Scanner(System.in);
      System.out.println("Welcome to Polar_Ctf!,come to play!");
      System.out.println("Please Input : ");
      String name = in.next();
      char[] Strings = name.toCharArray();
      Tools.Add_1(Strings, 3);
      Tools.Re(Strings);
      Tools.Judge(Strings);
   }
}

```

接收了我们的输入，之后调用了Tools类中的多个方法

将其逐个呈现：

```java
public static void Add_1(char[] str, int x) {
  for(int i = 0; i < str.length; ++i) {
     str[i] = (char)(str[i] + x);
  }
}
```

```java
public static void Re(char[] str) {
  for(int i = 0; i < str.length / 2 - 1; ++i) {
     char temp = str[i];
     str[i] = str[str.length - i - 1];
     str[str.length - i - 1] = temp;
  }
}
```

可以看到，共有两个变换方法，先调用Add_1方法，将输入内容逐字符+3，然后调用Re方法将字符串翻转，最后是Judge方法：

```java
public static void Judge(char[] str) {
  ArrayList Result = new ArrayList();
  ArrayList Flag = new ArrayList();
  char[] var3 = str;
  int var4 = str.length;

  for(int var5 = 0; var5 < var4; ++var5) {
     Character i = var3[var5];
     Result.add(i);
  }

  String name = "$gourZroohK";
  String sttr = new String(str);
  if (name.contains(sttr)) {
     System.out.println("You Are Right!MD5!");
  } else {
     System.out.println("You Are Wrong! please try it again!");
  }

  char[] Strings = name.toCharArray();
  char[] var13 = Strings;
  int var7 = Strings.length;

  for(int var8 = 0; var8 < var7; ++var8) {
     char c = var13[var8];
     Flag.add(c);
  }

  if (Result.equals(Flag)) {
     System.out.println("You Are Right!MD5!");
  } else {
     System.out.println("You Are Wrong! please try it again!");
  }

}
```

可以看到用于比较的字符串`$gourZroohK`，这就是变换后的字符串

我们先将其翻转，然后逐字节-3就可得到flag

参考脚本：

```python
reverse = "".join(reversed("$gourZroohK"))
flag = ""
for i in range(len(reverse)):
    flag += chr(ord(reverse[i]) - 3)
print(flag)
```

输出结果为：HelloWorld!

![image-20240225000444816](image-20240225000444816.png)

flag为`flag{06e0e6637d27b2622ab52022db713ce2}`

## PY_RE

![image-20240225000617533](image-20240225000617533.png)

```python
import Test
Dict = {}
key = 'A'
value = 26
for i in range(1,27):				
    Dict.setdefault(key, value)		#这里将A与26对应，B与25对应，以此类推
    key = chr(ord(key) + 1)
    value = value - 1
print("===================Py_Reverse====================")

def main():
    Input_Str = input("Please Input Str:\n")
    Input_Str = list(Input_Str)
    Test.EnData1(Input_Str,Dict)
    Test.Judge(Input_Str)
main()
```

上面将我们的输入给到EnData1，然后判断

```python
def EnData1(Input_Str,Dict):
    for i in range(int(len(Input_Str)/2),len(Input_Str)):
        for dict in Dict:
            if Input_Str[i] == str(dict):
                Input_Str[i] = Dict[dict]
                break
```

可以看到EnData1里从我们输入的一半处开始处理，将一半之后的内容替换为字典里的相应值，如果字典里没有就不做修改

```python
def Judge(Input_Str):
    FLAG = ['H', 'E', 'L', 'L', 'O', '_', '_', 11, 2, 7, 19, 12, 13]
    if str(Input_Str) == str(FLAG):
        print("YES!")
    else:
        print("NO!")
```

可以看到flag的长度为13，这里应该从第二个下划线处开始修改，但是字典里没有下划线，所以下换线不,

我们修改一下源码，使其输出一下字典的内容

```python
{'A': 26, 'B': 25, 'C': 24, 'D': 23, 'E': 22, 'F': 21, 'G': 20, 'H': 19, 'I': 18, 'J': 17, 'K': 16, 'L': 15, 'M': 14, 'N': 13, 'O': 12, 'P': 11, 'Q': 10, 'R': 9, 'S': 8, 'T': 7, 'U': 6, 'V': 5, 'W': 4, 'X': 3, 'Y': 2, 'Z': 1}
```

对照着字典找到相应的字符：PYTHON

输入HELLO__PYTHON提示YES

![image-20240225001434360](image-20240225001434360.png)

md5后提交提示正确

flag为`flag{ceee59bbd765a9cb20daa0c1d2b3b9d0}`

## 二层防御

![image-20240225001616303](image-20240225001616303.png)

查壳发现UPX，upx -d 脱一下

IDA载入脱壳后程序，反编译主函数：

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  _main();
  puts("Input :");
  gets(input_flag);
  Check_Length();
  Strlen();
  sub122(x);
  check();
  return 0;
}
```

先查看check函数

```c
__int64 check(void)
{
  int i; // [rsp+2Ch] [rbp-4h]

  for ( i = 0; i < x; ++i )
  {
    if ( flag1[i] != input_flag[i] )
    {
      printf("Error!");
      return 0i64;
    }
  }
  printf(aRight);
  return 1i64;
}
```

其中将flag1与输入字符串进行比较

![image-20240225001954556](image-20240225001954556.png)

flag1是固定值`allo_PWN n`，于是我们怀疑对`input_flag`做了变换

![image-20240225002103554](image-20240225002103554.png)

交叉引用确实存在很多处代码

我们回到main函数从上向下看

```c
size_t Check_Length(void)
{
  size_t result; // rax

  result = strlen(input_flag);
  if ( result != 37 )
    tick = 0;
  return result;
}
```

Check_Length函数判断了input_flag的长度，决定了tick的值

![image-20240225002206478](image-20240225002206478.png)

但是tick的交叉引用没有别处代码引用了tick，暂时不能确定flag的长度

```c
__int64 Strlen(void)
{
  __int64 result; // rax
  int i; // [rsp+Ch] [rbp-4h]

  for ( i = 0; ; ++i )
  {
    result = (unsigned __int8)input_flag[i];
    if ( !(_BYTE)result )
      break;
    ++x;
  }
  return result;
}
```

Check_Length函数之后立即调用了Strlen函数，里面根据input_flag的长度设置了全局变量x，x的值是input_flag的长度

```c
__int64 __fastcall sub122(int a1)
{
  char v2; // [rsp+2Bh] [rbp-5h]
  int i; // [rsp+2Ch] [rbp-4h]

  for ( i = 1; a1 / 2 > i; ++i )
  {
    v2 = input_flag[i];
    input_flag[i] = input_flag[a1 - i - 1];
    input_flag[a1 - i - 1] = v2;
  }
  return sub133();
}
```

sub122在Strlen函数之后被调用，传入的参数是全局变量x，代码中大概是将input_flag前后字符交换，该函数在返回前调用了sub133

```c
__int64 sub133(void)
{
  __int64 result; // rax
  int v1; // [rsp+Ch] [rbp-4h]

  v1 = 1;
  x1 = j;
  while ( 1 )
  {
    result = (unsigned int)(x - 1);
    if ( (_DWORD)result == v1 )
      break;
    input_flag[v1] ^= x1;
    --input_flag[v1++];
  }
  return result;
}
```

该函数将input_flag逐字节先与x1异或，然后-1，x1的值来自全局变量j，根据交叉引用，没有别处调用了j，j的值始终为8

![image-20240225002623612](image-20240225002623612.png)

sub122函数返回后，调用check函数

了解了以上信息，我们可以写出逆过程：先将`allo_PWN n`逐字节+1后与8异或，再将处理后的字符串按照上面的算法交换就可以得出flag

```python
flag = list("allo_PWN n")
for i in range(1, len(flag) - 1):
    flag[i] = chr((ord(flag[i]) + 1) ^ 8)
for i in range(1, int(len(flag) / 2)):
    a = flag[i]
    flag[i] = flag[len(flag) - i - 1]
    flag[len(flag) - i - 1] = a
    i += 1

print("".join(flag))
```

![image-20240225004712777](image-20240225004712777.png)

flag为`flag{ab2c636ddee2f907f3b38c151cb9b274}`

## 猜猜我在哪

拖入IDA，main函数伪代码如下：

![image-20240323233352248](image-20240323233352248.png)

可以看到这里对输入字符串的变换是随机的，会生成0-4的随机数，使用这个随机数作为key进行变换，最后与程序中存储的字符串进行比较判断flag是否正确。

encrypt函数伪代码如下：

![image-20240323233712063](image-20240323233712063.png)

这里实现了一个类似凯撒密码的加密，使用key对输入的字符串进行偏移，只会处理大写字母和小写字母（可参考ASCII码表了解其判断大小写字母的原理），其他字符不被偏移。逆运算则是减去key。

了解了加密原理之后，获取到加密后文本，则可尝试对其解密，观察main函数中第27行，其中用于比较的全局变量IDA给予其名为src，双击观察到其内容为`khb i0dj lv qrw khuh.`

![image-20240323234026885](image-20240323234026885.png)

编写一个脚本尝试对其进行如上面凯撒密码的解密

参考脚本：

```python
flag = list("khb iodj lv qrw khuh.")

for i in range(len(flag)):
    ord_ = ord(flag[i])
    if ord_ >= 0x60 and ord_ <=0x7a:
        flag[i] = chr(ord_ - 3)

print("".join(flag))
```

由于已知传进来的字符串只有小写字母，就只判断了小写字母，第6行减去的值为试出来的key，当其值为3时可观察到输出结果内存在有意义的单词

输出结果：

```
he_ flag is not here.
```

可以发现这里的脚本写的并不完美，本应在26个英文字母之间循环的字符出现了一个下划线，需要手动修复一下

这里加密后的字符为b，减去偏移3后为y（`abcdefghijklmnopqrstuvwxyz`字母表中进行循环，b减1之后则到字母表的首项，再从字母表的尾项继续减掉剩下的2，得到字母y）

最终明文为：

```
hey flag is not here.
```

输入到程序中：

![image-20240323234706986](image-20240323234706986.png)

由于key是随机的，需要多试几次才能得到key值为3，最后会提示`You are get it!`

flag为`flag{hey flag is not here.}`

## 易位

这道题始终没有头猪，最终看了官方的题解视频，才明白易位指的是什么意思

拖入IDA，观察main函数的伪代码：

![image-20240324001927327](image-20240324001927327.png)

其中调用了两个函数，可以看到上面还有两个函数存在于函数列表中，没有被任何地方调用

代码分别如下：

![image-20240324002011470](image-20240324002011470.png)

![image-20240324002018521](image-20240324002018521.png)

可以看到，对字符串做了变换之后输出，这里直接使用调试器设置EIP到此处尝试观察输出内容

![image-20240324002211937](image-20240324002211937.png)

这里转到了函数：yi，到输出内容处，可以看到这里的字符串都是乱码

函数san也是一样

以上是比赛时能够想到的内容，下面的解题思路来自官方题解

易位，指的是将两个函数中减去的值相交换

![image-20240324002354315](image-20240324002354315.png)

![image-20240324002407669](image-20240324002407669.png)

函数san中，减去的值为8；函数yi中，减去的值为0xF

在调试器中进行一下修改，并且重新将EIP设置到函数头部，重新进行解密

![image-20240324002501128](image-20240324002501128.png)

再次来到输出位置

![image-20240324002544704](image-20240324002544704.png)

可以看到这里的字符串已经是可以识别的汉字了，另一个函数中也一样处理

![image-20240324002637157](image-20240324002637157.png)

将两个字符串按语言顺序排列，得到`在这个变迁的世界仍有长存之物`，将其做MD5加密得到flag

flag为`flag{c2f447e3054e0610ca272f63f9aedc3f}`

## c2

可根据运行提示，结合IDA的反编译代码分析。运行如下图：

![image-20240602133444185](image-20240602133444185.png)

IDA反编译代码如下图：

![image-20240602133440497](image-20240602133440497.png)

首先，对用户输入字符串进行了逐字节与10异或。随后，对异或后的字符串每字节ASCII码-3，得到最终变换的字符串。最后，将变换后的字符串与程序中检查的字符串比较，判断用户输入的flag是否正确。

检查字符串如图所示：

![image-20240602133436217](image-20240602133436217.png)

仅需要对检查字符串进行上述变换的逆过程，即可得到用户应输入的字符串，编写脚本如下图：

```python
str1 = list("hefklijcda")
for i in range(len(str1)):
    str1[i] = chr(ord(str1[i]) + 3)
    str1[i] = chr(ord(str1[i]) ^ 10)

print("".join(str1))
```

## EasyGo

IDA64加载，main函数中相关验证代码如下图：

![image-20240602133531809](image-20240602133531809.png)

main函数中首先调用了main.encode()（未在截图中显示），该函数对flag变量的值进行了变换，随后读取了用户输入，并与变化后的flag值比较。

main.encode函数反编译代码如下图：

![image-20240602133527038](image-20240602133527038.png)

可知，对flag变量进行了逐字节ASCII码+2，然后异或3。

flag变量如下图：

![image-20240602133522345](image-20240602133522345.png)

它指向一处内存地址：

![image-20240602133518813](image-20240602133518813.png)

可知值为jiqnnkssghwikjhg。

由此写出脚本，代码如下：

```python
flag = list("jiqnnkssghwikjhg")
for i in range(len(flag)):
    flag[i] = chr(ord(flag[i]) + 2)
    flag[i] = chr(ord(flag[i]) ^ 3)

print("".join(flag))
```

## 语言不通禁止入内

附件是IDA生成的反汇编代码。先找到main函数，如下图：

![image-20240922104130382](image-20240922104130382.png)

发现这里将字符串传给了`processString`函数

找到该函数：

![image-20240922104334284](image-20240922104334284.png)

该函数对传入的字符串逐字节进行了与6异或后减1的操作

Python实现：

```python
str =  [0x7E, 0x60, 0x62, 0x64, 0x69, 0x75, 0x60, 0x64, 0x63, 0x64, 0x72, 0x72, 0x60, 0x68, 0x65, 0x6B, 0x7C]
flag = ""
for i in range(len(str)):
    flag += chr((str[i] ^ 6) - 1)
print(flag)
```

![image-20240922104442851](image-20240922104442851.png)

需要注意字节序问题和运算符优先级。

## RE_jar

附件提供了一个Jar文件和一个后缀名为enc的文件。

反编译Jar文件主类的代码可以得知，附件提供的RE_jar-1.0-SNAPSHOT.jar实现了加密文件的功能。

KeyGenerator类仅有的一个方法返回了一个密钥，用于AES的密钥。

对GetAesKeyB64String方法的结尾处稍作修改，使其输出密钥：

![image-20240922104745357](image-20240922104745357.png)

（图中高亮处为添加代码）

执行得密钥：9FQxXBEE2GCG1Q+AzwVvZA==

![image-20240922104749528](image-20240922104749528.png)

（执行结果）

反编译FileEncryptor类，得知其加密方法及输出格式，如下图：

![image-20240922104723602](image-20240922104723602.png)

可知，加密采用了CBC模式。并且将IV写入了加密后的文件。

![image-20240922104736040](image-20240922104736040.png)

（加密后文件分析，以附件提供encrypted.enc为例）

分析加密后文件可知，IV为28A6059CFD4381D33B4EC46CD4680069。剩余字节为加密内容，将其丢进CyberChef进行Bake：

![image-20240922104757916](image-20240922104757916.png)

（CyberChef执行结果）

将输出内容作为16进制复制：

![image-20240922104804145](image-20240922104804145.png)

高亮部分为flag

（完）
