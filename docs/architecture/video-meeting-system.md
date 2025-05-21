# 基于WebRTC和GB28181的多源视频会议系统设计与实现

## 摘要

本文档介绍了一种多设备融合视频会议系统的设计与实现方案。该系统支持PCWeb端、PC客户端、单兵设备、球机、国标摄像头、手机等多种终端的融合会议，实现多源异构视频的统一管理和交互。

## 1. 引言

### 1.1 项目背景

现代视频会议系统需要同时支持多种终端设备，包括PCWeb端、PC客户端、单兵设备、球机、国标摄像头和手机等。然而，这些设备采用不同的协议和标准，如WebRTC、GB28181、ONVIF等，给融合会议带来了技术挑战。

### 1.2 项目目标

设计并实现一个多设备融合视频会议系统，支持：

1. **PCWeb端与PC客户端**：基于WebRTC的实时视频通信
2. **单兵设备与球机**：支持RTSP和ONVIF协议
3. **国标摄像头**：支持GB28181协议
4. **手机终端**：支持WebRTC和RTMP协议
5. **统一管理平台**：提供多设备的统一控制和管理

## 2. 系统架构设计

### 2.1 总体架构

系统采用分层架构，主要由以下几部分组成：

1. **前端Web应用**：基于HTML5、JavaScript开发的用户界面
2. **代理服务器**：基于Node.js的本地代理服务，处理API请求和FFmpeg进程管理
3. **会议管理中心**：基于WVP-Pro的会议管理和设备分组
4. **流媒体服务器**：基于ZLMediaKit的流媒体处理服务
5. **多协议接入层**：处理不同协议的视频源接入（WebRTC、RTMP、GB28181、ONVIF等）

```
+----------------+     +----------------+
|                |     |                |
| 前端Web应用    +---->+ 本地代理服务器 |
|                |     |                |
+-------+--------+     +-------+--------+
        |                      |
        |                      |
        v                      v
                         +----------------+
                         |                |
                         |   WVP-Pro      |
                         |   会议管理中心 |
                         |   (会议分组)   |
                         +--------+-------+
                                  |
                                  | 管理所有设备
                                  v
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  PC客户端     +---->+  WebRTC接入   +---->+                |
|  浏览器        |     |                |     |                |
+----------------+     +----------------+     |                |
                             |                |                |
+----------------+     +-----v------+        |                |
|                |     |            |        |                |
|  移动端设备   +---->+  RTMP接入  +------->+  ZLMediaKit   |
|                |     |            |        |  流媒体服务器  |
+----------------+     +------------+        |                |
                             |                |                |
+----------------+     +-----v------+        |                |
|                |     |            |        |                |
|  国标设备     +---->+  GB28181接入 +------->+                |
|                |     |            |        |                |
+----------------+     +------------+        +----------------+
                             |                       ^
+----------------+     +-----v------+                |
|                |     |            |                |
|  ONVIF设备    +---->+  RTSP接入  +----------------+
|                |     |            |
+----------------+     +------------+

```

该架构图展示了会议管理的新模式：

1. **WVP-Pro作为会议管理中心**：
   - 创建会议时在WVP-Pro上创建临时分组
   - 所有设备（包括PC客户端、移动端、国标设备、ONVIF设备）都上报到该分组
   - 拉起会议时可以获取分组下的所有设备信息

2. **多协议接入**：
   - 各类设备通过各自的协议接入到系统
   - 所有协议接入层都受WVP-Pro管理
   - 媒体流最终汇聚到ZLMediaKit进行处理和分发

### 2.2 技术架构

系统采用以下技术栈：

- **前端**：HTML5, CSS3, JavaScript, WebRTC API, flv.js
- **后端**：Node.js, Express.js, axios, child_process
- **流媒体服务**：ZLMediaKit
- **GB28181协议网关**：WVP-Pro
- **视频处理**：WebRTC, FFmpeg
- **协议支持**：GB28181, ONVIF, RTSP, RTMP, HTTP-FLV, HLS

### 2.3 数据流程

