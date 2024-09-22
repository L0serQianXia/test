---
title: PolarCTF2024秋季个人挑战赛个人Writeup
typora-root-url: polarctf-2024-autumn-personal-wp
date: 2024-09-22 10:52:43
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

# PolarCTF2024秋季个人挑战赛个人Writeup

## Misc

### 文物追回

附件中提供了一段音频和一张图片，图片尾藏了一个压缩包，压缩包需要密码。

音频听取后发现是SSTV编码，解码后获得如下图片：

![20240921_204322](20240921_204322.png)

图片中包含的文本推测为压缩包的密码，使用“it'stooexpensive”作为密码解压获得如下文件：

![image-20240922094500484](image-20240922094500484.png)

在手机上安装base.apk，发现这个应用可以揭露图片中的隐藏信息。点击“Reveal the Message”，选择压缩包中的“文物.jpg”，并单击Reveal，得到下图页面。

![Screenshot_20240921_212107_com.romancinkais.stega](Screenshot_20240921_212107_com.romancinkais.stega.jpg)

可知隐藏的内容为9527ETC。同时这是文物的价格。

flag为flag{5ba2c63a15dcfecb5297f4688bfc6516}

## Crypto

###  ao神之力

提示得知，附件中的文本采用了多次不同base编码。经过测试，Base91->Base16->Base64->Base16后得到明文woshi_Polar-aoshen

Base91结果：

![img](clip_image002.jpg)

Base16结果：

![img](clip_image004.jpg)

Base64结果：

![img](clip_image006.jpg)

Base16结果：

![img](clip_image008.jpg)

### 动物世界

打开后发现明显的熊曰。与熊论道解密：

![img](clip_image002-1726969654187-7.jpg)

明显的兽音译者，解密：

![img](clip_image004-1726969654187-8.jpg)

flag为flag{666666666}

### 僧人和小妖的爱情

分析文本可提取到有效信息两条：

![img](clip_image002-1726969666096-11.jpg)

分别采用了与佛论禅和兽音译者，解密如下图：

![img](clip_image004-1726969666098-13.jpg)

![img](clip_image006-1726969666098-12.jpg)

与佛论禅解密得：yuanmengzhixing。兽音译者解密得：qi_dong!!!

最后将两段文本拼接得出flag

## Web

### 传马

可上传图片：

![image-20240922095148896](image-20240922095148896.png)

如果上传php文件，弹出下图提示

![image-20240922095311050](image-20240922095311050.png)

明显是一个前端校验，分析后在控制台输入：

```javascript
checkFile = function(){return true}
```

绕过前端的文件后缀名检测

再次点击上传返回：

```plaintext
提示：文件类型不正确，请重新上传！
```

直接修改请求中的`Content-Type`为`image/png`，发送请求，即可绕过后端验证。

![image-20240922095547715](image-20240922095547715.png)

返回如下：

```plaintext
UPLOAD_PATH 存在: ./upload
上传文件类型: image/png
临时文件路径: /tmp/phpnJFNmi
目标路径: ./upload/muma.php
文件移动成功
```

蚁剑连接后在根目录发现flag.txt

![image-20240922095757409](image-20240922095757409.png)

### 笑傲上传

尝试上传一句话木马，同样有一个前端检测，同样控制台输入：

```javascript
checkFile = function(){return true}
```

绕过前端的后缀名检测。

返回如下提示：

```plaintext
提示：文件未知，上传失败！
```

仿照上一题修改请求的`Content-Type`，无法绕过。

已知可以上传图片，传个图片马试试。

![image-20240922100301153](image-20240922100301153.png)

上传成功。

但是后缀被修改为了.jpg

这里上传页面还有一个神秘链接，点进去发现是一个php文件的源码：

```php
<?php
header("Content-Type:text/html;charset=utf-8");
$file = $_GET['file'];
if(isset($file)){
    include $file;
}else{
    show_source(__file__);
}
/*这里是妙妙屋的后门*/
?>
```

这里include了file参数提供的文件，我们把刚刚传上去的一句话木马的路径写进去。

