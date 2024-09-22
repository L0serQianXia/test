---
title: PolarCTF靶场Reverse方向简单难度Writeup
typora-root-url: PolarCTF-Reverse-Easy-Writeup
date: 2024-02-16 00:25:39
updateTime: 2024-06-02 14:52:00
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

# PolarCTF靶场Reverse方向简单难度

这里是简单难度题目的个人解析，分析题目代码大多采用反汇编代码，部分题目使用IDA的F5伪代码呈现

| 更新日期           | 更新内容                                             |
| ------------------ | ---------------------------------------------------- |
| 2024年4月13日23:30 | 添加解析：C^、一个flag劈三瓣儿（2024春季个人挑战赛） |
| 2024年6月2日14:52  | 添加解析：EasyCPP2、crc（2024夏季个人挑战赛）        |

## shell

查壳得知UPX

<img src="image-20240216002729780.png" alt="image-20240216002729780" style="zoom: 80%;" />

运行搜索字符串，找到这里：

![image-20240216003049435](image-20240216003049435.png)

简单分析得知这里使用输入内容直接与一个局部变量作比较，故断在对比函数，发现传入参数，可得flag

![image-20240216003200101](image-20240216003200101.png)

## PE结构

<img src="image-20240216003917236.png" alt="image-20240216003917236" style="zoom:80%;" />

查壳无有效信息，根据题目名称猜测，可能是PE结构中动了手脚，使用010 Editor打开

![image-20240216004010181](image-20240216004010181.png)

可以直接发现DOS头的魔数被修改，将其修改为MZ后保存

![image-20240216004021808](image-20240216004021808.png)

直接运行得到flag

![image-20240216004116215](image-20240216004116215.png)

## 拼接

直接拖入调试器搜索字符串可找到如下内容：

![image-20240216004338772](image-20240216004338772.png)

根据名称可直接猜测flag为flag{03ff6cf238c5cd8e7b4ee1e9567ad5a4}

转到congratulation字符串附近，分析得知如下：

![image-20240216004252180](image-20240216004252180.png)

在strcmp处下断点，运行查看栈中参数可得flag

![image-20240216004518478](image-20240216004518478.png)

![image-20240216004621795](image-20240216004621795.png)

## 加加减减



![image-20240216004656442](image-20240216004656442.png)

调试器中搜索字符串sorry，找到以下位置，此时下断点并查看参数并不可行，对比字符串已在前面被变换过

![image-20240216004756823](image-20240216004756823.png)

根据长度猜测，eax即ebp-3C（后文简化称为var3C）是程序内对比值，而ebp-78（简称为var78)是经过变换的输入值，知道这些后从上面开始分析代码

![image-20240216005257673](image-20240216005257673.png)

首先从程序中取出一串固定的字符放入var3C

![image-20240216005427412](image-20240216005427412.png)

var78用于接收用户的输入

继续向下我们看到如下代码：

![image-20240216005911681](image-20240216005911681.png)

```nasm
mov dword ptr ss:[ebp-84],0
jmp 加加减减.381A7C
mov eax,dword ptr ss:[ebp-84]
add eax,1
mov dword ptr ss:[ebp-84],eax
lea eax,dword ptr ss:[ebp-78]
push eax
call 加加减减.381082
add esp,4
cmp dword ptr ss:[ebp-84],eax
jae 加加减减.381AAA
mov eax,dword ptr ss:[ebp-84]
movsx ecx,byte ptr ss:[ebp+eax-78]
sub ecx,1
mov edx,dword ptr ss:[ebp-84]
mov byte ptr ss:[ebp+edx-78],cl
jmp 加加减减.381A6D
```

此处是一个for循环，还原伪代码大概为

```c
for (int i = 0; i < strlen(user_input); i++)
{
    char b = user_input[i];
    b = b - 1;
    user_input[i] = b;
}
```

继续向下

![image-20240216010306672](image-20240216010306672.png)

在上一个对用户输入（var78）的变换之后，直接进行了strcmp操作，将变换后的var78与var3C比较，而变换的方法是将用户输入的每个字符ASCII码-1

我们可以写出脚本还原var3C，使其每个字符的ASCII码+1即可得出flag

![image-20240216011023112](image-20240216011023112.png)

简要写出以上代码后，将eip设置到给var3C赋值处，直接运行

![image-20240216011132155](image-20240216011132155.png)

触发断点被调试器断住，同时flag已被解密

![image-20240216011223591](image-20240216011223591.png)

## 康师傅

![image-20240216221536648](image-20240216221536648.png)

搜索字符串error来到如图位置

![image-20240216221925578](image-20240216221925578.png)

分析上下代码可知，`ebp-78`为用户输入，`ebp-3C`为用于比较的字符串，`00EAE522`处为`strcmp`函数

加密用户输入字符串的代码：