1. **WebRTC流程**：
   - 浏览器采集本地媒体流
   - 通过WebRTC协议推送到ZLMediaKit
   - ZLMediaKit转换为标准流格式（FLV/HLS）
   - 其他客户端通过HTTP-FLV协议播放

2. **FFmpeg流程**：
   - 本地代理服务器启动FFmpeg进程
   - FFmpeg采集本地设备视频
   - 通过RTMP协议推送到ZLMediaKit
   - 其他客户端通过HTTP-FLV协议播放

3. **GB28181流程**：
   - 国标设备向WVP-Pro注册
   - WVP-Pro通过SIP协议与设备交互
   - WVP-Pro请求设备推送视频流
   - ZLMediaKit接收并转换视频流
   - 客户端通过HTTP-FLV协议播放

## 3. 核心功能实现

### 3.1 WebRTC流推送与接收

#### 3.1.1 WebRTC推流实现

```javascript
// 创建WebRTC连接
const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// 添加本地媒体轨道
localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
});

// 创建SDP提议
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// 发送到服务器并获取应答
const response = await fetch(`${proxyServerUrl}/api/pushWebRTC`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        sdp: offer.sdp, 
        streamId: meetingId, 
        app: 'live', 
        secret: 'YOUR_SECRET'
    })
});

// 设置远程描述
const result = await response.json();
await peerConnection.setRemoteDescription(new RTCSessionDescription({
    type: 'answer',
    sdp: result.sdp
}));
```

#### 3.1.2 FLV流播放实现

```javascript
// 创建FLV播放器
const flvPlayer = flvjs.createPlayer({
    type: 'flv',
    url: `${serverUrl}/live/${meetingId}.flv`,
    isLive: true
});

// 绑定视频元素并播放
flvPlayer.attachMediaElement(remoteVideo);
flvPlayer.load();
flvPlayer.play();
```

### 3.2 FFmpeg流推送

#### 3.2.1 FFmpeg命令构建

```javascript
// FFmpeg命令参数
const ffmpegArgs = [
    '-f', 'avfoundation',
    '-framerate', '30',
    '-i', `${videoDevice}:${audioDevice}`,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-vf', 'eq=brightness=0.1:contrast=1.2:saturation=1.5',
    '-pix_fmt', 'yuv420p',
    '-tune', 'zerolatency',
    '-b:v', '1000k',
    '-maxrate', '1000k',
    '-bufsize', '2000k',
    '-g', '60',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'flv',
    fullRtmpUrl
];
```

#### 3.2.2 FFmpeg进程管理

```javascript
// 启动FFmpeg进程
const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
ffmpegProcesses[streamId] = ffmpegProcess;

// 收集输出
ffmpegProcess.stdout.on('data', (data) => {
    console.log(`FFmpeg stdout: ${data}`);
});

ffmpegProcess.stderr.on('data', (data) => {
    console.log(`FFmpeg stderr: ${data}`);
});

// 监听进程退出
ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg进程退出，代码: ${code}`);
    delete ffmpegProcesses[streamId];
});
```

### 3.3 GB28181设备接入

#### 3.3.1 WVP-Pro配置

```yaml
# SIP服务配置
sip:
  # SIP服务器ID
  id: 34020000002000000001
  # SIP域
  domain: 3402000000
  # SIP服务器IP
  ip: 192.168.1.100
  # SIP服务器端口
  port: 5060
  
# 媒体服务器配置
media:
  # ZLMediaKit地址
  ip: 23.99.11.9
  # ZLMediaKit HTTP端口
  http-port: 19351
  # ZLMediaKit RTMP端口
  rtmp-port: 19351
  # ZLMediaKit Secret
  secret: 035c73f7-bb6b-4889-a715-d9eb2d1925cc
```

#### 3.3.2 GB28181设备接入API

```javascript
// 获取国标设备列表
app.get('/api/gb28181/devices', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8080/api/device/query/devices');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      code: -1,
      msg: `获取设备列表失败: ${error.message}`
    });
  }
});

