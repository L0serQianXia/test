---
title: BeginCTF2024个人Writeup
typora-root-url: BeginCTF2024PersonalWriteup
date: 2024-02-15 21:02:52
tags:
categories: Writeup
---

# Misc

---

## real check in

base32解密得begin{WELCOMe_to_B3GinCTF_2024_H0Pe_YOU_wiL1_11ke_i7}

## Tupper

```python
import os
 

path = 'L:\\Downloads\\tupper'
files = os.listdir(path)
for i in range(len(files)):
  if i == 0:
    continue
  temp = files[i]
  k = i
  while (int(files[k - 1].replace(".txt", "")) > int(files[k].replace(".txt", ""))):
    files[k] = files[k - 1]
    files[k - 1] = temp
    if k != 1:
      k = k - 1
print(files)

for f in range(len(files)):
  print(open(path + "\\" + files[f], 'r').read(5), end="")
```

写脚本读一下内容拼接一下内容得到MTQyNzgxOTM0MzI3MjgwMjYwNDkyOTg1NzQ1NzU1NTc1MzQzMjEwNjIzNDkzNTI1NDM1NjI2NTY3NjY0Njk3MDQwOTI4NzQ2ODgzNTQ2NzkzNzEyMTI0NDQzODIyOTg4MjEzNDIwOTM0NTAzOTg5MDcwOTY5NzYwMDI0NTg4MDc1OTg1MzU3MzUxNzIxMjY2NTc1MDQxMzExNzE2ODQ5MDcxNzMwODY2NTk1MDUxNDM5MjAzMDAwODU4MDg4MDk2NDcyNTY3OTAzODQzNzg1NTM3ODAyODI4OTQyMzk3NTE4OTg2MjAwNDExNDMzODMzMTcwNjQ3MjcxMzY5MDM2MzQ3NzA5MzYzOTg1MTg1NDc5MDA1MTI1NDg0MTk0ODYzNjQ5MTUzOTkyNTM5NDEyNDU5MTEyMDUyNjI0OTM1OTExNTg0OTc3MDgyMTkxMjY0NTM1ODc0NTY2MzczMDI4ODg3MDEzMDMzODIyMTA3NDg2Mjk4MDAwODE4MjE2ODQyODMxODczNjg1NDM2MDE1NTk3Nzg0MzE3MzUwMDY3OTQ3NjE1NDI0MTMwMDY2MjEyMTkyMDczMjI4MDg0NDkyMzIwNTA1Nzg4NTI0MzEzNjE2Nzg3NDUzNTU3NzY5MjExMzIzNTI0MTk5MzE5MDc4MzgyMDUwMDExODQ=

base64解密得14278193432728026049298574575557534321062349352543562656766469704092874688354679371212444382298821342093450398907096976002458807598535735172126657504131171684907173086659505143920300085808809647256790384378553780282894239751898620041143383317064727136903634770936398518547900512548419486364915399253941245911205262493591158497708219126453587456637302888701303382210748629800081821684283187368543601559778431735006794761542413006621219207322808449232050578852431361678745355776921132352419931907838205001184

根据题目提示，搜索tupper找到在线转换工具

![img](clip_image002.jpg)

得begin{T4UUPER!}

## where is crazyman v1.0

![img](clip_image004.jpg) ![img](clip_image006.jpg)

一眼日本，观察上方牌匾可辨认出秋*原店，网络搜索“秋原 日本”关键字可得秋叶原

flag为begin{秋叶原}

# Web

------

## Zupload

![img](clip_image007.png)

分析index.php可知

访问http://容器地址/?action=/flag 即可得到flag

begin{jU5t_r3Ad_21f66b3c71a5}

## zupload-pro

分析index.php可知，限制了action的’/’和’..’字符，但是实现了文件上传而后端没有做校验，只有前端js的校验，绕过一下成功上传小马，用蚁剑连接即可获取到flag

## zupload-pro-plus

后端校验了后缀名，但是仅校验第一个后缀名，因此我们可以将马的后缀名改为.zip.php即可绕过校验

（写wp时已无法启动容器，故没有flag）

# Reverse

------

## superguesser

不会静态去模糊，动态调试慢慢跟

![img](clip_image009.jpg)

到这么一个神奇地方，明显和其他混淆代码不一样，这里逐步跟下去可分析到如下内容

![img](clip_image011.jpg)

![img](clip_image013.jpg)

![img](clip_image014.png)

后面是对比，前面的大段赋值即为对比内容

![img](clip_image015.png)

在调试器中获取到这里的内容后进行异或即可得出flag

