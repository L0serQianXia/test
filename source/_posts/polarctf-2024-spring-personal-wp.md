---
title: PolarCTF2024春季个人挑战赛个人Writeup
typora-root-url: polarctf-2024-spring-personal-wp
date: 2024-03-24 01:02:06
tags:
- PolarCTF
- CTF
- Writeup
- wp
- misc
- web
categories: 
- Writeup
- PolarCTF
---

# PolarCTF2024春季个人挑战赛个人Writeup

这里包含了Crypto的两道题，Misc的两道题和Web的一道题。

Reverse方向的题解单独写了一篇：[PolarCTF2024春季个人挑战赛Reverse方向个人Writeup](https://l0serqianxia.github.io/blog/2024/03/23/polarctf-2024-spring-reverse-wp/)

## Crypto

### 周杰伦的贝斯

附件是一个文本文档，其中充满了emoji

![image-20240324003517671](image-20240324003517671.png)

搜索得知，使用的是base100编码

![image-20240324003549433](image-20240324003549433.png)

到这里可以联合附件名称和题目名称推测，这里使用了base家族编码（周杰伦的贝斯），逐步进行base100、base64、base32（100_64_32.txt）就可以得到flag

base64解码：

![image-20240324003736630](image-20240324003736630.png)

base32解码：

![image-20240324003753422](image-20240324003753422.png)

最终得到明文Jay Chou

flag为`flag{Jay Chou}`

#### 在线工具

[BASE100编码解码 - Bugku CTF](https://ctf.bugku.com/tool/base100)

[BASE64编码解码 - Bugku CTF](https://ctf.bugku.com/tool/base64)

[BASE32编码解码 - Bugku CTF](https://ctf.bugku.com/tool/base32)

### 歌词最后一句

附件提供了一个压缩包，内含两个图片，一个是十个小人的图片，另一个是包含一张专辑封面的图片

![image-20240324004010898](image-20240324004010898.png)

![image-20240324004059745](image-20240324004059745.png)

![image-20240324004104705](image-20240324004104705.png)

查询得知，小人的图片是福尔摩斯密码小人，密码表如下：

![img](v2-c323f229bd8ffb032a7df5293562f378_r.jpg)

对照得出字符串：wydzmnzwsb

另一种包含周杰伦专辑封面的图片，经过对比，可以发现是周杰伦的《11月的萧邦》

![image-20240324004237163](image-20240324004237163.png)

接下来就是联系题目名称，思考上面小人解密出的字符串的含义，推测是该专辑中某首歌的歌词最后一句的首字母

寻找得知，是单曲《枫》中的“我要的只是你在我身边”的首字母

MD5加密后得到flag

flag为`flag{776e26e39d01c914e8faa6796bf7e9b3}`

#### 在线工具

[MD5在线加密/解密/破解—MD5在线 (sojson.com)](https://www.sojson.com/encrypt_md5.html)

## Misc

### 加点儿什么

图片是一张平平无奇的经典之作：

![c](c.jpg)

这个图片中蕴含了什么内容，并不容易被得知，使用010 Editor打开发现文件尾部存在额外的内容：

![image-20240324004629286](image-20240324004629286.png)

PK的字样，暗示我们它极有可能藏了一个压缩包，使用解压缩软件打开：

![image-20240324004711229](image-20240324004711229.png)

发现其中存在一个源代码文件，文件内容：

```cpp
#include<bits/stdc++.h>
using namespace std;
#define MAX 100
//提示：密文输入372658619JI0707I8G64HF2400F96991 
//提示[1]：代码不是完全准确，需要你加点东西(非常简单) 
char ciphertext[MAX];    //密文
char plaintext[MAX];     //明文
int K=4;
//加密
void Encryption()
{
	cout<<"请输入明文："<<endl;
	gets(plaintext);
	cout<<"密文为："<<endl;
	for(int i=0; plaintext[i] != '\0'; i++)
	{
        if(plaintext[i] >= 'A' && plaintext[i] <= 'Z')
        {
           ciphertext[i] = (plaintext[i] - 'A' + K) % 26 + 'A';
        }
        else if (plaintext[i] >= 'a' && plaintext[i] <= 'z')
        {
            ciphertext[i]=(plaintext[i] - 'a' + K) % 26 + 'a';
        }
        else
			ciphertext[i] = plaintext[i];
		cout<<plaintext[i];
    }
	printf("\n");
}

//解密
void Decryption()
{
	cout<<"请输入密文："<<endl;
	gets(ciphertext);
	cout<<"明文为："<<endl;
	for(int i=0; ciphertext[i] != '\0'; i++)
	{
        if(ciphertext[i] >= 'A' && ciphertext[i] <= 'Z')
        {
           plaintext[i] = ((ciphertext[i] - 'A' - K) % 26 + 26)%26 + 'A';
        }
        else if (ciphertext[i] >= 'a' && ciphertext[i] <= 'z')
        {
            plaintext[i]=((ciphertext[i] - 'a' - K) % 26 + 26)%26 + 'a';
        }
        else
			plaintext[i] = ciphertext[i];
		
    }
	printf("\n");
}

int main()
{
    int n,flag=1;
	while(flag)
	{
		cout<<"请选择（1:加密，2:解密,3:退出）："<<endl;
		cin>>n;
		getchar();
		switch(n)
		{
			case 1:
				Encryption();
				break;
			case 2:
				Decryption();
				break;
			case 3:exit(0);
		}
	}
}
```

与Reverse方向中的C^题目的代码较为相似，同样是类似凯撒密码的实现，这里的解密方法减去的为K变量，K的值为4，可以复用那里的代码，略微改动即可用于解密这里的字符串

参考脚本：

```python
flag = list("372658619JI0707I8G64HF2400F96991")

for i in range(len(flag)):
    ord_ = ord(flag[i])
    if ord_ >= 0x40 and ord_ <=0x5a:
        flag[i] = chr(ord_ - 4)

print("".join(flag))
```

输出结果：

```
372658619FE0707E8C64DB2400B96991
```

flag为`flag{372658619FE0707E8C64DB2400B96991}`

### 你懂二维码吗？

附件存在两个文件，一个压缩文件和一个jpg文件，但是并不可以解压，提示文件已损坏。

![image-20240324005308114](image-20240324005308114.png)

010 Editor中打开：

![image-20240324005405888](image-20240324005405888.png)

发现模板并不能正确执行，于是转而求助于WinRAR的压缩包修复功能，修复后压缩包如下：

![image-20240324005459276](image-20240324005459276.png)

替代1.zip的文件是1.txt，而它是存在密码的，hahaha目录中又存在一个图片，打开发现是PolarCTF的微信公众号的二维码

![image-20240324005539430](image-20240324005539430.png)

使用010 Editor打开，发现尾部存在额外内容：

![image-20240324005620345](image-20240324005620345.png)

猜测666777888为1.txt的密码，成功打开：

![image-20240324005644763](image-20240324005644763.png)

发现这个1.txt实际上是一个二进制文件，观察文件头表明很可能是一个PNG文件，解压后修改后缀为.png

![image-20240324005750552](image-20240324005750552.png)

扫描二维码得到flag：

![image-20240324005816273](image-20240324005816273.png)

flag为`flag{zun_du_jia_du}`

#### 在线工具

[草料二维码解码器 (cli.im)](https://cli.im/deqr)

## Web

### 机器人

根据题目名称可以猜测，与robots.txt文件有些关系，访问该文件发现如下内容：

![image-20240324010043100](image-20240324010043100.png)

存在一半的Flag，还有一个目录，直接访问会返回403

可以扫描一下该目录：

![image-20240324010144901](image-20240324010144901.png)

发现该目录下存在一个flag.php文件，访问后得到后半段flag

flag为`flag{4749ea1ea481a5d56685442c8516b61c}`

（完）
