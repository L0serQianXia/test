---
title: 你的记事本安全吗：瞄准中国用户的恶意的文本编辑器
typora-root-url: trojanized-text-editor-apps
date: 2024-03-16 16:53:39
tags:
- news
- malicious
- Translation
categories: Misc
---

# 你的记事本安全吗：瞄准中国用户的恶意的文本编辑器

本文为翻译，感觉不如机翻。

原文地址：[Infected text editors load backdoor into macOS | Securelist](https://securelist.com/trojanized-text-editor-apps/112167/)

原作者：[SERGEY PUZAN](https://securelist.com/author/sergeypuzan/)

恶意广告（Malvertising） 是一种吸引受害者到恶意网站的流行方式：推广部分被放在搜索结果的顶端，增加了用户点击链接的可能性。在搜索结果顶端的网址也更容易被用户信任。一年前，我们的专家[讨论了](https://securelist.com/malvertising-through-search-engines/108996/)通过谷歌广告传播的窃密红线（RedLine stealer）。通过误植域名 （Typosquatting）和其他技术，攻击者尽力让他们的恶意网站看起来和官方网址一样。

这次，一个相似的威胁瞄准了中国互联网最大搜索引擎之一。在该搜索引擎中，我们发现了两个相关的文本编辑器的修改版：第一个，恶意资源在搜索结果的推广部分；第二个则在搜索结果的最前面。我们还没研究完这个威胁的全部细节，所以这篇文章可能以后还会更新。

## 搜索结果中的恶意网址

下面的截图显示了两次搜索，都返回了恶意链接：

![Malicious link in the advertisement section for the search notepad++ (left) and search results for vnote (right)](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11114834/Trojanized_Notepad_01-1024x352.png)

搜索notepad++时，在推广区域的恶意链接（左）；vnote的搜索结果（右）

搜索**notepad++**时在推广区域中发现的恶意网址。打开它，善于观察的用户会立即注意到一个有趣的矛盾：网址里有关键词**vnote**，网站标题说提供**Notepad‐‐**（一个和**Notepad++**类似的开源软件）的下载，而图片显示的是**Notepad++**的图标。实际上，下载的包里还是**Notepad--**

![Page with fake NotePad++](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11115044/Trojanized_Notepad_02-1024x518.png)

提供假NotePad++的网站

这个网站提供了三个平台的安装包（Windows，Linux，macOS)；然而，只有macOS和Linux的安装包是有问题的。Windows版的下载链接指向官方仓库，也不是恶意的：

![Application download links, linked to buttons on the malicious Notepad-- download page](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11115114/Trojanized_Notepad_03-1024x206.png)

截图显示了恶意软件安装包的源是**vnote-1321786806[.]cos[.]ap-hongkong[.]myqcloud[.]com**.

同时，在**vnote**搜索结果的第二个页面，试着伪装成程序的官方网站：

![Fake (above) and the original (below) VNote site](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11115145/Trojanized_Notepad_04-1008x1024.png)

假冒的（上）和官方的（下）**VNote**网站

不幸的是，在我们调查的时候，可能存在恶意代码的**VNote**的下载链接已经失效了；然而，它们带我们获取到和**Notepad‐‐**链接里同样的资源：

![Application download links, linked to buttons on the fake VNote site](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11115215/Trojanized_Notepad_05.png)

应用程序下载链接

## 带有恶意负载的文本编辑器

因为我们有了针对Linux和macOS的假冒的**Notepad‐‐**的样本，可以更细致的看一下它们。

下载到的应用程序和官方版本有几处不同，Linux和macOS的恶意版本功能上都是相似的。我们来看一下macOS版本（*MD5: 00fb77b83b8ab13461ea9dd27073f54f*）。这是一个DMG格式的磁盘镜像，除了名为NotePad--的可执行文件（*MD5: 6ace1e014863eee67ab1d2d17a33d146*），其他内容和官方版本（2.0.0版）都一样。

探究了**main**函数的内容之后，我们发现，在应用程序完全启动之前，一个可疑的类**Uplocal**被初始化，而它在官方版本的Notepad--的源代码中并不存在：

![Modified section of code before application launch](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11120304/Trojanized_Notepad_06.png)

代码中被修改的部分

这个类只实现了一个方法，名为**run**。它会下载一个文件到**/tmp/updater**，并且执行它：

![Payload of the run method of the Uplocal class](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11120342/Trojanized_Notepad_07-1024x430.png)

Uplocal类的run方法的有效负载

文件从地址**hxxp://update[.]transferusee[.]com/onl/mac/<md5_hash>**下载，**<md5_hash>**是通过**GetComputerUUID**函数获取到的机器序列号的MD5值，该函数通过如下命令执行：

```bash
ioreg -rd1 -c IOPlatformExpertDevice | awk '/IOPlatformSerialNumber/ { print $3; }'
```

Linux版有点差异：

1. 文件从同样的网站下载，但是目录在/onl/lnx/：**hxxp://update[.]transferusee[.]com/onl/lnx/<md5_hash>**

2. **<md5_hash>**是设备的MAC地址的MD5值：

   ![Obtaining and hashing the device's MAC address](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11120430/Trojanized_Notepad_08.png)

   获取设备的MAC地址并对其进行哈希

不幸的是，在我们调查时，已经下载不到这个文件了，我们也不能确定原本应该是什么文件。

然而，我们明确的知道，这个服务器有另一个子域名，**dns[.]transferusee[.]com**，并且他被一个名为**DPysMac64**的Mach-O文件 (*MD5: 43447f4c2499b1ad258371adff4f503f*)访问，先前被传到了VT上，截止调查时，没有被任何杀软检出：

![DPysMac64 file page on VT](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11120532/Trojanized_Notepad_09-1024x663.png)

DPysMac64在VT上

另外，这个文件和那个神秘的本应该被下载下来的**updater**存在同一个服务器上：

![Loading DPysMac64 from update[.]transferusee[.]com](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11120606/Trojanized_Notepad_10-1024x144.png)

从update[.]transferusee[.]com加载DPysMac64

从这里我们可以自信的说，**updater**是一个中间步骤，最终应该加载的是**DPysMac64**。服务器同样有一个文件，名为**DPysMacM1**，名字表示它是为运行在苹果Silicon处理器的系统准备的；然而，其实它是和**DPysMac64**完全一致的一个文件。

这个应用程序是一个后门程序，和一个叫**Geacon**的东西非常像（**Geacon**是一个开源的Go语言写的**CobaltStrike** agent的实现）。尽管攻击者移除了直接提到**Geacon**的部分，我们仍发现了一大堆名称和函数中的代码片段，还有模块，符合[**geacon_plus**](https://github.com/Z3ratu1/geacon_plus/)，**geacon_pro**和[**BeaconTool**](https://github.com/jas502n/BeaconTool)的实现。比如说，它们有一个标志性的**sysinfo**模块，还有函数**FirstBlood**, **EncryptedMetaInfo**, **PullCommand**，等等：

![Comparison of the list of functions of the sysinfo module of DPysMac64 (left) and an instance of geacon_pro (right)](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11120633/Trojanized_Notepad_11-1024x243.png)

函数列表中**sysinfo**相关模块的比较，DPysMac64（左），geacon_pro（右）

这个后门程序有两个启动选项——正常启动和作为一个服务启动。与C2服务器**dns[.]transferusee[.]com**的沟通是通过HTTPS协议的。有趣的是，攻击者把执行远程命令的相关内容命名为**spacex**：

![The name of the backdoor module contained in the lines of the DPysMac64 file](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11120705/Trojanized_Notepad_12.png)

The name of the backdoor module contained in the lines of the DPysMac64 file

该后门包含以下命令：

| **代码** | **名称**     | **意图**                                      |
| -------- | ------------ | --------------------------------------------- |
| 25       | CmdSSH       | 创建一个SSH连接                               |
| 27       | Spawn        | 启动一个新的代理木马（Launching a new agent） |
| 32       | CmdExit      | 关闭                                          |
| 34       | SetSleep     | 进入睡眠模式                                  |
| 1010     | Screenshot   | 拍摄屏幕快照                                  |
| 1020     | ProcessList  | 获取进程列表                                  |
| 1021     | ProcessKill  | 终止一个进程                                  |
| 1030     | PortScan     | 扫描端口                                      |
| 1031     | Install      | 将自己注册服务                                |
| 1032     | UnInstall    | 取消注册自己的服务                            |
| 1040     | CmdHashdump  | 获取计算机名                                  |
| 1044     | CmdClipboard | 读取剪切板内容                                |
| 1050     | FileBrowse   | 获取一个目录下的文件                          |
| 1051     | FileDrives   | 获取驱动器列表                                |
| 1052     | FileMakeDir  | 创建一个目录                                  |
| 1056     | FileUpload   | 上传一个文件到服务器                          |
| 1057     | FileExecute  | 执行一个文件                                  |
| 1060     | FileDownload | 从服务器下载一个文件                          |

## 受感染应用程序之间的联系

尽管我们不能确定先前从**vnote[.]info**下载的文件，但我们发现，两个网站中分发应用程序的源头是相同的。值得一提的是，在检查被修改的**NotePad‐‐**时，偶然发现了另一个有趣细节。可执行文件中，我们发现了一个**关于**窗口，但在原本应指向官方项目网站的链接处，却是一个指向可疑网站的链接**vnotepad[.]com**。下面是程序界面的**关于**窗口的截图：

![About window of modified Notepad--](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11120750/Trojanized_Notepad_13-1024x580.png)

修改版的Notepad‐‐的关于窗口

**关于**窗口中的链接带我们到了一个占位页面

![img](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11154800/Trojanized_Notepad_141.png)

这很奇怪，于是我们试着把网址中的HTTP转为HTTPS，才发现了这个网站是**VNote**网站的另一份假冒网站，与我们**vnote[.]info**中看到的很相似。此外，当我们打开这个网站时，浏览器警告我们证书无效，因为它是签发给**vnote[.]info**的：

![Certificate used by the site vnotepad[.]com](https://media.kasperskycontenthub.com/wp-content/uploads/sites/43/2024/03/11154934/Trojanized_Notepad_15.png)

vnotepad[.]com所使用的证书

这表示，这里描述的两个案例是有明确的联系的，也说明很有可能，修改版的**VNote**编辑器和修改版**NotePad--**的意图是相似的，包括通过它们来进行下一阶段的感染。

## 总结

我们会继续研究以上的威胁，也会搜寻还没被发现的中间过程。另外，我们确定Linux和macOS应用程序中的更改是相同的，暗示可能存在一个与我们在macOS上发现的后门类似的针对Linux系统的后门程序。

## IoC情报

**文件:**

| **MD5**                                                      | **文件类型**  | **文件名**                       |
| ------------------------------------------------------------ | ------------- | -------------------------------- |
| [43447f4c2499b1ad258371adff4f503f](https://opentip.kaspersky.com/43447f4c2499b1ad258371adff4f503f/?utm_source=SL&utm_medium=SL&utm_campaign=SL) | Mach-O 64-bit | DPysMac64                        |
| [00fb77b83b8ab13461ea9dd27073f54f](https://opentip.kaspersky.com/00fb77b83b8ab13461ea9dd27073f54f/?utm_source=SL&utm_medium=SL&utm_campaign=SL) | DMG           | Notepad‐‐v2.0.0-mac_x64_12.3.dmg |
| [5ece6281d57f16d6ae773a16f83568db](https://opentip.kaspersky.com/5ece6281d57f16d6ae773a16f83568db/?utm_source=SL&utm_medium=SL&utm_campaign=SL) | AppImage      | Notepad‐‐-x86_64.AppImage        |
| [6ace1e014863eee67ab1d2d17a33d146](https://opentip.kaspersky.com/6ace1e014863eee67ab1d2d17a33d146/?utm_source=SL&utm_medium=SL&utm_campaign=SL) | Mach-O 64-bit | NotePad‐‐                        |
| [47c9fec1a949e160937dd9f9457ec689](https://opentip.kaspersky.com/47c9fec1a949e160937dd9f9457ec689/?utm_source=SL&utm_medium=SL&utm_campaign=SL) | ELF 64-bit    | NotePad‐‐                        |

**链接:**

| 链接                                                         |
| ------------------------------------------------------------ |
| [dns[.]transferusee[.]com](https://opentip.kaspersky.com/dns.transferusee.com/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |
| [update[.]transferusee[.]com/onl/mac/](https://opentip.kaspersky.com/update.transferusee.com/onl/mac/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |
| [update[.]transferusee[.]com/onl/lnx/](https://opentip.kaspersky.com/update.transferusee.com/onl/lnx/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |
| [update[.]transferusee[.]com/DPysMac64](https://opentip.kaspersky.com/update.transferusee.com/DPysMac64/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |
| [update[.]transferusee[.]com/DPysMacM1](https://opentip.kaspersky.com/update.transferusee.com/DPysMacM1/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |
| [vnote[.]info](https://opentip.kaspersky.com/vnote.info/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |
| [vnote[.]fuwenkeji[.]cn](https://opentip.kaspersky.com/vnote.fuwenkeji.cn/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |
| [vnotepad[.]com](https://opentip.kaspersky.com/vnotepad.com/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |
| [vnote-1321786806[.]cos[.]ap-hongkong[.]myqcloud[.]com](https://opentip.kaspersky.com/vnote-1321786806.cos.ap-hongkong.myqcloud.com/?utm_source=SL&utm_medium=SL&utm_campaign=SL) |

