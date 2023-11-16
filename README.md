## 关于名字

原想起名为 nonstop(直达的意思)，已存在此工具，所以去掉了一个n，叫做 nostop。

## 功能

### 文件服务

```shell
nostop serve [port]

# 示例
nostop serve      # 在默认端口（3000）上启动服务
nostop serve 5000 # 在端口5000上启动服务
```

启动一个文件服务，通过服务可访问工作目录下的资源，且访问服务的设备可以通过点击上传文件，将资源上传到服务中。

### 将当前分支合并到指定分支

```shell
nostop mergeTo <target-branch>

# 简写
nostop m2 <target-branch>
```

使用 git 过程中发现，用于功能开发的特性分支(eg: feature-branch)向其他分支进行合并时，经常会是固定的下面几步：
```shell
# 将本地代码提交
git commit -am "add bla..."

# ------------- 分界线 ------------- 

# 将提交推送到远程
git push
# 切换到目标分支
git checkout target-branch
# 将分支更新到最新
git pull
# 将特性分支进行合并
git merge feature-branch
# 推送合并成果
git push
# 切换为之前的特性分支，继续开发
git checkout feature-branch
```

如果你也是经常这么做，那么可以通过 `nostop m2 <target-branch>` 一条命令来取代上面在`分界线`之后的多条命令了。
