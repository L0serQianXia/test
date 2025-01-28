---
title: 2024年天山固网杯Reverse方向部分Writeup
typora-root-url: 2024-tianshanguwangbei-reverse
date: 2025-01-28 22:07:32
tags:
- re
- reverse
- 天山固网杯
- writeup
- wp
categories: Writeup
---

# 2024年天山固网杯Reverse方向部分Writeup

## 前言

WP仅供参考。

## ezVM

直接拖进IDA

![image-20250128223634205](image-20250128223634205.png)

非常易懂的逻辑，只是将输入内容丢进了vm里处理

![image-20250128223820157](image-20250128223820157.png)

（取指令和处理指令）

自定义的指令：

![image-20250128224404147](image-20250128224404147.png)

方法是动态跟，以下是跟出来的指令含义：

| 指令   | 解释                     |
| ------ | ------------------- |
| 0x11xx | 读取key[xx]，存到ax |
| 0x12xx | 读取input[xx]，存到bx |
| 0x13xx | 将xx（作为立即数）存到bx |
| 0x21xx | 将ax存放起来 |
| 0x4100 | ax = ax ^ bx |
| 0x6100 | ax = ax + bx |
| 0x9000 | 结束标志 |
| 0x7000 | 结束标志 |

整理后指令：

![image-20250128224423398](image-20250128224423398.png)

可见大段重复指令，对应伪代码：

![image-20250128224906277](image-20250128224906277.png)

编写脚本：

```python
data = [0x1D, 0x25, 0x22, 0x1D, 0x3F, 0x38, 0x43, 0x33, 0x36, 0x20, 0x17, 0x42, 0x3F, 0x48, 0x20, 0x3B, 0x65, 0x1E, 0x2F, 0x2E, 0x29, 0x6C, 0x28] #伪代码中edx指向地址，动调可得
data1 = list("YesYouFindtheVMKeyBravo") #伪代码中ecx指向地址，动调可得
a = ""
for i in range(len(data)):
    a += chr(ord(data1[i]) ^ (data[i] - i)) # xor, add对应逆变换
print(a)
```

flag为`DASCTF{E@sy_Vm_g0t_it!}`

## CheckYouFlag

### 分析

Qt写的程序，搜索字符串能找到成功提示：

![image-20250128221115043](image-20250128221115043.png)

函数上面有长得很像验证字符串的东西：

![image-20250128222444425](image-20250128222444425.png)

根据这个变量能找到下方有一处类似比较的循环：

![image-20250128222555900](image-20250128222555900.png)

如果都相同会跳转到LABEL_19，也就是上面成功提示处。

上方疑似和用户输入有关的内容：

![image-20250128222740103](image-20250128222740103.png)

可以看到，根据当前字符在字符串中的下标，选择不同的变换方式。

根据反编译代码写出脚本：

```python
data1 = [0x40, 0xD8, 0x53, 0xDA, 0x50, 0xDF, 0x3B, 0xAB, 0x7C, 0xAC, 0x20, 0xA9, 0x20, 0xFB, 0x74, 0xAA, 0x22, 0xAF, 0x73, 0xFA, 0x2E, 0xAE, 0x20, 0xFC, 0x7F, 0xAE, 0x7D, 0xAA, 0x25, 0xFA, 0x21, 0xFA, 0x70, 0xFA, 0x73, 0xFF, 0x75, 0xAD, 0x23, 0xE4]
for i in range(len(data1)):
    if i & 1 != 0:
        data1[i] = chr(data1[i] ^ 0x99)
    else:
        data1[i] = chr((data1[i] ^ 0x66) + 30)

print("".join(data1))
```

flag为`DASCTF{285d0db03b63cf7de7793acec4c3f14c}`

（完）
