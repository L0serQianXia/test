---
title: 通过自定义类加载器（ClassLoader）实现类文件加密保护
typora-root-url: java-classloader-class-encryption
date: 2024-09-16 16:40:42
tags:
- Java
- Obfuscator
- ClassLoader
- Encryption
categories: Java
---

# 通过自定义类加载器（ClassLoader）实现类文件加密保护

## 前言

由于Java语言自身特点，及其产生的中间代码中含有大量有意义的信息，Java的中间代码是易受攻击的。这里讨论一种基于Java自身灵活性实现的，通过自定义ClassLoader实现运行期解密已加密的类文件而保护类文件不被直接反编译。

## 原理

Java语言中，类的加载、连接和初始化都是在程序运行期间完成的。利用这样动态加载的特性，可以将Jar包中所有类文件预先加密，保留一个入口类文件未加密，通过自定义类加载器在运行时解密已加密的类文件，并将其作为二进制流加载。

## 实现

### 手动加密类文件

首先创建3个类MainKlass.class、Klass2.class和NoEncryptionKlass.class。其中`me.qianxia.MainKlass`为主类，含有main方法。

```java
public class MainKlass {
    public static void main(String[] args) {
        System.out.println("Hello, this is MainKlass!");
        Klass2.Hello();
        NoEncryptionKlass.Hmmm();
    }
}
```

```java
public class Klass2 {
    public static void Hello() {
        System.out.println("It is Klass2!");
        System.out.println(Klass2.class.getClassLoader().getClass().getCanonicalName());
    }
}
```

```java
public class NoEncryptionKlass {
    public static void Hmmm() {
        System.out.println("This is NoEncryptionKlass!");
        System.out.println(NoEncryptionKlass.class.getClassLoader().getClass().getCanonicalName());
        Klass2.Hello();
    }
}
```

上述代码运行结果如下图：

![image-20240916155023662](image-20240916155023662.png)

演示目的，暂用密钥为5的异或算法进行加密，得到文件MainKlass.klass、Klass2.klass和NoEncryptionKlass.klass。

![image-20240916155053235](image-20240916155053235.png)

### 自定义类加载器

新建一个类，命名为MyClassLoader，继承于`ClassLoader`，重写`findClass`方法。在`findClass`方法中实现类的解密和加载。

```java
import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class MyClassLoader extends ClassLoader {
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        Class<?> klass = null;
        // 调用父类加载器
        try {
            klass = super.findClass(name);
        } catch (ClassNotFoundException ignored) {}
        if (klass != null) {
            return klass;
        }
        // 自行搜索及加载
        try {
            InputStream stream = MyClassLoader.class.getResourceAsStream("/" + name.replace('.', '/') + ".klass");
            if (stream == null) {
                throw new ClassNotFoundException();
            }
            byte[] b = encrypt(readBytes(stream));
            klass = defineClass(name, b, 0, b.length);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return klass;
    }

    private static byte[] readBytes(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int temp;
        while ((temp = in.read(buffer)) != -1) {
            out.write(buffer, 0, temp);
        }
        return out.toByteArray();
    }

    /**
     * 类的解密，暂时用异或了，可以改成其他方法
     */
    private static byte[] encrypt(byte[] b) {
        for (int i = 0; i < b.length; i++) {
            b[i] ^= 5;
        }
        return b;
    }
```

上面实现了根据类名读取相应文件为二进制流，并且对二进制流进行异或解密的操作，最后调用`defineClass`获得Class对象。

编写一个新的main方法，如下：

```java
public static void main(String[] args) throws Exception {
    MyClassLoader myClassLoader = new MyClassLoader();
    Class<?> aClass = myClassLoader.loadClass("me.qianxia.MainKlass");
    Method main = aClass.getDeclaredMethod("main", String[].class);
    main.invoke(null, (Object) args);
}
```

这里我们使用自定义的类加载器，加载了原主类，并且调用了原main方法。

将`META-INF/MANIFEST.MF`中的主类修改为`MyClassLoader`，从而使得程序从`MyClassLoader`的`main`方法开始执行：

![image-20240916155114386](image-20240916155114386.png)

完成后的jar文件结构：

![image-20240916155217646](image-20240916155217646.png)

![image-20240916155223383](image-20240916155223383.png)

运行结果如下图：

![image-20240916155318774](image-20240916155318774.png)

可以看到，类文件的类加载器为我们刚刚自定义的类加载器

### 实现自动加密

下面，让我们来实现一个自动处理Jar文件的工具。

#### 分步

