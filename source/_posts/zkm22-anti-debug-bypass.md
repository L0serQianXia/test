---
title: 一种基于替换核心类绕过ZKM22反JavaAgent的方法
typora-root-url: zkm22-anti-debug-bypass
date: 2024-05-12 22:05:09
tags:
- Reverse
- re
- zkm
- java
- -Xbootclasspath
- javaagent
categories:
- Reverse
- Java
---

# 利用-Xbootclasspath绕过ZKM22的反JavaAgent

## 前言

如果我们尝试使用Java Agent探测ZKM22，在启动时会看到如下的报错信息：

![image-20240505231329549](image-20240505231329549.png)

这实际上是ZKM对javaagent的检测，如何绕过这种检测？这里讨论一种修补Java核心类绕过检测的方法。

全文基于Java1.8

## 如何检测JVM参数

Java提供了ManagementFactory，这是一个为我们提供各种获取JVM信息的工厂类，具体上来说，可以用这个类来获取输入的JVM参数，下面提供一个检测参数的示例：

```java
import java.lang.management.ManagementFactory;
import java.util.List;

public class Start {
    public static void main(String[] str) {
        List<String> args = ManagementFactory.getRuntimeMXBean().getInputArguments();
        boolean flag = false;
        for(String s : args) {
            if(s.contains("-javaagent")) {
                flag = true;
                System.out.print("检测到JavaAgent：");
                System.out.println(s);
            }
        }
        
        if(!flag) {
            System.out.println("未检测到JavaAgent！");
        }
    }
}
```

下图为运行结果：

![image-20240512214955375](image-20240512214955375.png)

由此，我们可以检测到JavaAgent的使用。并且知道，获取JVM参数的关键API为`ManagementFactory.getRuntimeMXBean().getInputArguments()`

## 如何修补核心类

### 类的加载顺序

要修补核心类，先要了解JVM类的加载顺序

> The Java launcher, **java**, initiates the Java virtual machine. The virtual machine searches for and loads classes in this order:
>
> - **Bootstrap classes** - Classes that comprise the Java platform, including the classes in `rt.jar` and several other important jar files.
> - **Extension classes** - Classes that use the Java Extension mechanism. These are bundled as `.jar` files located in the extensions directory.
> - **User classes** - Classes defined by developers and third parties that do not take advantage of the extension mechanism. You identify the location of these classes using the `-classpath` option on the command line (the preferred method) or by using the CLASSPATH environment variable. (See **Setting the Classpath** for [Windows](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/classpath.html) or [Unix](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/classpath.html).)
>
> （引自https://docs.oracle.com/javase/8/docs/technotes/tools/findingclasses.html）

基于AI的翻译如下：

> Java 启动器，即 **java** 命令，启动了 Java 虚拟机。虚拟机按照以下顺序搜索并加载类：
>
> - **引导类（Bootstrap classes）** - 构成Java平台的类，包括`rt.jar`中的类和其他几个重要的jar文件。
> - **扩展类（Extension classes）** - 使用Java扩展机制的类。这些类被打包为`.jar`文件，位于扩展目录中。
> - **用户类（User classes）** - 由开发者和第三方定义的类，这些类没有利用扩展机制。通过命令行上的 `-classpath` 选项（推荐方法）或使用 CLASSPATH 环境变量来指定这些类的位置。（参见针对 [Windows](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/classpath.html) 或 [Unix](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/classpath.html) 的**设置类路径**说明。）

这里所谓的Bootstrap classes是构成Java平台的类，也就是我们调用的Java提供的API类，如果想要替换引导类，和替换扩展类和用户类来说，要相对更难一些，我们再来看看如何替换掉引导类：

> Bootstrap classes are the classes that implement the Java 2 Platform. Bootstrap classes are in the `rt.jar` and several other jar files in the `jre/lib` directory. These archives are specified by the value of the bootstrap class path which is stored in the `sun.boot.class.path` system property. This system property is for reference only, and should not be directly modified.
>
> It is very unlikely that you will need to redefine the bootstrap class path. The nonstandard option, **-Xbootclasspath**, allows you to do so in those rare cicrcumstances in which it is necessary to use a different set of core classes.
>
> （引自https://docs.oracle.com/javase/8/docs/technotes/tools/findingclasses.html）

基于AI的翻译：

> 引导类是实现Java 2平台的类。这些引导类位于`jre/lib`目录下的`rt.jar`及若干其他jar文件中。这些存档文件由引导类路径的值指定，该路径存储在`sun.boot.class.path`系统属性中。此系统属性仅供查阅，不应直接修改。
>
> 几乎不可能需要您重新定义引导类路径。但是，存在一个非标准选项 **-Xbootclasspath**，它允许在极少数需要使用不同核心类集合的情况下进行此类操作。

