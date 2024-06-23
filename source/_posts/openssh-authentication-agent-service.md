---
title: 记录安装OpenSSH服务器后没有ssh-agent服务问题
typora-root-url: openssh-authentication-agent-service
date: 2024-06-23 21:28:19
tags: 
- Misc
- OpenSSH
- OpenSSH authentication agent
- ssh-agent
categories: Misc
---

## 前言

系统是Win10 1809，翻了不少文章，很少找到缺失ssh-agent服务的问题，作为记录个人的问题了。

## 过程

最近试图使用SSH密钥连接到GitHub

![image-20240623204104283](image-20240623204104283.png)

需要用到OpenSSH，于是参考（[Windows 支持 OpenSSH 了！](https://www.cnblogs.com/sparkdev/p/10166061.html)）用系统的“管理可选功能”安装了OpenSSH服务器。

安装完毕后，使用Powershell执行了GitHub文档中的指令，提示找不到名为“ssh-agent”的服务：

![image-20240623204629354](image-20240623204629354.png)

参考一篇文章（[多种方法安装配置windows openssh server](https://cloud.tencent.com/developer/article/2358186)），其中提到：

> 在server2019、 server2022、新版win10、win11上，4种方法都可以，但建议后2种，因为前2种安装的openssh server只有sshd服务没有ssh-agent服务（OpenSSH Authentication Agent）

而这里的前两种方法中就有提到使用系统的“管理可选功能”安装OpenSSH服务器。

## 解决

在GitHub（[Releases](https://github.com/PowerShell/Win32-OpenSSH/releases)）上下载对应版本的msi安装包，直接安装后就不缺服务了

![image-20240623205403014](image-20240623205403014.png)

## 参考

[生成新的 SSH 密钥并将其添加到 ssh-agent - GitHub 文档](https://docs.github.com/zh/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

[Windows 支持 OpenSSH 了！](https://www.cnblogs.com/sparkdev/p/10166061.html)

[多种方法安装配置windows openssh server](https://cloud.tencent.com/developer/article/2358186)