```python
flag = [
0x51, 0x51, 0x52, 0x5F, 0x59, 0x43, 0x5D, 0x5F, 0x59, 0x49, 0x5A, 0x59, 0x56, 0x2E, 0x26, 0x1D, 0x2A, 0x37, 0x1A, 0x27, 0x29, 0x17, 0x28, 0x24, 0x2A, 0x38, 0x25, 0x21, 0x3D, 0x0F, 0x32, 0x3A, 0x3C, 0x3D, 0x36, 0x33, 0x2A
]

result = ""
for i in range(len(flag)):
    result += chr(flag[i] ^ i + 0x33)
```

 

![img](clip_image016.png)

## 红白机

![img](clip_image018.jpg)

6502汇编，搜索到在线运行工具

![img](clip_image020.jpg)

得出begin{6502_I_LOVE_u}

## xor

分析程序写出以下脚本

```python
secret1 = "63290794207715587679621386735000"
secret2 = "41803873625901363092606632787947"
secret_high = secret1[0:17]
secret_low = secret1[16:32]
secret2_high = secret2[0:17]
secret2_low = secret2[16:32]
secret2_low += '\0'
secret_low += '\0'
print(secret_low)
print(secret_high)

flag3 = "`agh{^bvuwTooahlYocPtmyiijj|ek'p"
flag2_low = flag3[16:32]
flag2_high = flag3[0:16]
flag2_high_1 = ""

for i in range(len(flag2_high)):
  flag2_high_1 += chr(ord(flag2_high[i]) ^ ord(secret2_high[16 - i]))

flag2_low_1 = ""
for i in range(len(flag2_low)):
  flag2_low_1 += chr(ord(flag2_low[i]) ^ ord(secret2_low[16 - i]))

flag2_low_2 = ""
for i in range(len(flag2_low_1)):
  flag2_low_2 += chr(ord(flag2_low_1[i]) ^ ord(secret2_high[16 - i]))

flag2_high_2 = ""
for i in range(len(flag2_high_1)):
  flag2_high_2 += chr(ord(flag2_high_1[i]) ^ ord(secret2_high[16 - i]))

flag2_low_3 = ""
for i in range(len(flag2_low_2)):
  flag2_low_3 += chr(ord(flag2_low_2[i]) ^ ord(secret2_low[i]))
 
flag2_high_3 = ""
for i in range(len(flag2_high_2)):
  flag2_high_3 += chr(ord(flag2_high_2[i]) ^ ord(secret2_high[i]))
 
flag2_low_4 = ""
for i in range(len(flag2_low_3)):
  flag2_low_4 += chr(ord(flag2_low_3[i]) ^ ord(secret2_high[i]))

flag2_high_4 = ""
for i in range(len(flag2_high_3)):
  flag2_high_4 += chr(ord(flag2_high_3[i]) ^ ord(secret2_low[i]))

flag2_low_5 = ""
for i in range(len(flag2_low_4)):
  flag2_low_5 += chr(ord(flag2_low_4[i]) ^ ord(secret_low[16 - i]))

flag2_high_5 = ""
for i in range(len(flag2_high_4)):
  flag2_high_5 += chr(ord(flag2_high_4[i]) ^ ord(secret_high[16 - i]))

flag2_low_6 = ""
for i in range(len(flag2_low_5)):
  flag2_low_6 += chr(ord(flag2_low_5[i]) ^ ord(secret_high[16 - i]))

flag2_high_6 = ""
for i in range(len(flag2_high_5)):
  flag2_high_6 += chr(ord(flag2_high_5[i]) ^ ord(secret_low[16 - i]))

flag2_low_7 = ""
for i in range(len(flag2_low_6)):
  flag2_low_7 += chr(ord(flag2_low_6[i]) ^ ord(secret_low[i]))

flag2_high_7 = ""
for i in range(len(flag2_high_6)):
  flag2_high_7 += chr(ord(flag2_high_6[i]) ^ ord(secret_high[i]))

flag2_low_8 = ""
for i in range(len(flag2_low_7)):
  flag2_low_8 += chr(ord(flag2_low_7[i]) ^ ord(secret_high[i]))

flag2_high_8 = ""
for i in range(len(flag2_high_7)):
  flag2_high_8 += chr(ord(flag2_high_7[i]) ^ ord(secret_low[i]))

print(flag2_high_8)
print(flag2_low_8)
```

但脚本部分有问题，命名为flag2_low_8的输出部分是正确的

运行可得出

```
7679621386735000
63290794207715587
Qmfo|Wkrpv^ojlo`
[be_terminated!}
```

将上方赋值修改为

```python
flag2_low = flag3[0:16]
flag2_high = flag3[16:32]
```

再次运行输出为

```
7679621386735000
63290794207715587
hcbWsdpmlk`|`f |
blag{Virus_gonna
```

拼接后修改两个字符串的第一个字节得出

begin{Virus_gonna_be_terminated!}

![img](clip_image021.png)



## 俄语学习

![img](clip_image022.png)

![img](clip_image023.png)

这个key_在前面的俄语题目之间有赋值

![img](clip_image024.png)

![img](clip_image025.png)

虽然里面有使用rc4，但是最终得出flag的过程完全不需要rc4

![img](clip_image026.png)

最后的check方法中，enc是由上面的+i&[@Y:g8[&l$f8S8v$Y&e>{经rc4加密得出，而crypted在前面的crypt函数中有赋值

![img](clip_image027.jpg)

 

同样是经过rc4加密的，这样我们可以直接用+i&[@Y:g8[&l$f8S8v$Y&e>{根据

crypted[i] = flag[i] + key_[i] - 112;写出解密代码，而无需经过rc4加密

写出脚本如下

```python
key = [
 0xA7, 0xDF, 0xA7, 0xD6, 0xA7, 0xE9, 0xA7, 0xD6, 0xA7, 0xD4, 
 0xA7, 0xE0, 0xA7, 0xDF, 0xA7, 0xD6, 0xA7, 0xE9, 0xA7, 0xD6, 
 0xA7, 0xD4, 0xA7, 0xE0, 0xA7, 0xDF, 0xA7, 0xD6, 0xA7, 0xE9, 
 0xA7, 0xD6, 0xA7, 0xD4, 0xA7, 0xE0]

for i in range(len(key)):
  key[i] = key[i] - 114
  
enc = "+i&[@Y:g8[&l$f8S8v$Y&e>{"
result = ""
for i in range(len(enc)):
  result += chr(ord(enc[i]) + 112 - key[i])
print(result)
```

这里对key的变换是根据前面flag_prepare函数中得来

![img](clip_image028.png)

得出flag{Russian_is_so_easy}

## real checkin xor

根据提供的py文件得出脚本

```python
def verify_func2(ciper,key):
  encrypted = []
  for i in range(len(ciper)):
    encrypted.append(chr((ciper[i]^ord(key[i%len(key)]))))
  return encrypted

secert = [7, 31, 56, 25, 23, 15, 91, 21, 49, 15, 33, 88, 26, 48, 60, 58, 4, 86, 36, 64, 23, 54, 63, 0, 54, 22, 6, 55, 59, 38, 108, 39, 45, 23, 102, 27, 11, 56, 32, 0, 82, 24]
print("".join(verify_func2(secert, "ez_python_xor_reverse")))
```

得出flag

begin{3z_PY7hoN_r3V3rSE_For_TH3_Be9inNEr!}

## stick game

js有混淆，直接浏览器里调试

![img](clip_image030.jpg)

搜索score，找到对其赋值位置

![img](clip_image032.jpg)

![img](clip_image034.jpg)

搜索到相关赋值位置，然后下断点后回到浏览器进行加分

断住之后在控制台修改_0x4424f7的值为目标分数

![img](clip_image035.png)

然后取消断点，继续执行，回到游戏随便按几下失败后弹出flag

![img](clip_image037.jpg)

begin{y0u_re4l1y_g07_1337427_f2be65e6b686d8851e9052a51577f7e1}

## beginner_Forensics!!!!

![img](clip_image039.jpg)

得到一个奇怪的文件，DIE观察是普通的文本

![img](clip_image041.jpg)

 

![img](clip_image043.jpg)

使用十六进制编辑器打开发现如下关键内容BatchEncryption Build 201610 By gwsbhqt@163.com

 

 



 

 

网络搜索相关内容后得到解密脚本，跑一下得出内容

```cmd
@echo off
echo catf1y:your flag is already deleted by me.
set find_me_pls = b@TcH_O8FU$c@T1on_15_e@SY_70_SO1vE
echo crazyman:no no no no no no !!!!! i need flag.
echo Attention:can you help crazyman to find the flag?
echo Attention:Submit the info you are looking for on begin{*}
```

（已省略与题目无关内容）

Flag为begin{b@TcH_O8FU$c@T1on_15_e@SY_70_SO1vE}

![img](clip_image045.jpg)

## 逆向工程(reverse)入门指南

下载得pdf文件，全选后发现一处不可见的文本被选中

复制出来得出begin{0kay_1_thiNK_YoU_Ar3_a1Re@DY_rE4D_6uiDe8ooK_

AnD_9OT_FL46}

 