首先，我们需要将一个类文件中所有class文件加密，非class文件跳过。这里可以使用Java API的`JarFile`或`ZipFile`实现。同时还要写出新的Jar文件，可以使用`ZipOutputStream`实现。

```java
try {
        JarFile jar = new JarFile(inputPath);
        ZipOutputStream out = new ZipOutputStream(new FileOutputStream(inputPath + ".out.jar"));
        Enumeration<JarEntry> entries = jar.entries();
        while (entries.hasMoreElements()) {
            JarEntry entry = entries.nextElement();
            if (entry.isDirectory()) {
                continue;
            }
            byte[] b = readBytes(entry, jar);
            // 非class文件跳过，直接写出
            if (!entry.getName().endsWith(".class")) {
                out.putNextEntry(new ZipEntry(entry.getName()));
                out.write(b, 0, b.length);
                out.closeEntry();
                continue;
            }
            // 加密类文件并写出
            encryptBytes(b);
            out.putNextEntry(new ZipEntry(entry.getName().replace(".class", ".klass")));
            out.write(b, 0, b.length);
            out.closeEntry();
        }
        out.close();
        jar.close();
        System.out.println("Finished. output=" + inputPath + ".out.jar");
    } catch (IOException e) {
        System.out.println("IO Error occurred.");
        e.printStackTrace();
    }
```

同时，我们需要设置新的主类，可以在遍历原Jar中文件的过程中，检查`META-INF/MANIFEST.MF`文件，如下代码：

```java
// 设置新主类
if (entry.getName().equals("META-INF/MANIFEST.MF")) {
    String s = new String(b);
    s = s.replace(mainClass, "MyClassLoader");
    b = s.getBytes(StandardCharsets.UTF_8);
    out.putNextEntry(new ZipEntry(entry.getName()));
    out.write(b, 0, b.length);
    out.closeEntry();
    continue;
}
```

`mainClass`为要求用户输入的原主类，也可自行解析`MANIFEST.MF`文件中的主类。

最后，我们需要写出MyClassLoader.class到新的Jar中，如下代码：

```java
// 写出自定义类加载器
out.putNextEntry(new ZipEntry("MyClassLoader.class"));
out.write(klassLoaderBytes, 0, klassLoaderBytes.length);
out.closeEntry();
```

放置在关闭输入流和输出流之前即可，不可放置在遍历循环内。

可以注意到这里存在一个变量`klassLoaderBytes`，可以把编译好的MyClassLoader.class放置在程序中，然后在运行时读取它的内容，并且存放在`klassLoaderBytes`中，代码如下：

```java
public static void readKlassLoader(String mainClass) {
    ByteArrayOutputStream out = null;
    try {
        InputStream stream = MyObfuscator.class.getResourceAsStream("/MyClassLoader.class");
        out = new ByteArrayOutputStream();
        byte[] b = new byte[1024];
        int temp;
        while ((temp = stream.read(b)) != -1) {
            out.write(b, 0, temp);
        }
    } catch (IOException e) {
        throw new RuntimeException(e);
    }
    byte[] b = out.toByteArray();

    // 将MyClassLoader中加载的原主类修改
    ClassReader reader = new ClassReader(b);
    ClassNode klass = new ClassNode();
    reader.accept(klass, ClassReader.SKIP_FRAMES);
    MethodNode main = klass.methods.stream().filter(m -> m.name.equals("main")).findFirst().orElse(null);
    for (AbstractInsnNode ain : main.instructions) {
        if (ain instanceof LdcInsnNode && ((LdcInsnNode) ain).cst.equals("MAINCLASS")) {
            ((LdcInsnNode) ain).cst = mainClass;
        }
    }

    ClassWriter writer = new ClassWriter(ClassWriter.COMPUTE_FRAMES);
    klass.accept(writer);
    klassLoaderBytes = writer.toByteArray();
}
```

需要注意，由于每个需要加密的Jar包的主类可能不同，因此需要将已编译的`MyClassLoader`中加载的主类修改掉。这里使用了asm库，对main方法中的一条指令加载的值进行了修改。见上方代码17~25行。

#### 完整代码

