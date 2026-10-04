# 牛马假期含金量

移动端 H5 时间账本。纯前端运行，无登录或后端。

## 启动

需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev
```

当前 `dev` 脚本先构建，再启动本地预览，默认地址 `http://localhost:4173/`。修改源码后重新运行即可看到更新。

```bash
npm test
npm run build
```

预设在 `src/calculator.ts` 的 `holidayPresets` 中配置。`visible` 可用于隐藏季节性方案。分享卡二维码采用当前页面地址；部署后用正式 HTTPS 地址打开页面生成分享卡。

## 线上部署

- 地址：<https://holiday.albert90.cn/>
- 服务器：`115.190.177.171`，SSH 用户 `deploy`，443 分流
- 静态文件：`/var/www/niuma-holiday-value/current`，指向带时间戳的 `releases/` 目录
- Nginx：`/etc/nginx/sites-available/niuma-holiday-value`
- TLS：Let's Encrypt；服务器现有 `certbot-docker-renew.timer` 负责自动续签

更新时运行 `npm run build`，把 `dist/` 作为新 release 上传，切换 `current` 链接后执行 `sudo nginx -t` 和 `sudo systemctl reload nginx`。