```nasm
00EAE4D1 | C785 7CFFFFFF 00000000 | mov dword ptr ss:[ebp-84],0       |
00EAE4DB | EB 0F                  | jmp 康师傅.EAE4EC                    |
00EAE4DD | 8B85 7CFFFFFF          | mov eax,dword ptr ss:[ebp-84]     |
00EAE4E3 | 83C0 01                | add eax,1                         | eax:"`鶁"
00EAE4E6 | 8985 7CFFFFFF          | mov dword ptr ss:[ebp-84],eax     |
00EAE4EC | 8D45 88                | lea eax,dword ptr ss:[ebp-78]     |
00EAE4EF | 50                     | push eax                          | eax:"`鶁"
00EAE4F0 | E8 7D91FFFF            | call 康师傅.EA7672                   | strlen
00EAE4F5 | 83C4 04                | add esp,4                         |
00EAE4F8 | 3985 7CFFFFFF          | cmp dword ptr ss:[ebp-84],eax     |
00EAE4FE | 73 1A                  | jae 康师傅.EAE51A                    |
00EAE500 | 8B85 7CFFFFFF          | mov eax,dword ptr ss:[ebp-84]     |
00EAE506 | 0FBE4C05 88            | movsx ecx,byte ptr ss:[ebp+eax-78] | ecx:EntryPoint
00EAE50B | 83F1 09                | xor ecx,9                         | ecx:EntryPoint
00EAE50E | 8B95 7CFFFFFF          | mov edx,dword ptr ss:[ebp-84]     | edx:EntryPoint
00EAE514 | 884C15 88              | mov byte ptr ss:[ebp+edx-78],cl   |
00EAE518 | EB C3                  | jmp 康师傅.EAE4DD                    |
00EAE51A | 8D45 88                | lea eax,dword ptr ss:[ebp-78]     | input
```

此处实现了一个for循环，首先是`00EAE4D1`处对局部变量`ebp-84`的赋值，可视作for循环中的i，随后的一个jmp跳过了循环尾部对i的增加，进入到循环体。循环体中首先是在`00EAE4F0`处调用了`EA7672`函数，此处应为`strlen`函数，随后使用cmp指令将i与eax存储的返回值做比较，如果大于等于则跳出循环，相反则向下执行，其中通过`ebp+eax-78`逐字节访问了用户输入内容，并对其逐字节与9做异或运算，随后将异或的结果放回去。

还原伪代码为：

```c
for (int i = 0; i < strlen(user_input); i++)
{
    char b = user_input[i];
    b = b ^ 9;
    user_input[i] = b;
}
```

我们知道，简单异或加密的特性是同字符串同密钥执行两遍字符串不变，因此，我们可以直接利用调试器使用程序自身的代码解密已加密的flag

我们只需要将用户输入字符串地址处内容修改为已加密的flag（`ebp-3C`），然后执行它的算法即可。

我们在接收输入完毕之后，在内存窗口中转到`ebp-78`（scanf接收输入地址）并将其值修改为`ebp-3C`处的值

![image-20240216223920719](image-20240216223920719.png)

之后在循环结束处（`00EAE51A`）处下断点运行即可观察到flag已解密

![image-20240216224050472](image-20240216224050472.png)

![image-20240216224116384](image-20240216224116384.png)

此题和加加减减代码几乎一致，修改部分只有一句：将ASCII码-1的指令修改为了异或指令

## 另辟蹊径

**截止该文章发布时，该题目存在感染型病毒，运行前需要注意清除病毒**

![image-20240216224933629](image-20240216224933629.png)

### 解法1

这是一个mfc框架的程序，我们直接搜索字符串似乎没有有用的信息，这里可以采用下消息断点的方式断在处理点击的函数前后

x64dbg加载程序后运行，转到句柄选项卡，右键刷新

![image-20240216232639419](image-20240216232639419.png)

可以观察到这里有一个标题为100000的窗口类名为Static的窗口，右键->消息断点，由于每次点击按钮都会改变文本，下一个WM_SETTEXT断点

![image-20240216232800891](image-20240216232800891.png)

在此之后回到程序，单击一下按钮发现程序被暂停，回到x64dbg中来到调用堆栈，回到程序的调用处下断点，使其运行到程序中

![image-20240216232946368](image-20240216232946368.png)

![image-20240216233024085](image-20240216233024085.png)

这里没有什么有用的信息，继续单步回到上一层调用

![image-20240216233221139](image-20240216233221139.png)

从调用中出来我们发现一条cmp指令，这里将`esi+D4`与0比较，我们知道我们程序中点击到0就应该弹出flag，我们初步推测这是判断点击次数的代码，我们再将`esi+D4`处的数值转换为十进制

![image-20240216233358777](image-20240216233358777.png)

发现这个数为99999，我们程序中在一次单击之后，显示的数值也应该为99999，更加印证了我们的猜想

这里我们将跳转NOP掉或修改零标志位后运行程序，清楚的发现已经显示了Congratulations

![image-20240216233545699](image-20240216233545699.png)

如果我们观察的足够仔细，我们可以发现这串字符（flag）略有眼熟，我们回到调试器的句柄选项卡中

![image-20240216233740659](image-20240216233740659.png)

由于没有刷新，这里我的数值没有变，也可以印证，flag一直都在窗口中，只是存在于一个不可视的控件中，我们可以进入那个被修改的跳转之间调用的两个CALL中查看代码

![image-20240216233954238](image-20240216233954238.png)

也发现了ShowWindow函数，说明它将存储flag的不可视的控件可视了

### 解法2

工具：CheatEngine

使用CE打开进程之后搜索数值100000

![image-20240216234525210](image-20240216234525210.png)

将其值修改为1

![image-20240216234608888](image-20240216234608888.png)

回到程序中单击按钮得到flag

![image-20240216234628721](image-20240216234628721.png)

注：在解法1中我们已经看到，程序是设置完点击数值之后才进行比较，也就是说，如果我们直接将其修改为0会产生负值而不能得到flag，如图：

![image-20240216234812697](image-20240216234812697.png)

### 解法3（？

![mmexport1708098664904](mmexport1708098664904.jpg)

~~当然是连点器啦~~

## use_jadx_open_it

题目给到一个Android程序，这里我使用JEB打开

![image-20240216235419620](image-20240216235419620.png)

```java
if(MainActivity.this.edit_sn.getText().toString().equals("flag{go_to_study_android}")) {
    Toast.makeText(MainActivity.this, "flag正确", 0).show();
    return;
}
```

发现只有一个MainActivity，并且里面的代码逻辑非常清晰，flag为flag{go_to_study_android}

直接打开应该是字节码，需要右键菜单中点击解析才能反编译为Java代码

## re2

没有后缀名，直接使用DIE看一下

![image-20240217000647573](image-20240217000647573.png)

是一个64位的ELF文件，使用ida64打开，向下稍滚动发现如下代码：

```nasm
.text:0000000000400922 BF C4 0F 40 00                mov     edi, offset s         ; "Please enter flag"
.text:0000000000400927 E8 24 FD FF FF                call    _puts
.text:0000000000400927
.text:000000000040092C 48 8D 85 D0 FE FF FF          lea     rax, [rbp+input]      ; 已对其重命名，原名为rbp+var_130
.text:0000000000400933 48 89 C6                      mov     rsi, rax
.text:0000000000400936 BF D6 0F 40 00                mov     edi, offset aS        ; "%s"
.text:000000000040093B B8 00 00 00 00                mov     eax, 0
.text:0000000000400940 E8 8B FD FF FF                call    ___isoc99_scanf
.text:0000000000400940
.text:0000000000400945 48 8D 85 D0 FE FF FF          lea     rax, [rbp+input]      ; 将输入进行base64编码
.text:000000000040094C 48 89 C7                      mov     rdi, rax
.text:000000000040094F E8 6F 00 00 00                call    base64_encode
.text:000000000040094F
.text:0000000000400954 48 89 C2                      mov     rdx, rax
.text:0000000000400957 48 8D 45 80                   lea     rax, [rbp+input_]     ; 已对其重命名，原名为rbp+s2
.text:000000000040095B 48 89 D6                      mov     rsi, rdx              ; src
.text:000000000040095E 48 89 C7                      mov     rdi, rax              ; dest
.text:0000000000400961 E8 DA FC FF FF                call    _strcpy               ; 将输入复制到rbp+input_中
.text:0000000000400961
.text:0000000000400966 48 8D 55 80                   lea     rdx, [rbp+input_]
.text:000000000040096A 48 8D 85 10 FF FF FF          lea     rax, [rbp+dest]
.text:0000000000400971 48 89 D6                      mov     rsi, rdx              ; s2
.text:0000000000400974 48 89 C7                      mov     rdi, rax              ; s1
.text:0000000000400977 E8 34 FD FF FF                call    _strcmp
```

此处是对用户输入内容做的处理，将用户输入进行base64编码，用于对比的内容是`rbp+dest`（后称`dest`）

在ida中向上找到`dest`的相关写入

```nasm
.text:00000000004008AC 48 8D 85 90 FE FF FF          lea     rax, [rbp+var_170]
.text:00000000004008B3 48 01 D0                      add     rax, rdx
.text:00000000004008B6 48 BB 66 6C 61 67 7B 65 31 30 mov     rbx, 3031657B67616C66h
.text:00000000004008C0 48 89 18                      mov     [rax], rbx
.text:00000000004008C3 48 BB 61 64 63 33 39 34 39 62 mov     rbx, 6239343933636461h
.text:00000000004008CD 48 89 58 08                   mov     [rax+8], rbx
.text:00000000004008D1 48 BB 61 35 39 61 62 62 65 35 mov     rbx, 3565626261393561h
.text:00000000004008DB 48 89 58 10                   mov     [rax+10h], rbx
.text:00000000004008DF 48 BE 36 65 30 35 37 66 32 30 mov     rsi, 3032663735306536h
.text:00000000004008E9 48 89 70 18                   mov     [rax+18h], rsi
.text:00000000004008ED C7 40 20 66 38 38 33          mov     dword ptr [rax+20h], 33383866h
.text:00000000004008F4 66 C7 40 24 65 7D             mov     word ptr [rax+24h], 7D65h
.text:00000000004008FA C6 40 26 00                   mov     byte ptr [rax+26h], 0
.text:00000000004008FE 48 8D 85 90 FE FF FF          lea     rax, [rbp+var_170]
.text:0000000000400905 48 89 C7                      mov     rdi, rax
.text:0000000000400908 E8 B6 00 00 00                call    base64_encode
.text:0000000000400908
.text:000000000040090D 48 89 C2                      mov     rdx, rax
.text:0000000000400910 48 8D 85 10 FF FF FF          lea     rax, [rbp+dest]
.text:0000000000400917 48 89 D6                      mov     rsi, rdx              ; src
.text:000000000040091A 48 89 C7                      mov     rdi, rax              ; dest
.text:000000000040091D E8 1E FD FF FF                call    _strcpy
```

这里同样是将一个内容进行了base64编码，并且将内容复制到了`dest`中，这里进行编码的内容是`rbp+var_170`指向的字符串，即从`00000000004008B6`到`00000000004008FA`处写入rax寄存器所存地址的内容，rax在上方被赋值为`rbp+var_170`的地址（lea指令）

于是我们可以将鼠标选中上方写入rax寄存器的数据按r键，转换为字符，可以观察到以字符形式表示的数据

```nasm
.text:00000000004008B6 48 BB 66 6C 61 67 7B 65 31 30 mov     rbx, '01e{galf'
.text:00000000004008C0 48 89 18                      mov     [rax], rbx
.text:00000000004008C3 48 BB 61 64 63 33 39 34 39 62 mov     rbx, 'b9493cda'
.text:00000000004008CD 48 89 58 08                   mov     [rax+8], rbx
.text:00000000004008D1 48 BB 61 35 39 61 62 62 65 35 mov     rbx, '5ebba95a'
.text:00000000004008DB 48 89 58 10                   mov     [rax+10h], rbx
.text:00000000004008DF 48 BE 36 65 30 35 37 66 32 30 mov     rsi, '02f750e6'
.text:00000000004008E9 48 89 70 18                   mov     [rax+18h], rsi
.text:00000000004008ED C7 40 20 66 38 38 33          mov     dword ptr [rax+20h], '388f'
.text:00000000004008F4 66 C7 40 24 65 7D             mov     word ptr [rax+24h], '}e'
.text:00000000004008FA C6 40 26 00                   mov     byte ptr [rax+26h], 0
```

这里的数据以小端序形式存储，而字符串实际上是多个字符，并不是单个数据多个字节，不需考虑字节序的问题，这里ida并没有很好的处理这个问题，而是将其当做小端序数据显示，因此我们需要逐字节反着读取数据得到如下：flag{e10adc3949ba59abbe56e057f20f883e}

即程序中将如上字符串做base64编码后与base64编码后的用户输入数据比对，那么flag即为flag{e10adc3949ba59abbe56e057f20f883e}

## layout

直接JEB打开，观察到

![image-20240216235803763](image-20240216235803763.png)

```java
public MainActivity() {
    this.flag = "flag{go_to_study_android}";
}
```

于是我们直接输入flag……平台返回错误

我们知道安卓程序还是要看Manifest文件的

![image-20240217000012471](image-20240217000012471.png)

但是简要观察了一下也没有什么头绪，来运行程序看一下吧

![我的弱智截屏](Screenshot_20240217_000332_com.example.myapplicat.jpg)

然后发现这么一个离谱的重叠文本，此时我们联想到题目的名字：layout，flag是在界面的layout文件中，与另一个文本重叠使我们看不清，于是我们找到MainActivity的layout文件，在Resource/layout中的activity_main.xml

![image-20240217000531947](image-20240217000531947.png)

可以发现flag为flag{andoird_re}

## Why 32

实质上是个64位程序

![image-20240217003018683](image-20240217003018683.png)

![image-20240217003130372](image-20240217003130372.png)

调试器中载入，并搜索相关字符串（此处已自行分析代码并标记部分地址）

![image-20240217003122225](image-20240217003122225.png)

发现这里是一个接收输入的函数，找到调用它的函数（节约长度，二进制代码显示不全）

```nasm
0000000000401649 | 55           | push rbp                       |
000000000040164A | 48:89E5      | mov rbp,rsp                    |
000000000040164D | 48:83EC 20   | sub rsp,20                     |
0000000000401651 | E8 DAFEFFFF  | call <why 32.get_user_input>   |
0000000000401656 | E8 14FFFFFF  | call <why 32.sub_40156F>       |
000000000040165B | 83F8 01      | cmp eax,1                      | eax:EntryPoint
000000000040165E | 0F94C0       | sete al                        |
0000000000401661 | 84C0         | test al,al                     |
0000000000401663 | 74 0E        | je why 32.401673               |
0000000000401665 | 48:8D0D C929 | lea rcx,qword ptr ds:[404035]  | 0000000000404035:"Wrong input"
000000000040166C | E8 D7150000  | call <JMP.&puts>               |
0000000000401671 | EB 06        | jmp why 32.401679              |
0000000000401673 | E8 14FFFFFF  | call <why 32.sub_40158C>       |
0000000000401678 | 90           | nop                            |
0000000000401679 | 48:83C4 20   | add rsp,20                     |
000000000040167D | 5D           | pop rbp                        |
000000000040167E | C3           | ret                            |
```

发现`0000000000401656`处的函数可能是关键函数，它的返回值决定了下方跳转的走向

```nasm
000000000040156F | 55           | push rbp                                  |
0000000000401570 | 48:89E5      | mov rbp,rsp                               |
0000000000401573 | 8B05 EB5A000 | mov eax,dword ptr ds:[<input_flag_len>]   | eax:EntryPoint
0000000000401579 | 83F8 20      | cmp eax,20                                | eax:EntryPoint, 20:' '
000000000040157C | 74 07        | je why 32.401585                          |
000000000040157E | B8 01000000  | mov eax,1                                 | eax:EntryPoint
0000000000401583 | EB 05        | jmp why 32.40158A                         |
0000000000401585 | B8 00000000  | mov eax,0                                 | eax:EntryPoint
000000000040158A | 5D           | pop rbp                                   |
000000000040158B | C3           | ret                                       |
```

发现这里校验的是上方`0000000000401530`函数获取的输入字符串长度，判断其是否为0x20，即十进制的32，也就是要求输入内容位数为32位，否则会显示Wrong input

下面观察一下位数校验成功进入的CALL

```nasm
000000000040158C | 55           | push rbp                                         |
000000000040158D | 48:89E5      | mov rbp,rsp                                      |
0000000000401590 | 48:83EC 50   | sub rsp,50                                       |
0000000000401594 | C745 FC 0000 | mov dword ptr ss:[rbp-4],0                       |
000000000040159B | 48:B8 326766 | mov rax,6338633865666732                         | rax:EntryPoint
00000000004015A5 | 48:8945 D0   | mov qword ptr ss:[rbp-30],rax                    | rax:EntryPoint
00000000004015A9 | 48:B8 346364 | mov rax,6634373565646334                         | rax:EntryPoint
00000000004015B3 | 48:8945 D8   | mov qword ptr ss:[rbp-28],rax                    | rax:EntryPoint
00000000004015B7 | 48:B8 373A63 | mov rax,3B3A3B6336633A37                         | rax:EntryPoint
00000000004015C1 | 48:8945 E0   | mov qword ptr ss:[rbp-20],rax                    | rax:EntryPoint
00000000004015C5 | 48:B8 333B37 | mov rax,3A6667323B373B33                         | rax:EntryPoint
00000000004015CF | 48:8945 E8   | mov qword ptr ss:[rbp-18],rax                    | rax:EntryPoint
00000000004015D3 | 66:C745 F0 0 | mov word ptr ss:[rbp-10],0                       |
00000000004015D9 | C745 F8 0000 | mov dword ptr ss:[rbp-8],0                       |
00000000004015E0 | C745 FC 0000 | mov dword ptr ss:[rbp-4],0                       |
00000000004015E7 | EB 41        | jmp why 32.40162A                                |
00000000004015E9 | 8B45 FC      | mov eax,dword ptr ss:[rbp-4]                     | eax:EntryPoint
00000000004015EC | 48:63D0      | movsxd rdx,eax                                   | rdx:EntryPoint, eax:EntryPoint
00000000004015EF | 48:8D05 4A5A | lea rax,qword ptr ds:[<input_flag>]              | rax:EntryPoint
00000000004015F6 | 0FB60402     | movzx eax,byte ptr ds:[rdx+rax]                  | eax:EntryPoint
00000000004015FA | 0FBED0       | movsx edx,al                                     | edx:EntryPoint
00000000004015FD | 8B45 FC      | mov eax,dword ptr ss:[rbp-4]                     | eax:EntryPoint
0000000000401600 | 48:98        | cdqe                                             |
0000000000401602 | 0FB64405 D0  | movzx eax,byte ptr ss:[rbp+rax-30]               | eax:EntryPoint
0000000000401607 | 0FBEC0       | movsx eax,al                                     | eax:EntryPoint
000000000040160A | 83E8 02      | sub eax,2                                        | eax:EntryPoint
000000000040160D | 39C2         | cmp edx,eax                                      | edx:EntryPoint, eax:EntryPoint
000000000040160F | 74 15        | je why 32.401626                                 |
0000000000401611 | 48:8D0D F929 | lea rcx,qword ptr ds:[404011]                    | 0000000000404011:"you are wrong"
0000000000401618 | E8 2B160000  | call <JMP.&puts>                                 |
000000000040161D | C745 F8 0100 | mov dword ptr ss:[rbp-8],1                       |
0000000000401624 | EB 0A        | jmp why 32.401630                                |
0000000000401626 | 8345 FC 01   | add dword ptr ss:[rbp-4],1                       |
000000000040162A | 837D FC 1F   | cmp dword ptr ss:[rbp-4],1F                      |
000000000040162E | 7E B9        | jle why 32.4015E9                                |
0000000000401630 | 837D F8 00   | cmp dword ptr ss:[rbp-8],0                       |
0000000000401634 | 75 0D        | jne why 32.401643                                |
0000000000401636 | 48:8D0D E229 | lea rcx,qword ptr ds:[40401F]                    | 000000000040401F:"Half right,think more"
000000000040163D | E8 06160000  | call <JMP.&puts>                                 |
0000000000401642 | 90           | nop                                              |
0000000000401643 | 48:83C4 50   | add rsp,50                                       |
0000000000401647 | 5D           | pop rbp                                          |
0000000000401648 | C3           | ret                                              |
```

不难发现，`00000000004015E0`到`000000000040162E`处是个while循环

```nasm
00000000004015E0 | C745 FC 0000 | mov dword ptr ss:[rbp-4],0                       |
00000000004015E7 | EB 41        | jmp why 32.40162A                                |
00000000004015E9 | 8B45 FC      | mov eax,dword ptr ss:[rbp-4]                     | eax:EntryPoint
00000000004015EC | 48:63D0      | movsxd rdx,eax                                   | rdx:EntryPoint, eax:EntryPoint
00000000004015EF | 48:8D05 4A5A | lea rax,qword ptr ds:[<input_flag>]              | rax:EntryPoint
00000000004015F6 | 0FB60402     | movzx eax,byte ptr ds:[rdx+rax]                  | eax:EntryPoint
00000000004015FA | 0FBED0       | movsx edx,al                                     | edx:EntryPoint
00000000004015FD | 8B45 FC      | mov eax,dword ptr ss:[rbp-4]                     | eax:EntryPoint
0000000000401600 | 48:98        | cdqe                                             |
0000000000401602 | 0FB64405 D0  | movzx eax,byte ptr ss:[rbp+rax-30]               | eax:EntryPoint
0000000000401607 | 0FBEC0       | movsx eax,al                                     | eax:EntryPoint
000000000040160A | 83E8 02      | sub eax,2                                        | eax:EntryPoint
000000000040160D | 39C2         | cmp edx,eax                                      | edx:EntryPoint, eax:EntryPoint
000000000040160F | 74 15        | je why 32.401626                                 |
0000000000401611 | 48:8D0D F929 | lea rcx,qword ptr ds:[404011]                    | 0000000000404011:"you are wrong"
0000000000401618 | E8 2B160000  | call <JMP.&puts>                                 |
000000000040161D | C745 F8 0100 | mov dword ptr ss:[rbp-8],1                       |
0000000000401624 | EB 0A        | jmp why 32.401630                                |
0000000000401626 | 8345 FC 01   | add dword ptr ss:[rbp-4],1                       |
000000000040162A | 837D FC 1F   | cmp dword ptr ss:[rbp-4],1F                      |
000000000040162E | 7E B9        | jle why 32.4015E9            
```

还原伪代码如下：

```c
int i = 0;
while(i <= 31)
{
	if(input_flag[i] != var30[i] - 2)
	{
		puts("you are wrong");
		verify_flag = true;
		break;
	}
    i++;
}
```

就是将`var30`（rbp-30）处的内容逐字节-2并与input_flag逐字节比较，我们向上可以看到`var30`的赋值，这里在调试器里不方便复制，直接将代码运行到这里之后从内存窗口中查看

![image-20240217005005040](image-20240217005005040.png)

断住之后转到`rbp-30`的地址不难发现这里的字符串，将其逐字节-2即可得到flag

![image-20240217005837597](image-20240217005837597.png)

程序提示对了一半

![image-20240217010109141](image-20240217010109141.png)

提交平台确实提示错误

![image-20240217010051554](image-20240217010051554.png)

观察得到的字符串，有md5可能，使用在线md5解密平台得到字符串

![image-20240217010249628](image-20240217010249628.png)

提交flag{F1laig}返回正确



## ？64

运行输出一段字符串：ZmxBZ19pc2hlUmU=

![image-20240217221346485](image-20240217221346485.png)

猜测是base64编码，解码得`flAg_isheRe`

直接提交提示错误，按照靶场惯例将其进行md5值计算

得到flag{5d15777a411724ee5d029caca1ca7298}

提交提示正确

## Sign Up



>  找到正确的账号和密码 拼接起来MD5即是正确答案。 例如 账号123 密码 root 答案 : flag{md5(123root)}

![image-20240217221805393](image-20240217221805393.png)

通过在调试器中搜索字符串，我们可以找到要求我们输入账号密码的函数

```nasm
0000000000401530 | 55         | push rbp                                      |
0000000000401531 | 48:89E5    | mov rbp,rsp                                   |
0000000000401534 | 48:83EC 20 | sub rsp,20                                    |
0000000000401538 | 48:8D0D C1 | lea rcx,qword ptr ds:[404000]                 | 0000000000404000:"请输入账号和密码:"
000000000040153F | E8 FC16000 | call <JMP.&puts>                              |
0000000000401544 | 48:8D0D F5 | lea rcx,qword ptr ds:[<input_username>]       | 0000000000407040:"111"
000000000040154B | E8 E816000 | call <JMP.&gets>                              |
0000000000401550 | 48:8D0D E9 | lea rcx,qword ptr ds:[<input_password>]       | 0000000000407140:"222"
0000000000401557 | E8 DC16000 | call <JMP.&gets>                              |
000000000040155C | 48:8D0D DD | lea rcx,qword ptr ds:[<input_username>]       | 0000000000407040:"111"
0000000000401563 | E8 D816000 | call <JMP.&puts>                              |
0000000000401568 | 48:8D0D D1 | lea rcx,qword ptr ds:[<input_password>]       | 0000000000407140:"222"
000000000040156F | E8 CC16000 | call <JMP.&puts>                              |
0000000000401574 | 90         | nop                                           |
0000000000401575 | 48:83C4 20 | add rsp,20                                    |
0000000000401579 | 5D         | pop rbp                                       |
000000000040157A | C3         | ret                                           |
```

以上代码接收了我们的输入，并将其存储在内存地址中，并且输出了我们的输入

由于这里我已经输入了内容，注释中存在内存地址指向的字符串，也就是我输入的账号密码

同样可以搜索字符串，或者找到以上函数的调用处，然后紧跟着的函数调用为下方函数：

```nasm
000000000040157B | 55         | push rbp                                      |
000000000040157C | 48:89E5    | mov rbp,rsp                                   |
000000000040157F | 48:83EC 30 | sub rsp,30                                    |
0000000000401583 | C745 FC 01 | mov dword ptr ss:[rbp-4],1                    | username_correct = true
000000000040158A | C745 F8 01 | mov dword ptr ss:[rbp-8],1                    | password_correct = false
0000000000401591 | C745 F4 00 | mov dword ptr ss:[rbp-C],0                    | i = 0
0000000000401598 | EB 3A      | jmp sign_up.4015D4                            |
000000000040159A | 8B45 F4    | mov eax,dword ptr ss:[rbp-C]                  |
000000000040159D | 48:63D0    | movsxd rdx,eax                                |
00000000004015A0 | 48:8D05 99 | lea rax,qword ptr ds:[<input_username>]       | 0000000000407040:"111"
00000000004015A7 | 0FB60402   | movzx eax,byte ptr ds:[rdx+rax]               |
00000000004015AB | 0FBEC0     | movsx eax,al                                  | eax = input_username[i]
00000000004015AE | 8D48 01    | lea ecx,qword ptr ds:[rax+1]                  | ecx = eax + 1
00000000004015B1 | 8B45 F4    | mov eax,dword ptr ss:[rbp-C]                  |
00000000004015B4 | 48:63D0    | movsxd rdx,eax                                |
00000000004015B7 | 48:8D05 52 | lea rax,qword ptr ds:[<username>]             | 0000000000403010:"192168109"
00000000004015BE | 0FB60402   | movzx eax,byte ptr ds:[rdx+rax]               |
00000000004015C2 | 0FBEC0     | movsx eax,al                                  | eax = username[i]
00000000004015C5 | 39C1       | cmp ecx,eax                                   |
00000000004015C7 | 74 07      | je sign_up.4015D0                             | jump if ecx == eax
00000000004015C9 | C745 FC 00 | mov dword ptr ss:[rbp-4],0                    | username_correct = false
00000000004015D0 | 8345 F4 01 | add dword ptr ss:[rbp-C],1                    |
00000000004015D4 | 837D F4 06 | cmp dword ptr ss:[rbp-C],6                    |
00000000004015D8 | 7E C0      | jle sign_up.40159A                            | jump if i <= 6
00000000004015DA | C745 F0 00 | mov dword ptr ss:[rbp-10],0                   | j = 0
00000000004015E1 | EB 3A      | jmp sign_up.40161D                            |
00000000004015E3 | 8B45 F0    | mov eax,dword ptr ss:[rbp-10]                 | [rbp-10]:&"D:\\CTF\\PolarCTF\\Reverse\\easy\\Sign_up.exe"
00000000004015E6 | 48:63D0    | movsxd rdx,eax                                |
00000000004015E9 | 48:8D05 50 | lea rax,qword ptr ds:[<input_password>]       | 0000000000407140:"222"
00000000004015F0 | 0FB60402   | movzx eax,byte ptr ds:[rdx+rax]               |
00000000004015F4 | 0FBEC0     | movsx eax,al                                  | eax = input_password[j]
00000000004015F7 | 8D48 02    | lea ecx,qword ptr ds:[rax+2]                  | ecx = eax + 2
00000000004015FA | 8B45 F0    | mov eax,dword ptr ss:[rbp-10]                 | [rbp-10]:&"D:\\CTF\\PolarCTF\\Reverse\\easy\\Sign_up.exe"
00000000004015FD | 48:63D0    | movsxd rdx,eax                                |
0000000000401600 | 48:8D05 13 | lea rax,qword ptr ds:[<password>]             | 000000000040301A:"root"
0000000000401607 | 0FB60402   | movzx eax,byte ptr ds:[rdx+rax]               |
000000000040160B | 0FBEC0     | movsx eax,al                                  | eax = password[j]
000000000040160E | 39C1       | cmp ecx,eax                                   |
0000000000401610 | 74 07      | je sign_up.401619                             | jump if ecx == eax
0000000000401612 | C745 F8 00 | mov dword ptr ss:[rbp-8],0                    | password_correct = false
0000000000401619 | 8345 F0 01 | add dword ptr ss:[rbp-10],1                   | [rbp-10]:&"D:\\CTF\\PolarCTF\\Reverse\\easy\\Sign_up.exe"
000000000040161D | 837D F0 03 | cmp dword ptr ss:[rbp-10],3                   | [rbp-10]:&"D:\\CTF\\PolarCTF\\Reverse\\easy\\Sign_up.exe"
0000000000401621 | 7E C0      | jle sign_up.4015E3                            |
0000000000401623 | 837D FC 00 | cmp dword ptr ss:[rbp-4],0                    |
0000000000401627 | 75 14      | jne sign_up.40163D                            | jump if username_correct == true
0000000000401629 | 837D F8 00 | cmp dword ptr ss:[rbp-8],0                    |
000000000040162D | 75 0E      | jne sign_up.40163D                            | jump if password_correct == true
000000000040162F | 48:8D0D DC | lea rcx,qword ptr ds:[404012]                 | 0000000000404012:"账号密码错误:"
0000000000401636 | E8 0516000 | call <JMP.&puts>                              |
000000000040163B | EB 35      | jmp sign_up.401672                            |
000000000040163D | 837D FC 00 | cmp dword ptr ss:[rbp-4],0                    |
0000000000401641 | 75 0E      | jne sign_up.401651                            | jump if username_correct == true
0000000000401643 | 48:8D0D D6 | lea rcx,qword ptr ds:[404020]                 | 0000000000404020:"账号错误:"
000000000040164A | E8 F115000 | call <JMP.&puts>                              |
000000000040164F | EB 21      | jmp sign_up.401672                            |
0000000000401651 | 837D F8 00 | cmp dword ptr ss:[rbp-8],0                    |
0000000000401655 | 75 0E      | jne sign_up.401665                            | jump if password_correct == true
0000000000401657 | 48:8D0D CC | lea rcx,qword ptr ds:[40402A]                 | 000000000040402A:"密码错误:"
000000000040165E | E8 DD15000 | call <JMP.&puts>                              |
0000000000401663 | EB 0D      | jmp sign_up.401672                            |
0000000000401665 | 48:8D0D C8 | lea rcx,qword ptr ds:[404034]                 | 0000000000404034:"密码正确!"
000000000040166C | E8 D715000 | call <JMP.&printf>                            |
0000000000401671 | 90         | nop                                           |
0000000000401672 | 48:83C4 30 | add rsp,30                                    |
0000000000401676 | 5D         | pop rbp                                       |
0000000000401677 | C3         | ret                                           |
```

在其中，我们可以发现两处循环

第一个循环从`0000000000401591`到`00000000004015D8`结束

```nasm
0000000000401591 | C745 F4 00 | mov dword ptr ss:[rbp-C],0                    | i = 0
0000000000401598 | EB 3A      | jmp sign_up.4015D4                            |
000000000040159A | 8B45 F4    | mov eax,dword ptr ss:[rbp-C]                  |
000000000040159D | 48:63D0    | movsxd rdx,eax                                |
00000000004015A0 | 48:8D05 99 | lea rax,qword ptr ds:[<input_username>]       | 0000000000407040:"111"
00000000004015A7 | 0FB60402   | movzx eax,byte ptr ds:[rdx+rax]               |
00000000004015AB | 0FBEC0     | movsx eax,al                                  | eax = input_username[i]
00000000004015AE | 8D48 01    | lea ecx,qword ptr ds:[rax+1]                  | ecx = eax + 1
00000000004015B1 | 8B45 F4    | mov eax,dword ptr ss:[rbp-C]                  |
00000000004015B4 | 48:63D0    | movsxd rdx,eax                                |
00000000004015B7 | 48:8D05 52 | lea rax,qword ptr ds:[<username>]             | 0000000000403010:"192168109"
00000000004015BE | 0FB60402   | movzx eax,byte ptr ds:[rdx+rax]               |
00000000004015C2 | 0FBEC0     | movsx eax,al                                  | eax = username[i]
00000000004015C5 | 39C1       | cmp ecx,eax                                   |
00000000004015C7 | 74 07      | je sign_up.4015D0                             | jump if ecx == eax
00000000004015C9 | C745 FC 00 | mov dword ptr ss:[rbp-4],0                    | username_correct = false
00000000004015D0 | 8345 F4 01 | add dword ptr ss:[rbp-C],1                    |
00000000004015D4 | 837D F4 06 | cmp dword ptr ss:[rbp-C],6                    |
00000000004015D8 | 7E C0      | jle sign_up.40159A                            | jump if i <= 6
```

该循环中将`input_username`（用户输入的用户名）逐字节+1与`username`（程序中存储的字符串）进行比较，如果任何字符不同，会将`rbp-4`处的局部变量赋值为0，而该变量在下方用于决定是否输出账号错误的提示

```nasm
000000000040163D | 837D FC 00 | cmp dword ptr ss:[rbp-4],0                    |
0000000000401641 | 75 0E      | jne sign_up.401651                            | jump if username_correct == true
0000000000401643 | 48:8D0D D6 | lea rcx,qword ptr ds:[404020]                 | 0000000000404020:"账号错误:"
000000000040164A | E8 F115000 | call <JMP.&puts>                              |
```

因此我们将该变量命名为`username_correct`

上方代码还原伪代码如下：

```c
bool username_correct = true;

