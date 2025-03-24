# Cherry Markdown Publish

## 功能

### 将前端发送的html和样式合并为內联样式后通过对应平台的发布接口发布

目前支持微信公众号

## 启动

### 安装依赖

```shell
pnpm i
pnpm start:dev
```

### 配置环境（微信公众号为例）

```shell
# 环境对应文件可以搜 configFileTypeMap 
cp src/common/config/dev.yaml.example src/common/config/dev.yaml

# 配置接口鉴权参数 APPID 和 APPSECRET
```

另外对于微信公众号，每篇文章还需要 `thumb_media_id`，为了方便查询提供了接口调用，`post publish/getWechatImageMaterial`， payload: `{ target: 'wechat', offset: 0, count: 20}`，你可以使用固定的配置文件方式配置`thumb_media_id`，key `ThumbMediaId`，或者在前端配置`thumb_media_id` (理论上按照官方参数补齐 injectPayload 即可)
