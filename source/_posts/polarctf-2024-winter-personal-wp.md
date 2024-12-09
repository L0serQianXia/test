---
title: PolarCTF2024冬季个人挑战赛个人Writeup
typora-root-url: polarctf-2024-winter-personal-wp
date: 2024-12-09 20:39:53
tags:
- PolarCTF
- Writeup
- wp
- Reverse
- misc
- web
- re
categories:
- Writeup
- PolarCTF
---

# PolarCTF2024冬季个人挑战赛个人Writeup

## Misc

### Sign-in questions

下载得到的音频听了听没有明显异常，利用DIE检测到其中存在RAR，如图所示：

![image-20241209201053182](image-20241209201053182.png)

将其提取，并打开，发现关键内容，如图所示：

![image-20241209201105687](image-20241209201105687.png)

公众号回复后得到flag。

### 妖精纪元

文件下载后得到一个很大的docx文档和一个带密码的rar压缩包，压缩包中存在名为flag的文件，推测是要获取到压缩包的密码。

从很大的docx文档入手，DIE检查后发现其中包含一个RAR文件，将其提取，如图所示：

![image-20241209201817631](image-20241209201817631.png)

其中包含一个exe文件，检查后发现是PyInstaller打包文件，如图所示：

![image-20241209201812622](image-20241209201812622.png)

利用`pyinstxtractor.py`解包，再利用pycdc反编译“凝固的岁月.pyc”，发现其中存在一个极大的`base64_data`变量，内容是base64编码后的图片。编写脚本将其解码后写出，如图所示：

![image-20241209201807720](image-20241209201807720.png)

（省略部分base64数据）

```python
import base64

base64_data = （数据过多，此处省略）
image_data = base64.b64decode(base64_data)
with open('photo.png', 'wb') as f:
  f.write(image_data)
```

 输出后利用DIE检查该图片文件，发现其中包含一个RAR压缩包，如图所示：

![image-20241209201802745](image-20241209201802745.png)

听取音频发现在3:00处有摩斯密码，如图所示：

![image-20241209201746214](image-20241209201746214.png)

摩斯密码为：`-.-- --- ..- .----. ...- . .... .--.-. -.. .--.-. .---- --- -. --. -.. .--.-. -.--`

解码后得到压缩包密码“YOU'VEH@D@1ONGD@Y”，如图所示：

![image-20241209201738965](image-20241209201738965.png)

解压压缩包后得到flag，如图所示：

![image-20241209201725834](image-20241209201725834.png)

## Web

### button

限制了F12按键，右键->检查，打开开发人员工具。script.js中发现关键限制，如图所示：

![image-20241209201903476](image-20241209201903476.png)

控制台中输入

```javascript
clickCount = 999999999999999999999999999999999999999999999999999999999999999999
```

再调用handleClick()，flag即弹出，如图所示：

![image-20241209201855187](image-20241209201855187.png)

###  xxmmll

打开开发人员工具，观察注释得到提示，如图所示：

![image-20241209202113200](image-20241209202113200.png)

切换到网络选项卡中，勾选保留日志，重新加载网页，观察响应头，发现疑似php文件名，如图所示：

![image-20241209202103917](image-20241209202103917.png)

访问后发现新网页，如图所示：

![image-20241209202055643](image-20241209202055643.png)

空白提交返回“Invalid XML input.”，在系统中搜索一个xml文件并输入，如图所示：

![image-20241209202045742](image-20241209202045742.png)

所以是考了个XXE注入。

返回：`“XXE attack simulated! Here is the simulated flag: flag{ce22bbe170d234645361239b395dbc5d}”`

## Reverse

### Lo0k_at_h3r3

拿到附件先查壳，结果如图所示：

![image-20241209202457750](image-20241209202457750.png)

NsPack，ESP定律脱壳，下硬件断点处如图所示：

![image-20241209202452167](image-20241209202452167.png)

F9运行程序，停在此处：

![image-20241209202447988](image-20241209202447988.png)

下一条指令即跳转到OEP，使用Scylla转储并修复后，IDA打开发现主程序逻辑，如图所示：

![image-20241209202443126](image-20241209202443126.png)

校验的字符串为多段，并有不同的异或值，编写出脚本如下图：

![image-20241209202438632](image-20241209202438632.png)

