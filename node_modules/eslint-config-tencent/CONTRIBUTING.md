# ESLint Tencent

## Build

```shell script
docker build --network host -t csighub.tencentyun.com/standards/eslint-config-tencent:latest .
```

## Run

```shell script
docker run -i -t --rm --network=host -v $(pwd):$(pwd) -w $(pwd) csighub.tencentyun.com/standards/eslint-config-tencent:latest
```

## Publish

1. 将所有提交通过 mr 形式合入主干

1. 更新本地主干

```shell script
git pull origin master
```

1. 本地运行 autotag 命令生成新的 git tag 并自动 push 到服务端

```shell script
tnpm run autotag
```

1. orange-ci 的 tag_push 钩子自动进行 tnpm 包的构造与发布
