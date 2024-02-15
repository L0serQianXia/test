---
title: PolarCTF靶场Reverse方向简单题Writeup
typora-root-url: PolarCTF-Reverse-Easy-Writeup
date: 2024-02-16 00:25:39
tags:
categories: Writeup
---

## shell

查壳得知UPX

<img src="image-20240216002729780.png" alt="image-20240216002729780" style="zoom: 80%;" />

运行搜索字符串，找到这里：

![image-20240216003049435](image-20240216003049435.png)

简单分析得知这里使用输入内容直接与一个局部变量作比较，故断在对比函数，发现传入参数，可得flag

![image-20240216003200101](image-20240216003200101.png)

## PE结构

<img src="/image-20240216003917236.png" alt="image-20240216003917236" style="zoom:80%;" />

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

```assembly
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
