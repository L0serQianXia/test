---
title: PolarCTF2024夏季个人挑战赛个人Writeup
typora-root-url: polarctf-2024-summer-personal-wp
date: 2024-06-02 00:00:00
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

# PolarCTF2024夏季个人挑战赛个人Writeup



## Misc

### 祺贵人告发

十六进制编辑器打开图片，发现末尾存在压缩包，如图所示：

![image-20240602132900656](image-20240602132900656.png)

使用解压缩软件打开，发现一个密码保护的文本文档，如图所示：

![image-20240602132918242](image-20240602132918242.png)

WinRAR修复压缩包无效，非伪加密。尝试暴力破解密码，根据文件名猜测，密码为4位，结果如图所示：

![image-20240602132928301](image-20240602132928301.png)

密码为1574，打开文本文档后将其中内容进行md5加密，即为flag。

### 加点什么2.0

下载到的图片使用十六进制编辑器打开，发现文件末尾存在压缩包，如图所示：

![image-20240602133010307](image-20240602133010307.png)

使用解压缩软件打开之后，发现存在一个名为ks的文件，使用DIE检测后发现这是一个ELF文件，如图所示：

![image-20240602133016769](image-20240602133016769.png)

使用IDA64打开，函数窗口中观察到一个名为FLAG的函数，函数无交叉引用，该函数运行会输出一个字符串，函数反编译代码如图所示：

![image-20240602133023003](image-20240602133023003.png)

将其作为参数传入Decryption方法，由于这里没有Linux环境，根据Decryption的反编译结果用Python实现了解密功能，Python代码如下：

```python
flag = list("372658619JI0707I8G64HF2400F96991")

for i in range(len(flag)):
    ord_ = ord(flag[i])
    if ord_ >= 0x40 and ord_ <=0x5a:
        flag[i] = chr(ord_ - 4)

print("".join(flag))
```

代码运行结果如下：

![image-20240602133033601](image-20240602133033601.png)

此字符串即为flag。

PS: 可以直接复用2024春季个人挑战赛的Misc题目“加点儿什么”的Flag（[个人题解](https://l0serqianxia.github.io/blog/2024/03/23/polarctf-2024-spring-personal-wp/#title-8)）

## Crypto

### pici

附件内容有明显的base64特征，解码结果如图所示：

![image-20240602133105155](image-20240602133105155.png)

可见是新约佛论禅，解密结果如下图：

![image-20240602133110046](image-20240602133110046.png)

将解密结果md5 32位小写即得到flag。

### 翻栅栏

附件中内容首先需要兽音译者进行解密，结果如下图：

![image-20240602133133629](image-20240602133133629.png)

将得到的明文进行栅栏解密，根据附件“txt”的提示，栏数填写6，解密结果如下图：

![image-20240602133140803](image-20240602133140803.png)

最后对解密结果进行md5 32位小写加密，即得到flag。

## Web

### 扫扫看

根据题目提示，使用dirsearch进行扫描，结果如图所示：

![image-20240602133211992](image-20240602133211992.png)

扫描到了flag.php页面。访问该页面，flag并未直接显示，查看网页源代码可以得到flag在注释中，如图所示：

![image-20240602133207046](image-20240602133207046.png)

###  debudao

抓包，返回内容设置了Cookie，即为flag，如图所示：

![image-20240602133225411](image-20240602133225411.png)

### Dragon

抓包，访问即送flag，如图所示：

![image-20240602133238733](image-20240602133238733.png)

## Reverse

### crc

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

### EasyCPP2

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

### c2

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

### EasyGo

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

### 往哪走

运行如图：

![image-20240602133556493](image-20240602133556493.png)

初步判断迷宫题。

程序有UPX壳，脱壳后使用IDA加载，在main函数开头处看到迷宫地图，如下图：

![image-20240602133552354](image-20240602133552354.png)

分组结果如下，同时写出路线，即为flag：

![image-20240602133549148](image-20240602133549148.png)

PS：该题目和BUUCTF的Reverse方向题目“不一样的flag”相同，仅使用UPX壳压缩。

![image-20240602142750453](image-20240602142750453.png)

### Gobang

程序有UPX壳，脱壳后使用IDA加载，判断成功的if语句如下图：

![image-20240602133625550](image-20240602133625550.png)

judge函数反编译代码如下图：

![image-20240602133620102](image-20240602133620102.png)

根据程序运行时的输出，这是一个9x9的棋盘，这里的for循环检测的是(2,2)、(3,3)、(4,4)、(5,5)和(6,6)这五点应该有棋子，才会返回判断成功。相关运行截图如下：

![image-20240602133616192](image-20240602133616192.png)

每次输入坐标后输出的内容拼接即得flag。

（完）