for (int i = 0; i <= 6; i++)
{
    char a1 = input_username[i] + 1;
    char a2 = username[i];
    if (a1 != a2)
    {
        username_correct = false;
    }
}
```

这里需要注意，我们调试器中标记`username`为`192168109`，而程序仅仅变换并校验了前7位，也就是`1921681`需要变换，变换后直接拼接`09`即可

对照上方代码，我们可以得出正确的账号为：`081057009`

然后我们观察校验密码的部分代码：

```nasm
00000000004015DA | C745 F0 00 | mov dword ptr ss:[rbp-10],0                   | j = 0
00000000004015E1 | EB 3A      | jmp sign_up.40161D                            |
00000000004015E3 | 8B45 F0    | mov eax,dword ptr ss:[rbp-10]                 | [rbp-10]:&"D:\\CTF\\PolarCTF\\Reverse\\easy\\Sign_up.exe"
00000000004015E6 | 48:63D0    | movsxd rdx,eax                                |
00000000004015E9 | 48:8D05 50 | lea rax,qword ptr ds:[<input_password>]       | 0000000000407140:"222"
00000000004015F0 | 0FB60402   | movzx eax,byte ptr ds:[rdx+rax]               |
00000000004015F4 | 0FBEC0     | movsx eax,al                                  | eax = input_password[j]
00000000004015F7 | 8D48 02    | lea ecx,qword ptr ds:[rax+2]                  | ecx = eax + 2
00000000004015FA | 8B45 F0    | mov eax,dword ptr ss:[rbp-10]                 | [rbp-10]:&"D:\\CTF\\PolarCTF\\Reverse\\easy\\Sign_up.exe"
00000000004015FD | 48:63D0    | movsxd rdx,eax                                |
0000000000401600 | 48:8D05 13 | lea rax,qword ptr ds:[<password>]             | 000000000040301A:"root"
0000000000401607 | 0FB60402   | movzx eax,byte ptr ds:[rdx+rax]               |
000000000040160B | 0FBEC0     | movsx eax,al                                  | eax = password[j]
000000000040160E | 39C1       | cmp ecx,eax                                   |
0000000000401610 | 74 07      | je sign_up.401619                             | jump if ecx == eax
0000000000401612 | C745 F8 00 | mov dword ptr ss:[rbp-8],0                    | password_correct = false
0000000000401619 | 8345 F0 01 | add dword ptr ss:[rbp-10],1                   | [rbp-10]:&"D:\\CTF\\PolarCTF\\Reverse\\easy\\Sign_up.exe"
000000000040161D | 837D F0 03 | cmp dword ptr ss:[rbp-10],3                   | [rbp-10]:&"D:\\CTF\\PolarCTF\\Reverse\\easy\\Sign_up.exe"
0000000000401621 | 7E C0      | jle sign_up.4015E3                            |
```

代码与校验用户名的代码极其相似，不同之处在于`00000000004015F7`处的指令为`lea ecx,qword ptr ds:[rax+2]`，这里我们需要将程序中的密码逐字节-2，得出我们输入的密码

root->pmmr

最终我们得到，账号为081057009，密码为pmmr，输入程序中校验，得到密码正确

![image-20240217225235004](image-20240217225235004.png)

flag为flag{aa07caa2ff9e5b774bfca3b1f20c3ea0}

### 总结

该题需要注意用户名变换的位数，程序中虽然只校验前7位，但最终平台还是只认变换前7位+不变的后2位

## easyre1

![image-20240217225650974](image-20240217225650974.png)

ELF32，用ida看一下

主函数：

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  __isoc99_scanf("%s", flag);
  enkey();
  reduce();
  check();
  return 0;
}
```

