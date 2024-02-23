---
title: 利用调试API的Hook学习：挂钩notepad.exe的WriteFile函数
typora-root-url: debugapi-hook-notepad
date: 2024-02-23 22:10:56
tags: 
- Hook
- DebugAPI
categories: Reverse
---

> 源代码来源于《逆向工程核心原理》第30章 记事本 WriteFile() API 钩取，对其进行了Bug修复和64位适配
>
> 本示例于Windows 10 64位系统环境下通过测试

这里利用调试API去Hook notepad.exe的WriteFile函数，将其写入内容中小写字母转为大写字母，实现效果如下：

![image-20240223222401160](image-20240223222401160.png)

## 运行原理

利用调试API附加notepad.exe，将WriteFile函数的第一个字节修改为0xCC以触发调试事件（EXCEPTION_BREAKPOINT），在调试器中处理该调试事件，可以对程序内存进行读取和修改，以达到修改写入文本目的，之后恢复原字节，调用原WriteFile函数以写入内容，最后再次将WriteFile函数首字节修改为0xCC，确保再次触发调试事件

## 源代码分析

### 附加进程

利用`DebugActiveProcess`附加到进程，然后进入调试循环

```c
int main(int argc, char* argv[])
{
    DWORD dwPID;

    if( argc != 2 )
    {
        printf("\nUSAGE : hookdbg.exe <pid>\n");
        return 1;
    }

    // 附加进程
    dwPID = atoi(argv[1]);
    if( !DebugActiveProcess(dwPID) )
    {
        printf("DebugActiveProcess(%d) failed!!!\n"
               "Error Code = %d\n", dwPID, GetLastError());
        return 1;
    }

    // 调试循环
    DebugLoop();

    return 0;
}
```

### 调试事件循环

调试循环中等待被调试者的调试事件，并且处理这些事件

```c
void DebugLoop()
{
    DEBUG_EVENT de;
    DWORD dwContinueStatus;

    // 等待被调试者发送事件
    while( WaitForDebugEvent(&de, INFINITE) )
    {
        // 默认异常未处理
        dwContinueStatus = DBG_EXCEPTION_NOT_HANDLED;

        // 调试器附加时触发
        if( CREATE_PROCESS_DEBUG_EVENT == de.dwDebugEventCode )
        {
           OnCreateProcessDebugEvent(&de);
        }
        // 异常事件
        else if( EXCEPTION_DEBUG_EVENT == de.dwDebugEventCode )
        {
            if( OnExceptionDebugEvent(&de) )
                continue;
        }
        // 被调试者终止
        else if( EXIT_PROCESS_DEBUG_EVENT == de.dwDebugEventCode )
        {
            // debuggee 终止 -> debugger 终止
            break;
        }

        // 继续运行被调试者
        ContinueDebugEvent(de.dwProcessId, de.dwThreadId, dwContinueStatus);
    }
}
```

这里如果我们不处理异常，调用`ContinueDebugEvent`时第三个参数`dwContinueStatus`要填`DBG_EXCEPTION_NOT_HANDLED`，系统会进行下一个结构化异常处理程序

下面是DBG_CONTINUE和DBG_EXCEPTION_NOT_HANDLED的含义（来自MSDN）

| 值                                             | 含义                                                         |
| ---------------------------------------------- | ------------------------------------------------------------ |
| **DBG_CONTINUE**<br />0x00010002L              | 如果 *dwThreadId* 参数指定的线程之前报告了EXCEPTION_DEBUG_EVENT调试事件，则函数将停止所有异常处理并继续线程，并将异常标记为已处理。 对于任何其他调试事件，此标志只是继续线程。 |
| **DBG_EXCEPTION_NOT_HANDLED**<br />0x80010001L | 如果 *dwThreadId* 指定的线程以前报告了EXCEPTION_DEBUG_EVENT调试事件，则函数将继续处理异常。 如果这是首次出现异常事件，则使用结构化异常处理程序的搜索和调度逻辑;否则，进程将终止。 对于任何其他调试事件，此标志只是继续线程。 |

#### 附加时事件

当附加时，触发`CREATE_PROCESS_DEBUG_EVENT`事件（这里说的并不严谨，参考下表，来自MSDN）