例如路径：

```plaintext
include.php?file=./upload/8020240922020217.jpg
```

写进蚁剑中，同样在根目录找到flag.txt

![image-20240922100626842](image-20240922100626842.png)

#### 非预期解

直接把flag.txt的路径传给include.php：

```plaintext
include.php?file=/flag.txt
```

![image-20240922100711216](image-20240922100711216.png)

## Reverse

### box

附件存在一个提示文本和一个ELF文件。根据提示文本，flag为ELF中获取的3个key拼接结果。

![image-20240922102847239](image-20240922102847239.png)

#### key1

key1反编译结果如下：

![image-20240922102902833](image-20240922102902833.png)

可以看到最后的全局变量key的结果应该是key1

这里需要注意的是IDA反编译存在问题：

![image-20240922103047471](image-20240922103047471.png)

汇编中可以清晰的看到，循环体中`key`加的值是`key + c`，而反编译中直接将f * d / 10的结果加给了`key`

在上一个for循环中可以看到`c`的值是改变了的，如果直接按照IDA的反编译结果来编写代码，会导致最终算出的`key`是错误的。

这里提供Python的一种实现：

```python
c=0
d=0
f=0
key=0
for i in range(1,22):
    c += i
    d += c
    f = d + c - 1
for k in range(33, 0, -1):
    c = int(f * d) / 10
    key += int(c)
print(key)
```

![image-20240922103420695](image-20240922103420695.png)

key1=11694441

#### key2

![image-20240922103512103](image-20240922103512103.png)

这里将输入字符串与程序内一个全局变量比较

![image-20240922103601641](image-20240922103601641.png)

变量值为that_ok

key2=that_ok

#### key3

![image-20240922103634658](image-20240922103634658.png)

强烈的base特征

Base32解码得：

![image-20240922103659329](image-20240922103659329.png)

key3=key

#### flag

flag=flag{md5(key1+key2+key3)}=flag{md5(11694441that_okkey)}=flag{0c680749b893e20d491a8752f1d49acd}

### HowTo_Login

查壳发现有一层UPX，使用UPX -d 脱掉

发现WinMain调用了`DialogBoxParamW`，进入过程函数，发现如下校验逻辑：

![image-20240922103932206](image-20240922103932206.png)

程序校验的序列号为CZ9dmq4c8g9G7bAX，同时也是本题目的flag。

### 语言不通禁止入内

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

### RE_jar

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

### bllbl_木马



#### 解法1

根据附件提示，可对照出相关加载器代码：

![image-20240922104853284](image-20240922104853284.png)

这里是加载shellcode。

但由于shellcode所在区段没有执行权限，直接运行会崩溃，需要手动设置下页面保护属性才可调试。

之后对照另一个提示中的payload源码，可以找到如下位置。

![image-20240922104922781](image-20240922104922781.png)

这里有sockaddr结构体，同时这个结构体中包含了连接到的IP和端口。

对应该题目为，IP：0C 22 38 4E，转为十进制：12.34.56.78。

端口：038E，转为十进制：910。

该题flag为flag{md5(12.34.56.78:910)}=flag{922049c9d5e1bdce2545f973eb031850}

#### 解法2

![image-20240922104946818](image-20240922104946818.png)

监控工具可监控到Connect行为。其中包含了目标IP及端口号。

### 两点半俱乐部

#### 解法1

IDA中分析：

![image-20240922105023707](image-20240922105023707.png)

首先转到窗口过程函数中，向下找到如下代码：

![image-20240922105029093](image-20240922105029093.png)

这里校验了输入的通行证和卡密，调试器中分析到正确的通行证和卡密：

![image-20240922105034565](image-20240922105034565.png)

IDA中继续查看，发现这里还校验了点击次数，如果小于9999999还不会弹出flag：

![image-20240922105040961](image-20240922105040961.png)

这里可以修改内存数据，或者直接复制下方else中弹窗里包含的flag即可。

#### 解法2

直接搜索字符串得flag：

![image-20240922105102531](image-20240922105102531.png)

（完）