// 开始播放国标设备视频流
app.post('/api/gb28181/play', async (req, res) => {
  const { deviceId, channelId } = req.body;
  
  try {
    // 请求WVP-Pro开始推流
    const response = await axios.get(`http://localhost:8080/api/play/start/${deviceId}/${channelId}`);
    
    if (response.data.code === 0) {
      // 返回流地址
      res.json({
        code: 0,
        msg: '成功',
        data: {
          streamId: response.data.data.stream,
          flvUrl: `http://23.99.11.9:19351/live/${response.data.data.stream}.flv`,
          hlsUrl: `http://23.99.11.9:19351/live/${response.data.data.stream}.m3u8`,
          rtmpUrl: `rtmp://23.99.11.9:19351/live/${response.data.data.stream}`
        }
      });
    } else {
      res.status(400).json(response.data);
    }
  } catch (error) {
    res.status(500).json({
      code: -1,
      msg: `开始播放失败: ${error.message}`
    });
  }
});
```

### 3.4 ONVIF设备接入

#### 3.4.1 ONVIF设备发现

```javascript
// ONVIF设备发现
app.get('/api/onvif/discover', async (req, res) => {
  try {
    // 使用onvif-js库发现设备
    const devices = await onvifService.discoverDevices();
    
    res.json({
      code: 0,
      msg: '成功',
      data: devices
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      msg: `设备发现失败: ${error.message}`
    });
  }
});
```

#### 3.4.2 ONVIF设备视频流获取

```javascript
// 获取ONVIF设备视频流
app.post('/api/onvif/stream', async (req, res) => {
  const { deviceIp, username, password, profileToken } = req.body;
  
  try {
    // 连接ONVIF设备
    const device = await onvifService.connectDevice(deviceIp, username, password);
    
    // 获取流URL
    const streamUrl = await device.getStreamUri({
      profileToken: profileToken || device.defaultProfile.token
    });
    
    // 使用FFmpeg转发RTSP流到RTMP
    const streamId = `onvif_${deviceIp.replace(/\./g, '_')}_${Date.now()}`;
    const rtmpUrl = `rtmp://23.99.11.9:19351/live/${streamId}`;
    
    const ffmpegArgs = [
      '-rtsp_transport', 'tcp',
      '-i', streamUrl,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-f', 'flv',
      rtmpUrl
    ];
    
    // 启动FFmpeg进程
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
    ffmpegProcesses[streamId] = ffmpegProcess;
    
    // 返回流地址
    res.json({
      code: 0,
      msg: '成功',
      data: {
        streamId,
        flvUrl: `http://23.99.11.9:19351/live/${streamId}.flv`,
        hlsUrl: `http://23.99.11.9:19351/live/${streamId}.m3u8`,
        rtmpUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      msg: `获取流失败: ${error.message}`
    });
  }
});
```

### 3.5 多路视频会议实现

```javascript
// 前端实现多路视频显示
function addParticipantVideo(streamId, participantName) {
  const participantContainer = document.getElementById('participantsContainer');
  
  // 创建视频容器
  const videoBox = document.createElement('div');
  videoBox.className = 'participant-video-box';
  videoBox.id = `participant_${streamId}`;
  
  // 创建标题
  const title = document.createElement('h4');
  title.textContent = participantName || `参会者 ${streamId}`;
  
  // 创建视频元素
  const video = document.createElement('video');
  video.id = `video_${streamId}`;
  video.controls = true;
  video.autoplay = true;
  video.muted = true;
  
  // 添加到DOM
  videoBox.appendChild(title);
  videoBox.appendChild(video);
  participantContainer.appendChild(videoBox);
  
  // 创建FLV播放器
  if (flvjs.isSupported()) {
    const flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: `${serverUrl}/live/${streamId}.flv`,
      isLive: true
    });
    
    flvPlayer.attachMediaElement(video);
    flvPlayer.load();
    flvPlayer.play();
    
    // 保存播放器引用
    flvPlayers[streamId] = flvPlayer;
  }
}
```

## 4. 系统部署

### 4.1 前端部署

1. 将HTML、CSS、JavaScript文件部署到Web服务器
2. 确保浏览器支持WebRTC和flv.js

```bash
# 使用Nginx部署前端文件
sudo cp -r /path/to/web-files /usr/share/nginx/html/video-meeting
sudo systemctl restart nginx
```

### 4.2 代理服务器部署

1. 安装Node.js环境
2. 安装必要的依赖

```bash
# 安装依赖
npm install express axios http-proxy-middleware cors child_process