| 值                                    | 含义                                                         |
| :------------------------------------ | :----------------------------------------------------------- |
| **CREATE_PROCESS_DEBUG_EVENT**<br />3 | 报告创建进程调试事件 (包括进程及其main线程) 。 **u.CreateProcessInfo** 的值指定[CREATE_PROCESS_DEBUG_INFO](https://learn.microsoft.com/zh-cn/windows/desktop/api/minwinbase/ns-minwinbase-create_process_debug_info)结构。 |

下面是处理函数

```c
LPVOID g_pfWriteFile = NULL;
CREATE_PROCESS_DEBUG_INFO g_cpdi;
BYTE g_chINT3 = 0xCC, g_chOrgByte = 0;

BOOL OnCreateProcessDebugEvent(LPDEBUG_EVENT pde)
{
    // 获取WriteFile() API地址
    g_pfWriteFile = GetProcAddress(GetModuleHandleA("kernel32.dll"), "WriteFile");

    // API Hook - WriteFile()
    //   更改第一个字节为0xCC (INT 3)
    //   (g_chOrgByte是原始字节的备份)
    memcpy(&g_cpdi, &pde->u.CreateProcessInfo, sizeof(CREATE_PROCESS_DEBUG_INFO));
    ReadProcessMemory(g_cpdi.hProcess, g_pfWriteFile, 
                      &g_chOrgByte, sizeof(BYTE), NULL);
    WriteProcessMemory(g_cpdi.hProcess, g_pfWriteFile, 
                       &g_chINT3, sizeof(BYTE), NULL);

    return TRUE;
}
```

这里获取了`WriteFile`函数的地址，并且将其第一个字节修改为`0xCC`，在执行到这个函数时会触发`EXCEPTION_BREAKPOINT`异常

#### 调试事件

| 值                               | 含义                                                         |
| :------------------------------- | :----------------------------------------------------------- |
| **EXCEPTION_DEBUG_EVENT**<br />1 | 报告异常调试事件。 **u.Exception** 的值指定[EXCEPTION_DEBUG_INFO](https://learn.microsoft.com/zh-cn/windows/desktop/api/minwinbase/ns-minwinbase-exception_debug_info)结构。 |

（来自MSDN）

我们`EXCEPTION_DEBUG_EVENT`事件中调用的函数处理了这个异常，相关函数代码如下

```c
BOOL OnExceptionDebugEvent(LPDEBUG_EVENT pde)
{
    CONTEXT ctx;
    PBYTE lpBuffer = NULL;
    DWORD64 dwNumOfBytesToWrite, dwAddrOfBuffer, i;
    PEXCEPTION_RECORD per = &pde->u.Exception.ExceptionRecord;

    // 判断断点异常 (INT 3)
    if( EXCEPTION_BREAKPOINT == per->ExceptionCode )
    {
        // 断点地址为WriteFile()时
        if( g_pfWriteFile == per->ExceptionAddress )
        {
            // #1. Unhook
            //   0xCC恢复为原始字节
            WriteProcessMemory(g_cpdi.hProcess, g_pfWriteFile, &g_chOrgByte, sizeof(BYTE), NULL);

            // #2. 获取线程上下文
            ctx.ContextFlags = CONTEXT_FULL;
            GetThreadContext(g_cpdi.hThread, &ctx);

            // #3. 获取WriteFile() 的第二个和第三个参数
            //   64位 寄存器传递参数，RDX是buffer，R8是BytesToWrite
            dwAddrOfBuffer = ctx.Rdx;
            dwNumOfBytesToWrite = ctx.R8;

            // #4. 分配缓冲区
            lpBuffer = (PBYTE)malloc(dwNumOfBytesToWrite+1);
            memset(lpBuffer, 0, dwNumOfBytesToWrite+1);

            // #5. WriteFile()缓冲区复制到临时缓冲区
            ReadProcessMemory(g_cpdi.hProcess, (LPVOID)dwAddrOfBuffer, lpBuffer, dwNumOfBytesToWrite, NULL);
            printf("\n### original string ###\n%s\n", lpBuffer);

            // #6. 小写字母转大写
            for( i = 0; i < dwNumOfBytesToWrite; i++ )
            {
                if( 0x61 <= lpBuffer[i] && lpBuffer[i] <= 0x7A )
                    lpBuffer[i] -= 0x20;
            }

            printf("\n### converted string ###\n%s\n", lpBuffer);

            // #7. 将变换后的缓冲区复制到 WriteFile() 缓冲区
            WriteProcessMemory(g_cpdi.hProcess, (LPVOID)dwAddrOfBuffer, lpBuffer, dwNumOfBytesToWrite, NULL);
            
            // #8. 释放缓冲区
            free(lpBuffer);

            // #9. 设置RIP到WriteFile() 
            //   (当前是WriteFile() + 1，INT3之后)
            ctx.Rip = (DWORD64)g_pfWriteFile;
            SetThreadContext(g_cpdi.hThread, &ctx);

            // #10. 继续被调试者
            ContinueDebugEvent(pde->dwProcessId, pde->dwThreadId, DBG_CONTINUE);
            Sleep(0);

            // #11. API Hook
            WriteProcessMemory(g_cpdi.hProcess, g_pfWriteFile, &g_chINT3, sizeof(BYTE), NULL);

            return TRUE;
        }
    }

    return FALSE;
}
```

代码主要分为11步，最初判断了触发的异常是否是断点异常`EXCEPTION_BREAKPOINT`，触发异常的地址是否为WriteFile函数

##### Unhook

在确定了以上之后，为了在修改参数之后再次调用WriteFile函数，先将`0xCC`字节恢复为了`OnCreateProcessDebugEvent`函数中保存的原始字节

```c
// #1. Unhook
//   0xCC恢复为原始字节
WriteProcessMemory(g_cpdi.hProcess, g_pfWriteFile, &g_chOrgByte, sizeof(BYTE), NULL);
```

##### 获取调用时参数

然后要获取到相关的参数，这里是64位程序的原因，参数传递使用RCX，RDX，R8，R9寄存器，除此之外的参数使用寄存器，WriteFile函数只有四个参数，寄存器足矣

WriteFile() API（来自MSDN）：

```c++
BOOL WriteFile(
  [in]                HANDLE       hFile,
  [in]                LPCVOID      lpBuffer,
  [in]                DWORD        nNumberOfBytesToWrite,
  [out, optional]     LPDWORD      lpNumberOfBytesWritten,
  [in, out, optional] LPOVERLAPPED lpOverlapped
);
```

我们只获取第二个参数（lpBuffer）和第三个参数（nNumberOfBytesToWrite），对应的是RDX寄存器和R8寄存器

```c
// #2. 获取线程上下文
// CONTEXT_FULL好像未文档化，但是写CONTEXT_CONTROL是获取不到这些寄存器的值的
ctx.ContextFlags = CONTEXT_FULL;
GetThreadContext(g_cpdi.hThread, &ctx);

// #3. 获取WriteFile() 的第二个和第三个参数
//   64位 寄存器传递参数，RDX是buffer，R8是BytesToWrite
dwAddrOfBuffer = ctx.Rdx;
dwNumOfBytesToWrite = ctx.R8;
```

##### 修改写入内容

然后准备修改写入的内容，将lpBuffer指向的内容复制到新申请的缓冲区中，然后修改这里的内容，再将修改后内容写入lpBuffer指向的地址

```c
// #4. 分配缓冲区
lpBuffer = (PBYTE)malloc(dwNumOfBytesToWrite+1);
memset(lpBuffer, 0, dwNumOfBytesToWrite+1);

// #5. WriteFile()缓冲区复制到临时缓冲区
ReadProcessMemory(g_cpdi.hProcess, (LPVOID)dwAddrOfBuffer, lpBuffer, dwNumOfBytesToWrite, NULL);
printf("\n### original string ###\n%s\n", lpBuffer);

// #6. 小写字母转大写
for( i = 0; i < dwNumOfBytesToWrite; i++ )
{
    if( 0x61 <= lpBuffer[i] && lpBuffer[i] <= 0x7A )
        lpBuffer[i] -= 0x20;
}

printf("\n### converted string ###\n%s\n", lpBuffer);

// #7. 将变换后的缓冲区复制到 WriteFile() 缓冲区
WriteProcessMemory(g_cpdi.hProcess, (LPVOID)dwAddrOfBuffer, lpBuffer, dwNumOfBytesToWrite, NULL);

// #8. 释放缓冲区
free(lpBuffer);
```

##### 恢复程序执行

最后设置RIP，将其重新指向WriteFile函数的起始处，因为程序是在执行了int 3指令之后产生了调试事件，当前的RIP是在`WriteFile + 1`处，因此我们需要将其设置到`WriteFile`处

```c
// #9. 设置RIP到WriteFile() 
//   (当前是WriteFile() + 1，INT3之后)
ctx.Rip = (DWORD64)g_pfWriteFile;
SetThreadContext(g_cpdi.hThread, &ctx);

// #10. 继续被调试者
ContinueDebugEvent(pde->dwProcessId, pde->dwThreadId, DBG_CONTINUE);
Sleep(0);
```

##### 重新Hook

此处我们已经处理了这个调试事件，调用`ContinueDebugEvent`就可以使用`DBG_CONTINUE`，以表示我们已经处理了这个事件，程序代码会从RIP执行

```c
// #11. API Hook
WriteProcessMemory(g_cpdi.hProcess, g_pfWriteFile, &g_chINT3, sizeof(BYTE), NULL);
```

最后我们将`0xCC`重新写回去，以确保下次调用WriteFile函数时，我们还可以拦截到

> 此处调用Sleep(0)可以释放当前线程的剩余时间片，CPU会立即执行其他线程，以避免在调用WriteFile()时修改其首字节，造成内存访问异常

虽然书里是这么说的，但是我把Sleep(0)删了后，快速反复保存也没产生内存访问异常，不管怎么样，留在这里应该还是会稳定一些的

## 完整源代码

```c
#include "windows.h"
#include "stdio.h"

LPVOID g_pfWriteFile = NULL;
CREATE_PROCESS_DEBUG_INFO g_cpdi;
BYTE g_chINT3 = 0xCC, g_chOrgByte = 0;

BOOL OnCreateProcessDebugEvent(LPDEBUG_EVENT pde)
{
    // 获取WriteFile() API地址
    g_pfWriteFile = GetProcAddress(GetModuleHandleA("kernel32.dll"), "WriteFile");

    // API Hook - WriteFile()
    //   更改第一个字节为0xCC (INT 3)
    //   (g_chOrgByte是原始字节的备份)
    memcpy(&g_cpdi, &pde->u.CreateProcessInfo, sizeof(CREATE_PROCESS_DEBUG_INFO));
    ReadProcessMemory(g_cpdi.hProcess, g_pfWriteFile, 
                      &g_chOrgByte, sizeof(BYTE), NULL);
    WriteProcessMemory(g_cpdi.hProcess, g_pfWriteFile, 
                       &g_chINT3, sizeof(BYTE), NULL);

    return TRUE;
}

BOOL OnExceptionDebugEvent(LPDEBUG_EVENT pde)
{
    CONTEXT ctx;
    PBYTE lpBuffer = NULL;
    DWORD64 dwNumOfBytesToWrite, dwAddrOfBuffer, i;
    PEXCEPTION_RECORD per = &pde->u.Exception.ExceptionRecord;

    // 判断断点异常 (INT 3)
    if( EXCEPTION_BREAKPOINT == per->ExceptionCode )
    {
        // 断点地址为WriteFile()时
        if( g_pfWriteFile == per->ExceptionAddress )
        {
            // #1. Unhook
            //   0xCC恢复为原始字节
            WriteProcessMemory(g_cpdi.hProcess, g_pfWriteFile, 
                               &g_chOrgByte, sizeof(BYTE), NULL);

            // #2. 获取线程上下文
            ctx.ContextFlags = CONTEXT_FULL;
            GetThreadContext(g_cpdi.hThread, &ctx);

            // #3. 获取WriteFile() 的第二个和第三个参数
            //   64位 寄存器传递参数，RDX是buffer，R8是BytesToWrite
            dwAddrOfBuffer = ctx.Rdx;
            dwNumOfBytesToWrite = ctx.R8;

            // #4. 分配缓冲区
            lpBuffer = (PBYTE)malloc(dwNumOfBytesToWrite+1);
            memset(lpBuffer, 0, dwNumOfBytesToWrite+1);

            // #5. WriteFile()缓冲区复制到临时缓冲区
            ReadProcessMemory(g_cpdi.hProcess, (LPVOID)dwAddrOfBuffer, 
                              lpBuffer, dwNumOfBytesToWrite, NULL);
            printf("\n### original string ###\n%s\n", lpBuffer);

            // #6. 小写字母转大写
            for( i = 0; i < dwNumOfBytesToWrite; i++ )
            {
                if( 0x61 <= lpBuffer[i] && lpBuffer[i] <= 0x7A )
                    lpBuffer[i] -= 0x20;
            }

            printf("\n### converted string ###\n%s\n", lpBuffer);

            // #7. 将变换后的缓冲区复制到 WriteFile() 缓冲区
            WriteProcessMemory(g_cpdi.hProcess, (LPVOID)dwAddrOfBuffer, 
                               lpBuffer, dwNumOfBytesToWrite, NULL);
            
            // #8. 释放缓冲区
            free(lpBuffer);

            // #9. 设置RIP到WriteFile() 
            //   (当前是WriteFile() + 1，INT3之后)
            ctx.Rip = (DWORD64)g_pfWriteFile;
            SetThreadContext(g_cpdi.hThread, &ctx);

            // #10. 继续被调试者
            ContinueDebugEvent(pde->dwProcessId, pde->dwThreadId, DBG_CONTINUE);
            Sleep(0);

            // #11. API Hook
            WriteProcessMemory(g_cpdi.hProcess, g_pfWriteFile, 
                               &g_chINT3, sizeof(BYTE), NULL);

            return TRUE;
        }
    }

    return FALSE;
}

void DebugLoop()
{
    DEBUG_EVENT de;
    DWORD dwContinueStatus;

    // 等待被调试者发送事件
    while( WaitForDebugEvent(&de, INFINITE) )
    {
        // 默认异常未处理
        dwContinueStatus = DBG_EXCEPTION_NOT_HANDLED;

        // 调试器附加时触发
        if( CREATE_PROCESS_DEBUG_EVENT == de.dwDebugEventCode )
        {
           OnCreateProcessDebugEvent(&de);
        }
        // 异常事件
        else if( EXCEPTION_DEBUG_EVENT == de.dwDebugEventCode )
        {
            if( OnExceptionDebugEvent(&de) )
                continue;
        }
        // 被调试者终止
        else if( EXIT_PROCESS_DEBUG_EVENT == de.dwDebugEventCode )
        {
            // debuggee 终止 -> debugger 终止
            break;
        }

        // 继续运行被调试者
        ContinueDebugEvent(de.dwProcessId, de.dwThreadId, dwContinueStatus);
    }
}

int main(int argc, char* argv[])
{
    DWORD dwPID;

    if( argc != 2 )
    {
        printf("\nUSAGE : hookdbg.exe <pid>\n");
        return 1;
    }

    // 附加进程
    dwPID = atoi(argv[1]);
    if( !DebugActiveProcess(dwPID) )
    {
        printf("DebugActiveProcess(%d) failed!!!\n"
               "Error Code = %d\n", dwPID, GetLastError());
        return 1;
    }

    // 调试循环
    DebugLoop();

    return 0;
}
```

## 参考资料

《逆向工程核心原理》第30章 记事本 WriteFile() API 钩取

[DEBUG_EVENT (minwinbase.h) - Win32 apps](https://learn.microsoft.com/zh-cn/windows/win32/api/minwinbase/ns-minwinbase-debug_event)

[ContinueDebugEvent 函数 (debugapi.h) - Win32 apps](https://learn.microsoft.com/zh-cn/windows/win32/api/debugapi/nf-debugapi-continuedebugevent)

[WriteFile 函数 (fileapi.h) - Win32 apps](https://learn.microsoft.com/zh-cn/windows/win32/api/fileapi/nf-fileapi-writefile)