其中接收了一个用户输入，存在命名为flag的变量中，接下来看看check函数

```c
int check()
{
  if ( !strcmp(flag, "d^XSAozQPU^WOBU[VQOATZSE@AZZVOF") )
    return puts("you are right");
  else
    return puts("no no no");
}
```

该函数将flag与一串字符串进行比较，我们推测enkey和reduce中有对flag变量进行变换的内容

```c
int enkey()
{
  int i; // [esp+Ch] [ebp-4h]

  for ( i = 0; i <= 31; ++i )
    *(i + 134520992) ^= *(i + 134520896);
  return 0;
}
```

enkey函数中有一个对固定地址的写入，被写入地址转为十六进制为`0x804A0A0`，读取地址为`0x804A040`

在ida中转为十六进制显示后双击转到，可以看到`0x804A0A0`处是我们输入的flag

![image-20240217230026029](image-20240217230026029.png)

同样转到`0x804A040`处看到这里是固定的字符串`5055045045055045055045055045055`

![image-20240217230106826](image-20240217230106826.png)

enkey函数将我们的输入值与key处的内容逐字节做异或运算，并放回flag变量中



我们继续查看reduce函数

```c
int reduce()
{
  int i; // [esp+Ch] [ebp-Ch]

  for ( i = 0; i <= 30; ++i )
    --*(i + 0x804A0A0);
  putchar(10);
  return 0;
}
```