# 安装GB28181和ONVIF相关依赖
npm install node-sip node-onvif

# 启动代理服务器
node proxy-server.js
```

### 4.3 ZLMediaKit服务器部署

1. 部署ZLMediaKit服务器
2. 配置RTMP、HTTP-FLV、WebRTC等协议支持

```bash
# 下载ZLMediaKit
git clone --depth 1 https://github.com/ZLMediaKit/ZLMediaKit.git
cd ZLMediaKit

# 编译
./build_for_linux.sh

# 启动服务
cd release/linux/Debug
./MediaServer -d
```

### 4.4 WVP-Pro部署（GB28181支持）

1. 部署WVP-Pro服务器
2. 配置SIP域和认证信息

```bash
# 克隆WVP-Pro仓库
git clone https://github.com/648540858/wvp-GB28181-pro.git
cd wvp-GB28181-pro

# 编译项目
mvn package

# 运行服务
java -jar target/wvp-pro.jar
```

## 5. 安全考虑

### 5.1 传输安全

- WebRTC使用DTLS加密
- HTTPS加密Web访问
- SRTP加密媒体流

### 5.2 认证与授权

- 用户认证系统
- 设备认证
- 基于角色的访问控制

### 5.3 API安全

- 使用secret参数进行API认证
- API访问限制
- 防止SQL注入和XSS攻击

## 6. 性能优化

### 6.1 媒体流优化

#### 6.1.1 自适应比特率

```javascript
// 在WebRTC中设置自适应比特率
const sender = peerConnection.getSenders()[0];
if (sender && sender.track.kind === 'video') {
  const parameters = sender.getParameters();
  if (!parameters.encodings) {
    parameters.encodings = [{}];
  }
  
  // 设置最小和最大比特率
  parameters.encodings[0].minBitrate = 100000; // 100kbps
  parameters.encodings[0].maxBitrate = 1500000; // 1.5Mbps
  
  // 应用参数
  sender.setParameters(parameters);
}
```

#### 6.1.2 网络带宽监测

```javascript
// 监测网络状态
setInterval(() => {
  if (peerConnection) {
    peerConnection.getStats(null).then(stats => {
      stats.forEach(report => {
        if (report.type === 'transport') {
          console.log(`当前带宽: ${report.bytesReceived} bytes`);
          
          // 根据网络状况调整视频质量
          if (report.bytesReceived < 100000) { // 网络较差
            adjustVideoQuality('low');
          } else if (report.bytesReceived < 500000) { // 网络一般
            adjustVideoQuality('medium');
          } else { // 网络良好
            adjustVideoQuality('high');
          }
        }
      });
    });
  }
}, 5000);
```

### 6.2 服务器优化

#### 6.2.1 负载均衡

```nginx
# Nginx负载均衡配置
upstream media_servers {
    server 192.168.1.100:19351;
    server 192.168.1.101:19351;
    server 192.168.1.102:19351;
}