```python
b = list("nqT")
c = list("kixS")
d = list("ka9jR")
e = list("h|>cQ")
f = list("g<}<")
for i in range(len(b)):
  b[i] = chr(ord(b[i]) ^ 0xB)
for i in range(len(c)):
  c[i] = chr(ord(c[i]) ^ 0xC)
for i in range(len(d)):
  d[i] = chr(ord(d[i]) ^ 0xD)
for i in range(len(e)):
  e[i] = chr(ord(e[i]) ^ 0xE)
for i in range(len(f)):
  f[i] = chr(ord(f[i]) ^ 0xF)

print("".join(b),"".join(c),"".join(d),"".join(e),"".join(f), sep="")
```

```plaintext
脚本输出：ez_get_fl4g_fr0m_h3r3
MD5: 78d7fd988b36958c1a798ee041fac43a
```



### ezpack

查壳发现AsPack，如图所示：

![image-20241209202544005](image-20241209202544005.png)

使用ESP定律脱壳，下硬件断点位置如图所示：

![image-20241209202540302](image-20241209202540302.png)

随后F9运行程序，断在如图所示处：

![image-20241209202535643](image-20241209202535643.png)

下方ret指令会返回到OEP，利用Scylla转储并修复后使用IDA打开，主要逻辑如图所示：

![image-20241209202530693](image-20241209202530693.png)

将用户输出的数据异或处理，并与程序内的一个字符串进行比较，Str2赋值处如图所示：

![image-20241209202526559](image-20241209202526559.png)

编写脚本解密Str2，如图所示：

![image-20241209202521980](image-20241209202521980.png)

```python
enc = list(">4i44oo4?i=n>:m;8m4=oo4i;>?4>h9m")
for i in range(len(enc)):
  enc[i] = chr(ord(enc[i]) ^ 0xC)
print("".join(enc))
```

 

得出flag：`flag{28e88cc83e1b26a74a81cc8e72382d5a}`

### delf

附件提供了一个Linux程序，和一个程序产生的文件，根据程序main函数代码，可知该文件是encrypt函数处理后的内容，观察encrypt函数如下：

![image-20241209202613454](image-20241209202613454.png)

先将传入内容逐字节异或，随后将变量中两侧字符交换，根据该逻辑编写逆过程的脚本：

![image-20241209202608380](image-20241209202608380.png)

```python
enc = [0x32, 0x0E, 0x05, 0x3F, 0x34, 0x3F, 0x05, 0x3E, 0x3C, 0x35, 0x2E, 0x05, 0x3F, 0x32, 0x2D, 0x05, 0x28, 0x35, 0x3E, 0x36, 0x33, 0x05, 0x05, 0x29, 0x33, 0x38, 0x3B, 0x34, 0x23, 0x28]

for i in range(len(enc)):
  if i % 2 == 0:
    continue
  temp = enc[i - 1]
  enc[i - 1] = enc[i]
  enc[i] = temp

for i in range(len(enc)):
  enc[i] = chr(enc[i] ^ 0x5A)

print("".join(enc))
```

 

```plaintext
脚本输出：The_end_of_the_world_is_binary
MD5:9ac39760c3195f2474f31291bc558798
```



### ∞

本题思路如下：  IDA打开，main函数如图所示：  

![image-20241209202709837](image-20241209202709837.png)

  要求输入字符串，随后处理输入的字符串，再输入一个数字，最后与程序内字符串比对。先逆推字符串变换，变换函数如下图：

  ![image-20241209202719588](image-20241209202719588.png)

  

编写逆过程脚本如下图：

  ![image-20241209202738943](image-20241209202738943.png)    

```python
enc = list("\"hwGwg88Y")

for i in range(len(enc)):
    enc[i] = chr(ord(enc[i]) - (i + 1))

i = len(enc) - 1
j = 0
while j < i:
    temp = enc[j]
    enc[j] = enc[i]
    enc[i] = temp
    j = j + 1
    i = i - 1 

print("".join(enc))
```

```plaintext
脚本输出：P01arCtf!  
MD5: 5e19d9bc65db961e55209188451c63e6     
```

直接输入到程序中，数字写字符串长度，如下图：

  ![image-20241209202745687](image-20241209202745687.png)     

### o_O

 

![image-20241209202901641](image-20241209202901641.png)

MacOS程序，直接加载进IDA。主程序逻辑如下图：

![image-20241209202856874](image-20241209202856874.png)