该函数访问了`0x804A0A0`处的变量，并对其前31个字节逐字节进行-1的操作，我们知道`0x804A0A0`为flag变量，即我们的输入值

至此对flag变量的变换已经结束，之后就是check函数中调用strcmp与`"d^XSAozQPU^WOBU[VQOATZSE@AZZVOF"`进行比较了

根据上面的信息我们可以写出脚本对`"d^XSAozQPU^WOBU[VQOATZSE@AZZVOF"`进行变换，首先将其前31个字符逐字节+1，然后再将其与`"5055045045055045055045055045055"`逐字节进行异或运算，即可得出flag

![image-20240217230907772](image-20240217230907772.png)

参考脚本：

```python
encrypt = "d^XSAozQPU^WOBU[VQOATZSE@AZZVOF"
key = "5055045045055045055045055045055"
flag = ""
for i in range(len(encrypt)):
    if i == 31: 							# 原程序中仅对前31个字节进行-1
            continue
    flag += chr(ord(encrypt[i]) + 1)
    
flag_ = ""
for i in range(len(flag)):
    flag_ += chr(ord(flag[i]) ^ ord(key[i]))
print(flag_)
```

最终得出flag：flag{PolarDNbecomesbiggerandstronger}

### 总结

本程序中访问一些变量使用如下方式：