server {
    listen 80;
    server_name media.example.com;
    
    location / {
        proxy_pass http://media_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 6.2.2 缓存策略

```nginx
# Nginx缓存配置
location ~* \.(m3u8|ts)$ {
    proxy_pass http://media_servers;
    proxy_cache media_cache;
    proxy_cache_valid 200 302 10s;
    proxy_cache_valid 404 1m;
    proxy_set_header Host $host;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### 6.3 客户端优化

#### 6.3.1 资源预加载

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="/js/flv.min.js" as="script">
<link rel="preload" href="/js/adapter.js" as="script">
```

#### 6.3.2 WebWorker处理复杂计算

```javascript
// 创建WebWorker
const worker = new Worker('/js/stats-worker.js');

// 发送数据到Worker
worker.postMessage({
  type: 'processStats',
  stats: statsData
});

// 接收Worker处理结果
worker.onmessage = function(e) {
  const result = e.data;
  updateStatsDisplay(result);
};
```

## 7. 扩展功能

### 7.1 聊天功能

```javascript
// 添加WebSocket连接用于实时聊天
const chatSocket = new WebSocket(`ws://${serverUrl}/chat/${meetingId}`);

// 发送消息
function sendChatMessage(message) {
  chatSocket.send(JSON.stringify({
    type: 'chat',
    from: userName,
    content: message,
    time: new Date().toISOString()
  }));
}

// 接收消息
chatSocket.onmessage = function(event) {
  const message = JSON.parse(event.data);
  if (message.type === 'chat') {
    displayChatMessage(message);
  }
};
```

### 7.2 屏幕共享

```javascript
// 屏幕共享
async function startScreenSharing() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always"
      },
      audio: false
    });
    
    // 替换现有的视频轨道
    const videoTrack = screenStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => 
      s.track && s.track.kind === 'video'
    );
    
    if (sender) {
      sender.replaceTrack(videoTrack);
    }
    
    // 监听屏幕共享结束
    videoTrack.onended = () => {
      stopScreenSharing();
    };
    
    return screenStream;
  } catch (error) {
    console.error('屏幕共享失败:', error);
    throw error;
  }
}
```

### 7.3 录制功能

```javascript
// 录制功能
let mediaRecorder;
let recordedChunks = [];

// 开始录制
function startRecording(stream) {
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9'
  });
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  
  mediaRecorder.onstop = () => {
    // 创建BLOB并下载
    const blob = new Blob(recordedChunks, {
      type: 'video/webm'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `meeting-${meetingId}-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };
  
  mediaRecorder.start(1000); // 每秒1秒保存一次数据
}
```

## 8. 已知问题和解决方案

### 8.1 灰色画面问题

**问题描述**：FFmpeg推流时出现灰色画面

**解决方案**：添加视频滤镜参数 `-vf "eq=brightness=0.1:contrast=1.2:saturation=1.5"`

```javascript
// 解决灰色画面的FFmpeg参数
const ffmpegArgs = [
  '-f', 'avfoundation',
  '-framerate', '30',
  '-i', `${videoDevice}:${audioDevice}`,
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-vf', 'eq=brightness=0.1:contrast=1.2:saturation=1.5', // 关键参数
  '-pix_fmt', 'yuv420p',
  '-tune', 'zerolatency',
  '-b:v', '1000k',
  '-f', 'flv',
  fullRtmpUrl
];
```

### 8.2 CORS问题

**问题描述**：直接访问ZLMediaKit API时的跨域问题

**解决方案**：使用本地代理服务器中转请求

```javascript
// 代理服务器中转请求
app.use('/api', createProxyMiddleware({
  target: 'http://23.99.11.9:19351',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/index/api'
  },
  onProxyRes: function(proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
}));
```

### 8.3 GB28181设备兼容性

**问题描述**：不同厂商的GB28181实现可能有差异

**解决方案**：建立设备适配层，针对不同厂商定制协议处理

```javascript
// 设备适配层
class DeviceAdapter {
  constructor(deviceInfo) {
    this.deviceInfo = deviceInfo;
    this.manufacturer = deviceInfo.manufacturer;
    this.adapterStrategy = this.getAdapterStrategy();
  }
  
  getAdapterStrategy() {
    // 根据厂商选择适配策略
    switch(this.manufacturer.toLowerCase()) {
      case 'hikvision':
        return new HikvisionAdapter();
      case 'dahua':
        return new DahuaAdapter();
      default:
        return new DefaultAdapter();
    }
  }
  
  async getStreamUrl(channelId) {
    return this.adapterStrategy.getStreamUrl(this.deviceInfo, channelId);
  }
}
```

## 9. 结论

本文档详细介绍了一种基于WebRTC和GB28181的多源视频会议系统的设计与实现方案。该系统通过整合WebRTC、FFmpeg、GB28181和ONVIF技术，实现了PC客户端与国标设备的无缝互联，为企业会议、安防监控、远程协作等场景提供了全面的解决方案。

系统采用分层架构和前后端分离设计，具有良好的可扩展性、兼容性和安全性。通过分阶段实施，可以逐步完善系统功能，满足不同用户的需求，并为未来的扩展和升级提供坦实基础。
```
