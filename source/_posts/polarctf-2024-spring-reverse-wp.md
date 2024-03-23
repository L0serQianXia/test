---
title: PolarCTF2024春季个人挑战赛Reverse方向个人Writeup
typora-root-url: polarctf-2024-spring-reverse-wp
date: 2024-03-24 00:00:00
tags: 
- polarctf
- CTF
- Writeup
- wp
categories: Writeup
---

# PolarCTF2024春季个人挑战赛Reverse方向个人Writeup

这里是个人Writeup，本次比赛Reverse方向共有6道题，解出5道，其中题目“易位”没能解出。

## 一个flag劈三瓣儿

是个ELF32文件，拖入IDA，进入main函数中的唯一一个函数调用中，伪代码如下：

![image-20240323232525776](image-20240323232525776.png)

拼接即得flag

flag为`flag{HaiZI233N145wuD!le112@666}`

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

flag为flag{hey flag is not here.}

## app_login

题目给出了一个apk程序，拖入JEB后反编译发现了登入按钮的处理方法，反编译代码如下：

![image-20240323232714393](image-20240323232714393.png)

注意到，其中调用了checkUsername方法和checkPass方法，如果两个方法都返回真，则提示登录成功，并且弹出flag，flag内容是flag格式与用户名和密码的拼接，即`flag{<用户名><密码>}`

接下来，分别观察两个判断方法：

```java
public boolean checkUsername(String input) {
    if(input != null) {
        try {
            if(input.length() == 0) {
                return 0;
            }

            if(input == null) {
                return 0;
            }

            MessageDigest v1 = MessageDigest.getInstance("MD5");
            v1.reset();
            v1.update("zhishixuebao".getBytes());
            String hex = FirstActivity.toHexString(v1.digest(), "");
            StringBuilder v2 = new StringBuilder();
            int i;
            for(i = 0; i < hex.length(); i += 2) {
                v2.append(hex.charAt(i));
            }

            return v2.toString().equals(input);
        }
        catch(NoSuchAlgorithmException v6) {
            v6.printStackTrace();
            return 0;
        }

        return 0;
    }

    return 0;
}
```

该方法将字符串“zhishixuebao”取MD5值，并调用了该类中的toHexString方法对MD5值进行处理，最后判断输入的用户名与处理后的MD5值是否相同。

接下来观察checkPass方法：

```java
public boolean checkPass(String input) {
    if(input != null) {
        char[] char_ = input.toCharArray();
        if(char_.length != 15) {
            return 0;
        }

        int i = 0;
        while(i < char_.length) {
            char_[i] = (char)(0xFF - i - 0x60 - char_[i]);
            if(char_[i] == 0x30 && i < 15) {
                ++i;
                continue;
            }

            return 0;
        }

        return 1;
    }

    return 0;
}
```

可以看到，密码的长度应该为15，下面的循环中，利用循环次数和作为索引对应的字符做了运算，判断运算后值是否等于0x30，如果不是则返回假。

这里可以解出每个char_[i]，即获得正确的密码。

参考脚本：

```java
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class HelloWorld {
	public static void main(String[] args) throws Exception {
		// username
		MessageDigest v1 = MessageDigest.getInstance("MD5");
		v1.reset();
		v1.update("zhishixuebao".getBytes());
		String hex = toHexString(v1.digest(), "");
		StringBuilder v2 = new StringBuilder();

		for(int i = 0; i < hex.length(); i += 2) {
			v2.append(hex.charAt(i));
		}
        
		System.out.println(v2.toString());
        
        // password
		for(int i = 0; i < 15; i++){
			System.out.print(new String(new char[]{(char)(0xff-i-0x60-0x30)}));
		}
	}
   
    private static String toHexString(byte[] arg6, String arg7) {
        StringBuilder v0 = new StringBuilder();
        int v2;
        for(v2 = 0; v2 < arg6.length; ++v2) {
            String v3 = Integer.toHexString(arg6[v2] & 0xFF);
            if(v3.length() == 1) {
                v0.append('0');
            }

            v0.append(v3);
            v0.append(arg7);
        }

        return v0.toString();
    }
}

```

运行结果：

![image-20240323235433904](image-20240323235433904.png)

flag为`flag{7afc4fcefc616ebdonmlkjihgfedcba}`

## kr

![image-20240323235936882](image-20240323235936882.png)

运行后提供了输入，但是不知道与输出结果有什么关系，尝试观察代码

本题目有壳，查壳结果：

![image-20240323235628804](image-20240323235628804.png)

IDE提示为UPX，尝试使用upx -d脱壳

![image-20240323235711144](image-20240323235711144.png)

提示并非UPX加壳，考虑魔改UPX，手动跟到OEP后dump，不能正常运行，但拖入IDA观察伪代码已经足够

![image-20240323235820509](image-20240323235820509.png)

可以看到，我们的输入并不能影响程序的执行流程，程序中存在一个变量，其值为999并且不被影响，该变量的值影响了程序流的走向，如果该变量的值>1000，那么会输出flag

但是在正常情况下，该变量的值永不会被改变，这里需要我们查看一下输出的内容或者修改一下程序的判断指令，这里直接双击到输出内容就可以，内容如下：

![image-20240324000148613](image-20240324000148613.png)

flag为`flag{polar_dream_bigger}`