```nasm
.text:0804851C 8B 45 F4                      mov     eax, [ebp+var_C]
.text:0804851F 05 A0 A0 04 08                add     eax, 804A0A0h
.text:08048524 0F B6 00                      movzx   eax, byte ptr [eax]
```

没有直接给eax赋值变量地址，避免了ida识别出变量进而通过交叉引用找到修改变量的位置

![image-20240218001104051](image-20240218001104051.png)

## babyRE

![image-20240217231209745](image-20240217231209745.png)

easy难度里的最后一题，上ida开摆（

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  __int64 v3; // rax
  char input[48]; // [rsp+20h] [rbp-20h] BYREF

  _main();
  endoce();
  std::string::basic_string(input);
  std::operator>><char>(refptr__ZSt3cin, input);
  if ( std::operator==<char>(input, &flag[abi:cxx11]) )
    v3 = std::operator<<<std::char_traits<char>>(refptr__ZSt4cout, "Ok");
  else
    v3 = std::operator<<<std::char_traits<char>>(refptr__ZSt4cout, "Err");
  (refptr__ZSt4endlIcSt11char_traitsIcEERSt13basic_ostreamIT_T0_ES6_)(v3);
  std::string::~string(input);
  return 0;
}
```

上面我们可以看到，该题目使用C++编写，使用了一个if校验我们的输入与`flag`是否相等

endoce函数如下：

```c
__int64 endoce()
{
  __int64 result; // rax
  __int64 v1; // [rsp+20h] [rbp-20h] BYREF
  __int64 v2; // [rsp+28h] [rbp-18h] BYREF
  _BYTE *v3; // [rsp+30h] [rbp-10h]
  void *v4; // [rsp+38h] [rbp-8h]

  v4 = &flag[abi:cxx11];
  v2 = std::string::begin(&flag[abi:cxx11]);
  v1 = std::string::end(&flag[abi:cxx11]);
  while ( 1 )
  {
    result = __gnu_cxx::operator!=<char *,std::string>(&v2, &v1);
    if ( !result )
      break;
    v3 = __gnu_cxx::__normal_iterator<char *,std::string>::operator*(&v2);
    *v3 += 2;
    __gnu_cxx::__normal_iterator<char *,std::string>::operator++(&v2);
  }
  return result;
}
```

里面的代码主要是将`flag`逐字节 + 2，如果我们在ida中点进`flag`应该会看到许多问号

![image-20240217232030749](image-20240217232030749.png)

这里的变量在`_main`函数中`_do_global_ctors`的调用被初始化

```c
void __cdecl _do_global_ctors()
{
  unsigned int v0; // ecx
  void (**v1)(void); // rbx
  __int64 *v2; // rsi
  unsigned int v3; // eax

  v0 = *refptr___CTOR_LIST__;
  if ( v0 == -1 )
  {
    v3 = 0;
    do
      v0 = v3++;
    while ( refptr___CTOR_LIST__[v3] );
  }
  if ( v0 )
  {
    v1 = &refptr___CTOR_LIST__[v0];
    v2 = &refptr___CTOR_LIST__[v0 - (v0 - 1) - 1];
    do
      (*v1--)();
    while ( v1 != v2 );
  }
  atexit(_do_global_dtors);
}
```

其中

```c
  if ( v0 )
  {
    v1 = &refptr___CTOR_LIST__[v0];
    v2 = &refptr___CTOR_LIST__[v0 - (v0 - 1) - 1];
    do
      (*v1--)();
    while ( v1 != v2 );
  }