```java
package me.qianxia;

import org.objectweb.asm.ClassReader;
import org.objectweb.asm.ClassWriter;
import org.objectweb.asm.tree.AbstractInsnNode;
import org.objectweb.asm.tree.ClassNode;
import org.objectweb.asm.tree.LdcInsnNode;
import org.objectweb.asm.tree.MethodNode;

import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

public class MyObfuscator {
    public static byte[] klassLoaderBytes;

    public static void main(String[] args) {
        if (args.length < 2) {
            System.out.println("Usage: Encryption.jar <input file> <main class>");
            return;
        }
        String inputPath = args[0];
        String mainClass = args[1];

        readKlassLoader(mainClass);

        try {
            JarFile jar = new JarFile(inputPath);
            ZipOutputStream out = new ZipOutputStream(new FileOutputStream(inputPath + ".out.jar"));
            Enumeration<JarEntry> entries = jar.entries();
            while (entries.hasMoreElements()) {
                JarEntry entry = entries.nextElement();
                if (entry.isDirectory()) {
                    continue;
                }
                byte[] b = readBytes(entry, jar);
                // 设置新主类
                if (entry.getName().equals("META-INF/MANIFEST.MF")) {
                    String s = new String(b);
                    s = s.replace(mainClass, "MyClassLoader");
                    b = s.getBytes(StandardCharsets.UTF_8);
                    out.putNextEntry(new ZipEntry(entry.getName()));
                    out.write(b, 0, b.length);
                    out.closeEntry();
                    continue;
                }
                // 非class文件跳过，直接写出
                if (!entry.getName().endsWith(".class")) {
                    out.putNextEntry(new ZipEntry(entry.getName()));
                    out.write(b, 0, b.length);
                    out.closeEntry();
                    continue;
                }
                // 加密类文件并写出
                encryptBytes(b);
                out.putNextEntry(new ZipEntry(entry.getName().replace(".class", ".klass")));
                out.write(b, 0, b.length);
                out.closeEntry();
            }
            // 写出自定义类加载器
            out.putNextEntry(new ZipEntry("MyClassLoader.class"));
            out.write(klassLoaderBytes, 0, klassLoaderBytes.length);
            out.closeEntry();
            out.close();
            jar.close();
            System.out.println("Finished. output=" + inputPath + ".out.jar");
        } catch (IOException e) {
            System.out.println("IO Error occurred.");
            e.printStackTrace();
        }
    }

    public static byte[] readBytes(ZipEntry entry, ZipFile file) throws IOException {
        InputStream in = file.getInputStream(entry);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int temp;
        while ((temp = in.read(buffer)) != -1) {
            out.write(buffer, 0, temp);
        }
        return out.toByteArray();
    }

    public static void encryptBytes(byte[] bytes) {
        for (int i = 0; i < bytes.length; i++) {
            bytes[i] ^= 5;
        }
    }

    public static void readKlassLoader(String mainClass) {
        ByteArrayOutputStream out = null;
        try {
            InputStream stream = MyObfuscator.class.getResourceAsStream("/MyClassLoader.class");
            out = new ByteArrayOutputStream();
            byte[] b = new byte[1024];
            int temp;
            while ((temp = stream.read(b)) != -1) {
                out.write(b, 0, temp);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        byte[] b = out.toByteArray();

        // 将MyClassLoader中加载的原主类修改
        ClassReader reader = new ClassReader(b);
        ClassNode klass = new ClassNode();
        reader.accept(klass, ClassReader.SKIP_FRAMES);
        MethodNode main = klass.methods.stream().filter(m -> m.name.equals("main")).findFirst().orElse(null);
        for (AbstractInsnNode ain : main.instructions) {
            if (ain instanceof LdcInsnNode && ((LdcInsnNode) ain).cst.equals("MAINCLASS")) {
                ((LdcInsnNode) ain).cst = mainClass;
            }
        }

        ClassWriter writer = new ClassWriter(ClassWriter.COMPUTE_FRAMES);
        klass.accept(writer);
        klassLoaderBytes = writer.toByteArray();
    }
}
```

运行需要将MyClassLoader.class放在根目录中。

#### 效果

![image-20240916160951502](image-20240916160951502.png)

![image-20240916161334445](image-20240916161334445.png)

左为处理前，右为处理后。处理后的Jar文件只能直接反编译到类加载器，其他类由于是加密的，不能被直接反编译。

### 缺点

- 调用getPackage方法返回null
- 父类加载器加载的类不能调用子类加载器加载的类
- more....

## 总结

自定义类加载器实现对类文件的加密是一种长久的保护方法，但它的保护效果并不够理想。显而易见的，只要加载进JVM中的类都需要被解密，因此，可以通过dump加载的类轻易得到未加密的类。除保护效果外，本文的实现方式还存在许多潜在的问题，实现的效果并不稳定，可能导致部分程序无法正常运行。

（完）