文档里指出，可以使用-Xbootclasspath这个JVM参数，使JVM加载的核心类被我们替换掉。

### -Xbootclasspath

该参数可以用于指定JVM在启动时搜索类文件的路径，它优先于常规的类路径(`-classpath`或`-cp`)进行搜索。

用法（java -X输出）：

> -Xbootclasspath:<用 ; 分隔的目录和 zip/jar 文件>
>                   设置搜索路径以引导类和资源
> -Xbootclasspath/a:<用 ; 分隔的目录和 zip/jar 文件>
>                   附加在引导类路径末尾
> -Xbootclasspath/p:<用 ; 分隔的目录和 zip/jar 文件>
>                   置于引导类路径之前

这里我们需要附加在引导类路径之前，使我们的修补类优先于核心类被加载，就可以实现替换核心类的效果。

用法：

```bash
java -Xbootclasspath/p:Patch.jar -jar ...
```

### 寻找被替换的目标类

根据上面编写的JVM参数检测代码，可以知道获取JVM参数的关键API为`ManagementFactory.getRuntimeMXBean().getInputArguments()`，我们就跟踪它的调用，找到最终的方法：getInputArguments所在处并修改其代码。

OpenJDK提供的src.zip中包含了核心类的源代码，首先我们跟踪ManagementFactory类

![image-20240512212057493](image-20240512212057493.png)

它调用了ManagementFactoryHelper的`getRuntimeMXBean`方法

![image-20240512212142303](image-20240512212142303.png)

这里返回了RuntimeImpl对象

![image-20240512212216028](image-20240512212216028.png)

最终我们跟踪到了`getInputArguments`方法

注意：从甲骨文JDK提供的src.zip下并不包含sun包的源代码，也就是无法找到这里的代码，可以下载使用OpenJDK

### 编写替代的核心类

首先创建一个项目，将RuntimeImpl复制为同包名同类名的文件

目录结构如下图：

![image-20240512212346646](image-20240512212346646.png)

这样就获得了要修补的类的源代码

#### 访问限制错误

但是可以看到IDE提示有错误：



![image-20240512211633582](image-20240512211633582.png)

这个访问限制的错误并不重要，实测使用Eclipse可以正确编译，所以直接配置这个问题的严重级别，忽略即可

![image-20240512212824805](image-20240512212824805.png)

#### 修改getInputArguments

修改`getInputArguments`的代码为：

```java
public List<String> getInputArguments() {
    Util.checkMonitorAccess();
    List<String> args = jvm.getVmArguments();
    Iterator<String> iterator = args.iterator();
    while(iterator.hasNext()) {
        String s = iterator.next();
        if(s.contains("-javaagent")) {
            iterator.remove();
        }
    }
    return args;
}
```

编译，并使用命令行运行：

![image-20240512215019461](image-20240512215019461.png)

抛出了一个异常

查询得知这个异常可能是由于Arrays.asList转换来的数组不支持remove导致的，为证实我们的想法，寻找一下`getVmArguments`方法的源代码。



![image-20240512215140427](image-20240512215140427.png)

跟踪VMManagement时发现同目录下有个Impl，直接进入该类，发现实现如下：

![image-20240512215502321](image-20240512215502321.png)

这里的确用了一个Arrays.asList，将native返回的字符串数组转为List

用ArrayList即可解决这个问题：

```java
public List<String> getInputArguments() {
    Util.checkMonitorAccess();
    List<String> args = new ArrayList<>(jvm.getVmArguments()); // 这里修改
    Iterator<String> iterator = args.iterator();
    while(iterator.hasNext()) {
        String s = iterator.next();
        if(s.contains("-javaagent")) {
            iterator.remove();
        }
    }
    return args;
}
```

重新编译，并且再次执行：

![image-20240512215716747](image-20240512215716747.png)

可以看到，已经通过修改`getInputArguments`的返回结果，绕过了JavaAgent检测。

## 实战ZKM

以上完成了修补核心类绕过JVM参数检测的效果，是否对ZKM有效，还需我们将这个方法用在ZKM上进行测试

![image-20240512220313996](image-20240512220313996.png)

如图，已经绕过ZKM22的JavaAgent检测。

## 参考资料

[How Classes are Found (oracle.com)](https://docs.oracle.com/javase/8/docs/technotes/tools/findingclasses.html)

[java.lang.UnsupportedOperationException异常分析和解决方法-CSDN博客](https://blog.csdn.net/IM507/article/details/99677430)