```

![image-20240217232302837](image-20240217232302837.png)

这里的`dq offset _GLOBAL__sub_I__Z4flagB5cxx11`实现了对`flag`的初始化



```c
int __static_initialization_and_destruction_0(void)
{
  __int64 v1; // [rsp+0h] [rbp-30h] BYREF
  char v2; // [rsp+27h] [rbp-9h] BYREF
  __int64 v3; // [rsp+28h] [rbp-8h]

  v3 = &v1 + 39;
  std::string::basic_string<std::allocator<char>>(&flag[abi:cxx11], "asdfgcvbnmjgtlop", v3);
  std::__new_allocator<char>::~__new_allocator(&v2);
  return atexit(_tcf_0);
}
```

可以看到，最终`flag`初始化的值为`"asdfgcvbnmjgtlop"`

同样的，我们可以在调试器中步过`_main`函数调用后发现`flag`的值

![image-20240217232542564](image-20240217232542564.png)

> 回到endoce函数：里面的代码主要是将`flag`逐字节 + 2

我们可以将`flag`的内容逐字节+2，得到的值作为输入，给到我们的程序即为正确解

![image-20240217232752199](image-20240217232752199.png)

参考脚本：

```python
flag = "asdfgcvbnmjgtlop"
flag_ = ""
for i in range(len(flag)):
    flag_ += chr(ord(flag[i]) + 2
print(flag_)
```

![image-20240217232848188](image-20240217232848188.png)

## C^

拖入IDA，main函数伪代码如下：

![image-20240323232842797](image-20240323232842797.png)

首先要求我们输入，然后将输入内容传入函数fun1，之后调用check函数判断是否正确

fun1伪代码：

![image-20240323232941045](image-20240323232941045.png)

可以看到其中仅仅对我们输入字符串做了异或的操作

check函数如下：

![image-20240323233022180](image-20240323233022180.png)

将异或后的输入字符串与shfiu777作比较，如果不同则返回0，上层判断提示flag错误

可知这里将shfiu777逐字节与1异或即可得到flag

参考脚本：

```python
flag = list("shfiu777")
for i in range(len(flag)):
    flag[i] = chr(ord(flag[i]) ^ 1)
print("".join(flag))
```

输出结果：

```
right666
```

flag为`flag{f9239748ca798af5d838ac8699bb5d3d}`

## 一个flag劈三瓣儿

是个ELF32文件，拖入IDA，进入main函数中的唯一一个函数调用中，伪代码如下：

![image-20240323232525776](image-20240323232525776.png)

拼接即得flag

flag为`flag{HaiZI233N145wuD!le112@666}`

## crc

IDE检查发现ELF64文件，使用IDA64加载，main函数主要代码如下图：

![image-20240602133323745](image-20240602133323745.png)

不难发现，其中将用户输入内容分别切为4字节、1字节、4字节、2字节、4字节和1字节，并分别送入magic函数中，检查返回值是否与预期值相等。

magic函数代码如下图：

![image-20240602133319801](image-20240602133319801.png)

可以看出，计算了输入内容的crc32值，并将其返回。因此得知，main函数中预期比较的值为crc32。可以编写脚本进行暴力破解，脚本代码如下：

```python
import binascii
import string

chars = string.printable
def crc4(target):
    for a in chars:
        for b in chars:
            for c in chars:
                for d in chars:
                    str1 = a + b + c + d 
                    if(target == "{:0>8s}".format("%x"%(binascii.crc32(str1.encode("utf-8")) & 0xffffffff))):
                        print(str1)
                        return

def crc1(target):
    for a in chars:
        str1 = a
        if(target == "{:0>8s}".format("%x"%(binascii.crc32(str1.encode("utf-8")) & 0xffffffff))):
            print(str1)
            return

def crc2(target):
    for a in chars:
        for b in chars:
            str1 = a + b
            if(target == "{:0>8s}".format("%x"%(binascii.crc32(str1.encode("utf-8")) & 0xffffffff))):
                print(str1)
                return

crc4("d1f4eb9a")
crc1("15d54739")
crc4("540bbb08")
crc2("3fcbd242")
crc4("2479c623")
crc1("fcb6e20c")
```

脚本执行结果如下图：

![image-20240602133307158](image-20240602133307158.png)

拼接起来即为flag。

## EasyCPP2

IDE检查得知ELF64，使用IDA64加载。main函数主要代码如下图：

![image-20240602133404353](image-20240602133404353.png)

其中调用了encode函数，并接收了用户的输入，将用户输入与变量flag进行比较，如果相同则正确。

encode函数代码如下图：

![image-20240602133400173](image-20240602133400173.png)

flag变量值如图：

![image-20240602133355053](image-20240602133355053.png)

据encode函数代码写出对flag内容的变换脚本，脚本代码如下：

```python
flag = list("qisngksofhuivvmg")
for i in range(len(flag)):
    flag[i] = chr(ord(flag[i]) + 3)
    flag[i] = chr(ord(flag[i]) ^ 1)
    
print("".join(flag))
```

运行结果如下图：

![image-20240602133346047](image-20240602133346047.png)

此为flag。

（完）