首先将输入的数字，由ASCII转为纯数字（减去0x30），随后利用异或，交换了字符串两侧的数字，最后将每个数字都除以10

最后的比对逻辑：

![image-20241209202852588](image-20241209202852588.png)

直接用arr的值逆推，脚本如下图：

![image-20241209202847234](image-20241209202847234.png)

```python
enc = [0x5A, 0x14, 0xA, 0x32, 0, 0, 0x14]
for k in range(len(enc)):
  enc[k] = int(enc[k] / 10)
#9, 2, 1, 5, 0, 0, 2
b = 3
a = 2 * b

for j in range(b):
  temp = enc[j]
  enc[j] = enc[a-j]
  enc[a-j] = temp

for i in range(len(enc)):
  print(enc[i], sep="",end="")
```

 

```plaintext
脚本输出：2005129
flag{7e4e85033d36b28767243dcb3d9c7049}
```



### decipher

附件提供了一个编译后的python字节码文件，利用pycdc反编译一下，大致逻辑如下：

![image-20241209203019493](image-20241209203019493.png)

图中标红框处存在反编译问题，第一处为错误地将dkLen和count解释为元组作为参数传入函数，第二处为反编译失败，均已手动修复。

可观察到该en_records.txt文件中包含了salt和iv，这里传入的password在题目的描述中，为2024.利用这些信息，编写出解密脚本，如图所示：

![image-20241209203024927](image-20241209203024927.png)

 

```python
from Crypto.Cipher import AES
import os
from Crypto.Protocol.KDF import PBKDF2
import base64

enc = "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"
decode_base64 = base64.b64decode(enc)
salt = decode_base64[:16]
iv = decode_base64[16:32]
a = decode_base64[32:]
key = PBKDF2('2024', salt, dkLen=32, count=1000000)
cipher = AES.new(key, AES.MODE_CBC, iv)
decipher = cipher.decrypt(a)
print(decipher.decode('utf-8'))
```

