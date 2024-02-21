---
title: 利用调试API的Hook学习：挂钩notepad.exe的WriteFile函数
typora-root-url: debugapi-hook-notepad
date: 2099-02-19 23:10:56
tags: Hook
categories: Reverse
---

实现Hook可以注入DLL并将目标函数跳转到挂钩函数，或者利用调试API，使目标函数触发断点异常停在调试器，在调试器中执行额外操作，后者无需编译DLL并注入，个人认为较为便捷，这里学习一下该种方式

## 参考资料

《逆向工程核心原理》第30章
