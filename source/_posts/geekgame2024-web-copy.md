---
title: 2024京华杯Web方向题目个人题解——验证码
typora-root-url: geekgame2024-web-copy
date: 2024-10-28 23:40:19
tags:
- Geekgame2024
- web
- 京华杯
- Geekgame
- writeup
- wp
categories: Reverse
---

# 验证码

本来一直想写京华杯的题解了，但是今天才抽出时间。通过该题学到了浏览器自动化调试的技术，还是很有含金量的比赛。

前端经验不足，有误之处还请多指教

## Hard难度

网页屏蔽了快捷键和右键菜单，Edge浏览器可以通过工具栏中“更多->更多工具->开发人员工具”打开DevTools

可发现有一个经常更新的div标签，id为“floatingElementsContainer”：

![image-20241028224641409](image-20241028224641409.png)

这个便是框上闪动的干扰字符

![image-20241028224839509](image-20241028224839509.png)

可以选择性将其删去，删去后：

![image-20241028224857914](image-20241028224857914.png)

下面提供两种获取验证码的方法：

第一种，可以直接复制所有div标签中的内容：

![image-20241028224934279](image-20241028224934279.png)

第二种，尝试使用浏览器的“打印”功能，但是按下Ctrl+P无响应。在事件侦听器中删除keydown即可：

![image-20241028225211421](image-20241028225211421.png)

此时网页内的快捷键不再受影响，包括粘贴和打印等快捷键都可正常使用，此时即可解题。若需右键菜单，可删除contextmenu的事件侦听器。

![image-20241028225939004](image-20241028225939004.png)

此时即可复制网页内容，随后粘贴到输入框中即可。

![image-20241028230028025](image-20241028230028025.png)

## Expert难度

在DevTools运行时从首页跳转到page2，可发现被检测到调试，自动跳转到其他页面：

![image-20241028230146721](image-20241028230146721.png)

观察到跳转前有命中debugger断点，源代码栏中停用断点即可：

![image-20241028230249309](image-20241028230249309.png)

随后观察字符串存储方式：

![image-20241028232711718](image-20241028232711718.png)

渲染采用了css的伪元素：

![image-20241028232741945](image-20241028232741945.png)

直接打印页面，显示内容为空，仅有输入框

![image-20241028232815109](image-20241028232815109.png)

### 解法1

决定采用浏览器调试功能及相关的库，获取显示的文字，这里采用了[DrissionPage](https://drissionpage.cn/)库。

相关使用方法不再描述，直接给出脚本：

```python
from DrissionPage import ChromiumPage
page = ChromiumPage()
# page.get("https://geekgame.pku.edu.cn/#/game/web-copy")

ok = ""
while ok != "OK":
    ok = input("Enter \"OK\" when you are in the correct page")

a = page.ele("@id:root")
b = a.shadow_root.ele('tag:span')
c = page.ele("@id:noiseInput")

code = ""
for i in range(100):
    try:
        code += b.pseudo.before
        code += b.pseudo.after
        b = b.next()
    except:
        code = code.replace('""', '')
        code = code[1:-1]
        print(code)
        c.input(code)
        break
    print(i)
```

该脚本通过该库提供的强大能力，实现了自动化读取验证码的内容，并将其自动填写到输入框中，最终只需要手动按下提交按钮即可。

运行该脚本后，会弹出一个新的浏览器窗口，在该窗口中登录Geekgame账号后将页面打开到Expert难度的题目后，在脚本中输入“OK”。随后便会自动提取内容并输入。

![image-20241028233453001](image-20241028233453001.png)

最后按下提交按钮：

![image-20241028233610782](image-20241028233610782.png)

![image-20241028233116208](image-20241028233116208.png)

### 解法2

该题目放出提示后，发现由于缺失前端经验之前做复杂了。查看提示后观察了styles标签中的代码，发现如下内容：

![image-20241028233751632](image-20241028233751632.png)

将高亮部分删除再次打印页面即可显示内容，但内容并不完整，而是有滚动条。直接摆烂把下面的style标签删掉即可，再次打印会发现完整的验证码。

![image-20241028234359701](image-20241028234359701.png)

删除后页面：

![image-20241028234657038](image-20241028234657038.png)

打印页面：

![image-20241028234717009](image-20241028234717009.png)

不能粘贴或打印等问题可参考Hard难度中的解法：删除keydown的事件侦听器。

（完）