```plaintext
脚本输出：
HBih7ONc0Ovu8m7YWDxi
qRAKggjLmTOlg0132GkV
oHXnQD7RrbPnfnelizAp
HJxHi7heG7C2Lm2zYuil
QJDGI1L5AZ3kCLtdj88y
xUCFd6CUHeIn7JLgHwrT
UXR2t28IIChXaAAeOi37
ArkEpFP5qs2zHATTiaky
fjWLln7Uuh8npsdEpXh2
dHdICOTyz1tzgCqEoIXb
OyAg0ZlyhtojDMriNgpi
LnjZoQ6ePgteOmF4zmkp
1jdWbGLP1QIHEMajfbem
KJiwG1o9JaJmnliqcxLu
VZ9YmblVR71glqEmDlgp
fyAv2o3Uf8UJKmHc9ShE
KJ3MwSeQyapMqQyrMc3C
Oep1eVk8DTz7NVMqX3OS
oG0B2wiz73rntDqgVCxt
QE1rNSG5hgKbKscDraG2
T0dduo0pdqWfyKEmnUPB
OysCUqQnPWJR6TdqhQo7
djvjYNwi6pUqHwAD8pUM
m6xWXEEQsZV5Fjg88OiR
YsthEzM0VrRQuRdAdViO
DiSJ9MBZhSgSyPf5vxdX
avTEWEHEbMVut79XXSmg
7kjYLw3I67zUHT1IvD6Y
CfR1AZ5GHCJLeGHMW60e
Z7QCUzfNRRoToNAqRFJe
PPxQxb7mVQWylBKYpTX3
5aG0n3O1iCeBYvs40zfZ
AWeywKpCXOFMUMempb83
YDVLcL36t8BDEPfAS3jq
A8vyq83SqMiJaL0qN80w
bTYfFMLm7r55u9i1vETA
V2u09hDXkEwpuGDBpIof
PewQndSNYy51MV4hdnZj
IZnPynRbuvYlB7VKOPkI
yUJgn24GdRsnOw7aX6rh
eyIHN9HlqJiT4efFhKam
7JN9CfVMsC0e1mfNtx0s
YjOhO3BSNa5XrTEOVEYi
TFuZkO5CW3uE74kPxbvA
s3DLknQctxaCGb6N1S8B
hK15ovNytbHoKYWY3VFq
vZkm3EU5GrubPZeRdqC4
9ydzfjDnvtLFqXObPZhZ
XCcyML70ldPm130QVoCH
8Tx3gXzYhrAiqaHtHekZ
xOetkyfB54KzppjoahoS
EWeBrBwTxRFlxO4VUf66
qWABMyxPsqOSDKiJS77O
LPqHCVdq9CyYkzLu7xPs
FffX8ZkY14xejvvElUDT
rJ8VavnNQ63PFNvsOM7h
MYHOG2s5gkfTkGP3q8Qq
W2lvMZCuL9JkebESeekU
6FndY1tfQrfSSeU2SO11
8Rq6Mnm0WK35YASeO5vc
LYwVPwr57ZAQCorkKlTq
9Fkwzot9x6ZmKXuB8nhZ
SsAZky3vAVteCFUNc5Mi
CTKyV8q7TbQVSJ53slcg
tnff7Wc9dnWZtnX5MYfz
5St5tB5F0jI1Nq6hux95
08FA3oCa4azJxMl6VLXI
piThyTheihwVoy7KK8ZY
xxQsjLqnYvPIJebNhR10
yHZxfXF99e8GfXYFavtf
WrPe1Svd3VzYnbYbyrMR
EuvNqKgckUMFuCJd6S30
Yf1jmJ5RCmC55uctZy4Z
M5fXCbzsKgqIr0xizJHe
WOz9cXBZd5B6FC4n2eWe
FMxkC51FdcEgeZFOfMGh
cOjhT0K8KWd6EDbAWnJm
zvvCprhMqHrZKo33nOQu
7zDSiuqgiGvJMFGwjDUl
mo5enHbCnAQdt205qLAf
82cIv9gBzzwNWGcPUHsZ
SqDu0CJKvyZ96ethJv8y
TOLhXMhScbnZOFRIIgp6
Rki1Yu3S4DMWYWuDWZhH
CSgn3AR03uo9wprNnKgL
bkUmgqCe8f0drAhV6gcz
f46Kn4FrrdCUKxXxYfVe
2axM9wW5RnDvDOAcNgBH
VaQnpDUFYiGuMp44zoe8
rtNdAhb8VgUMsR0svhk0
Jg3Ja4MY6fvXOeFysFio
is0WcoG51hK0ozpJe6ev
5iMiSysx9Htc1G0FDIQ8
E6NpBqayMGggUfPyv62Y
InSzPdcBDTg3kYQg4Usf
c8X1O3MhgJ5CgxOQ4Trr
FONVaz7UydmK6tfYUr6k
NcFp4VPRKg8AKograF8w
kr8QlczTjAROjv95UzX8
aPba2QqyibjoMmSAPMgc
0gmC6PzoiSx4UsPFxZge
Kk7BVDIlmqhCTmWsVIlz
MhKsVlprCiKiuYF5VLAQ
thc8LL5OPPhIvRoFJWpi
q5aTlxTFAZkaygvPO6qr
CqgNRZ3mZG2QsvkWg117
PaOlqhbj60Cioc6DqZxB
AdwpLUYZqdt2tJoRABWG
1gdl3R19w910yvDjpAgK
du9lJgEvE8vAxHPhNsWG
Bpow3snpqVqiGoWoIHwj
mjFNxfMSu57cGCeIkAuA
NXrv1zB25V2TlBendsJ6
6H8b6EruZJL16SqYT88j
lrfTiFD0Blses8jAlXP3
27ZKptRN0GlUFnnWTLct
gDDzlhCWvwKa2KfiEm7W
4s7rsXt6kcufywt2u40H
2QsTZpGkAgg6fpNISmz7
snM3jMllZSaqdyuYVlLQ
NgXSXQXvpMEXOMuLIs10
y86oh3tuUdQJpTPtzFP3
ZzWP5FnZUVY5nSgR64v5
R7maIkCfp4iFmHfubfQl
bitqZY0Kgz7aavwlNFo7
ysSmnh9twiP7GCs0kanL
oZPEmTbZBGFCDVQPjl3y
S3X0BXszBhBj6knuBRKO
jJhtBenea5kx8rcmnP7Q
y2QDnlkEnWsSfM8opPlC
exSdnucH4ppanPrdv1iT
C2CgeFrbJTeVB9d8Fh0O
wif5E9kDUtERVkE6L4xw
K3nXu7D2anKlXn1oh0gz
uJ7J1gwEVAQ2h656VTMv
Kqo4LhLkIl3AgnNZ35Yh
l8j3yNV4TgDVUlv0uJ54
4G6Q95MbL41wIAMxqpOl
0Rnq5ryYlRPc5HMkxEOt
jSanBGd3mTNleYurFauu
RJ1qpzTn42MwZopCkNXE
76h5b9IRNZTVjoECkXuc
p9UKyL00a2GuDK3Q1e7H
VvVXJwtOAFqlX8ywjDYs
e6Ytl8eTXtoIbdnZyXBP
yulW9LcvcYGp2MBoq3sY
3CrqM6kRZTXGxwBY7FNJ
u4ADeDgXle9wWBcJr6be
yyYbRp1mPM1jloUzloaz
i9WFyZQbMZB7TjpQsGgX
uKMGRtX0gNwnyUurc40W
WZhv0EIPqKoPm7m6H1PB
MxeMGkTMrz3F7NCy5xPG
S4JeXOea5J87BGR3bEoq
Vav9oMjdmUjIesHQnAKZ
qFHvSLUkYcRb0dNUMMTL
1DNdXYdZ4V4NAI2wEtlZ
oqb57VjJ5RBdu47wl3PR
LBfnAKIisDjx5Lq97yNf
JJb9qbg7edjpRIDhd7u6
f3ifcEFH9BkGzZ49bGRy
1SAPxZhAfNvlCbeqE6yu
WDGfJKSBU9a5nIYQME9g
jDy44o1wBFYTDjHX9En5
zPQjrsEMRJXz7Ku7ONGU
0uueEOVbWTr4DJZiiCdR
OruxkUbDWwsrXCxJiYst
cnYTi6bfO2yvnlrP8tOT
gmAmweFOYOTMySL2O95O
4qy72aM4uI9ttes9xNs9
TYjgoI2nSivAWZp7SRht
dxPxZ0yLX4GYfvl8ze5E
beiIrqu9baJAi3LChkkp
MHNW6AXPhz0Ll6gGKv6I
j2txuNFb005soGmZR75o
MtKxo4yWA1HW9K3AmwW6
Srt7PegGhNFmLftxod9D
F3JB4P3YD4ZXoq9qu0ag
HpqC7q7fTKxhfvne6Ig2
xbPJ5UZqo4EVPTWeXov3
kx31osKQZvjDzxHsEcHB
0eajMvPtixaUK5sRrmYy
R0ddPDkmnfrurVqilfLI
rap4CzCY00vrZoJmxi4O
2hdeS2pCrX9FpY54hnZU
ek2PCyvRoXO0lIZUj4rB
chXvq6KRvjYmoYFRisG7
xuP8aFGIf0tXpARoiwUC
s4rK7TTJlQZmXltSisV7
WaaTvextwb3e4g7BZLdO
LCJwEPrcrxTtXShxAQwK
z6nREtYH1GYkafJUTx2S
sr74V3lxKTeQodAQkQ7m
uu7Xmxaq4nUvUkaGMi5G
XRGezHU4WoI7vayHAOpI
NoUIJOxIxqOCqeHgKs9b
n27FuwWWN5nwJCtQ1WH2
gRuGjz7WMLxB1WbUqcUb
OEJEVHH4jsh9lvauf12G
Me0GnkcccGVKCHHzOjLx
l0qCZoRGvjAKYrtzHd75
RZGwmJ2TdR4yZYAH6tzj
UAJrhidNp7uWtkVupE9Z
BJZPmVBOzDKgLfEni6Rs
AtleV3xl6XGeQNaZdpYG
mDeLf39fMaPhO9oEqn7C
vLRTtEP3JTABP4MPOVCT
kEUIZVSlp8corZKXEOd0
2KGnaLQRfXC1kUHQ3trW
0E9u5YWzQsF0hbVZx8pg
t4SVLnTBXh0zgGxMwFn5
TxBVANwieiLRZAu6JPc5
ySnQhBoXl1Tk2LakqJjW
1P589zyP0TU7YiQtNwiX
7UL8UpBMkPYLsUuwZW5e
5KEJCV7WjYiNMwEURIEA
ZqbYPfREqY2HgVxtntd7
yCQJvB7YLCSRI0gVaHJk
HdW6OpBEPSNKnUYe5iTM
67lZfNVanQbpSr4YQgks
vgQA5qSd14wnMNbBIXrY
C7nPP13Pxg2j4P0HeX1d
1z1pUpzJ23XRtJ0vAlha
pN4poAP3rIJzP1QsY1MA
nWqf7X2NXJVmb8QjfVhz
h94CUgISZG1Qrzp2BK8R
fZPE51bzf0WnxjV6CBA7
Wq95WkzOAGxWULuBecfu
qPckruY3gbH1lr9zyEIQ
Vdgej0JuiwCO6HhN6uJG
J2s83MeqZGuejZimudKR
8MUEMQ2CxHDcrDwfH7eu
PdpqY8AAXNXEINpp8bm1
jhY0KIQTqMnkcjyFsX9l
itQZpeB8WzCEybamw0no
OELlFXYFBYNnNvBN6JZG
0ws8nKRkRyQoB0aCqSy2
6muhIgghOuWf05zZLLPj
ZFFc3i5LixkyJVVXlf74
ErAjNLAyTAVSJ5zx4NYv
5zzi662w0LTI7lsAiUv5
Zgvb0qhUE59OG5gESTX1
TC4wAB3eDuWeaGC1Zm1D
TcGVlkufgMVRqQoPnlCe
K1uImIFsLAhWYVbkrleg
EqREr4ZS1UTRYrxQNtFS
BUGVbhWUH9JepNk9rS75
3Bvo55K43NZISKjOn6s3
bksbzw0TI4qrO3rErRZv
aTzPhrfYnBr9AMiOUdxb
znAJzOL8NIBsTjvTnJu1
MgxRLpRnGge4Qa9Opx6b
WkYphTiokOwOUGvlMCds
OmHAYVmVUf6oi0zPAvlH
hIuYjP5NqkKm3jmOFwvK
sfKVM4yKbdQDZGmgwsEz
rOn7ET0yAXwhiO4DJrV7
6TZx8JnKcLQ1AR23132h
mQnbcCqdesCTA7puf1is
7vT9JHdt5o75sUknjPvZ
OcLgDWZDBO84kOUJQYUi
oPPgqaWS7fkZi3lBZJNa
dfS33BcLtTuE7IIypvjj
xAaSjZ2wOkEGBrkYqRku
dswl6FoVueTolN1sQ2Bq
5RS2mGik2iKTWpi0qa89
EdP39z90mEYyhtvHEpbq
UJ1lnkIWZs99UT7bSbUt
yqxfk64Vpf1dYnLGl6zW
xWONQVZgsmeUE9yBaXCW
gUDRIx1upt8Wq27ut06q
P6STosgPbP9yBqB5zlqL
6kyxXTEx6SrBzx84wWxv
5k9OyqLGEVDM4rjnoqL3
PtjpnRxq1WcUKEGl1ffC
usijGY0NAL3cAFU6zOTM
OeumjfkoS4EiQ519wrcA
qzSXAyi8d74NXFiCxHVr
s7O0FlYp1baVdJfkq3Vi
Qb3CFUpzwnk4X1LJFtsT
xKZxwNOZjkaL6ZvBkIjJ
itswhatiwannasaytoya
QZoeVzZIu5BFRWCf8Xln
e30EuetENRuVdYk1PfFs
j4Pko965Dmh6hvXsJ5k2
vPk33C0hg7uJISUl6Z48
5ah2ro9qZGdwQjkKt2RT
hGIU1q96AgmZ3MuGA4i8
VwFo5D1mBpJekmC4MTkY
GQy796V1bIHhJUCpxlhE
pF4gS1ccMn8Vpjl3ccvC
sDri7FCHN2vo8XkFwINE
Iqpogchh7fdJFCWgVNd2
BfKTWOjWobDQifi0kx6w
U8O9u4oF6Qc78Bj170Pe
xjEkE7DwwI4Sg6fVk4DA
VkWabaJeoraamtJ7UY6N
2MSvVbTgoAQwYq3MG5Tl
DxKEtsd6hns7b7Om0a1u
xvj1LIy6wmdDWXN7eguR
wboZcnxNnmCgRFDEMrgO
```

仔细观察杂乱的数据，发现有意义的字符串：

![image-20241209203038427](image-20241209203038427.png)

```plaintext
itswhatiwannasaytoya
MD5: 95a41d12c80528cc98df81ae12154e7d
```

（完）
