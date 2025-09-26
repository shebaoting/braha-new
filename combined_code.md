# 项目代码总览

### 文件路径: `src\models\plant.ts`

```ts
// models/plant.ts
class Plant {
  constructor(data) {
    this.systemInfo = data.systemInfo || {};
    this.pixelRatio1 = data.pixelRatio1 || 0;
    this.menuInfo = data.menuInfo || {};
    this.statusHeight = data.statusHeight || 0;
    this.naviHeight = data.naviHeight || 0;
    this.topHeight = data.topHeight || 0;
    this.screenHeight = data.screenHeight || 0;
    this.bottomHeight = data.bottomHeight || 0;
  }

  updateData(data) {
    Object.assign(this, data);
  }
}

export default Plant;
```

### 文件路径: `src\models\user.ts`

```ts
// src/models/user.ts
class User {
  userInfo: any;

  constructor(data: any = {}) {
    this.userInfo = data.userInfo || null;
  }

  setUserInfo(userInfo: any) {
    this.userInfo = userInfo;
  }

  getUserInfo() {
    return this.userInfo;
  }
}

export default User;
```

### 文件路径: `src\stores\plant-store.ts`

```ts
// stores/plant-store.ts
import { Store } from 'westore'; // 从 westore 导入 Store 类
import Plant from '../models/plant'; // 从 models 目录导入 Plant 类

class PlantStore extends Store {
  constructor() {
    super(); // 调用父类构造函数
    this.data = new Plant({}); // 初始化 Plant 实例作为 store 的数据
    console.log('PlantStore initialized:', this.data); // 打印初始化信息
  }

  // 异步初始化方法，用于获取和设置初始数据
  async init() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    // 获取菜单按钮的位置信息
    const menuInfo = wx.getMenuButtonBoundingClientRect();

    // 构造初始的 plant 数据对象
    const plantData = {
      systemInfo,
      pixelRatio1: 750 / systemInfo.windowWidth, // 计算 1rpx 像素值
      menuInfo,
      statusHeight: systemInfo.statusBarHeight * (750 / systemInfo.windowWidth), // 计算状态栏高度
      naviHeight: (menuInfo.top - systemInfo.statusBarHeight) * 2 + menuInfo.height * (750 / systemInfo.windowWidth), // 计算导航栏高度
      topHeight: (systemInfo.statusBarHeight + ((menuInfo.top - systemInfo.statusBarHeight) * 2 + menuInfo.height * (750 / systemInfo.windowWidth))) * (750 / systemInfo.windowWidth), // 计算顶部高度
      screenHeight: systemInfo.screenHeight * (750 / systemInfo.windowWidth), // 计算屏幕高度
      bottomHeight: (systemInfo.screenHeight - systemInfo.safeArea.bottom) * (750 / systemInfo.windowWidth) // 计算底部高度
    };

    // 更新 store 数据
    this.data.updateData(plantData);
    // 计算 adjustedTop
    this.calculateAdjustedTop();
    // 计算剩余高度
    this.calculateRemainingHeight();
    // 调用 update 方法更新 store
    this.update();
  }

  // 计算 adjustedTop 方法
  calculateAdjustedTop() {
    const { menuInfo } = this.data; // 从 store 数据中获取 menuInfo
    const tabHeight = 50; // 假设的 tab 高度
    const offset = (tabHeight - menuInfo.height) / 2; // 计算偏移量
    this.data.adjustedTop = menuInfo.top - offset; // 计算 adjustedTop 并更新 store 数据
    console.log('Adjusted top calculated:', this.data.adjustedTop); // 打印计算结果
  }

  // 计算剩余高度方法
  calculateRemainingHeight() {
    const { topHeight, bottomHeight, screenHeight } = this.data; // 从 store 数据中获取相关高度值
    this.data.remainingHeight = (screenHeight - topHeight - bottomHeight) / 2; // 计算剩余高度
    console.log('Remaining height calculated:', this.data.remainingHeight); // 打印计算结果
  }

  // 重写 update 方法，在调用父类方法后打印更新后的数据
  update() {
    super.update(); // 调用父类的 update 方法
    console.log('PlantStore data updated:', this.data); // 打印更新后的数据
  }
}

export default new PlantStore(); // 导出 PlantStore 实例
```

### 文件路径: `src\stores\user-store.ts`

```ts
// src/stores/user-store.ts
import { Store } from 'westore'
import User from '../models/user'
import { userAccountApi } from './../utils/api'

class UserStore extends Store {
  // 新增：用于追踪初始化 Promise
  _initPromise: Promise<void> | null = null

  constructor() {
    super()
    this.data = new User({})
  }

  // 修改：初始化方法，获取用户信息，并确保只执行一次异步请求
  // 添加 forceFetch 参数，允许强制从后端拉取最新数据
  async init(forceFetch = false): Promise<void> {
    console.log(`UserStore init called. forceFetch: ${forceFetch}`)

    // 如果已经有进行中的初始化 Promise，直接返回它
    if (this._initPromise) {
      console.log(
        'UserStore init: Initialization already in progress, returning existing promise.',
      )
      // 如果是强制刷新请求，但正在进行的是非强制刷新，这可能需要更复杂的逻辑来处理优先级，
      // 但简单起见，我们这里只等待当前进行中的初始化完成。
      return this._initPromise
    }

    // 如果不是强制刷新，并且用户数据（至少有ID）已经加载，直接返回一个已解决的 Promise
    // 这个条件现在包含了 forceFetch 的判断
    if (!forceFetch && this.data.userInfo?.id) {
      console.log(
        'UserStore init: User info already loaded and forceFetch is false, skipping fetch.',
      )
      return Promise.resolve()
    }

    // 开始一个新的初始化流程，创建并存储 Promise
    const fetchPromise = (async () => {
      console.log('UserStore init: Starting new fetch process...')
      try {
        // 调用后端接口获取最新用户信息
        const userInfoRes = await userAccountApi.getMiniprogramUserInfo()
        console.log('UserStore init: userApi.me response:', userInfoRes)
        if (userInfoRes.data?.status === 'success' && userInfoRes.data?.data) {
          // 获取成功，更新 Store 中的用户信息
          this.data.setUserInfo(userInfoRes.data.data)
          console.log('UserStore init: User info fetched and set successfully.')
        } else {
          // API 返回非成功状态，记录警告
          console.warn(
            'UserStore init: Failed to fetch user info from API, status not success:',
            userInfoRes.data?.message || 'Unknown API error',
            userInfoRes,
          )
          // 在 API 返回非成功状态时，清空本地用户信息，确保状态是未加载
          this.data.setUserInfo(null)
        }
      } catch (e: any) {
        // 网络错误或服务器错误，记录错误
        console.error(
          'UserStore init: Failed to fetch user info (network or server error):',
          e,
        )
        // 在网络或服务器错误时，同样清空本地用户信息
        this.data.setUserInfo(null)
        // 可以选择重新抛出错误，让调用者知道初始化失败了
        // throw e; // 如果支付成功后拉取用户信息失败不希望中断后续流程，可以不抛出
      } finally {
        // 无论成功还是失败，都在这里触发 store 更新，通知所有监听者
        // 即使数据为 null，update 也会触发，让页面更新到加载失败的状态
        this.update() // 触发 update 以刷新视图
        // 在异步操作完成后清除 promise，允许下次 init 调用时重新 fetch (或使用缓存)
        this._initPromise = null
        console.log(
          'UserStore init: Fetch process finished, _initPromise cleared.',
        )
      }
    })() // 立即执行这个异步函数

    this._initPromise = fetchPromise // 存储这个 Promise
    return fetchPromise // 返回 Promise
  }

  updateUserInfo(userInfo: any) {
    this.data.setUserInfo(userInfo)
    this.update() // 更新数据后触发 update
  }

  // 重写update方法，更新视图
  update() {
    super.update()
  }
}

export default new UserStore()
```

### 文件路径: `src\utils\api.ts`

```ts
import Request from './request'

const request = new Request()

/**
 * 用户账户相关 API
 */
export const userAccountApi = {
  /**
   * 发送手机验证码
   */
  sendVerifyCode: (data: any) => request.post('/app/sendVerifyCode', data),

  /**
   * 获取小程序用户信息
   */
  getMiniprogramUserInfo: () => request.get('/miniprogram/getUserInfo'),

  /**
   * 更新小程序用户资料
   */
  updateMiniprogramProfile: (data: any) =>
    request.put('/miniprogram/updateProfile', data),
}


/**
 * 摄像头相关 API
 */
export const cameraApi = {
  /**
   * 获取用户所有设备的相册列表
   */
  getCameraAlbum: (params: any) => request.get('/camera/album', params),

  /**
   * 获取摄像头绑定状态
   */
  getCameraBindStatus: (params: { bindKey: string }) =>
    request.get('/camera/bindStatus', params),

  /**
   * 获取设备三元组信息
   */
  getDeviceTriple: (params: { deviceId: string }) =>
    request.get('/camera/deviceTriple', params),


    /**
   * 获取单个摄像头信息
   */
  getCameraInfo: (params: { id: string }) =>
    request.get('/camera/info', params),

  /**
   * 获取用户所有设备的事件列表
   */
  getCameraEvents: (params: any) => request.get('/camera/events', params),

  /**
   * 获取绑定密钥
   */
  getBindKey: () => request.get('/camera/getBindKey'),

  /**
   * 获取用户的摄像头列表
   */
  getCameraList: () => request.get('/camera/list'),

  /**
   * 获取用户对设备的权限
   */
  getCameraPermissions: (params: { deviceId: string }) =>
    request.get('/camera/permissions', params),

  /**
   * 注册用户设备的推送token
   */
  registerPushToken: (data: any) =>
    request.post('/camera/registerPushToken', data),

  /**
   * 发送推送消息给用户所有设备的绑定用户
   */
  sendPushMessage: (data: any) =>
    request.post('/camera/sendPushMessage', data),

  /**
   * 设置用户对设备的权限
   */
  setCameraPermissions: (data: any) =>
    request.post('/camera/setPermissions', data),

  /**
   * 分享设备给其他用户
   */
  shareCamera: (data: any) => request.post('/camera/share', data),

  /**
   * 获取设备的分享用户列表
   */
  getSharedUsers: (params: { deviceId: string }) =>
    request.get('/camera/sharedUsers', params),

  /**
   * 获取腾讯物联网配置
   */
  getTencentIotConfig: () => request.get('/camera/tencentIotConfig'),

  /**
   * 设备解绑
   */
  unbindCamera: (params: { deviceId: string }) =>
    request.delete('/camera/unbind', params),

  /**
   * 取消分享设备给某个用户
   */
  unshareCamera: (data: any) => request.post('/camera/unshare', data),
}



/**
 * 智能床设备相关 API
 */
export const bedDeviceApi = {
  /**
   * 添加智能床设备
   */
  addBedDevice: (data: any) => request.post('/product/bedAdd', data),

  /**
   * 验证设备是否已被绑定
   */
  checkBedDevice: (params: { mac: string }) =>
    request.get('/product/bedCheck', params),

  /**
   * 删除床设备
   */
  deleteBedDevice: (data: { id: number }) =>
    request.delete('/product/bedDelete', data),

  /**
   * 更新床设备信息
   */
  updateBedDevice: (data: any) => request.put('/product/bedUpdate', data),

  /**
   * 获取用户的床设备列表
   */
  getBedList: () => request.get('/product/getBedList'),
}



/**
 * 公告信息相关 API
 */
export const infoApi = {
  /**
   * 分页获取公告列表
   */
  getInfoList: (params: any) => request.get('/info/getInfoList', params),

  /**
   * 用id查询公告
   */
  findInfo: (params: { ID: number }) => request.get('/info/findInfo', params),

  /**
   * 获取公共公告接口（无需鉴权）
   */
  getInfoPublic: (params: any) => request.get('/info/getInfoPublic', params),
}
```

### 文件路径: `src\utils\config.ts`

```ts
interface Config {
  baseUrl: string
}

const config: Config = {
  baseUrl: 'https://haima.hxycbj.com',
}

export default config
```

### 文件路径: `src\utils\log.ts`

```ts
// 从基础库 2.7.1 开始支持
const log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

export default {
  debug(...args: any[]) {
    if (!log) return
    log.debug.apply(log, args)
  },
  info(...args: any[]) {
    if (!log) return
    log.info.apply(log, args)
  },
  warn(...args: any[]) {
    if (!log) return
    log.warn.apply(log, args)
  },
  error(...args: any[]) {
    if (!log) return
    log.error.apply(log, args)
  },
  setFilterMsg(msg: string) {
    // 从基础库 2.7.3 开始支持
    if (!log || !log.setFilterMsg) return
    if (typeof msg !== 'string') return
    log.setFilterMsg(msg)
  },
  addFilterMsg(msg: string) {
    // 从基础库 2.8.1 开始支持
    if (!log || !log.addFilterMsg) return
    if (typeof msg !== 'string') return
    log.addFilterMsg(msg)
  },
}
```

### 文件路径: `src\utils\request.ts`

```ts
// request.ts
import config from './config'
interface RequestOptions {
  baseUrl?: string
  url: string
  data?: any
  header?: any
  method?: string
  noToken?: boolean
}

// 新增 WebSocket 选项接口
interface WebSocketOptions {
  url: string
  header?: any
  protocols?: string[]
  noToken?: boolean // 添加 noToken 选项
}

class Request {
  private config = {
    baseUrl: config.baseUrl,
    header: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    method: 'GET',
    noToken: false,
  }
  private loginPromise: Promise<any> | null = null
  public async wxLogin() {
    if (this.loginPromise) {
      return this.loginPromise
    }

    this.loginPromise = new Promise(async (resolve, reject) => {
      try {
        const { code } = await wx.login()
        const systemInfo = wx.getSystemInfoSync()
        const device_name = systemInfo.model

        const url = this.config.baseUrl + '/miniprogram/login'
        const data = { code, device_name }
        const header = Object.assign({}, this.config.header, {
          Authorization: '',
        })

        wx.request({
          url,
          data,
          header,
          method: 'POST',
          success: (res: any) => {
            if (res.statusCode === 200 && res.data.code === 0 && res.data.data.token) {
              const expiredTime = res.data.data.expiresAt * 1000;
              wx.setStorageSync('token', res.data.data.token)
              wx.setStorageSync('expiredTime', expiredTime)
              resolve(res)
            } else {
              const errorMessage = res.data.msg || '登录失败'
              reject(new Error(errorMessage))
            }
          },
          fail: err => {
            reject(err)
          },
        })
      } catch (e) {
        reject(e)
      } finally {
        setTimeout(() => {
          this.loginPromise = null
        }, 0)
      }
    })

    return this.loginPromise
  }

  public async request(options: RequestOptions): Promise<any> {
    console.log('第一步：发起请求', options.url)
    const { options: processedOptions, header } = await this.processOptions(
      options,
    )

    // 请求的url
    const url = processedOptions.baseUrl + processedOptions.url
    console.log(url)
    // 请求的参数
    const data = processedOptions.data
    // 请求的header
    const processedHeader = header
    // 请求的方法
    const method = processedOptions.method

    // 返回一个Promise对象
    return new Promise((resolve, reject) => {
      console.log('第七步：发起请求', url, data, processedHeader, method)
      wx.request({
        url,
        data,
        header: processedHeader,
        method: method as
          | 'GET'
          | 'POST'
          | 'PUT'
          | 'DELETE'
          | 'OPTIONS'
          | 'HEAD'
          | 'TRACE'
          | 'CONNECT',
        success: async res => {
          // 请求成功，如果响应中有错误信息，则拒绝Promise
          if (typeof res.data === 'string') {
            reject(new Error(res.data))
          } else {
            const data =
              typeof res.data === 'object' ? res.data : JSON.parse(res.data)
            if (data.message === 'Unauthenticated.') {
              // token 无效，重新登录获取新的 token
              console.log('Token无效，正在重新登录...')
              await this.wxLogin()
              // 重新请求
              try {
                const newResponse = await this.request(options)
                resolve(newResponse)
              } catch (error) {
                reject(error)
              }
            } else if (data.status === 'error') {
              reject(new Error(data.message))
            } else {
              resolve(res)
            }
          }
        },
        fail: err => {
          // 请求失败，拒绝Promise
          reject(err)
        },
      })
    })
  }

  public async uploadFile(options: wx.UploadFileOptions): Promise<any> {
    const { options: processedOptions, header } = await this.processOptions(
      options,
    )

    // 请求的文件路径
    const filePath = processedOptions.filePath
    // 请求的文件名
    const name = processedOptions.name
    // 请求的formData
    const formData = processedOptions.formData

    // 返回一个Promise对象
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: processedOptions.baseUrl + processedOptions.url,
        filePath,
        name,
        formData,
        header,
        success: res => {
          // 请求成功，如果响应中有错误信息，则拒绝Promise
          const data = JSON.parse(res.data)
          resolve(data)
        },
        fail: err => {
          // 请求失败，拒绝Promise
          reject(err)
        },
      })
    })
  }

  public async getClientAuth(
    socketId: string,
    channelName: string,
  ): Promise<{ auth: string; channelData: string }> {
    // 修改返回类型
    const response = await this.request({
      url: '/reverb/client-auth',
      data: {
        socket_id: socketId,
        channel_name: channelName,
      },
      method: 'POST',
      noToken: false,
    })
    console.log('获取到 auth:', response.data)
    //return response.data.auth; // 原始的返回值
    return {
      // 修改返回值
      auth: response.data.auth,
      channelData: response.data.channel_data,
    }
  }

  public connectWebSocket(options: WebSocketOptions): Promise<wx.SocketTask> {
    return new Promise(async (resolve, reject) => {
      const { options: processedOptions, header } =
        await this.processWebSocketOptions(options)
      const url = processedOptions.url
      const processedHeader = header // 包含了 Authorization: Bearer <token>

      const socketTask = wx.connectSocket({
        url,
        header: processedHeader, // 使用包含 token 的 header
        protocols: options.protocols,
        success: () => {
          console.log('WebSocket 连接尝试成功 (wx.connectSocket success)')
        },
        fail: err => {
          console.log('WebSocket 连接失败:', err)
          reject(err)
        },
      })

      socketTask.onOpen(() => {
        console.log('WebSocket 连接已打开 (socketTask.onOpen)')
        resolve(socketTask)
      })

      socketTask.onMessage(async msg => {
        // onMessage 也改为 async
        console.log('WebSocket 收到消息:', msg)
        const data = JSON.parse(msg.data)
        if (data.event === 'pusher:connection_established') {
          const innerData = JSON.parse(data.data) // 对 data.data 再次解析
          let socketId = innerData.socket_id
          console.log('获取到 socketId:', socketId)
        }
      })

      socketTask.onClose(() => {
        console.log('WebSocket 连接已关闭')
      })

      socketTask.onError(err => {
        console.log('WebSocket 连接出错:', err)
      })
    })
  }

  // 处理 WebSocket 选项，复用 token 逻辑
  private async processWebSocketOptions(
    options: WebSocketOptions,
  ): Promise<{ options: WebSocketOptions; header: any }> {
    const newOptions = { ...options }
    newOptions.header = newOptions.header || {}

    if (!newOptions.noToken) {
      // 检查 noToken
      let token = wx.getStorageSync('token')
      console.log('判断缓存是否过期', !token || this.isTokenExpired())

      if (!token || this.isTokenExpired()) {
        console.log('调用 wxLogin 方法重新获取 token')
        await this.wxLogin()
        token = wx.getStorageSync('token')
        console.log('拿到新的 token', token)
      }

      if (token) {
        newOptions.header.Authorization = `Bearer ${token}`
      }
    }

    return { options: newOptions, header: newOptions.header }
  }

  private async processOptions(
    options: RequestOptions | wx.UploadFileOptions,
  ): Promise<{ options: RequestOptions | wx.UploadFileOptions; header: any }> {
    const newOptions = Object.assign({}, options)
    newOptions.header = newOptions.header || {}

    if (!newOptions.noToken) {
      let token = wx.getStorageSync('token')
      console.log('判断缓存是否过期', !token || this.isTokenExpired())

      if (!token || this.isTokenExpired()) {
        console.log('调用 wxLogin 方法重新获取 token')
        await this.wxLogin()
        token = wx.getStorageSync('token')
        console.log('拿到新的 token', token)
      }

      if (token) {
        newOptions.header.Authorization = `Bearer ${token}`
      }
    }

    const processedOptions = {
      ...this.config,
      ...newOptions,
      header: {
        ...this.config.header,
        ...newOptions.header,
      },
    }

    return { options: processedOptions, header: processedOptions.header }
  }

  private isTokenExpired(): boolean {
    const expiredTime = wx.getStorageSync('expiredTime')
    console.log('当前时间：', new Date().getTime())
    console.log('过期时间：', expiredTime)
    console.log('距离过期还有：', expiredTime - new Date().getTime(), '毫秒')

    if (!expiredTime) {
      return true
    }
    if (new Date().getTime() > expiredTime) {
      return true
    }
    return false
  }

  public get(url: string, data?: any, noToken?: boolean): Promise<any> {
    return this.request({ url, data, noToken })
  }

  public post(url: string, data?: any): Promise<any> {
    return this.request({ url, data, method: 'POST' })
  }

  public put(url: string, data?: any): Promise<any> {
    return this.request({ url, data, method: 'PUT' })
  }

  public delete(url: string, data?: any): Promise<any> {
    return this.request({ url, data, method: 'DELETE' })
  }
}

export default Request
```

### 文件路径: `src\utils\util.ts`

```ts
const sysInfo = wx.getSystemInfoSync();
export const isDevTool = sysInfo.platform === 'devtools';

export function compareVersion(ver1: string, ver2: string): number {
  const v1 = ver1.split('.');
  const v2 = ver2.split('.');
  const len = Math.max(v1.length, v2.length);

  while (v1.length < len) {
    v1.push('0');
  }
  while (v2.length < len) {
    v2.push('0');
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i], 10);
    const num2 = parseInt(v2[i], 10);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }

  return 0;
}

export function pad(v: number | string, l?: number): string {
  let val = String(v);
  const len = l || 2;
  while (val.length < len) {
    val = `0${val}`;
  }
  return val;
}

export const toDateString = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const toTimeString = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
// 修正：添加了 export 关键字
export const toDateTimeMsString = (date: Date): string => `${toDateString(date)} ${toTimeString(date)}.${pad(date.getMilliseconds(), 3)}`;

const userIdKey = 'userId';
export const getUserId = (): string => {
  let userId = wx.getStorageSync(userIdKey);
  if (userId) {
    return userId;
  }
  const accountInfo = wx.getAccountInfoSync();
  userId = `demo_${accountInfo.miniProgram.appId}_${pad(Math.floor(Math.random() * 10000), 4)}`;
  wx.setStorageSync(userIdKey, userId);
  return userId;
};
```

### 文件路径: `src\pages\addCamera\addCamera.json`

```json
{
  "navigationBarTitleText": "设备配网",
  "usingComponents": {},
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff"
}
```

### 文件路径: `src\pages\addCamera\addCamera.scss`

```scss
/* pages/index/cameraPlay/addCamera.scss */
page {
  background-color: #f5f5f7;
}

.btn_style {
  background-color: #BDA01E;
  color: white;
  border-radius: 9999px;
  text-align: center;
  font-weight: bold;
  padding: 12px;
}

/* Simple loading animation */
.loading-dots {
  display: flex;
  justify-content: center;
  &::after {
    content: '.';
    animation: dots 1s steps(5, end) infinite;
    font-size: 2.5rem;
  }
}

@keyframes dots {
  0%, 20% {
    color: rgba(0,0,0,0);
    text-shadow:
      .25em 0 0 rgba(0,0,0,0),
      .5em 0 0 rgba(0,0,0,0);
  }
  40% {
    color: #BDA01E;
    text-shadow:
      .25em 0 0 rgba(0,0,0,0),
      .5em 0 0 rgba(0,0,0,0);
  }
  60% {
    text-shadow:
      .25em 0 0 #BDA01E,
      .5em 0 0 rgba(0,0,0,0);
  }
  80%, 100% {
    text-shadow:
      .25em 0 0 #BDA01E,
      .5em 0 0 #BDA01E;
  }
}
```

### 文件路径: `src\pages\addCamera\addCamera.ts`

```ts
// pages/index/cameraPlay/addCamera.ts
// @ts-nocheck

let countdownTimer: any = null; // 用于存储倒计时器

Page({
  data: {
    popup_show: false,
    current: 0,
    set_wifi: false, // true for Wi-Fi connect, false for QR code

    WifiInfo: {
      SSID: '',
      password: ''
    },

    iseye: false, // false = password hidden
    wifi_show: false,
    theList: [] as WechatMiniprogram.WifiInfo[],
    chooseIndex: -1,

    codeUrl: '',
    productId: '',
    deviceName: '',

    isknow: false, // Flag to check if returning from Wi-Fi settings
    tips: '60', // Countdown text
    tipstext: '配置WiFi结果，由于设备型号不同，请以设备提示为准，为此带来的不便，敬请谅解.',

    wifiInitialized: false // 新增一个状态，标记Wi-Fi是否已初始化
  },

  onLoad(options: any) {
    this.setData({
      productId: options.productId,
      deviceName: options.deviceName,
    });
  },

  onShow() {
    // 【修正】页面显示时不再自动初始化Wi-Fi，只在需要时（例如从系统设置返回）检查网络状态
    if (this.data.isknow) {
      this.checkConnectedWifi();
    }
  },

  onUnload() {
    this.stopCountdown();
  },

  // --- UI Event Handlers ---
  setWifi(e: WechatMiniprogram.BaseEvent) {
    const type = parseInt(e.currentTarget.dataset.type, 10);
    this.setData({
      set_wifi: type === 1,
      popup_show: true,
    });
  },

  confirmExit() {
    wx.showModal({
      title: '提示',
      content: '您确定要退出吗？',
      confirmColor: '#BDA01E',
      success: (res) => {
        if (res.confirm) {
          this.exitPop();
        }
      }
    });
  },

  exitPop() {
    this.setData({
      popup_show: false,
      current: 0,
      set_wifi: false,
    });
    this.stopCountdown();
  },

  toggleEye() {
    this.setData({ iseye: !this.data.iseye });
  },

  async showWifiList() {
    // 【修正】在用户点击“选择Wi-Fi”时，才进行初始化和权限请求
    if (!this.data.wifiInitialized) {
      try {
        await wx.startWifi({});
        this.setData({ wifiInitialized: true });
        this.reloadWifi(); // 初始化成功后加载列表
      } catch (err) {
        console.error('Wi-Fi init error:', err);
        wx.showToast({ title: '请先开启手机Wi-Fi和定位服务', icon: 'none' });
        return;
      }
    } else {
      this.reloadWifi(); // 如果已初始化，直接加载列表
    }
    this.setData({ wifi_show: true });
  },

  hideWifiList() {
    this.setData({ wifi_show: false });
  },

  // --- Logic Methods ---
  nextStep(e: WechatMiniprogram.BaseEvent) {
    const step = parseInt(e.currentTarget.dataset.step, 10);

    if (step === 2) {
      if (!this.data.WifiInfo.SSID || !this.data.WifiInfo.password) {
        wx.showToast({ title: "请选择Wi-Fi和输入Wi-Fi密码", icon: 'none' });
        return;
      }
      if (!this.data.set_wifi) {
        const qrData = encodeURIComponent(JSON.stringify(this.data.WifiInfo));
        this.setData({
          codeUrl: `https://api.pwmqr.com/qrcode/create/?url=${qrData}`
        });
        this.startCountdown();
      }
      this.setData({ current: step });
    } else if (step === 3) {
      this.setData({ isknow: true });
      this.connectToDeviceWifi();
    } else {
      this.setData({ current: step });
    }
  },

  backStep() {
    if (!this.data.set_wifi && this.data.current === 2) {
      this.stopCountdown();
    }
    this.setData({ current: this.data.current - 1 });
  },

  // --- Wi-Fi Logic ---
  async checkConnectedWifi() {
    // 仅检查当前连接的Wi-Fi，不主动扫描，避免权限问题
    try {
      const netRes = await wx.getNetworkType();
      if (netRes.networkType === 'wifi') {
        const wifiRes = await wx.getConnectedWifi({});
        console.log(`已连接的Wifi信息：${wifiRes.wifi.SSID}`);

        if (this.data.isknow) {
          this.setData({ isknow: false });
          if (wifiRes.wifi.SSID.toLowerCase().includes("care")) {
            this.setCameraWifi();
          } else {
            wx.showToast({ title: '请连接正确的设备Wi-Fi', icon: 'error' });
          }
        } else {
          this.setData({ 'WifiInfo.SSID': wifiRes.wifi.SSID });
        }
      }
    } catch(err) {
      console.log('获取已连接WiFi失败', err);
    }
  },

  reloadWifi() {
      wx.getWifiList({
          success: () => {
              wx.onGetWifiList((result) => {
                  const filteredList = result.wifiList.filter(item => !!item.SSID);
                  this.setData({ theList: filteredList });
              });
          },
          fail: (err) => {
              wx.showToast({title: '获取Wi-Fi列表失败', icon: 'none'})
              console.error(err);
          }
      });
  },

  chooseSSID(e: WechatMiniprogram.BaseEvent) {
    const { item, index } = e.currentTarget.dataset;
    this.setData({
      'WifiInfo.SSID': item.SSID,
      chooseIndex: index,
      wifi_show: false
    });
  },

  connectToDeviceWifi() {
    wx.showModal({
        title: '操作提示',
        content: '请前往手机系统设置，手动连接到以 "Care-AP" 开头的Wi-Fi，密码为 "12345678"，连接成功后请返回小程序。',
        showCancel: false,
        confirmText: '好的',
        confirmColor: '#BDA01E',
    });
  },

  setCameraWifi() {
    this.setData({ current: 3 });
    const data = {
      enable: 1, dhcp: 1, ssid: this.data.WifiInfo.SSID, pwd: this.data.WifiInfo.password
    };
    console.log('Sending Wi-Fi credentials to device:', data);
    this.startCountdown();
  },

  // --- Countdown Logic ---
  startCountdown() {
    this.stopCountdown();
    this.setData({ tips: '60' });
    countdownTimer = setInterval(() => {
      let seconds = parseInt(this.data.tips, 10) - 1;

      if (seconds % 2 === 0) {
        this.checkDeviceStatus();
      }

      if (seconds <= 0) {
        this.stopCountdown();
        this.setData({ tips: '0' });
        this.showResultModal('配置超时，请重试');
      } else {
        this.setData({ tips: seconds.toString() });
      }
    }, 1000);
  },

  stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  },

  checkDeviceStatus() {
    console.log(`Checking device status for ${this.data.productId}/${this.data.deviceName}`);
  },

  showResultModal(content: string) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
      confirmText: '确定',
      confirmColor: '#BDA01E',
      success: () => {
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  }
});
```

### 文件路径: `src\pages\addCamera\addCamera.wxml`

```wxml
<view class="container">
  <view wx:if="{{!popup_show}}" class="mt-4">
    <view class="bg-white">
      <view class="flex items-center p-4 border-b" bind:tap="setWifi" data-type="1">
        <image class="w-10 h-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/camera/ic_cp_sifi.png"></image>
        <text class="ml-4 flex-1">WIFI</text>
        <view class="text-gray-400">></view>
      </view>
      <view class="flex items-center p-4" bind:tap="setWifi" data-type="2">
        <image class="w-10 h-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/camera/ic_cp_sm.png"></image>
        <text class="ml-4 flex-1">扫描二维码</text>
        <view class="text-gray-400">></view>
      </view>
    </view>
  </view>

  <view wx:if="{{popup_show}}" class="fixed inset-0 bg-white z-50">
    <view class="p-6 pt-12">
      <image src="../../assets/images/close_icon.png" class="w-6 h-6" bind:tap="confirmExit"></image>
    </view>

    <view wx:if="{{current === 0}}" class="px-6 text-center">
      <view class="text-2xl font-bold">设备重置</view>
      <view class="text-lg font-bold mt-6">Braha智能摄像机</view>
      <view class="text-gray-500 mt-6 leading-relaxed">
        摄像机通电后，等待1~3分钟，长按Reset键5秒，等待1~3分钟，点击下一步。注：首次绑定无需按键，可直接进行下一步
      </view>
      <image class="w-56 mx-auto mt-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/camera/ic_sbcz.png" mode="widthFix"></image>
      <view class="absolute bottom-16 left-0 right-0 px-10">
        <button class="btn_style" bind:tap="nextStep" data-step="1">设备已重置</button>
      </view>
    </view>

    <view wx:elif="{{current === 1}}" class="px-6">
      <view class="text-center">
        <view class="text-2xl font-bold">选择家庭Wi-Fi</view>
        <view class="font-bold mt-6">此设备只支持使用<text class="text-red-600">2.4GHz Wi-Fi</text>连接使用</view>
        <view class="text-red-600 mt-4">Wi-Fi名称仅支持英文字符及数字</view>
      </view>
      <view class="mt-10">
        <view class="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
          <input class="flex-1" value="{{WifiInfo.SSID}}" placeholder="Wi-Fi名称" disabled/>
          <button class="bg-white text-sm px-4 py-1 rounded" bind:tap="showWifiList">选择Wi-Fi</button>
        </view>
        <view class="bg-gray-100 p-3 rounded-lg flex items-center mt-6">
          <input class="flex-1" type="{{iseye ? 'text' : 'password'}}" placeholder="Wi-Fi密码"/>
          <image src="{{iseye ? '../../assets/images/eye_open.png' : '../../assets/images/eye_close.png'}}" class="w-6 h-6" bind:tap="toggleEye"></image>
        </view>
        <view class="text-xs text-gray-500 mt-6">
          Wi-Fi密码输入错误是最常见的失败原因之一，<text class="text-red-600 font-bold">请仔细检查Wi-Fi密码</text>，密码必须至少包含8个字符
        </view>
      </view>
      <view class="absolute bottom-10 left-0 right-0 px-10 text-center">
        <button class="btn_style" bind:tap="nextStep" data-step="2">下一步</button>
        <view class="text-yellow-600 underline mt-6" bind:tap="backStep">返回上一步</view>
      </view>
    </view>

    <view wx:elif="{{current === 2}}">
      <view wx:if="{{set_wifi}}" class="px-6 text-center">
        <view class="text-2xl font-bold">连接设备Wi-Fi</view>
        <view class="font-bold mt-6">连接以<text class="text-red-600">【Care-AP】</text>开头的设备Wi-Fi</view>
        <view class="text-gray-500 mt-4">Wi-Fi默认密码为<text class="text-red-600 font-bold">12345678</text></view>
        <view class="font-bold text-lg mt-6">如有弹窗，请选择保持/使用此网络。</view>
        <view class="text-xs text-gray-500 mt-10">
          * 检查Wi-Fi名称，必须以【Care-AP】的Wi-Fi,若没有，请重新重置摄像头，或断电2分钟之后重试
        </view>
        <view class="absolute bottom-10 left-0 right-0 px-10 text-center">
          <button class="btn_style" bind:tap="nextStep" data-step="3">我已知晓，立即连接</button>
          <view class="text-yellow-600 underline mt-6" bind:tap="backStep">返回上一步</view>
        </view>
      </view>
      <view wx:else class="px-6 text-center">
        <view class="text-xl font-bold">扫描二维码</view>
        <image class="w-full mt-4" src="{{codeUrl}}" mode="widthFix"></image>
        <view class="text-xs text-gray-500 mt-4">请将二维码正对摄像机镜头，并保持15cm左右距离</view>
        <view class="text-5xl font-bold mt-6">{{tips}}</view>
        <view class="absolute bottom-10 left-0 right-0 px-10">
          <view class="text-yellow-600 underline" bind:tap="backStep">返回上一步</view>
        </view>
      </view>
    </view>

    <view wx:elif="{{current === 3}}" class="px-6 text-center">
      <view class="text-2xl font-bold mt-4">连接设备</view>
      <view class="flex items-center justify-center mt-16">
        <image class="w-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/camera/img_ljsb_sj.png" mode="widthFix"></image>
        <view class="mx-4">
          <view class="loading-dots"></view> </view>
        <image class="w-12" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/camera/img_ljsb_wifi.png" mode="widthFix"></image>
      </view>
      <view class="mt-16">
        <view class="font-semibold">向设备传输信息</view>
        <view class="text-xs text-gray-500 mt-2">请将手机尽量靠近设备</view>
        <view class="text-xs text-gray-500 mt-2">设备连接网络</view>
        <view class="text-5xl font-bold mt-6">{{tips}}</view>
      </view>
    </view>
  </view>

  <view wx:if="{{wifi_show}}" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" bind:tap="hideWifiList">
    <view class="bg-white rounded-lg w-4/5" catch:tap>
      <view class="flex justify-between items-center p-4 border-b">
        <text class="font-bold">Wi-Fi列表</text>
        <image src="../../assets/images/reload_icon.png" class="w-5 h-5" bind:tap="reloadWifi"></image>
      </view>
      <scroll-view scroll-y="true" class="h-64">
        <block wx:for="{{theList}}" wx:key="BSSID">
          <view class="flex items-center p-4 border-b" bind:tap="chooseSSID" data-item="{{item}}" data-index="{{index}}">
            <view class="w-8">
              <image wx:if="{{chooseIndex === index}}" src="../../assets/images/checkbox_on.png" class="w-5 h-5"></image>
            </view>
            <text class="flex-1">{{item.SSID}}</text>
            <image src="../../assets/images/wifi_icon.png" class="w-5 h-5 ml-2"></image>
            <image src="../../assets/images/lock_icon.png" class="w-5 h-5 ml-2"></image>
          </view>
        </block>
      </scroll-view>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\addDevice\addDevice.json`

```json
{
  "navigationBarTitleText": "添加设备",
  "usingComponents": {},
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff"
}
```

### 文件路径: `src\pages\addDevice\addDevice.scss`

```scss
/* pages/index/addDevice/addDevice.scss */

page {
  background-color: #F5F5F7;
}
```

### 文件路径: `src\pages\addDevice\addDevice.ts`

```ts
// pages/index/addDevice/addDevice.ts

// 获取全局 app 实例
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    roleName: '',
    showModal: false,
    modalContent: '设备添加成功',
    bed_id: -1,
    camera_id: -1,
    userid: -1,
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options 页面启动参数
   */
  onLoad(options: { bed_id?: string; camera_id?: string; userid?: string }) {
    this.setData({
      bed_id: options.bed_id ? parseInt(options.bed_id, 10) : -1,
      camera_id: options.camera_id ? parseInt(options.camera_id, 10) : -1,
      userid: options.userid ? parseInt(options.userid, 10) : -1,
    });
  },

  /**
   * 点击确认按钮
   */
  confirmBtn() {
    if (this.data.roleName.trim().length > 0) {
      // 模拟 API 请求
      this.shareDeviceRequest();
    } else {
      // 显示错误提示的模态框
      this.setData({
        modalContent: '请输入角色名称',
        showModal: true,
      });
    }
  },

  /**
   * 模拟API请求：分享设备
   */
  shareDeviceRequest() {
    const params = {
      bed_id: this.data.bed_id,
      camera_id: this.data.camera_id,
      userid: app.globalData.userInfo.userid, // 假设 app.globalData.userInfo 存在
      relationName: this.data.roleName,
      createid: this.data.userid
    };

    console.log('发起分享设备请求:', params);

    // 在这里替换为实际的 wx.request 调用
    // wx.request({
    //   url: 'YOUR_API_ENDPOINT/shareDevice',
    //   method: 'POST',
    //   data: params,
    //   success: (res) => {
    //     if (res.data.code === 200) {
           this.setData({
             modalContent: '添加成功',
             showModal: true,
           });
    //     } else {
    //       // 处理错误情况
    //     }
    //   },
    //   fail: () => {
    //     // 处理网络错误
    //   }
    // });
  },


  /**
   * 模态框确认按钮点击事件
   */
  btn_confirm() {
    this.setData({
      showModal: false,
    });
    // 只有在添加成功时才跳转
    if (this.data.modalContent === '添加成功') {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
});
```

### 文件路径: `src\pages\addDevice\addDevice.wxml`

```wxml
<view class="container main-width">
  <view class="bg-white mt-5 rounded-lg">
    <view class="flex items-center p-4 border-b border-gray-100">
      <text class="w-24 text-gray-700">角色名称</text>
      <input class="flex-1" type="text" model:value="{{roleName}}" placeholder="示例: 爸爸" />
    </view>
  </view>

  <view class="main-width mt-8">
    <button class="w-full bg-yellow-600 text-white rounded-lg py-3" hover-class="bg-yellow-700" bind:tap="confirmBtn">添加</button>
  </view>

  <view wx:if="{{showModal}}" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <view class="rounded w-4/5 p-6 text-center">
      <view class="text-lg mb-6">{{modalContent}}</view>
      <button class="w-full bg-yellow-500 text-yellow-800 rounded-lg py-2 font-semibold" hover-class="bg-yellow-400" bind:tap="btn_confirm">确定</button>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\afterSearch\afterSearch.json`

```json
{
  "navigationStyle": "default",
  "navigationBarTitleText": "附近设备",
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff"
}
```

### 文件路径: `src\pages\afterSearch\afterSearch.scss`

```scss
/* pages/index/searchDevice/afterSearch.scss */

page {
  background-color: #ffffff;
}

.title_panel {
  background-image: url('http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/ic_cp_sbfx.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  width: 100%;
  height: 210px; // 420rpx
}

.device-view {
  background-color: white;
  border-radius: 10px; // 20rpx
  box-shadow: 0 5px 8px 0 rgba(206, 211, 217, 0.50);
}

.text-btn {
  border-radius: 5px; // 10rpx
  border: 1px solid rgba(189, 160, 30, 0.30);
  color: #BDA01E;
  font-size: 14px;
}
```

### 文件路径: `src\pages\afterSearch\afterSearch.ts`

```ts
const app = getApp();

Page({
  data: {
    title: '',
    blue_deviceList: [] as any[],
    isNotDevice: true,
    bluetoothInited: false,
    bluetoothSearched: false,
    connected: false,
    connect_blue_deviceInfo: null,
    chooseDevice: {},
    localSN: '',
  },

  onLoad() {
    this.setData({
      title: `${app.globalData.userInfo.nickname}的家`
    });
  },

  onShow() {
    console.log('[调试] 页面 onShow，开始初始化流程...');
    this.initPage();
  },

  onUnload() {
    console.log('[调试] 页面 onUnload，关闭蓝牙适配器。');
    wx.closeBluetoothAdapter({});
  },

  goBack() {
    wx.navigateBack();
  },

  initPage() {
    console.log('[调试] -> initPage: 重置页面数据，准备打开蓝牙适配器。');
    this.setData({
      isNotDevice: true,
      blue_deviceList: [],
    });
    this.openBluetoothAdapter();
  },

  uToast(title: string) {
    wx.showToast({ title, icon: 'none' });
  },

  // --- 蓝牙核心逻辑 ---

  async connect_blue(e: WechatMiniprogram.BaseEvent) {
    const device = e.currentTarget.dataset.device;
    const index = e.currentTarget.dataset.index;
    console.log(`[调试] -> connect_blue: 尝试连接设备:`, device);


    this.setData({
      [`blue_deviceList[${index}].state`]: '连接中'
    });

    // 检查设备是否已被绑定 (替换为您的 wx.request)
    // const check_device = await YourApi.check_bed({ mac: device.localName || device.name });
    const isDeviceBound = false; // 模拟API返回

    if (isDeviceBound) {
      console.log('[调试] 设备已被绑定，显示提示框。');
      wx.showModal({
        title: '提示',
        content: '该设备已被绑定,请联系设备管理员',
        showCancel: false,
        confirmColor: '#BEA121'
      });
      this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
      return;
    }

    this.setData({ chooseDevice: device });

    console.log(`[调试] 调用 wx.createBLEConnection， DeviceId: ${device.deviceId}`);
    wx.createBLEConnection({
      deviceId: device.deviceId,
      success: (res) => {
        console.log('[调试] wx.createBLEConnection 成功:', res);
        if (this.data.bluetoothSearched) {
          console.log('[调试] 连接成功，停止蓝牙搜索。');
          this.stopBluetoothDevicesDiscovery();
        }
        this.setData({ connected: true });

        setTimeout(() => {
          this.discoverServicesAndCharacteristics(device, index);
        }, 1000);
      },
      fail: (err) => {
        console.error('[调试] wx.createBLEConnection 失败:', err);
        this.uToast('连接蓝牙失败,请重试');
        this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
      }
    });
  },

 async discoverServicesAndCharacteristics(device: any, index: number) {
      console.log('[调试] -> discoverServicesAndCharacteristics: 开始发现服务和特征值', device);

      const YOUR_SERVICE_UUID = "00008356-0000-1000-8000-00805F9B34FB";


      const YOUR_WRITE_CHARACTERISTIC_UUID = "00009535-0000-1000-8000-00805F9B34FB";

      try {
        const services = await this.getBLEDeviceServices(device);
        if (!services || services.length === 0) {
            console.error('[调试] 未找到任何服务。');
            this.uToast('获取蓝牙服务失败');
            this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
            return;
        }
        console.log('[调试] 获取到的所有服务列表:', services);

        // 从所有服务中，找到我们需要的那个特定服务
        const targetService = services.find(s => s.uuid.toUpperCase() === YOUR_SERVICE_UUID.toUpperCase());

        if (!targetService) {
            console.error(`[调试] 未在设备上找到指定的服务UUID: ${YOUR_SERVICE_UUID}`);
            // 如果找不到，也可以尝试使用第一个服务作为备选方案
            // const targetService = services[0];
            // console.warn(`[调试] 警告: 未找到指定服务，将尝试使用发现的第一个服务: ${targetService.uuid}`);
            this.uToast('找不到指定蓝牙服务');
            this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
            return;
        }

        console.log(`[调试] 成功找到目标服务: ${targetService.uuid}`);
        const characteristics = await this.getBLEDeviceCharacteristics(device.deviceId, targetService.uuid);
        console.log('[调试] 在目标服务下获取到的所有特征值列表:', characteristics);

        // 从该服务的所有特征值中，找到我们需要的那个“可写”的特征值
        const writeCharacteristic = characteristics.find(c => c.uuid.toUpperCase() === YOUR_WRITE_CHARACTERISTIC_UUID.toUpperCase());

        // 也可以通过属性来找，但不推荐，因为一个服务下可能有多个可写的特征值
        // const writeCharacteristic = characteristics.find(c => c.properties.write);

        if (writeCharacteristic) {
            console.log('[调试] 成功找到可写的特征值:', writeCharacteristic);
            this.setData({
                connect_blue_deviceInfo: {
                    deviceId: device.deviceId,
                    serviceId: targetService.uuid,
                    characteristicId: writeCharacteristic.uuid, // 存储写入特征值的ID
                },
                [`blue_deviceList[${index}].state`]: '已连接'
            });
            this.sendPostData(); // 连接成功后跳转
        } else {
            console.error(`[调试] 在服务 ${targetService.uuid} 下未找到指定的写入特征值UUID: ${YOUR_WRITE_CHARACTERISTIC_UUID}`);
            this.uToast('未找到可用特征值');
            this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
        }
      } catch (err) {
          console.error('[调试] 在发现服务或特征值过程中发生异常:', err);
          this.uToast('发现服务/特征值失败');
          this.setData({ [`blue_deviceList[${index}].state`]: '未连接' });
      }

      // ======================= 代码修改结束 =======================
  },

  openBluetoothAdapter() {
    console.log('[调试] -> openBluetoothAdapter: 调用 wx.openBluetoothAdapter');
    wx.openBluetoothAdapter({
      success: (e) => {
        console.log('[调试] wx.openBluetoothAdapter 成功:', e);
        this.setData({ bluetoothInited: true });
        this.getBluetoothAdapterState();
      },
      fail: (e) => {
        console.error('[调试] wx.openBluetoothAdapter 失败:', e);
        this.setData({ bluetoothInited: false });
        this.initTypes(e.errCode);
      }
    });
  },

  getBluetoothAdapterState() {
    console.log('[调试] -> getBluetoothAdapterState: 调用 wx.getBluetoothAdapterState');
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('[调试] wx.getBluetoothAdapterState 成功:', res);
        if (res.available) {
          console.log('[调试] 蓝牙适配器可用，开始搜索设备...');
          this.startBluetoothDevicesDiscovery();
        } else {
          console.warn('[调试] 蓝牙适配器不可用，提示用户打开蓝牙。');
          this.uToast('请打开手机蓝牙');
        }
      },
      fail: (e) => {
         console.error('[调试] wx.getBluetoothAdapterState 失败:', e);
         this.initTypes(e.errCode);
      }
    });
  },

  startBluetoothDevicesDiscovery() {
    console.log('[调试] -> startBluetoothDevicesDiscovery: 调用 wx.startBluetoothDevicesDiscovery');
    this.setData({ bluetoothSearched: true });
    wx.startBluetoothDevicesDiscovery({
      success: (e) => {
        console.log('[调试] wx.startBluetoothDevicesDiscovery 成功, 开始监听设备发现...', e);
        this.onBluetoothDeviceFound();
      },
      fail: (e) => {
        console.error('[调试] wx.startBluetoothDevicesDiscovery 失败:', e);
        this.setData({ bluetoothSearched: false, isNotDevice: false });
        this.initTypes(e.errCode);
      }
    });
  },

  onBluetoothDeviceFound() {
    console.log('[调试] -> onBluetoothDeviceFound: 注册 wx.onBluetoothDeviceFound 回调。');
    wx.onBluetoothDeviceFound(() => {
      // 使用箭头函数确保 this 指向正确
      // 为了避免频繁调用 getBluetoothDevices，可以加一个定时器或者防抖
      console.log('[调试] wx.onBluetoothDeviceFound 触发，发现新设备，调用 getBluetoothDevices。');
      this.getBluetoothDevices();
    });
  },

  getBluetoothDevices() {
    console.log('[调试] -> getBluetoothDevices: 调用 wx.getBluetoothDevices');
    wx.getBluetoothDevices({
      success: (res) => {
        console.log('[调试] wx.getBluetoothDevices 成功，【所有】发现的设备列表:', res.devices);

        let foundDevices = res.devices.filter(item => item.name && item.name.includes("Baby2Plus"));
        console.log('[调试] 经过名称 "Braha" 过滤后，【符合条件】的设备列表:', foundDevices);

        if (foundDevices.length > 0) {
          let currentDeviceList = this.data.blue_deviceList;
          console.log('[调试] 当前页面已显示的设备列表:', currentDeviceList);

          foundDevices.forEach(newDevice => {
            // 避免重复添加
            if (!currentDeviceList.some(d => d.deviceId === newDevice.deviceId)) {
              console.log(`[调试] 发现一个【新】的 Braha 设备，准备添加到列表:`, newDevice);
              newDevice.state = '未连接';
              currentDeviceList.push(newDevice);
            }
          });

          console.log('[调试] 更新后的完整设备列表，准备 setData:', currentDeviceList);
          this.setData({ blue_deviceList: currentDeviceList });
        } else {
            console.log('[调试] 本次 getBluetoothDevices 调用中，没有发现名称含 "Braha" 的设备。');
        }
      },
      fail: (err) => {
        console.error('[调试] wx.getBluetoothDevices 失败:', err);
      }
    });
  },

  stopBluetoothDevicesDiscovery() {
      console.log('[调试] -> stopBluetoothDevicesDiscovery: 调用 wx.stopBluetoothDevicesDiscovery');
      wx.stopBluetoothDevicesDiscovery({
          success: (res) => {
            console.log('[调试] wx.stopBluetoothDevicesDiscovery 成功', res);
            this.setData({ bluetoothSearched: false });
          },
          fail: (err) => {
            console.error('[调试] wx.stopBluetoothDevicesDiscovery 失败', err);
          }
      });
  },

  sendPostData(){
      console.log('[调试] -> sendPostData: 准备跳转到 inputDevice 页面');
      wx.navigateTo({
          url: `/pages/index/addDevice/inputDevice/inputDevice?sn=${this.data.localSN}&name=${this.data.chooseDevice.name}&mac=${this.data.chooseDevice.deviceId}`
      });
  },

  // 这里为您补充一个Promise封装的示例
  getBLEDeviceServices(device: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceServices({
        deviceId: device.deviceId,
        success: (res) => resolve(res.services),
        fail: reject,
      });
    });
  },

  getBLEDeviceCharacteristics(deviceId: string, serviceId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => resolve(res.characteristics),
        fail: reject,
      });
    });
  },

  initTypes(code: number) {
    console.error(`[调试] -> initTypes: 蓝牙流程发生错误，错误码: ${code}`);
    const errorMessages: { [key: number]: string } = {
      10000: '未初始化蓝牙适配器',
      10001: '当前蓝牙适配器不可用，请打开系统蓝牙',
      10002: '没有找到指定设备',
      10003: '连接失败',
      10004: '没有找到指定服务',
      10005: '没有找到指定特征值',
      10006: '当前连接已断开',
      10007: '当前特征值不支持此操作',
      10008: '其余所有系统上报的异常',
      10009: 'Android 系统特有，系统版本低于 4.3 不支持 BLE',
      10012: '连接超时',
      10013: '创建连接失败'
    };
    this.uToast(errorMessages[code] || `蓝牙发生未知错误(${code})`);
  },
});
```

### 文件路径: `src\pages\afterSearch\afterSearch.wxml`

```wxml
<view class="container">
  <view wx:if="{{blue_deviceList.length === 0}}" class="flex flex-col h-screen">

    <view class="flex-1 flex flex-col items-center justify-center">
      <image src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/search/img_sssb.png" class="w-64 h-auto" mode="widthFix"></image>

      <view wx:if="{{isNotDevice}}" class="text-center p-4">
        <view class="text-md text-gray-800 font-semibold">正在努力搜索附近设备</view>
        <view class="text-sm text-yellow-600 mt-2">查找不到设备怎么办？</view>
      </view>

      <view wx:else class="text-center p-4">
        <view class="text-md text-gray-800 font-semibold">搜索设备失败</view>
        <view class="text-sm text-yellow-600 mt-2" bind:tap="initPage">再试一次</view>
      </view>
    </view>
  </view>

  <view wx:else>
    <view class="title_panel">
      <view class="custom-navbar sticky top-0 z-50 flex items-center">
         <view class="absolute left-4" bind:tap="goBack">
            <image src="../../assets/images/back_icon_white.png" class="w-6 h-6"></image>
        </view>
      </view>
      <view class="p-10 pt-4 text-white">
        <view class="font-bold text-2xl">{{title}}</view>
        <view class="mt-2 opacity-80">共{{blue_deviceList.length}}个设备</view>
      </view>
    </view>

    <view class="p-4">
      <block wx:for="{{blue_deviceList}}" wx:key="deviceId">
        <view class="device-view flex items-center justify-between p-4 my-4">
          <view class="flex items-center">
            <image src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/img_nbt.png" class="w-20 h-auto" mode="widthFix"></image>
            <text class="ml-4 font-bold">{{item.name}}</text>
          </view>
          <view>
            <text class="text-btn px-4 py-2" bind:tap="connect_blue" data-device="{{item}}" data-index="{{index}}">{{item.state}}</text>
          </view>
        </view>
      </block>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\baby\baby.json`

```json
{
  "navigationStyle": "custom",
  "usingComponents": {}
}
```

### 文件路径: `src\pages\baby\baby.scss`

```scss
/* pages/baby/baby.scss */
page {
  background-color: #f5f5f7;
  --td-navbar-bg-color: transparent
}

.baby-show {
  background-image: linear-gradient(90deg, rgba(235, 210, 69, 0.3), rgba(224, 152, 19, 0.5));
  height: 275px; /* 550rpx */
}

.icon_bg {
  @apply h-14 w-14 rounded-full flex items-center justify-center mx-auto;
}

.custom-capsule {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-capsule__icon {
  flex: 1;
  position: relative;
}

.custom-capsule__icon.home:before {
  content: '';
  display: block;
  position: absolute;
  left: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 18px;
  background: #e7e7e7;
}
```

### 文件路径: `src\pages\baby\baby.ts`

```ts
// pages/baby/baby.ts
// @ts-nocheck
const app = getApp();

Page({
  data: {
    statusBarHeight: 0,
    babyList: [] as any[],
    chooseBaby: {} as any,
    memoList: [] as any[],
    dayShow: false, // 控制添加记录弹窗
    del_show: false, // 控制删除确认弹窗
    chooseDeeds: {} as any, // 待删除的记录

    icon_list: [
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/iconsg.png', name: '身高', bgColor: '#ed7e9e' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/tizhong.png', name: '体重', bgColor: '#6bcdaf' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/buru.png', name: '瓶喂母乳', bgColor: '#a772e7' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/naifen.png', name: '奶粉', bgColor: '#75bbf8' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/fushiyingyang.png', name: '辅食', bgColor: '#c87ee9' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/yinger.png', name: '头围', bgColor: '#f6ca5d' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/Thermometer.png', name: '体温', bgColor: '#6bcdaf' },
      { imgurl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon/niaobu.png', name: '换尿布', bgColor: '#75bbf8' },
    ]
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0,
    });
  },

  onShow() {
    this.getBaby();
  },

  async getBaby() {
    // 模拟API获取宝宝列表
    // const res = await this.$u.iotApi.getBabyList(...);
    const mockBabyList = [
      { babyid: 1, lovename: '小宝', field1: '男', field2: '1岁2个月', lastheight: 75, lastweight: 10 },
      { babyid: 2, lovename: '小美', field1: '女', field2: '2岁', lastheight: 85, lastweight: 12 },
    ];

    if (mockBabyList.length > 0) {
      this.setData({
        babyList: mockBabyList,
        chooseBaby: mockBabyList[0]
      });
      this.getMemoList(mockBabyList[0].babyid);
    } else {
      this.setData({
        babyList: [],
        chooseBaby: {},
        memoList: []
      });
    }
  },

  async getMemoList(babyid: number) {
      // 模拟API获取记录列表
      // const memo = await this.$u.iotApi.getBabyDayList({ babyid });
      const mockMemoList = [
        { id: 1, createtime: Date.now(), field1: '身高', field2: '75', describe: '长高高', nickName: '妈妈', imgList: ['http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/memo/buy_detail.jpg'] },
        { id: 2, createtime: Date.now() - 86400000, field1: '大事记', describe: '第一次叫爸爸', nickName: '爸爸', imgList: [] },
      ];
      this.setData({ memoList: mockMemoList });
  },

  onBabyChange(e: WechatMiniprogram.BaseEvent) {
    const index = e.detail.value;
    const selectedBaby = this.data.babyList[index];
    this.setData({ chooseBaby: selectedBaby });
    this.getMemoList(selectedBaby.babyid);
  },

  setBaby() {
    const params = Object.keys(this.data.chooseBaby).map(key => `${key}=${this.data.chooseBaby[key]}`).join('&');
    wx.navigateTo({ url: `/pages/baby/addBaby?${params}` });
  },

  addBaby() {
    wx.navigateTo({ url: '/pages/baby/addBaby' });
  },

  page_to(e: WechatMiniprogram.BaseEvent) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  showImg(e: WechatMiniprogram.BaseEvent) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ urls: [url] });
  },

  show_del(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    wx.showModal({
        title: '提示',
        content: '您确定要删除吗？',
        confirmColor: '#BDA01E',
        success: (res) => {
            if (res.confirm) {
                this.delDeeds_event(item);
            }
        }
    });
  },

  delDeeds_event(item: any) {
    // 模拟删除API
    // await this.$u.iotApi.delDeeds({ id: item.id });
    const newMemoList = this.data.memoList.filter(memo => memo.id !== item.id);
    this.setData({ memoList: newMemoList });
    wx.showToast({ title: '删除成功' });
  },

  showDayPopup() {
    this.setData({ dayShow: true });
  },

  hideDayPopup() {
    this.setData({ dayShow: false });
  },

  baby_day(e: WechatMiniprogram.BaseEvent) {
    const name = e.currentTarget.dataset.name;
    this.setData({ dayShow: false });
    wx.navigateTo({
      url: `/pages/baby/babyDiary?name=${name}&babyname=${this.data.chooseBaby.lovename}&babyid=${this.data.chooseBaby.babyid}`
    });
  }
});
```

### 文件路径: `src\pages\baby\baby.wxml`

```wxml
<wxs module="timeUtil" src="./time.wxs"></wxs>
<t-navbar t-class-placeholder="t-navbar-placeholder" t-class-content="t-navbar-content">
  <view slot="capsule" class="custom-capsule">
    <t-icon
      size="40rpx"
      bind:tap="onBack"
      aria-role="button"
      aria-label="返回"
      name="chevron-left"
      class="custom-capsule__icon back"
    />
    <t-icon
      size="40rpx"
      bind:tap="addBaby"
      aria-role="button"
      aria-label="添加宝宝"
      name="add"
      class="custom-capsule__icon home"
    />
  </view>
  <view slot="title" wx:if="{{babyList.length > 0}}">
        <picker range="{{babyList}}" range-key="lovename" bindchange="onBabyChange">
          <view class="flex items-center">
            <text class="text-sm">{{chooseBaby.lovename}}</text>
            <image src="../../assets/images/arrow_down.png" class="w-4 h-4 ml-2"></image>
          </view>
        </picker>
  </view>
</t-navbar>
<view class="container -mt-24">
  <view class="baby-show">
    <view style="height: {{statusBarHeight + 54}}px;"></view>

    <view wx:if="{{babyList.length > 0}}" class="px-4">

      <view class="flex justify-between items-center mt-2 pl-8 text-xs">
        <view>
          <text class="text-yellow-700">{{chooseBaby.field2}}</text>
          <view class="text-sm font-bold my-2 flex items-center">
            <text class="mr-2">{{chooseBaby.lovename}}</text>
            <image src="../../assets/images/edit_icon.png" class="w-6 h-6" bind:tap="setBaby"></image>
          </view>
          <text class="text-yellow-700">身高（长）</text>
          <view class="text-sm font-bold my-2">{{chooseBaby.lastheight}}cm</view>
          <text class="text-yellow-700">体重</text>
          <view class="text-sm font-bold mt-2">{{chooseBaby.lastweight}}kg</view>
        </view>
        <image class="w-36" src="{{chooseBaby.field1 === '男' ? 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/baby_boy.png' : 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/baby_gril.png'}}" mode="widthFix"></image>
      </view>
    </view>

    <view wx:else class="h-full flex justify-center items-center">
      <view class="text-center">
        <view class="font-semibold mb-4">还未创建宝宝专属档案</view>
        <view class="bg-yellow-600 rounded-full px-6 py-2 inline-flex items-center" bind:tap="addBaby">
          <image src="../../assets/images/plus_icon.png" class="w-5 h-5"></image>
          <text class="text-white ml-2">创建档案</text>
        </view>
      </view>
    </view>
  </view>

  <view class="p-4">
    <view class="bg-white rounded-lg flex justify-around p-4">
      <view class="text-center" bind:tap="page_to" data-url="/pages/baby/feeding">
        <image class="w-12 h-12" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon_wygl.png"></image>
        <text class="block text-sm mt-2">喂养攻略</text>
      </view>
      <view class="text-center" bind:tap="page_to" data-url="/pages/baby/vac_date/vac_date">
        <image class="w-12 h-12" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon_ymzq.png"></image>
        <text class="block text-sm mt-2">疫苗周期</text>
      </view>
      <view class="text-center" bind:tap="page_to" data-url="/pages/baby/devlopGud">
        <image class="w-12 h-12" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon_fyzn.png"></image>
        <text class="block text-sm mt-2">发育指南</text>
      </view>
      <view class="text-center" bind:tap="page_to" data-url="/pages/baby/sleepMemo">
        <image class="w-12 h-12" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/baby/icon_smzd.png"></image>
        <text class="block text-sm mt-2">睡眠指导</text>
      </view>
    </view>
  </view>

  <view wx:if="{{memoList.length > 0}}" class="px-4">
    <text class="text-lg font-bold border-b-2 border-yellow-500 pb-1">宝宝记录</text>
    <block wx:for="{{memoList}}" wx:key="id">
      <view class="mt-6">
        <text class="font-bold text-lg">{{timeUtil.format(item.createtime, 'dd')}}</text>
        <text class="text-xs text-gray-500 ml-2">{{timeUtil.format(item.createtime, '/MM月 yyyy年')}}</text>
        <text class="text-xs text-white rounded-tr-lg rounded-bl-lg px-2 py-1 ml-2 {{item.field1 === '大事记' ? 'bg-orange-500' : 'bg-yellow-600'}}">{{item.field1}}</text>

        <view class="bg-white rounded-lg mt-3 p-4">

          <view class="mt-3">
            <view wx:if="{{item.field1 === '大事记' || item.field1 === '随手记' || item.field1 === '换尿布'}}" class="{{item.field1 === '大事记' ? 'text-yellow-700 font-semibold' : ''}}">{{item.describe}}</view>
            <view wx:else>
              <view class="text-yellow-700 font-semibold">{{item.field1}} | {{item.field2}} {{timeUtil.getUnit(item.field1)}}</view>
              <view class="mt-2">{{item.describe}}</view>
            </view>
          </view>

          <view class="flex mt-3">
            <block wx:for="{{item.imgList}}" wx:for-item="img" wx:key="*this">
              <image class="w-24 h-24 mr-2 rounded" src="{{img}}" mode="aspectFill" bind:tap="showImg" data-url="{{img}}"></image>
            </block>
          </view>

          <view class="flex justify-between items-center mt-3 text-xs">
            <view class="text-yellow-700">
              <text>{{item.nickName}}</text>
              <text class="ml-4">{{timeUtil.format(item.createtime, 'hh:mm')}}发布</text>
            </view>
            <view class="flex items-center text-gray-500" bind:tap="show_del" data-item="{{item}}">
              <image src="../../assets/images/delete_icon.png" class="w-4 h-4"></image>
              <text class="ml-1">删除</text>
            </view>
          </view>
        </view>
      </view>
    </block>
  </view>

  <view wx:if="{{babyList.length > 0}}" class="fixed w-14 h-14 bg-yellow-600 rounded-full flex justify-center items-center bottom-20 right-8 shadow-lg" bind:tap="showDayPopup">
    <image src="../../assets/images/plus_icon.png" class="w-8 h-8"></image>
  </view>

  <view wx:if="{{dayShow}}" class="fixed inset-0 bg-black bg-opacity-50 z-40" bind:tap="hideDayPopup">
    <view class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 text-center" catch:tap>
      <view class="grid grid-cols-4 gap-y-4 border-b pb-4">
        <view bind:tap="baby_day" data-name="随手记">
          <view class="icon_bg bg-yellow-100"><image class="w-8 h-8" src="../../assets/images/memo_icon.png"></image></view>
          <text class="text-xs mt-2 block">随手记</text>
        </view>
        <view bind:tap="baby_day" data-name="大事记">
          <view class="icon_bg bg-yellow-100"><image class="w-8 h-8" src="../../assets/images/event_icon.png"></image></view>
          <text class="text-xs mt-2 block">大事记</text>
        </view>
        <block wx:for="{{icon_list}}" wx:key="name">
          <view bind:tap="baby_day" data-name="{{item.name}}">
            <view class="icon_bg" style="background-color:{{item.bgColor}}"><image class="w-8 h-8" src="{{item.imgurl}}"></image></view>
            <text class="text-xs mt-2 block">{{item.name}}</text>
          </view>
        </block>
      </view>
      <view class="py-3" bind:tap="hideDayPopup">取消</view>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\baby\time.wxs`

```wxs
// pages/baby/time.wxs

// 时间格式化主函数
function format(timestamp, fmt) {
  // WXS 中使用全局的 getDate 函数创建日期对象
  var date = getDate(timestamp);

  var o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
  };

  // WXS 中使用 getRegExp 代替 new RegExp()
  var yearReg = getRegExp('(y+)');
  if (yearReg.test(fmt)) {
    var yearStr = date.getFullYear() + '';
    // 使用 exec 获取匹配结果，避免使用不支持的 RegExp.$1
    var match = yearReg.exec(fmt)[0];
    fmt = fmt.replace(match, yearStr.substr(4 - match.length));
  }

  // 【修正】使用标准 for 循环代替 for...in 循环，避免 WXS 解析错误
  var keys = ['M+', 'd+', 'h+', 'm+', 's+'];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var reg = getRegExp('(' + k + ')');
    if (reg.test(fmt)) {
      var str = o[k] + '';
      var match = reg.exec(fmt)[0];
      // 根据匹配长度判断是否需要补零
      fmt = fmt.replace(match, (match.length === 1) ? str : ('00' + str).substr(str.length));
    }
  }
  return fmt;
}

// 根据不同类型获取单位
function getUnit(type) {
  if (type === '身高' || type === '头围') return 'CM';
  if (type === '体重') return 'KG';
  if (type === '体温') return '℃';
  if (type === '辅食') return '';
  return 'ML';
}

// 导出模块方法
module.exports = {
  format: format,
  getUnit: getUnit
};
```

### 文件路径: `src\pages\camera\camera.json`

```json
{
  "usingComponents": {
    "p2p-live-player": "../../components/p2p-live-player/p2p-live-player",
    "iot-p2p-voice": "plugin://xp2p/iot-p2p-voice"
  },
  "navigationBarTitleText": "实时监控"
}
```

### 文件路径: `src\pages\camera\camera.scss`

```scss
/* 保持原项目中的PTZ面板样式 */
.ptz-panel {
  position: relative;
}
.ptz-panel .ptz-controls {
  padding: 0;
  display: flex;
  justify-content: center;
}
.ptz-panel .ptz-controls .ptz-controls-top {
  position: relative;
  display: flex;
  width: 250rpx;
  height: 250rpx;
  border-radius: 20rpx;
  overflow: hidden;
  align-items: center;
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position {
  position: relative;
  width: 250rpx;
  height: 250rpx;
  border-radius: 50%;
  background-color: #f5f5f5;
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-btn {
  position: relative;
  text-align: center;
  padding: 20rpx;
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-icon {
  width: 48rpx;
  height: 48rpx;
  background: url("data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 fill%3D%22none%22 viewBox%3D%220 0 32 32%22 class%3D%22design-iconfont%22%3E  %3Cg clip-path%3D%22url(%23clip0)%22%3E    %3Cpath opacity%3D%22.01%22 fill%3D%22red%22 d%3D%22M0 0H32V32H0z%22%2F%3E    %3Cpath fill-rule%3D%22evenodd%22 clip-rule%3D%22evenodd%22 d%3D%22M12.4542 10.5807L13.5149 9.52004L19.293 15.2982C19.6836 15.6887 19.6836 16.3219 19.293 16.7124L13.5149 22.4906L12.4542 21.4299L17.8788 16.0053L12.4542 10.5807Z%22 fill%3D%22%23000%22 fill-opacity%3D%22.9%22%2F%3E    %3Cmask id%3D%22sgcfdjtfua%22 style%3D%22mask-type%3Aalpha%22 maskUnits%3D%22userSpaceOnUse%22 x%3D%2212%22 y%3D%229%22 width%3D%228%22 height%3D%2214%22%3E      %3Cpath fill-rule%3D%22evenodd%22 clip-rule%3D%22evenodd%22 d%3D%22M12.4542 10.5807L13.5149 9.52004L19.293 15.2982C19.6836 15.6887 19.6836 16.3219 19.293 16.7124L13.5149 22.4906L12.4542 21.4299L17.8788 16.0053L12.4542 10.5807Z%22 fill%3D%22%23fff%22%2F%3E    %3C%2Fmask%3E  %3C%2Fg%3E  %3Cdefs%3E    %3CclipPath id%3D%22clip0%22%3E      %3Cpath fill%3D%22%23fff%22 d%3D%22M0 0H32V32H0z%22%2F%3E    %3C%2FclipPath%3E  %3C%2Fdefs%3E%3C%2Fsvg%3E") center center no-repeat;
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-icon.press {
  background: url("data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 fill%3D%22none%22 viewBox%3D%220 0 32 32%22 class%3D%22design-iconfont%22%3E  %3Cg clip-path%3D%22url(%23clip0)%22%3E    %3Cpath opacity%3D%22.01%22 fill%3D%22red%22 d%3D%22M0 0H32V32H0z%22%2F%3E    %3Cpath fill-rule%3D%22evenodd%22 clip-rule%3D%22evenodd%22 d%3D%22M12.4542 10.5807L13.5149 9.52004L19.293 15.2982C19.6836 15.6887 19.6836 16.3219 19.293 16.7124L13.5149 22.4906L12.4542 21.4299L17.8788 16.0053L12.4542 10.5807Z%22 fill%3D%22%2329CC85%22 fill-opacity%3D%22.9%22%2F%3E    %3Cmask id%3D%22sgcfdjtfua%22 style%3D%22mask-type%3Aalpha%22 maskUnits%3D%22userSpaceOnUse%22 x%3D%2212%22 y%3D%229%22 width%3D%228%22 height%3D%2214%22%3E      %3Cpath fill-rule%3D%22evenodd%22 clip-rule%3D%22evenodd%22 d%3D%22M12.4542 10.5807L13.5149 9.52004L19.293 15.2982C19.6836 15.6887 19.6836 16.3219 19.293 16.7124L13.5149 22.4906L12.4542 21.4299L17.8788 16.0053L12.4542 10.5807Z%22 fill%3D%22%23fff%22%2F%3E    %3C%2Fmask%3E  %3C%2Fg%3E  %3Cdefs%3E    %3CclipPath id%3D%22clip0%22%3E      %3Cpath fill%3D%22%23fff%22 d%3D%22M0 0H32V32H0z%22%2F%3E    %3C%2FclipPath%3E  %3C%2Fdefs%3E%3C%2Fsvg%3E") center center no-repeat;
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-icon.arrow-left {
  transform: rotate(180deg);
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-icon.arrow-up {
  transform: rotate(-90deg);
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-icon.arrow-down {
  transform: rotate(90deg);
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-icon.arrow-right {
  transform: rotate(0deg);
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-cricle {
  position: absolute;
  width: 96rpx;
  height: 96rpx;
  border: 2rpx solid rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-dir {
  position: absolute;
  width: 88rpx;
  height: 88rpx;
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-left {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-up {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-down {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}
.ptz-panel .ptz-controls .ptz-controls-top .ptz-position .ptz-right {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}
```

### 文件路径: `src\pages\camera\camera.ts`

```ts
import { isDevTool } from '../../utils/util';
import { getXp2pManager } from '../../lib/xp2pManager';

const app = getApp();
const console = app.logger || console;

// 设备参数
const hardcodedDevice = {
  targetId: 'hardcoded_ipc_1',
  deviceId: '20250901001_178884195_3',
  productId: 'PBA3VBVMHF',
  deviceName: '20250901001_178884195_3',
  xp2pInfo: 'XP2PwuQc1i/sjgUnKC4q9JnRng==%2.4.50',
  isMjpgDevice: false,
  p2pMode: 'ipc' as const,
  sceneType: 'live' as const,
  liveStreamDomain: '',
  initCommand: '',
  useChannelIds: [0],
  options: {
    liveQuality: 'high',
    playerRTC: true,
    playerMuted: false,
    playerLog: true,
    voiceType: 'Pusher',
    intercomType: 'voice',
    supportPTZ: true,
    supportCustomCommand: true,
  },
};

const recordFlvOptions = {
  maxFileSize: 100 * 1024 * 1024,
  needAutoStartNextIfFull: false,
  needSaveToAlbum: true,
  needKeepFile: wx.getAccountInfoSync().miniProgram.envVersion === 'develop',
  showLog: true,
};


Page({
  data: {
    deviceInfo: null as any,
    xp2pInfo: '',
    useChannelIds: [] as number[],
    options: {} as any,

    isPlaySuccess: false,
    isMuted: false,
    isRecording: false,
    voiceState: 'VoiceIdle',

    ptzCmd: '',
    inputCommand: 'CHECK_ONLINE',
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },

    showMusicPanel: false,
    musicList: [] as string[],
    currentSong: '',
    musicState: -1,
    volume: 80,

    deviceStatus: {
      BABY_CRY_APPEASE: false,
      CRY_DETECT_SENSE: 1,
      PTZ_TRACK: false,
      DEFENCE_NOTIFY: false,
      SLEEP_TRACKING: false,
      FENCE_DISPLAY: false,
      DANGER_DISPLAY: false,
      FENCEDET_SENSE: 2,
      SLEEP_TRACK_SENSE: 2,
      FACE_SNAPSHOT: false,
      BLOCK_DETECT: false,
      CRYDET_TIME: '00:00-24:00',

      RES: '720',
      FV: false,
      FH: false,
      LUMI: 50,
      CONT: 50,
      SATU: 50,
      SET_ENCODE_H265: false,
      FORCE_RGB: false,
      AIBOX: false,
      LOGO: true, // 默认改为true

      NIGHT_LAMP: false,
      CAM_WORK_TIME_START: '00:00',
      CAM_WORK_TIME_END: '24:00',
      FIRMWARE: '0',
      VER: '',
      YSGN: false,
      AUDIO: false,
      RECORDTIME: '15',
      TEMPERATURE_UNIT: '0',

      MUSIC_APPEASING: false,
      BREATHING_LED: false,
    },
    cryTimeEnd: '24:00',
  },

  userData: {
    deviceId: '',
    xp2pManager: null as any,
    pageId: 'camera-view-page',
    player: null as any,
    voiceComponent: null as any,
  },

  onLoad() {
    this.userData.xp2pManager = getXp2pManager();
    this.userData.xp2pManager.checkReset();
    this.onStartPlayer({ detail: hardcodedDevice });
  },
  onReady() {
    this.userData.player = this.selectComponent('#p2p-live-player-0');
    this.userData.voiceComponent = this.selectComponent('#iot-p2p-voice');
  },
  onUnload() {
    if (this.userData.deviceId) {
      this.userData.xp2pManager.stopP2PService(this.userData.deviceId, this.userData.pageId);
    }
    this.userData.xp2pManager.checkReset();
  },

  _sendCommand(cmd: string) {
    const commandString = `action=user_define&cmd=${cmd},MYBABY`;
    console.log('发送指令:', commandString);
    return this.userData.xp2pManager.sendCommand(this.userData.deviceId, commandString);
  },

  _updateDeviceStatus(status: any) {
    if (!status) return;

    const newStatus: { [key: string]: any } = {};
    const cryDetTime = status.CRYDET_TIME || '00:00-24:00';
    const cryTimeParts = cryDetTime.split('-');
    const cryTimeEnd = cryTimeParts.length > 1 ? cryTimeParts[1] : '24:00';

    if (status.APPEASE !== undefined) newStatus['deviceStatus.BABY_CRY_APPEASE'] = status.APPEASE === '1';
    if (status.CRY_DETECT_SENSE !== undefined) newStatus['deviceStatus.CRY_DETECT_SENSE'] = parseInt(status.CRY_DETECT_SENSE, 10);
    if (status.PT !== undefined) newStatus['deviceStatus.PTZ_TRACK'] = status.PT === '1';
    if (status.FENCE !== undefined) newStatus['deviceStatus.DEFENCE_NOTIFY'] = status.FENCE === '1';
    if (status.SLEEP_TRACKING !== undefined) newStatus['deviceStatus.SLEEP_TRACKING'] = status.SLEEP_TRACKING === '1';
    if (status.FENCE_DISPLAY !== undefined) newStatus['deviceStatus.FENCE_DISPLAY'] = status.FENCE_DISPLAY === '1';
    if (status.DANGER_DISPLAY !== undefined) newStatus['deviceStatus.DANGER_DISPLAY'] = status.DANGER_DISPLAY === '1';
    if (status.FENCEDET_SENSE !== undefined) newStatus['deviceStatus.FENCEDET_SENSE'] = parseInt(status.FENCEDET_SENSE, 10);
    if (status.SLEEP_TRACK_SENSE !== undefined) newStatus['deviceStatus.SLEEP_TRACK_SENSE'] = parseInt(status.SLEEP_TRACK_SENSE, 10);
    if (status.SNAPSHOT !== undefined) newStatus['deviceStatus.FACE_SNAPSHOT'] = status.SNAPSHOT === '1';
    if (status.BLOCK !== undefined) newStatus['deviceStatus.BLOCK_DETECT'] = status.BLOCK === '1';
    if (status.CRYDET_TIME !== undefined) { newStatus['deviceStatus.CRYDET_TIME'] = cryDetTime; newStatus['cryTimeEnd'] = cryTimeEnd; }
    if (status.RES !== undefined) newStatus['deviceStatus.RES'] = status.RES;
    if (status.FV !== undefined) newStatus['deviceStatus.FV'] = status.FV === '1';
    if (status.FH !== undefined) newStatus['deviceStatus.FH'] = status.FH === '1';
    if (status.LUMI !== undefined) newStatus['deviceStatus.LUMI'] = parseInt(status.LUMI, 10);
    if (status.CONT !== undefined) newStatus['deviceStatus.CONT'] = parseInt(status.CONT, 10);
    if (status.SATU !== undefined) newStatus['deviceStatus.SATU'] = parseInt(status.SATU, 10);
    if (status.SET_ENCODE_H265 !== undefined) newStatus['deviceStatus.SET_ENCODE_H265'] = status.SET_ENCODE_H265 === '1';
    if (status.FC !== undefined) newStatus['deviceStatus.FORCE_RGB'] = status.FC === '1';
    if (status.AIBOX !== undefined) newStatus['deviceStatus.AIBOX'] = status.AIBOX === '0';

    // ================== 核心修复：修正LOGO状态解析 ==================
    if (status.LOGO !== undefined) newStatus['deviceStatus.LOGO'] = status.LOGO === '1'; // 1代表开启
    // =============================================================

    if (status.NightLamp !== undefined) newStatus['deviceStatus.NIGHT_LAMP'] = status.NightLamp === '1';
    if (status.START_TIME !== undefined) newStatus['deviceStatus.CAM_WORK_TIME_START'] = status.START_TIME === '0' ? '00:00' : status.START_TIME;
    if (status.END_TIME !== undefined) newStatus['deviceStatus.CAM_WORK_TIME_END'] = status.END_TIME === '24' ? '24:00' : status.END_TIME;
    if (status.FIRMWARE !== undefined) newStatus['deviceStatus.FIRMWARE'] = status.FIRMWARE;
    if (status.VER !== undefined) newStatus['deviceStatus.VER'] = status.VER;
    if (status.YSGN !== undefined) newStatus['deviceStatus.YSGN'] = status.YSGN === '1';
    if (status.AUDIO !== undefined) newStatus['deviceStatus.AUDIO'] = status.AUDIO === '1';
    if (status.RECORDTIME !== undefined) newStatus['deviceStatus.RECORDTIME'] = status.RECORDTIME;
    if (status.TEMPERATURE_UNIT !== undefined) newStatus['deviceStatus.TEMPERATURE_UNIT'] = status.TEMPERATURE_UNIT;
    if (status.MUSIC_APPEASING !== undefined) newStatus['deviceStatus.MUSIC_APPEASING'] = status.MUSIC_APPEASING === '1';
    if (status.BREATHING_LED !== undefined) newStatus['deviceStatus.BREATHING_LED'] = status.BREATHING_LED === '1';
    if (status.MusicState !== undefined) newStatus['musicState'] = parseInt(status.MusicState, 10);
    if (status.CUR_MUSIC !== undefined) newStatus['currentSong'] = status.CUR_MUSIC || '';
    if (status.Volume !== undefined) newStatus['volume'] = parseInt(status.Volume, 10);

    if (Object.keys(newStatus).length > 0) {
      this.setData(newStatus);
    }
  },

  onStartPlayer({ detail }: { detail: any }) {
    this.userData.deviceId = detail.deviceId;
    this.userData.xp2pManager.startP2PService({ p2pMode: detail.p2pMode, deviceInfo: detail, xp2pInfo: detail.xp2pInfo, caller: this.userData.pageId }).catch((err: any) => console.error('启动P2P服务失败:', err));
    this.setData({ deviceInfo: detail, xp2pInfo: detail.xp2pInfo, useChannelIds: detail.useChannelIds, options: detail.options, isMuted: detail.options.playerMuted });
  },

  onPlayStateChange({ detail }: { detail: any }) {
    if (detail.type === 'playsuccess' && !this.data.isPlaySuccess) {
      this.setData({ isPlaySuccess: true });
      this.getDeviceStatusAndMusicList();
    } else if (['playstop', 'playend', 'playerror'].includes(detail.type)) {
      this.setData({ isPlaySuccess: false });
    }
  },

  // ... (其他事件处理函数保持不变)
  onRecordStateChange({ detail }: { detail: { record: boolean } }) { this.setData({ isRecording: detail.record }); },
  onRecordFileStateChange({ detail }: { detail: any }) { if (detail.state === 'SaveSuccess') { wx.showToast({ title: '录像已保存到相册', icon: 'success' }); } else if (detail.state === 'Error') { if (detail.errType === 'saveError' && detail.errMsg.includes('invalid video')) { wx.showModal({ title: '保存失败', content: '视频录制成功，但因设备视频编码为H.265，系统相册不支持，无法保存。请将设备视频编码设为H.264。', showCancel: false }); } else { wx.showModal({ title: '录像出错', content: `${detail.errType}: ${detail.errMsg || ''}`, showCancel: false }); } } },
  onVoiceStateChange({ detail }: { detail: { voiceState: string } }) { this.setData({ voiceState: detail.voiceState }); },
  onVoiceError({ detail }: { detail: any }) { this.setData({ voiceState: 'VoiceIdle' }); wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' }); },
  onCryAppeaseChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`BABY_CRY_APPEASE,${e.detail.value ? '1' : '0'},auto`).then(this.handleCommandResponse); },
  onCrySenseTap() { const itemList = ['低', '中', '高']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`CRY_DETECT_SENSE,${res.tapIndex}`).then(this.handleCommandResponse) }); },
  onTrackingChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`PTZ_TRACK,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onFenceChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`DEFENCE_NOTIFY,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onSleepTrackingChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SLEEP_TRACKING,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onFenceDisplayChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`DISPLAY_FENCE_AREA,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onDangerDisplayChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`DISPLAY_DANGER_AREA,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onFenceSenseTap() { const itemList = ['低', '中', '高']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`SET_FENCEDET_SENSE,${res.tapIndex + 1}`).then(this.handleCommandResponse) }); },
  onSleepSenseTap() { const itemList = ['低', '中', '高']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`SET_SLEEP_TRACK_SENSE,${res.tapIndex + 1}`).then(this.handleCommandResponse) }); },
  onFaceSnapChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`FACE_SNAPSHOT,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onBlockDetectChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`BLOCK_DETECT,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onCryTimeChange(e: WechatMiniprogram.PickerChange) { const endTime = e.detail.value; const originalTime = this.data.deviceStatus.CRYDET_TIME || '00:00-24:00'; const startTime = originalTime.split('-')[0]; this._sendCommand(`SET_CRYDET_TIME,${startTime},${endTime}`).then(this.handleCommandResponse); },
  onResolutionTap() { const itemList = ['超高清 (1080P)', '高清 (720P)', '标清 (360P)']; const values = ['1080', '720', '360']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`CHANGE_RESOLUTION,${values[res.tapIndex]}`).then(this.handleCommandResponse) }); },
  onImageFlipChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`UISPC,4,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onImageMirrorChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`UISPC,3,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onBrightnessChange(e: WechatMiniprogram.SliderChange) { this._sendCommand(`UISPC,0,${e.detail.value}`).then(this.handleCommandResponse); },
  onContrastChange(e: WechatMiniprogram.SliderChange) { this._sendCommand(`UISPC,1,${e.detail.value}`).then(this.handleCommandResponse); },
  onSaturationChange(e: WechatMiniprogram.SliderChange) { this._sendCommand(`UISPC,2,${e.detail.value}`).then(this.handleCommandResponse); },
  onEncodingChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SET_ENCODE_H265,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onForceRgbChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`FORCE_RGB,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onAiBoxChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`DISABLE_AIBOX,${e.detail.value ? '0' : '1'}`).then(this.handleCommandResponse); },

  // ================== 核心修复：修正LOGO指令发送逻辑 ==================
  onLogoChange(e: WechatMiniprogram.SwitchChange) {
    // 指令是反的: 1 -> 关闭, 0 -> 开启
    const commandValue = e.detail.value ? '0' : '1';
    this._sendCommand(`DISABLE_LOGO_DISP,${commandValue}`).then(this.handleCommandResponse);
  },
  // =============================================================

  onNightLightChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`NIGHT_LAMP,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onWorkTimeChange(e: WechatMiniprogram.PickerChange) { const { type } = e.currentTarget.dataset; const value = e.detail.value; const { CAM_WORK_TIME_START, CAM_WORK_TIME_END } = this.data.deviceStatus; const start = type === 'start' ? value : CAM_WORK_TIME_START; const end = type === 'end' ? value : CAM_WORK_TIME_END; this._sendCommand(`CAM_WORK_TIME,${start},${end}`).then(this.handleCommandResponse); },
  onRebootTap() { wx.showModal({ title: '确认重启', content: '您确定要重启设备吗？', success: res => { if (res.confirm) this._sendCommand('REBOOT_DEVICE').then(() => wx.showToast({ title: '重启指令已发送', icon: 'none' })); } }); },
  onUpgradeTap() { const { FIRMWARE, VER } = this.data.deviceStatus; if (FIRMWARE !== '1') { wx.showToast({ title: '已是最新版本', icon: 'none' }); return; } const newVersion = VER.split('/')[1]; wx.showModal({ title: '固件升级', content: `检测到新版本 ${newVersion}，是否立即升级？`, success: res => { if (res.confirm) this._sendCommand(`UPGRADE_FIRMWARE,${newVersion}`).then(() => wx.showToast({ title: '升级指令已发送', icon: 'none' })); } }); },
  onSleepModeChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SET_SLEEP_MODE,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onSysAudioChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SYS_AUDIO,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onRecordTimeTap() { const itemList = ['15秒', '30秒', '60秒']; const values = ['15', '30', '60']; wx.showActionSheet({ itemList, success: res => this._sendCommand(`SET_RECORD_TIMES,${values[res.tapIndex]}`).then(this.handleCommandResponse) }); },
  onTempUnitChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`SET_TEMPERATURE_UNIT,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onMusicAppeasingChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`MUSIC_APPEASING,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  onBreathingLedChange(e: WechatMiniprogram.SwitchChange) { this._sendCommand(`BREATHING_LED,${e.detail.value ? '1' : '0'}`).then(this.handleCommandResponse); },
  handleCommandResponse(res: any) { if (res.type === 'success' && res.data) { const status = JSON.parse(res.data); this._updateDeviceStatus(status); } else { wx.showToast({ title: '操作失败', icon: 'error' }); } },
  toggleMusicPanel() { this.setData({ showMusicPanel: !this.data.showMusicPanel }); if (this.data.showMusicPanel) { this.getDeviceStatusAndMusicList(); } },
  async getDeviceStatusAndMusicList() { if (!this.data.isPlaySuccess) return; try { const res = await this._sendCommand('CHECK_ONLINE'); if (res.type === 'success' && res.data) { const status = JSON.parse(res.data); const musicArray = []; for (let i = 0; i < 10; i++) { if (status[`Music${i}`]) musicArray.push(status[`Music${i}`]); else break; } this.setData({ musicList: musicArray }); this._updateDeviceStatus(status); } } catch (err) { console.error('获取设备状态失败:', err); } },
  onMusicListItemTap(e: WechatMiniprogram.TouchEvent) { this.controlMusic('play', e.currentTarget.dataset.song); },
  toggleMusicPlay() { if (!this.data.currentSong) return; this.controlMusic(this.data.musicState === 1 ? 'pause' : 'play', this.data.currentSong); },
  async controlMusic(action: 'play' | 'pause', songName: string) { try { const res = await this._sendCommand(`SET_LULLABY_PLAY,${action},${songName}`); this.handleCommandResponse(res); } catch (err) { console.error(`音乐操作 ${action} 失败:`, err); } },
  toggleMute() { this.setData({ isMuted: !this.data.isMuted }); },
  takeSnapshot() { if (!this.data.isPlaySuccess) return; this.userData.player?.snapshotAndSave(); },
  toggleRecording() { if (!this.data.isPlaySuccess) return; this.data.isRecording ? this.userData.player?.stopRecordFlv() : this.userData.player?.startRecordFlv(recordFlvOptions); },
  toggleVoice() { if (!this.data.isPlaySuccess) return; this.data.voiceState === 'VoiceIdle' ? this.userData.voiceComponent?.startVoice() : this.userData.voiceComponent?.stopVoice(); },
  controlPTZ(e: WechatMiniprogram.TouchEvent) { const ptzAction = e.currentTarget.dataset.cmd as string; const directionMap: { [key: string]: string } = { 'ptz_up_press': 'UP', 'ptz_down_press': 'DOWN', 'ptz_left_press': 'LEFT', 'ptz_right_press': 'RIGHT' }; const direction = directionMap[ptzAction]; if (!direction || !this.userData.deviceId) return; this.setData({ ptzCmd: ptzAction }); this._sendCommand(`UYTKZ,${direction},1`).catch((err: any) => console.error(`PTZ指令 ${direction} 失败:`, err)); },
  releasePTZBtn() { this.setData({ ptzCmd: '' }); },
  onInputCommand(e: WechatMiniprogram.Input) { this.setData({ inputCommand: e.detail.value }); },
  sendCommand() { if (!this.data.inputCommand || !this.userData.deviceId) return; this._sendCommand(this.data.inputCommand).then((res: any) => { let content = '类型：' + res.type; if (res.data) { try { content += '\n内容：' + JSON.stringify(JSON.parse(res.data), null, 2); } catch { content += '\n内容：' + res.data; } } wx.showModal({ title: '信令成功', content: content, showCancel: false }); }).catch((err: any) => wx.showModal({ title: '信令失败', content: err.errMsg, showCancel: false })); },
});
```

### 文件路径: `src\pages\camera\camera.wxml`

```wxml
<view class="flex flex-col h-screen bg-gray-100">
  <!-- 视频播放区域 -->
  <view class="w-full bg-black" style="height: 56.25vw;">
    <block wx:if="{{deviceInfo}}">
      <p2p-live-player
        wx:for="{{useChannelIds}}"
        wx:key="index"
        data-channel="{{item}}"
        id="p2p-live-player-{{item}}"
        compClass="w-full h-full"
        deviceInfo="{{deviceInfo}}"
        xp2pInfo="{{xp2pInfo}}"
        needCheckStream="{{options.needCheckStream}}"
        sceneType="live"
        streamChannel="{{item}}"
        streamQuality="{{options.liveQuality}}"
        mode="{{options.playerRTC ? 'RTC' : 'live'}}"
        muted="{{isMuted}}"
        showLog="{{options.playerLog}}"
        onlyp2pMap="{{onlyp2pMap}}"
        bind:playstatechagne="onPlayStateChange"
        bind:recordstatechange="onRecordStateChange"
        bind:recordfilestatechange="onRecordFileStateChange"
        bind:recordtap="toggleRecording"
        >
        <view class="text-white font-bold">
          CH-{{item}}
        </view>
      </p2p-live-player>
    </block>
    <view wx:else class="w-full h-full flex items-center justify-center text-white bg-black">
      正在加载设备信息...
    </view>
  </view>

  <!-- 对讲组件 (隐藏在后台工作) -->
  <iot-p2p-voice
    wx:if="{{deviceInfo}}"
    id="iot-p2p-voice"
    deviceInfo="{{deviceInfo}}"
    voiceType="{{options.voiceType}}"
    showLog="{{options.playerLog}}"
    bind:voicestatechange="onVoiceStateChange"
    bind:voiceerror="onVoiceError"
  />

  <!-- 控制面板区域 -->
  <scroll-view scroll-y class="flex-1 p-4 space-y-4 text-sm">
    <!-- 基本操作面板 -->
    <view class="p-4 bg-white rounded-lg shadow">
      <view class="text-lg font-semibold mb-3">基本操作</view>
      <view class="grid grid-cols-2 gap-4">
        <button class="bg-blue-500 text-white py-2 rounded" bind:tap="toggleMute">{{isMuted ? '取消静音' : '静音'}}</button>
        <button class="bg-green-500 text-white py-2 rounded disabled:opacity-50" bind:tap="takeSnapshot" disabled="{{!isPlaySuccess}}">拍照</button>
        <button class="text-white py-2 rounded disabled:opacity-50 {{isRecording ? 'bg-red-500' : 'bg-orange-500'}}" bind:tap="toggleRecording" disabled="{{!isPlaySuccess}}">{{isRecording ? '停止录像' : '开始录像'}}</button>
        <button class="text-white py-2 rounded disabled:opacity-50 {{voiceState === 'VoiceSending' ? 'bg-red-500' : 'bg-purple-500'}}" bind:tap="toggleVoice" disabled="{{!isPlaySuccess}}">{{voiceState === 'VoiceSending' ? '挂断对讲' : '按住对讲'}}</button>
        <button class="bg-pink-500 text-white py-2 rounded col-span-2" bind:tap="toggleMusicPanel">{{showMusicPanel ? '收起音乐面板' : '音乐安抚'}}</button>
      </view>
    </view>

    <!-- 音乐播放器面板 -->
    <view wx:if="{{showMusicPanel}}" class="p-4 bg-white rounded-lg shadow space-y-3">
      <view class="text-lg font-semibold">摇篮曲列表</view>
      <view class="max-h-32 overflow-y-auto border rounded-md">
        <block wx:if="{{musicList.length > 0}}">
          <view wx:for="{{musicList}}" wx:key="*this" class="p-2 border-b last:border-b-0 {{item === currentSong ? 'bg-blue-100 text-blue-600 font-semibold' : ''}}" data-song="{{item}}" bind:tap="onMusicListItemTap">{{item}}</view>
        </block>
        <view wx:else class="p-4 text-center text-gray-400">无音乐列表, 请尝试刷新</view>
      </view>
      <view class="flex items-center space-x-4">
        <button class="w-16 h-10 flex items-center justify-center rounded {{musicState === 1 ? 'bg-yellow-500' : 'bg-green-500'}} text-white disabled:opacity-50" bind:tap="toggleMusicPlay" disabled="{{!currentSong}}">{{musicState === 1 ? '暂停' : '播放'}}</button>
        <view class="flex-1 flex flex-col">
          <text class="text-sm truncate">{{currentSong || '请选择歌曲'}}</text>
          <view class="flex items-center space-x-2">
            <text class="text-xs text-gray-500">音量</text>
            <slider class="flex-1" value="{{volume}}" min="0" max="100" bindchange="onVolumeChange" step="1" />
          </view>
        </view>
      </view>
      <view class="flex items-center justify-between"><text>音乐安抚总开关</text><switch checked="{{deviceStatus.MUSIC_APPEASING}}" bindchange="onMusicAppeasingChange" /></view>
      <view class="flex items-center justify-between"><text>音乐呼吸灯</text><switch checked="{{deviceStatus.BREATHING_LED}}" bindchange="onBreathingLedChange" /></view>
    </view>

    <!-- 智能检测设置 -->
    <view class="p-4 bg-white rounded-lg shadow space-y-3">
      <view class="text-lg font-semibold">智能检测设置</view>
      <view class="flex items-center justify-between"><text>啼哭自动安抚</text><switch checked="{{deviceStatus.BABY_CRY_APPEASE}}" bindchange="onCryAppeaseChange" /></view>
      <view class="flex items-center justify-between" bind:tap="onCrySenseTap"><text>啼哭灵敏度</text><text class="text-blue-500">{{['低', '中', '高'][deviceStatus.CRY_DETECT_SENSE] || '中'}}</text></view>
      <view class="flex items-center justify-between">
        <text>哭声检测时间段</text>
        <picker mode="time" value="{{cryTimeEnd}}" bindchange="onCryTimeChange">
            <view class="text-blue-500">{{deviceStatus.CRYDET_TIME}}</view>
        </picker>
      </view>
      <view class="flex items-center justify-between"><text>行人追踪</text><switch checked="{{deviceStatus.PTZ_TRACK}}" bindchange="onTrackingChange" /></view>
      <view class="flex items-center justify-between"><text>虚拟围栏提醒</text><switch checked="{{deviceStatus.DEFENCE_NOTIFY}}" bindchange="onFenceChange" /></view>
      <view class="flex items-center justify-between"><text>显示围栏</text><switch checked="{{deviceStatus.FENCE_DISPLAY}}" bindchange="onFenceDisplayChange" /></view>
      <view class="flex items-center justify-between"><text>显示危险区域</text><switch checked="{{deviceStatus.DANGER_DISPLAY}}" bindchange="onDangerDisplayChange" /></view>
      <view class="flex items-center justify-between" bind:tap="onFenceSenseTap"><text>围栏灵敏度</text><text class="text-blue-500">{{['', '低', '中', '高'][deviceStatus.FENCEDET_SENSE] || '中'}}</text></view>
      <view class="flex items-center justify-between"><text>睡眠监测</text><switch checked="{{deviceStatus.SLEEP_TRACKING}}" bindchange="onSleepTrackingChange" /></view>
      <view class="flex items-center justify-between" bind:tap="onSleepSenseTap"><text>睡眠灵敏度</text><text class="text-blue-500">{{['', '低', '中', '高'][deviceStatus.SLEEP_TRACK_SENSE] || '中'}}</text></view>
      <view class="flex items-center justify-between"><text>面部抓拍</text><switch checked="{{deviceStatus.FACE_SNAPSHOT}}" bindchange="onFaceSnapChange" /></view>
      <view class="flex items-center justify-between"><text>遮挡检测</text><switch checked="{{deviceStatus.BLOCK_DETECT}}" bindchange="onBlockDetectChange" /></view>
    </view>

    <!-- 图像与视频设置 -->
    <view class="p-4 bg-white rounded-lg shadow space-y-3">
      <view class="text-lg font-semibold">图像与视频</view>
      <view class="flex items-center justify-between" bind:tap="onResolutionTap"><text>分辨率</text><text class="text-blue-500">{{deviceStatus.RES}}P</text></view>
       <view class="flex items-center justify-between"><text>H.265编码</text><switch checked="{{deviceStatus.SET_ENCODE_H265}}" bindchange="onEncodingChange" /></view>
      <view class="flex items-center justify-between"><text>垂直翻转</text><switch checked="{{deviceStatus.FV}}" bindchange="onImageFlipChange" /></view>
      <view class="flex items-center justify-between"><text>水平镜像</text><switch checked="{{deviceStatus.FH}}" bindchange="onImageMirrorChange" /></view>
      <view class="flex items-center justify-between"><text>强制夜间彩色</text><switch checked="{{deviceStatus.FORCE_RGB}}" bindchange="onForceRgbChange" /></view>
      <view class="flex items-center justify-between"><text>显示AI检测框</text><switch checked="{{deviceStatus.AIBOX}}" bindchange="onAiBoxChange" /></view>
      <view class="flex items-center justify-between"><text>显示LOGO水印</text><switch checked="{{deviceStatus.LOGO}}" bindchange="onLogoChange" /></view>
      <view class="flex items-center justify-between"><text>亮度 ({{deviceStatus.LUMI}})</text><slider class="w-40" value="{{deviceStatus.LUMI}}" min="0" max="100" bindchange="onBrightnessChange" step="1" /></view>
      <view class="flex items-center justify-between"><text>对比度 ({{deviceStatus.CONT}})</text><slider class="w-40" value="{{deviceStatus.CONT}}" min="0" max="100" bindchange="onContrastChange" step="1" /></view>
      <view class="flex items-center justify-between"><text>饱和度 ({{deviceStatus.SATU}})</text><slider class="w-40" value="{{deviceStatus.SATU}}" min="0" max="100" bindchange="onSaturationChange" step="1" /></view>
    </view>

    <!-- 设备管理 -->
    <view class="p-4 bg-white rounded-lg shadow space-y-3">
      <view class="text-lg font-semibold">设备管理</view>
      <view class="flex items-center justify-between"><text>休眠模式</text><switch checked="{{deviceStatus.YSGN}}" bindchange="onSleepModeChange" /></view>
      <view class="flex items-center justify-between"><text>夜灯</text><switch checked="{{deviceStatus.NIGHT_LAMP}}" bindchange="onNightLightChange" /></view>
      <view class="flex items-center justify-between"><text>系统提示音</text><switch checked="{{deviceStatus.AUDIO}}" bindchange="onSysAudioChange" /></view>
      <view class="flex items-center justify-between" bind:tap="onRecordTimeTap"><text>事件录像时长</text><text class="text-blue-500">{{deviceStatus.RECORDTIME}}秒</text></view>
      <view class="flex items-center justify-between"><text>温度单位 ({{deviceStatus.TEMPERATURE_UNIT === '0' ? '摄氏度' : '华氏度'}})</text><switch checked="{{deviceStatus.TEMPERATURE_UNIT === '1'}}" bindchange="onTempUnitChange" /></view>
      <view class="flex items-center justify-between"><text>工作开始时间</text><picker mode="time" value="{{deviceStatus.CAM_WORK_TIME_START}}" bindchange="onWorkTimeChange" data-type="start"><view class="text-blue-500">{{deviceStatus.CAM_WORK_TIME_START}}</view></picker></view>
      <view class="flex items-center justify-between"><text>工作结束时间</text><picker mode="time" value="{{deviceStatus.CAM_WORK_TIME_END}}" bindchange="onWorkTimeChange" data-type="end"><view class="text-blue-500">{{deviceStatus.CAM_WORK_TIME_END}}</view></picker></view>
      <view class="grid grid-cols-2 gap-4 pt-2">
        <button class="bg-gray-200 py-2 rounded" bind:tap="onRebootTap">重启设备</button>
        <button class="py-2 rounded {{deviceStatus.FIRMWARE === '1' ? 'bg-red-500 text-white' : 'bg-gray-200'}}" bind:tap="onUpgradeTap" disabled="{{deviceStatus.FIRMWARE !== '1'}}">{{deviceStatus.FIRMWARE === '1' ? '固件升级' : '已是最新'}}</button>
      </view>
    </view>

    <!-- PTZ 控制 -->
    <view wx:if="{{options.supportPTZ}}" class="p-4 bg-white rounded-lg shadow">
      <view class="text-lg font-semibold mb-2">云台控制 (PTZ)</view>
      <view class="ptz-panel mx-auto">
        <view class="ptz-controls">
          <view class="ptz-controls-top">
            <view class="ptz-position">
              <view class="ptz-dir ptz-up"><view class="ptz-btn" data-cmd="ptz_up_press" bind:touchstart="controlPTZ" bind:touchend="releasePTZBtn"><view class="ptz-icon arrow-up {{ptzCmd === 'ptz_up_press' ? 'press' : ''}}"></view></view></view>
              <view class="ptz-dir ptz-left"><view class="ptz-btn" data-cmd="ptz_left_press" bind:touchstart="controlPTZ" bind:touchend="releasePTZBtn"><view class="ptz-icon arrow-left {{ptzCmd === 'ptz_left_press' ? 'press' : ''}}"></view></view></view>
              <view class="ptz-dir ptz-right"><view class="ptz-btn" data-cmd="ptz_right_press" bind:touchstart="controlPTZ" bind:touchend="releasePTZBtn"><view class="ptz-icon arrow-right {{ptzCmd === 'ptz_right_press' ? 'press' : ''}}"></view></view></view>
              <view class="ptz-dir ptz-down"><view class="ptz-btn" data-cmd="ptz_down_press" bind:touchstart="controlPTZ" bind:touchend="releasePTZBtn"><view class="ptz-icon arrow-down {{ptzCmd === 'ptz_down_press' ? 'press' : ''}}"></view></view></view>
              <view class="ptz-cricle"></view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 自定义信令 -->
    <view wx:if="{{options.supportCustomCommand}}" class="p-4 bg-white rounded-lg shadow">
      <view class="text-lg font-semibold mb-2">自定义信令</view>
      <input class="w-full p-2 border border-gray-300 rounded mb-2" type="text" value="{{inputCommand}}" placeholder="请输入指令名,参数1,参数2..." bindinput="onInputCommand" />
      <button class="w-full bg-gray-500 text-white py-2 rounded" bind:tap="sendCommand" disabled="{{!inputCommand}}">发送信令</button>
    </view>
  </scroll-view>
</view>
```

### 文件路径: `src\pages\camera\setting\index\index.json`

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "基础设置",
  "navigationBarBackgroundColor": "#fff",
  "navigationBarTextStyle": "black"
}
```

### 文件路径: `src\pages\camera\setting\index\index.scss`

```scss
page {
  --td-cell-description-font-size:12px;
}
.t-radio-group .t-radio {
  justify-content: space-between;
  font-size: 14px;
  margin-right: 8px;
  background-color: var(--td-bg-color-container, #fff);
}
```

### 文件路径: `src\pages\camera\setting\index\index.ts`

```ts
import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';

Page({
  data: {
    deviceId: '',
    xp2pInfo: '', // 新增，用于存储 xp2pInfo
    recordTime: '15',
    showAiBox: true,
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-index-page-${Date.now()}`,
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) { // 增加 xp2pInfo
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo
      });
      console.log('【设置首页】已接收到设备ID:', options.deviceId);
      console.log('【设置首页】已接收到xp2pInfo:', decodedXp2pInfo);

      this.userData.xp2pManager = getXp2pManager();

      try {
        wx.showLoading({ title: '连接设备中...' });

        // 1. 启动P2P服务
        await this.userData.xp2pManager.startP2PService({
          p2pMode: 'ipc',
          deviceInfo: {
            deviceId: options.deviceId,
            productId: options.deviceId.split('/')[0],
            deviceName: options.deviceId.split('/')[1],
            isMjpgDevice: false,
          },
          xp2pInfo: decodedXp2pInfo, // 使用传递过来的 xp2pInfo
          caller: this.userData.pageId,
        });
        console.log('【设置首页】P2P服务启动成功。');

        // 2. 将设备注册到全局服务
        cameraService.setActiveDevice(options.deviceId);
        console.log('【设置首页】已在 CameraService 中将此设备设置为活动设备。');

        // 3. P2P连接成功后，获取设备状态
        await this.fetchDeviceStatus();

      } catch (error: any) {
        console.error('【设置首页】P2P服务启动失败:', error);
        wx.showModal({
          title: '连接失败',
          content: `无法连接到设备(${error.errMsg || '未知错误'})`,
          showCancel: false,
          success: () => wx.navigateBack(),
        });
      } finally {
        wx.hideLoading();
      }

    } else {
      console.error('【设置首页】缺少 deviceId 或 xp2pInfo 参数');
      wx.showToast({
        title: '设备信息缺失',
        icon: 'error',
        duration: 2000,
        complete: () => {
          wx.navigateBack();
        }
      });
    }
  },

  onUnload() {
    if (this.data.deviceId && this.userData.xp2pManager) {
      console.log('【设置首页】页面卸载，停止P2P服务:', this.data.deviceId);
      // 注意：这里需要根据业务决定是否清除service。如果子页面还需要通信，就不应该在这里清除。
      // 但为了页面的独立性，最好是每个页面都管理自己的连接。
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
      // 如果 setting/index 是所有设置页的父级，可以不清，由它统一管理。
      // 为简单起见，这里假设每个页面独立管理。
    }
  },

  async fetchDeviceStatus() {
    console.log('【设置首页】正在获取设备初始状态...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【设置首页】获取到设备状态:', status);
        this.setData({
          recordTime: status.RECORDTIME || '15',
          showAiBox: status.AIBOX === '0',
        });
      }
    } catch (error) {
      console.error('【设置首页】获取设备状态失败:', error);
      wx.showToast({ title: '获取设备状态失败', icon: 'none' });
    }
  },

  onRecordTimeChange(e: WechatMiniprogram.TouchEvent) {
    const newTime = e.detail.value;
    console.log('【设置首页】录像时长变更为:', newTime);
    this.setData({ recordTime: newTime });
    cameraService.sendCommand(`SET_RECORD_TIMES,${newTime}`)
      .then(() => wx.showToast({ title: '设置成功', icon: 'success' }))
      .catch(err => {
        console.error('【设置首页】设置录像时长失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
      });
  },

  onAiBoxChange(e: WechatMiniprogram.TouchEvent) {
    const isShow = e.detail.value;
    const commandValue = isShow ? '0' : '1';
    console.log(`【设置首页】AI检测框开关切换为: ${isShow}, 发送指令值: ${commandValue}`);
    this.setData({ showAiBox: isShow });
    cameraService.sendCommand(`DISABLE_AIBOX,${commandValue}`)
      .then(() => wx.showToast({ title: '设置成功', icon: 'success' }))
      .catch(err => {
        console.error('【设置首页】设置AI检测框失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
        this.setData({ showAiBox: !isShow });
      });
  },

  onRebootTap() {
    wx.showModal({
      title: '确认重启',
      content: '您确定要重启摄像机吗？此操作将导致设备短暂离线。',
      confirmColor: '#BDA01E',
      success: (res) => {
        if (res.confirm) {
          console.log('【设置首页】用户确认重启，发送重启指令...');
          wx.showLoading({ title: '正在发送指令...' });
          cameraService.sendCommand('REBOOT_DEVICE')
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '重启指令已发送', icon: 'success' });
            })
            .catch(err => {
              wx.hideLoading();
              console.error('【设置首页】发送重启指令失败:', err);
              wx.showToast({ title: '操作失败', icon: 'error' });
            });
        }
      }
    });
  },

  navigateToSetting(e: WechatMiniprogram.BaseEvent) {
    const pageUrl = e.currentTarget.dataset.url;
    if (!pageUrl) return;
    if (!this.data.deviceId) {
      wx.showToast({ title: '设备信息丢失，无法跳转', icon: 'none' });
      return;
    }
    // 【修改】继续向下传递关键信息
    const fullUrl = `${pageUrl}?deviceId=${this.data.deviceId}&xp2pInfo=${encodeURIComponent(this.data.xp2pInfo)}`;
    wx.navigateTo({ url: fullUrl });
  }
});
```

### 文件路径: `src\pages\camera\setting\index\index.wxml`

```wxml
<view class="py-4 flex flex-col">
  <text class="text-sm ml-4 text-gray-400">基本设置</text>
  <view class="mt-2">

      <t-cell title="摄像机名称" hover arrow note="海马爸比二代plus" bind:click="navigateToSetting" data-url="/pages/camera/setting/name/name" />
      <t-cell title="摄像机设置" hover arrow bind:click="navigateToSetting" data-url="/pages/camera/setting/list/list" />
      <t-cell title="回看" hover arrow bind:click="navigateToSetting" data-url="/pages/camera/setting/review/review" />
      <t-cell title="设备共享" hover arrow bind:click="navigateToSetting" data-url="/pages/camera/setting/share/share" />
      <t-cell title="摄像机信息" hover arrow bind:click="navigateToSetting" data-url="/pages/camera/setting/info/info" />


      <t-cell title="消息录像时长" hover>
        <t-radio-group value="{{recordTime}}" borderless t-class="t-radio-box" slot="note" bind:change="onRecordTimeChange">
          <t-radio block="{{false}}" label="15s" value="15" />
          <t-radio block="{{false}}" label="30s" value="30" />
          <t-radio block="{{false}}" label="60s" value="60" />
        </t-radio-group>
      </t-cell>

      <t-cell title="生活瞬间" hover arrow description="智能生成每日精彩图库和时光相册" bind:click="navigateToSetting" data-url="/pages/camera/setting/lifesnap/lifesnap" />


      <t-cell title="显示AI检测框" description="开启后，画面中显示人脸/移动检测的识别框">
        <t-switch value="{{showAiBox}}" size="small" slot="note" bind:change="onAiBoxChange" />
      </t-cell>

      <t-cell title="啼哭安抚" hover arrow description="检测到宝宝啼哭时，将记录视频并提醒" bind:click="navigateToSetting" data-url="/pages/camera/setting/soothe/soothe" />

  </view>

  <text class="text-sm ml-4 text-gray-400 mt-4">系统设置</text>
  <view class="mt-2">

      <t-cell title="固件更新" hover arrow />
      <t-cell title="SD卡" hover arrow note="正常" />
      <t-cell title="重置WIFI" hover arrow />

      <t-cell title="重启摄像机" hover arrow bind:click="onRebootTap" />
      <t-cell title="使用说明" hover arrow />

  </view>
</view>
```

### 文件路径: `src\pages\camera\setting\info\info.json`

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "摄像机信息",
  "navigationBarBackgroundColor": "#fff",
  "navigationBarTextStyle": "black"
}
```

### 文件路径: `src\pages\camera\setting\info\info.scss`

```scss
page {
  --td-cell-note-font-size:14px;
  --td-cell-title-font-size:14px;
}
```

### 文件路径: `src\pages\camera\setting\info\info.ts`

```ts
import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';

Page({
  data: {
    deviceId: '',
    xp2pInfo: '',
    deviceInfo: null as any, // 用于存储从设备获取的完整信息对象
    isLoading: true, // 控制加载状态的显示
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-info-page-${Date.now()}`,
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) {
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo
      });
      console.log('【摄像机信息页】已接收到设备ID:', options.deviceId);

      this.userData.xp2pManager = getXp2pManager();

      try {
        // 启动 P2P 服务，这是发送信令的前提
        await this.userData.xp2pManager.startP2PService({
          p2pMode: 'ipc',
          deviceInfo: {
            deviceId: options.deviceId,
            productId: options.deviceId.split('/')[0],
            deviceName: options.deviceId.split('/')[1],
            isMjpgDevice: false,
          },
          xp2pInfo: decodedXp2pInfo,
          caller: this.userData.pageId,
        });

        console.log('【摄像机信息页】P2P服务启动成功。');
        cameraService.setActiveDevice(options.deviceId); // 注册到全局服务

        // P2P连接成功后，获取设备信息
        await this.fetchDeviceInfo();

      } catch (error: any) {
        console.error('【摄像机信息页】P2P服务启动失败:', error);
        this.setData({ isLoading: false }); // 停止加载状态
        wx.showModal({
          title: '连接失败',
          content: `无法连接到设备(${error.errMsg || '未知错误'})`,
          showCancel: false,
          success: () => wx.navigateBack(),
        });
      }

    } else {
      console.error('【摄像机信息页】缺少 deviceId 或 xp2pInfo 参数');
      this.setData({ isLoading: false });
      wx.navigateBack();
    }
  },

  onUnload() {
    // 页面卸载时，清理P2P连接
    if (this.data.deviceId && this.userData.xp2pManager) {
      console.log('【摄像机信息页】页面卸载，停止P2P服务:', this.data.deviceId);
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
    }
  },

  /**
   * 发送 CHECK_ONLINE 指令获取设备详细信息
   */
  async fetchDeviceInfo() {
    this.setData({ isLoading: true });
    console.log('【摄像机信息页】正在发送 CHECK_ONLINE 指令获取设备信息...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【摄像机信息页】获取到设备信息:', status);
        this.setData({
          deviceInfo: status,
          isLoading: false
        });
      } else {
        // 处理信令返回但内容错误的情况
        throw new Error(res.errMsg || '设备返回数据格式错误');
      }
    } catch (error) {
      console.error('【摄像机信息页】获取设备信息失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({ title: '获取信息失败', icon: 'none' });
    }
  },
});
```

### 文件路径: `src\pages\camera\setting\info\info.wxml`

```wxml
<view>
  <block wx:if="{{isLoading}}">
    <view class="text-center text-gray-500 py-10">正在加载设备信息...</view>
  </block>

  <block wx:elif="{{deviceInfo}}">

      <t-cell title="摄像机型号" note="{{deviceInfo.CAMERA_MODEL || '-'}}" />
      <t-cell title="固件版本" note="{{deviceInfo.VER ? deviceInfo.VER.split('/')[0] : '-'}}" />
      <t-cell title="WIFI名称" note="{{deviceInfo.WIFI_SSID || '-'}}" />
      <t-cell title="信号强度" note="{{deviceInfo.WIFI_SIGNAL ? deviceInfo.WIFI_SIGNAL : '-'}}" />
      <t-cell title="IP地址" note="{{deviceInfo.IP_ADDR || '-'}}" />
      <t-cell title="MAC地址" note="{{deviceInfo.MAC_ADDR || '-'}}" />
      <t-cell title="设备ID (ChipID)" note="{{deviceInfo.DEVID || '-'}}" />

  </block>

  <block wx:else>
    <view class="text-center text-red-500 py-10">加载设备信息失败，请返回重试。</view>
  </block>
</view>
```

### 文件路径: `src\pages\camera\setting\list\list.json`

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "摄像机设置",
  "navigationBarBackgroundColor": "#fff",
  "navigationBarTextStyle": "black"
}
```

### 文件路径: `src\pages\camera\setting\list\list.scss`

```scss

```

### 文件路径: `src\pages\camera\setting\list\list.ts`

```ts
import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';

Page({
  data: {
    deviceId: '',
    xp2pInfo: '',
    // --- UI的状态 ---
    volume: 80, // 设备音量
    sysAudioOn: true, // 系统提示音开关
    indicatorLightOn: true, // 工作指示灯开关
    isVolumePopupVisible: false, // 控制音量弹出层的显示
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-list-page-${Date.now()}`,
    // 用于滑块节流，避免频繁发送指令
    volumeChangeTimer: null as any,
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) {
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo
      });
      console.log('【摄像机设置页】已接收到设备ID:', options.deviceId);

      this.userData.xp2pManager = getXp2pManager();

      try {
        wx.showLoading({ title: '连接设备中...' });

        await this.userData.xp2pManager.startP2PService({
          p2pMode: 'ipc',
          deviceInfo: {
            deviceId: options.deviceId,
            productId: options.deviceId.split('/')[0],
            deviceName: options.deviceId.split('/')[1],
            isMjpgDevice: false,
          },
          xp2pInfo: decodedXp2pInfo,
          caller: this.userData.pageId,
        });

        console.log('【摄像机设置页】P2P服务启动成功。');
        cameraService.setActiveDevice(options.deviceId);

        await this.fetchDeviceStatus();

      } catch (error: any) {
        console.error('【摄像机设置页】P2P服务启动失败:', error);
        wx.showModal({
          title: '连接失败',
          content: `无法连接到设备(${error.errMsg || '未知错误'})`,
          showCancel: false,
          success: () => wx.navigateBack(),
        });
      } finally {
        wx.hideLoading();
      }

    } else {
      console.error('【摄像机设置页】缺少 deviceId 或 xp2pInfo 参数');
      wx.navigateBack();
    }
  },

  onUnload() {
    if (this.data.deviceId && this.userData.xp2pManager) {
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
    }
  },

  async fetchDeviceStatus() {
    console.log('【摄像机设置页】正在获取设备状态...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【摄像机设置页】获取到设备状态:', status);
        this.setData({
          volume: parseInt(status.Volume, 10) || 80,
          sysAudioOn: status.AUDIO === '1',
          indicatorLightOn: status.LED === '1'
        });
      }
    } catch (error) {
      console.error('【摄像机设置页】获取设备状态失败:', error);
      wx.showToast({ title: '获取设备状态失败', icon: 'none' });
    }
  },

  // --- 事件处理函数 ---

  /**
   * 跳转到其他设置页
   */
  navigateToSetting(e: WechatMiniprogram.BaseEvent) {
    const pageUrl = e.currentTarget.dataset.url;
    const { deviceId, xp2pInfo } = this.data;
    if (!pageUrl || !deviceId) return;

    const fullUrl = `${pageUrl}?deviceId=${deviceId}&xp2pInfo=${encodeURIComponent(xp2pInfo)}`;
    wx.navigateTo({ url: fullUrl });
  },

  /**
   * 显示音量调节弹窗
   */
  showVolumePopup() {
    this.setData({ isVolumePopupVisible: true });
  },

  /**
   * 隐藏音量调节弹窗
   */
  hideVolumePopup() {
    this.setData({ isVolumePopupVisible: false });
  },

  /**
   * 滑块滑动时触发，更新UI并使用节流发送指令
   */
  onVolumeChange(e: WechatMiniprogram.TouchEvent) {
    const newVolume = e.detail.value;
    // 实时更新UI
    this.setData({ volume: newVolume });

    // 清除上一个定时器
    if (this.userData.volumeChangeTimer) {
      clearTimeout(this.userData.volumeChangeTimer);
    }

    // 设置一个节流定时器，200毫秒后发送指令
    this.userData.volumeChangeTimer = setTimeout(() => {
      console.log(`【摄像机设置页】发送音量指令: ${newVolume}`);
      cameraService.sendCommand(`SET_SPEAKER_VOLUME,${newVolume}`)
        .catch(err => {
          console.error('【摄像机设置页】设置音量失败:', err);
          wx.showToast({ title: '音量设置失败', icon: 'error' });
        });
    }, 200);
  },

  /**
   * 系统提示音开关
   */
  onSysAudioChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    const commandValue = value ? '1' : '0';
    console.log(`【摄像机设置页】系统提示音开关切换为: ${value}, 发送指令值: ${commandValue}`);

    this.setData({ sysAudioOn: value });

    cameraService.sendCommand(`SYS_AUDIO,${commandValue}`)
      .then(() => wx.showToast({ title: '设置成功', icon: 'success' }))
      .catch(err => {
        console.error('【摄像机设置页】设置系统提示音失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
        this.setData({ sysAudioOn: !value }); // 失败回滚
      });
  },

  /**
   * 摄像机工作指示灯开关
   */
  onIndicatorLightChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    const commandValue = value ? '1' : '0';
    console.log(`【摄像机设置页】工作指示灯开关切换为: ${value}, 发送指令值: ${commandValue}`);

    this.setData({ indicatorLightOn: value });

    // 文档中没有直接控制指示灯的指令，这里假设指令为 "LED"
    // 如果指令不同，请修改此处
    cameraService.sendCommand(`LED,${commandValue}`)
      .then(() => wx.showToast({ title: '设置成功', icon: 'success' }))
      .catch(err => {
        console.error('【摄像机设置页】设置指示灯失败:', err);
        wx.showToast({ title: '设置失败', icon: 'error' });
        this.setData({ indicatorLightOn: !value }); // 失败回滚
      });
  },
});
```

### 文件路径: `src\pages\camera\setting\list\list.wxml`

```wxml
<view>
    <t-cell title="画面设置" hover arrow bind:click="navigateToSetting" data-url="/pages/camera/setting/view/view" />
    <t-cell title="设备音量" hover arrow note="{{volume}}%" bind:click="showVolumePopup" />
    <t-cell title="系统提示音" hover>
      <t-switch value="{{sysAudioOn}}" size="small" slot="note" bind:change="onSysAudioChange" />
    </t-cell>
    <t-cell title="摄像机工作指示灯" hover>
      <t-switch value="{{indicatorLightOn}}" size="small" slot="note" bind:change="onIndicatorLightChange" />
    </t-cell>
</view>

<!-- 底部音量调节弹出层 -->
<t-popup visible="{{isVolumePopupVisible}}" placement="bottom" bind:visible-change="hideVolumePopup">
  <view class="p-6 bg-white">
    <view class="text-center font-semibold mb-4">调节设备音量</view>
    <view class="flex items-center">
      <t-icon name="volume-down" size="48rpx" color="#999" />
      <t-slider
        class="flex-1 mx-4"
        value="{{volume}}"
        min="0"
        max="100"
        step="1"
        bind:change="onVolumeChange"
        aria-label="音量调节滑块"
      />
      <t-icon name="volume-up" size="48rpx" color="#333" />
    </view>
    <view class="text-center text-lg font-bold mt-2">{{volume}}%</view>
  </view>
</t-popup>
```

### 文件路径: `src\pages\camera\setting\name\name.json`

```json
{
  "usingComponents": {
    "p2p-live-player": "../../../../components/p2p-live-player/p2p-live-player",
    "iot-p2p-voice": "plugin://xp2p/iot-p2p-voice"
  },
  "navigationBarTitleText": "摄像机名称",
  "navigationBarBackgroundColor": "#fff",
  "navigationBarTextStyle": "black"
}
```

### 文件路径: `src\pages\camera\setting\name\name.scss`

```scss
.item-list text {
  @apply bg-gray-100 text-gray-700 text-center py-2 text-sm rounded
}
page {
  --td-input-bg-color:#f3f4f6;
  --td-input-placeholder-text-font-size:14px;

}
```

### 文件路径: `src\pages\camera\setting\name\name.ts`

```ts
Page({
  data: {

  },
  onLoad() {

  }
})
```

### 文件路径: `src\pages\camera\setting\name\name.wxml`

```wxml
<view class="main-width bg-white rounded mt-4 py-6 px-4 flex flex-col h-auto">
<text class="text-xs">摄像机名称</text>
<t-input placeholder="请输入文字" borderless class="mt-3" />
<text class="mt-6 text-xs">场景</text>
<view class="grid grid-cols-3 gap-4 mt-4 item-list">
<text>默认</text>
<text>客厅</text>
<text>卧室</text>
<text>厨房</text>
<text>阳台</text>
<text>餐厅</text>
<text>休闲室</text>
<text>门口</text>
</view>
<t-button theme="primary" size="large" block class="mt-10">保存</t-button>
</view>
```

### 文件路径: `src\pages\camera\setting\soothe\soothe.json`

```json
{
  "usingComponents": {},
  "navigationBarTitleText": "啼哭安抚",
  "navigationBarBackgroundColor": "#fff",
  "navigationBarTextStyle": "black"
}
```

### 文件路径: `src\pages\camera\setting\soothe\soothe.scss`

```scss

```

### 文件路径: `src\pages\camera\setting\soothe\soothe.ts`

```ts
import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';

// 【新增】辅助函数：生成0到n-1的数组，并格式化为两位数
const generateNumberArray = (n: number) => {
  return Array.from({ length: n }, (_, i) => ({
    label: i < 10 ? `0${i}` : `${i}`,
    value: i < 10 ? `0${i}` : `${i}`,
  }));
};

// 【新增】生成级联选择器所需的时间数据
const generateTimeOptions = () => {
  const hours = generateNumberArray(25); // 0-24
  const minutes = generateNumberArray(60); // 0-59

  // 为每个小时选项添加分钟作为子集
  hours.forEach(hour => {
    // 24点后面不需要分钟
    if (hour.value !== '24') {
        hour.children = minutes;
    }
  });

  // “全天”选项
  const allDayOption = { label: '全天', value: 'allday', children: [] };

  return [allDayOption, ...hours];
};

Page({
  data: {
    deviceId: '',
    xp2pInfo: '',
    deviceStatus: {
      BABY_CRY_APPEASE: false,
      MUSIC_APPEASING: false,
      CRYDET_TIME: '00:00-24:00',
      CRY_DETECT_SENSE: 1,
      CRY_APPEASE_SONG: 'auto',
      MUSIC_LIST: [] as string[],
    },
    senseMap: ['低', '中', '高'],

    // --- Cascader 相关数据 ---
    isTimePickerVisible: false,
    timeOptions: generateTimeOptions(),
    cascaderValue: null as any,
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-soothe-page-${Date.now()}`,
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) {
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo
      });
      console.log('【啼哭安抚页】已接收到设备ID:', options.deviceId);

      this.userData.xp2pManager = getXp2pManager();

      try {
        wx.showLoading({ title: '连接设备中...' });

        await this.userData.xp2pManager.startP2PService({
          p2pMode: 'ipc',
          deviceInfo: {
            deviceId: options.deviceId,
            productId: options.deviceId.split('/')[0],
            deviceName: options.deviceId.split('/')[1],
            isMjpgDevice: false,
          },
          xp2pInfo: decodedXp2pInfo,
          caller: this.userData.pageId,
        });

        console.log('【啼哭安抚页】P2P服务启动成功。');
        cameraService.setActiveDevice(options.deviceId);
        await this.fetchDeviceStatus();

      } catch (error: any) {
        console.error('【啼哭安抚页】P2P服务启动失败:', error);
        wx.showModal({
          title: '连接失败',
          content: `无法连接到设备(${error.errMsg || '未知错误'})`,
          showCancel: false,
          success: () => wx.navigateBack(),
        });
      } finally {
        wx.hideLoading();
      }

    } else {
      console.error('【啼哭安抚页】缺少 deviceId 或 xp2pInfo 参数');
      wx.showToast({ title: '参数错误', icon: 'error', duration: 2000, complete: () => wx.navigateBack() });
    }
  },

  onUnload() {
    if (this.data.deviceId && this.userData.xp2pManager) {
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
    }
  },

  async fetchDeviceStatus() {
    console.log('【啼哭安抚页】正在获取设备状态...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【啼哭安抚页】获取到设备状态:', status);

        const musicList = [];
        for (let i = 0; i < 10; i++) {
          if (status[`Music${i}`]) {
            musicList.push(status[`Music${i}`]);
          }
        }

        this.setData({
          'deviceStatus.BABY_CRY_APPEASE': status.APPEASE === '1',
          'deviceStatus.MUSIC_APPEASING': status.MUSIC_APPEASING === '1',
          'deviceStatus.CRYDET_TIME': status.CRYDET_TIME || '00:00-24:00',
          'deviceStatus.CRY_DETECT_SENSE': parseInt(status.CRY_DETECT_SENSE, 10) || 1,
          'deviceStatus.CRY_APPEASE_SONG': status.CRY_APPEASE || 'auto',
          'deviceStatus.MUSIC_LIST': musicList,
        });
      }
    } catch (error) {
      console.error('【啼哭安抚页】获取设备状态失败:', error);
      wx.showToast({ title: '获取设备状态失败', icon: 'none' });
    }
  },

  // --- 事件处理函数 ---

  onCryDetectChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    const commandValue = value ? '1' : '0';
    this.setData({ 'deviceStatus.BABY_CRY_APPEASE': value });

    cameraService.sendCommand(`BABY_CRY_APPEASE,${commandValue},${this.data.deviceStatus.CRY_APPEASE_SONG}`)
      .catch(() => this.setData({ 'deviceStatus.BABY_CRY_APPEASE': !value }));
  },

  onMusicAppeasingChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    const commandValue = value ? '1' : '0';
    this.setData({ 'deviceStatus.MUSIC_APPEASING': value });
    cameraService.sendCommand(`MUSIC_APPEASING,${commandValue}`)
      .catch(() => this.setData({ 'deviceStatus.MUSIC_APPEASING': !value }));
  },

  showTimePicker() {
    const [start, end] = this.data.deviceStatus.CRYDET_TIME.split('-');
    // 将 "HH:mm-HH:mm" 格式转换为 Cascader 需要的 value 数组
    const cascaderValue = start === '00:00' && (end === '24:00' || end === '00:00')
      ? ['allday'] // 如果是全天，则选中“全天”
      : [start, end];

    this.setData({
      cascaderValue: cascaderValue,
      isTimePickerVisible: true
    });
  },

  hideTimePicker() {
    this.setData({ isTimePickerVisible: false });
  },

  onTimeChange(e: WechatMiniprogram.TouchEvent) {
    const { value, selectedOptions } = e.detail;

    let startTime = '00:00';
    let endTime = '24:00';
    let isValidSelection = false;

    if (value.length === 1 && value[0] === 'allday') {
      isValidSelection = true;
    } else if (value.length === 2) {
      // 级联选择返回的是 value，需要从 options 中找到 label
      const startHour = selectedOptions[0].label;
      const startMinute = selectedOptions[0].children.find((c:any) => c.value === value[1]).label;
      startTime = `${startHour}:${startMinute}`;

      const endHour = selectedOptions[2].label;
      const endMinute = selectedOptions[2].children.find((c:any) => c.value === value[3]).label;
      endTime = `${endHour}:${endMinute}`;
      isValidSelection = true;
    }

    if (!isValidSelection) {
        // 用户可能只选择了一部分，此时不关闭弹窗也不发指令
        return;
    }

    const timeRange = `${startTime}-${endTime}`;

    console.log(`【啼哭安抚页】安抚时间段变更为: ${timeRange}`);

    this.setData({
      'deviceStatus.CRYDET_TIME': timeRange,
      cascaderValue: value,
      isTimePickerVisible: false // 确认选择后关闭
    });

    cameraService.sendCommand(`SET_CRYDET_TIME,${startTime},${endTime}`);
  },

  showSensePicker() {
    wx.showActionSheet({
      itemList: this.data.senseMap,
      success: (res) => {
        const senseValue = res.tapIndex; // 0, 1, 2
        this.setData({ 'deviceStatus.CRY_DETECT_SENSE': senseValue });
        cameraService.sendCommand(`CRY_DETECT_SENSE,${senseValue}`);
      }
    });
  },

  showMusicPicker() {
    const itemList = ['随机', ...this.data.deviceStatus.MUSIC_LIST];
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const selectedSong = res.tapIndex === 0 ? 'auto' : itemList[res.tapIndex];
        this.setData({ 'deviceStatus.CRY_APPEASE_SONG': selectedSong });
        // 使用复合指令，保持当前啼哭检测开关状态
        const commandValue = this.data.deviceStatus.BABY_CRY_APPEASE ? '1' : '0';
        cameraService.sendCommand(`BABY_CRY_APPEASE,${commandValue},${selectedSong}`);
      }
    });
  },
});
```

### 文件路径: `src\pages\camera\setting\soothe\soothe.wxml`

```wxml
<view>
    <t-cell title="啼哭检测" hover description="开启后，海马爸比检测到哭声时记录视频并提醒">
      <t-switch value="{{deviceStatus.BABY_CRY_APPEASE}}" size="small" slot="note" bind:change="onCryDetectChange" />
    </t-cell>
    <t-cell title="音乐安抚" hover description="检测到哭声时，自动播放安抚音乐">
      <t-switch value="{{deviceStatus.MUSIC_APPEASING}}" size="small" slot="note" bind:change="onMusicAppeasingChange" />
    </t-cell>
    <t-cell title="安抚时间段" hover arrow note="{{deviceStatus.CRYDET_TIME}}" bind:click="showTimePicker" />
    <t-cell title="检测灵敏度" hover arrow note="{{senseMap[deviceStatus.CRY_DETECT_SENSE]}}" bind:click="showSensePicker" />
    <t-cell title="音乐" hover arrow note="{{deviceStatus.CRY_APPEASE_SONG === 'auto' ? '随机' : deviceStatus.CRY_APPEASE_SONG}}" bind:click="showMusicPicker" />

</view>

<t-cascader
  visible="{{isTimePickerVisible}}"
  title="选择安抚时间段"
  sub-titles="{{['开始时间', '结束时间']}}"
  options="{{timeOptions}}"
  value="{{cascaderValue}}"
  bind:change="onTimeChange"
  bind:close="hideTimePicker"
/>
```

### 文件路径: `src\pages\camera\setting\view\view.json`

```json
{
  "usingComponents": {
    "p2p-live-player": "../../../../components/p2p-live-player/p2p-live-player"
  },
  "navigationBarTitleText": "画面设置",
  "navigationBarBackgroundColor": "#fff",
  "navigationBarTextStyle": "black"
}
```

### 文件路径: `src\pages\camera\setting\view\view.scss`

```scss
.t-cell {
  --td-cell-vertical-padding:0px !important;
  --td-cell-horizontal-padding:0px !important;
}
```

### 文件路径: `src\pages\camera\setting\view\view.ts`

```ts
import cameraService from '../../../../lib/cameraService';
import { getXp2pManager } from '../../../../lib/xp2pManager';
import { isDevTool } from '../../../../utils/util';

Page({
  data: {
    deviceId: '',
    xp2pInfo: '',
    deviceInfo: null as any,
    isPlaySuccess: false,
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },
    // --- UI的状态 ---
    deviceStatus: {
      FV: false,      // 垂直翻转
      FH: false,      // 水平镜像
      LOGO: true,     // 显示水印
      FORCE_RGB: false, // 强制彩色（高清夜视的反向逻辑）
      LUMI: 50,       // 亮度
      CONT: 50,       // 对比度
      SATU: 50,       // 饱和度
    },
  },

  userData: {
    xp2pManager: null as any,
    pageId: `setting-view-page-${Date.now()}`,
    sliderChangeTimer: null as any, // 滑块节流定时器
  },

  async onLoad(options: { deviceId?: string; xp2pInfo?: string }) {
    if (options.deviceId && options.xp2pInfo) {
      const decodedXp2pInfo = decodeURIComponent(options.xp2pInfo);
      this.setData({
        deviceId: options.deviceId,
        xp2pInfo: decodedXp2pInfo,
        deviceInfo: { // 预设 deviceInfo 以渲染播放器
          deviceId: options.deviceId,
          productId: options.deviceId.split('/')[0],
          deviceName: options.deviceId.split('/')[1],
          isMjpgDevice: false,
        }
      });
      console.log('【画面设置页】已接收到设备ID:', options.deviceId);

      this.userData.xp2pManager = getXp2pManager();

      try {
        await this.userData.xp2pManager.startP2PService({
          p2pMode: 'ipc',
          deviceInfo: this.data.deviceInfo,
          xp2pInfo: decodedXp2pInfo,
          caller: this.userData.pageId,
        });

        console.log('【画面设置页】P2P服务启动成功。');
        cameraService.setActiveDevice(options.deviceId);

      } catch (error: any) {
        console.error('【画面设置页】P2P服务启动失败:', error);
        wx.showModal({
          title: '连接失败',
          content: `无法连接到设备(${error.errMsg || '未知错误'})`,
          showCancel: false,
          success: () => wx.navigateBack(),
        });
      }

    } else {
      console.error('【画面设置页】缺少 deviceId 或 xp2pInfo 参数');
      wx.navigateBack();
    }
  },

  onUnload() {
    if (this.data.deviceId && this.userData.xp2pManager) {
      this.userData.xp2pManager.stopP2PService(this.data.deviceId, this.userData.pageId);
    }
  },

  /**
   * 视频播放成功后，获取设备状态来初始化UI
   */
  onPlaySuccess() {
    this.setData({ isPlaySuccess: true });
    this.fetchDeviceStatus();
  },

  async fetchDeviceStatus() {
    if (!this.data.isPlaySuccess) return;
    console.log('【画面设置页】正在获取设备状态...');
    try {
      const res = await cameraService.sendCommand('CHECK_ONLINE');
      if (res.type === 'success' && res.data) {
        const status = JSON.parse(res.data);
        console.log('【画面设置页】获取到设备状态:', status);
        this.setData({
          'deviceStatus.FV': status.FV === '1',
          'deviceStatus.FH': status.FH === '1',
          'deviceStatus.LOGO': status.LOGO === '1',
          'deviceStatus.FORCE_RGB': status.FC === '1',
          'deviceStatus.LUMI': parseInt(status.LUMI, 10) || 50,
          'deviceStatus.CONT': parseInt(status.CONT, 10) || 50,
          'deviceStatus.SATU': parseInt(status.SATU, 10) || 50,
        });
      }
    } catch (error) {
      console.error('【画面设置页】获取设备状态失败:', error);
    }
  },

  // --- 事件处理函数 ---

  /**
   * 垂直翻转
   */
  toggleFlip() {
    const newValue = !this.data.deviceStatus.FV;
    this.setData({ 'deviceStatus.FV': newValue });
    cameraService.sendCommand(`UISPC,4,${newValue ? '1' : '0'}`)
      .catch(() => this.setData({ 'deviceStatus.FV': !newValue })); // 失败回滚
  },

  /**
   * 水平镜像
   */
  toggleMirror() {
    const newValue = !this.data.deviceStatus.FH;
    this.setData({ 'deviceStatus.FH': newValue });
    cameraService.sendCommand(`UISPC,3,${newValue ? '1' : '0'}`)
      .catch(() => this.setData({ 'deviceStatus.FH': !newValue }));
  },

  /**
   * 水印开关
   */
  toggleLogo() {
    const newValue = !this.data.deviceStatus.LOGO;
    // 指令是反向的: 1=关闭, 0=开启
    const commandValue = newValue ? '0' : '1';
    this.setData({ 'deviceStatus.LOGO': newValue });
    cameraService.sendCommand(`DISABLE_LOGO_DISP,${commandValue}`)
      .catch(() => this.setData({ 'deviceStatus.LOGO': !newValue }));
  },

  /**
   * 高清夜视开关 (强制彩色)
   */
  onForceRgbChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.detail.value;
    // UI上的“高清夜视”开启，对应的是强制彩色关闭(0)
    // UI上的“高清夜视”关闭，对应的是强制彩色开启(1)
    const commandValue = value ? '0' : '1';
    this.setData({ 'deviceStatus.FORCE_RGB': !value });
    cameraService.sendCommand(`FORCE_RGB,${commandValue}`)
      .catch(() => this.setData({ 'deviceStatus.FORCE_RGB': value }));
  },

  /**
   * 滑块调节（亮度、对比度、饱和度）
   */
  onSliderChange(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    const value = e.detail.value;

    // 实时更新UI
    switch(type) {
      case 'brightness': this.setData({ 'deviceStatus.LUMI': value }); break;
      case 'contrast': this.setData({ 'deviceStatus.CONT': value }); break;
      case 'saturation': this.setData({ 'deviceStatus.SATU': value }); break;
    }

    // 节流发送
    if (this.userData.sliderChangeTimer) {
      clearTimeout(this.userData.sliderChangeTimer);
    }

    this.userData.sliderChangeTimer = setTimeout(() => {
      let command = '';
      switch(type) {
        case 'brightness': command = `UISPC,0,${value}`; break;
        case 'contrast': command = `UISPC,1,${value}`; break;
        case 'saturation': command = `UISPC,2,${value}`; break;
      }
      if(command) {
        cameraService.sendCommand(command).catch(err => {
            console.error(`【画面设置页】设置${type}失败:`, err);
            // 失败时可以考虑重新拉取状态进行UI校准
            this.fetchDeviceStatus();
        });
      }
    }, 200);
  },
});
```

### 文件路径: `src\pages\camera\setting\view\view.wxml`

```wxml
<view class="flex flex-col h-screen">
  <!-- 视频预览区域 -->
  <view class="w-full bg-black" style="height: 56.25vw;">
    <block wx:if="{{deviceInfo}}">
      <p2p-live-player
        id="p2p-live-player-0"
        compClass="w-full h-full"
        deviceInfo="{{deviceInfo}}"
        xp2pInfo="{{xp2pInfo}}"
        sceneType="live"
        streamChannel="{{0}}"
        streamQuality="high"
        mode="RTC"
        muted="{{true}}"
        showLog="{{false}}"
        onlyp2pMap="{{onlyp2pMap}}"
        bind:playsuccess="onPlaySuccess"
      />
    </block>
    <view wx:else class="w-full h-full flex items-center justify-center text-white bg-black">
      正在连接设备...
    </view>
  </view>

  <!-- 控制按钮区域 -->
  <view class="bg-black grid grid-cols-3 gap-4 py-3 text-center">
    <view bind:tap="toggleFlip">
      <t-icon name="gesture-wipe-down" size="48rpx" color="{{deviceStatus.FV ? '#BDA01E' : '#fff'}}" />
    </view>
    <view bind:tap="toggleMirror">
      <t-icon name="gesture-right-slip" size="48rpx" color="{{deviceStatus.FH ? '#BDA01E' : '#fff'}}" />
    </view>
    <view bind:tap="toggleLogo">
      <t-icon name="markup" size="48rpx" color="{{deviceStatus.LOGO ? '#BDA01E' : '#fff'}}" />
    </view>
  </view>

  <!-- 设置项 -->
  <view class="bg-white p-4 flex flex-col flex-1">
    <text class="text-sm">亮度</text>
    <t-slider value="{{deviceStatus.LUMI}}" label="${value}" bind:change="onSliderChange" data-type="brightness" />
    <text class="text-sm mt-3">对比度</text>
    <t-slider value="{{deviceStatus.CONT}}" label="${value}" bind:change="onSliderChange" data-type="contrast" />
    <text class="text-sm mt-3">饱和度</text>
    <t-slider value="{{deviceStatus.SATU}}" label="${value}" bind:change="onSliderChange" data-type="saturation" />

    <t-cell title="高清夜视" hover bordered="{{false}}" description="关闭后，环境光线不足时看不清画面" t-class="mt-6 t-cell">
      <t-switch value="{{!deviceStatus.FORCE_RGB}}" slot="note" size="small" bind:change="onForceRgbChange" />
    </t-cell>
  </view>
</view>
```

### 文件路径: `src\pages\camera\show\show.json`

```json
{
  "usingComponents": {
    "p2p-live-player": "../../../components/p2p-live-player/p2p-live-player",
    "iot-p2p-voice": "plugin://xp2p/iot-p2p-voice"
  },
  "navigationBarTitleText": "海马爸比二代看护器"
}
```

### 文件路径: `src\pages\camera\show\show.scss`

```scss

```

### 文件路径: `src\pages\camera\show\show.ts`

```ts
import { cameraApi } from '../../../utils/api';
import { isDevTool } from '../../../utils/util';
import { getXp2pManager } from '../../../lib/xp2pManager';
import cameraService from '../../../lib/cameraService';

const app = getApp();
const console = app.logger || console;

const recordFlvOptions = {
  maxFileSize: 100 * 1024 * 1024,
  needAutoStartNextIfFull: false,
  needSaveToAlbum: true,
  needKeepFile: wx.getAccountInfoSync().miniProgram.envVersion === 'develop',
  showLog: true,
};

Page({
  data: {
    cameraId: null as number | null,
    deviceInfo: null as any,
    xp2pInfo: '',
    useChannelIds: [0],
    options: {
      liveQuality: 'high',
      playerRTC: true,
      playerMuted: false,
      playerLog: true,
      voiceType: 'Pusher',
      intercomType: 'voice',
      supportPTZ: true,
      supportCustomCommand: true,
    },
    isPlaySuccess: false,
    isMuted: false,
    isRecording: false,
    voiceState: 'VoiceIdle',
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },
    recordIconColor: '#000000',
    micIconColor: '#000000',
    muteIconName: 'sound-mute',
    icons: {
      books: '/assets/images/books.svg',
      music: '/assets/images/music.svg',
      camera: '/assets/images/camera.svg',
      timer: '/assets/images/timer.svg',
      switch: '/assets/images/switch.svg',
      note: '/assets/images/note.svg',
      baby: '/assets/images/baby.svg',
    },
    current: 0,
    autoplay: false,
    duration: 500,
    interval: 5000,
    swiperList: [
      'https://tdesign.gtimg.com/mobile/demos/swiper1.png',
      'https://tdesign.gtimg.com/mobile/demos/swiper2.png',
    ],
  },

  userData: {
    deviceId: '',
    xp2pManager: null as any,
    pageId: `camera-show-page-${Date.now()}`,
    player: null as any,
    voiceComponent: null as any,
  },

  onLoad(options: { id?: string }) {
    if (options.id) {
      this.setData({ cameraId: parseInt(options.id, 10) });
      this.userData.xp2pManager = getXp2pManager();
      this.userData.xp2pManager.checkReset();
      this.fetchCameraInfo(options.id);
    } else {
      wx.showToast({ title: '缺少设备ID', icon: 'error', duration: 2000, complete: () => wx.navigateBack() });
    }
  },

  onReady() {
    this.userData.player = this.selectComponent('#p2p-live-player-0');
    this.userData.voiceComponent = this.selectComponent('#iot-p2p-voice');
  },

  onUnload() {
    if (this.userData.deviceId) {
      this.userData.xp2pManager.stopP2PService(this.userData.deviceId, this.userData.pageId);
    }
    cameraService.clearActiveDevice();
    this.userData.xp2pManager.checkReset();
  },

  async fetchCameraInfo(id: string) {
    wx.showLoading({ title: '加载设备信息...' });
    try {
      const res = await cameraApi.getCameraInfo({ id });
      if (res.data && res.data.code === 0) {
        const deviceData = res.data.data;
        const deviceDetail = {
          targetId: 'hardcoded_ipc_1',
          deviceId: deviceData.deviceId,
          productId: deviceData.productId,
          deviceName: deviceData.deviceName,
          xp2pInfo: deviceData.xp2pInfo,
          isMjpgDevice: false,
          p2pMode: 'ipc' as const,
          sceneType: 'live' as const,
          liveStreamDomain: '',
          initCommand: '',
          useChannelIds: [0],
          options: this.data.options,
        };
        this.onStartPlayer({ detail: deviceDetail });
      } else {
        throw new Error(res.data.msg || '获取设备信息失败');
      }
    } catch (error: any) {
      wx.showModal({
        title: '错误',
        content: error.message || '网络请求失败',
        showCancel: false,
        success: () => wx.navigateBack(),
      });
    } finally {
      wx.hideLoading();
    }
  },

  onStartPlayer({ detail }: { detail: any }) {
    this.userData.deviceId = detail.deviceId;
    this.userData.xp2pManager.startP2PService({
      p2pMode: detail.p2pMode,
      deviceInfo: {
        deviceId: detail.deviceId,
        productId: detail.productId,
        deviceName: detail.deviceName,
        isMjpgDevice: detail.isMjpgDevice,
      },
      xp2pInfo: detail.xp2pInfo,
      caller: this.userData.pageId,
    }).then(() => {
      cameraService.setActiveDevice(detail.deviceId);
    }).catch((err: any) => {
      console.error('启动P2P服务失败:', err);
      wx.showToast({ title: '连接设备失败', icon: 'error' });
    });

    const isMuted = detail.options.playerMuted;
    this.setData({
      deviceInfo: detail,
      xp2pInfo: detail.xp2pInfo,
      useChannelIds: detail.useChannelIds,
      options: detail.options,
      isMuted: isMuted,
      muteIconName: isMuted ? 'sound-mute-1' : 'sound-mute',
    }, () => {
      this.userData.player = this.selectComponent('#p2p-live-player-0');
      this.userData.voiceComponent = this.selectComponent('#iot-p2p-voice');
    });
  },

  onPlayStateChange({ detail }: { detail: any }) {
    if (detail.type === 'playsuccess' && !this.data.isPlaySuccess) {
      this.setData({ isPlaySuccess: true });
    } else if (['playstop', 'playend', 'playerror'].includes(detail.type)) {
      this.setData({ isPlaySuccess: false });
    }
  },

  onRecordStateChange({ detail }: { detail: { record: boolean } }) {
    this.setData({
      isRecording: detail.record,
      recordIconColor: detail.record ? '#4CAF50' : '#000000',
    });
  },

  onRecordFileStateChange({ detail }: { detail: any }) {
    if (detail.state === 'SaveSuccess') {
      wx.showToast({ title: '录像已保存到相册', icon: 'success' });
    } else if (detail.state === 'Error') {
      wx.showModal({
        title: '录像出错',
        content: `${detail.errType}: ${detail.errMsg || '未知错误'}`,
        showCancel: false,
      });
    }
  },

  onVoiceStateChange({ detail }: { detail: { voiceState: string } }) {
    this.setData({
      voiceState: detail.voiceState,
      micIconColor: detail.voiceState === 'VoiceSending' ? '#4CAF50' : '#000000',
    });
  },

  onVoiceError({ detail }: { detail: any }) {
    this.setData({ voiceState: 'VoiceIdle', micIconColor: '#000000' });
    wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' });
  },

  toggleRecording() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    if (this.data.isRecording) {
      this.userData.player?.stopRecordFlv();
    } else {
      this.userData.player?.startRecordFlv(recordFlvOptions);
    }
  },

  takeSnapshot() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    this.userData.player?.snapshotAndSave();
  },

  toggleVoice() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '请等待视频加载完成', icon: 'none' });
      return;
    }
    if (this.data.voiceState === 'VoiceIdle') {
      this.userData.voiceComponent?.startVoice();
    } else {
      this.userData.voiceComponent?.stopVoice();
    }
  },

  toggleMute() {
    const newMutedState = !this.data.isMuted;
    this.setData({
      isMuted: newMutedState,
      muteIconName: newMutedState ? 'sound-mute-1' : 'sound-mute',
    });
  },

  /**
   * [修改] 跳转到设置页面，增加 xp2pInfo 参数
   */
  goToSettings() {
    if (!this.data.deviceInfo) {
      wx.showToast({title: '设备信息未加载', icon: 'none'});
      return;
    }
    // 【关键修改】将 xp2pInfo 编码后传递给设置页面
    const url = `/pages/camera/setting/index/index?deviceId=${this.data.deviceInfo.deviceId}&xp2pInfo=${encodeURIComponent(this.data.xp2pInfo)}`;
    wx.navigateTo({
      url: url,
      fail: (err) => {
        console.error('跳转到设置页面失败:', err);
      }
    });
  },

  onTap(e: any) {
    console.log('Swiper tapped', e);
  },
  onChange(e: any) {
    this.setData({
      current: e.detail.current,
    });
  },
  onImageLoad(e: any) {
    console.log('Image loaded', e);
  },
});
```

### 文件路径: `src\pages\camera\show\show.wxml`

```wxml
<view class="flex flex-col h-screen bg-gray-100">
  <!-- 视频播放区域 -->
  <view class="w-full bg-black" style="height: 56.25vw;">
    <block wx:if="{{deviceInfo}}">
      <!-- 【重要】为 p2p-live-player 添加事件绑定 -->
      <p2p-live-player
        wx:for="{{useChannelIds}}"
        wx:key="index"
        data-channel="{{item}}"
        id="p2p-live-player-{{item}}"
        compClass="w-full h-full"
        deviceInfo="{{deviceInfo}}"
        xp2pInfo="{{xp2pInfo}}"
        needCheckStream="{{options.needCheckStream}}"
        sceneType="live"
        streamChannel="{{item}}"
        streamQuality="{{options.liveQuality}}"
        mode="{{options.playerRTC ? 'RTC' : 'live'}}"
        muted="{{isMuted}}"
        showLog="{{options.playerLog}}"
        onlyp2pMap="{{onlyp2pMap}}"
        bind:playstatechagne="onPlayStateChange"
        bind:recordstatechange="onRecordStateChange"
        bind:recordfilestatechange="onRecordFileStateChange"
        >
      </p2p-live-player>
    </block>
    <view wx:else class="w-full h-full flex items-center justify-center text-white bg-black">
      正在加载设备信息...
    </view>
  </view>

  <!-- 对讲组件 (隐藏) -->
  <iot-p2p-voice
    wx:if="{{deviceInfo}}"
    id="iot-p2p-voice"
    deviceInfo="{{deviceInfo}}"
    voiceType="{{options.voiceType}}"
    showLog="{{options.playerLog}}"
    bind:voicestatechange="onVoiceStateChange"
    bind:voiceerror="onVoiceError"
  />

  <!-- 控制按钮 -->
  <view class="main-width bg-white py-6 rounded-b-lg px-4 grid grid-cols-5 gap-4 text-center">
    <!-- 1. 录制视频按钮 -->
    <view class="py-4 bg-gray-100 rounded-full" bind:tap="toggleRecording">
      <t-icon name="video-camera-1" size="36rpx" color="{{recordIconColor}}"/>
    </view>
    <!-- 2. 拍照按钮 -->
    <view class="py-4 bg-gray-100 rounded-full" bind:tap="takeSnapshot">
      <t-icon name="camera" size="36rpx"/>
    </view>
    <!-- 3. 语音对讲按钮 -->
    <view class="py-4 bg-gray-100 rounded-full" bind:tap="toggleVoice">
      <t-icon name="microphone-1" size="36rpx" color="{{micIconColor}}"/>
    </view>
    <!-- 4. 静音切换按钮 -->
    <view class="py-4 bg-gray-100 rounded-full" bind:tap="toggleMute">
      <t-icon name="{{muteIconName}}" size="36rpx"/>
    </view>
    <!-- 5. 设置按钮 -->
    <view class="py-4 bg-gray-100 rounded-full" bind:tap="goToSettings">
      <t-icon name="setting-1" size="36rpx"/>
    </view>
  </view>

  <!-- 页面其他内容 -->
  <view class="main-width bg-white py-2 rounded-lg px-4 mt-4 grid grid-cols-7 gap-4">
    <view class="flex flex-row items-center justify-between col-span-5">
      <t-icon name="{{icons.music}}" size="58rpx" />
      <text class="text-sm font-bold">童谣时间</text>
      <text class="text-xs text-gray-400">宝宝今天听点什么呢?</text>
    </view>
    <view class="flex flex-col text-center  col-span-2">
      <t-icon name="music" size="28rpx" color="#9ca3af" />
      <text class="text-xs mt-1 text-gray-400">音乐安抚</text>
    </view>
  </view>

  <view class="main-width mt-4 grid grid-cols-7 gap-4">
    <view class="bg-white rounded-lg py-4 px-4 col-span-3 flex flex-row items-center">
      <t-icon name="{{icons.note}}" size="58rpx" />
      <view class="ml-2 flex flex-col">
        <text class="text-sm font-bold">生活报告</text>
        <view class="h-px w-full bg-gray-200 my-1"></view>
        <text class="text-xs text-gray-400">记录宝宝睡眠</text>
      </view>
    </view>
    <view class="bg-white rounded-lg py-2 px-4 col-span-4 flex flex-row items-center">
      <t-icon name="{{icons.switch}}" size="58rpx" />
      <view class="ml-2 flex flex-col">
        <text class="text-sm font-bold">智能模式 · 睡眠</text>
        <view class="h-px w-full bg-gray-200 my-1"></view>
        <text class="text-xs text-gray-400">- -</text>
      </view>
    </view>
    <view class="bg-white rounded-lg py-4 px-4 col-span-3">
      <view class="flex flex-row items-center">
        <t-icon name="{{icons.timer}}" size="58rpx" />
        <view class="ml-2 flex flex-col">
          <text class="text-sm font-bold">睡眠质量</text>
          <view class="h-px w-full bg-gray-200 my-1"></view>
          <text class="text-xs text-gray-400">检测已关闭</text>
        </view>
      </view>
      <view class="flex flex-col items-center bg-gray-100 mt-2 h-20 justify-center rounded-xl">
        <t-icon name="{{icons.baby}}" size="38rpx" />
        <text class="text-xs text-gray-400 mt-1">未入睡</text>
      </view>
    </view>
    <view class="bg-white rounded-lg py-4 px-4 col-span-4">
      <view class="flex flex-row items-center">
        <t-icon name="{{icons.camera}}" size="58rpx" />
        <view class="ml-2 flex flex-col">
          <text class="text-sm font-bold">时光相册</text>
          <view class="h-px w-full bg-gray-200 my-1"></view>
          <text class="text-xs text-gray-400">抓拍宝宝的精彩瞬间</text>
        </view>
      </view>
      <t-swiper current="{{current}}" autoplay="{{autoplay}}" duration="{{duration}}" interval="{{interval}}" navigation="{{ { type: 'dots' } }}" list="{{swiperList}}" bind:click="onTap" bind:change="onChange" bind:image-load="onImageLoad" height="80" t-class="mt-2">
      </t-swiper>
    </view>
  </view>

  <view class="mx-auto flex flex-row items-center mt-6">
    <t-icon name="help-circle" size="24rpx" color="#9ca3af" />
    <text class="text-xs ml-2 text-gray-400">使用教程</text>
  </view>

  <view class="wrapper">
    <t-tab-bar t-class="t-tab-bar" defaultValue="label1" split="{{false}}">
      <t-tab-bar-item value="label1" icon="camera-1">
        首页
      </t-tab-bar-item>
      <t-tab-bar-item value="label2" icon="camera-1">
        消息
      </t-tab-bar-item>
      <t-tab-bar-item value="label4" icon="image">
        媒体库
      </t-tab-bar-item>
    </t-tab-bar>
  </view>
</view>
```

### 文件路径: `src\pages\devcieShare\devcieShare.json`

```json
{
  "navigationBarTitleText": "设备分享",
  "usingComponents": {},
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff"
}
```

### 文件路径: `src\pages\devcieShare\devcieShare.scss`

```scss
/* pages/mine/Devices/devcieShare.scss */

page {
  background-color: #f5f5f7;
}

.confirm-btn {
  // 使用 tailwindcss 的类，也可以在这里写自定义样式
  &:active {
    opacity: 0.9;
  }
}
```

### 文件路径: `src\pages\devcieShare\devcieShare.ts`

```ts
import { isDevTool } from '../../utils/util';
import { getXp2pManager } from '../../lib/xp2pManager';

const app = getApp();
const console = app.logger || console;

// 设备参数
const hardcodedDevice = {
  targetId: 'hardcoded_ipc_1',
  deviceId: '7UJZ5UMOJT/20250307059_163524756_90',
  productId: '7UJZ5UMOJT',
  deviceName: '20250307059_163524756_90',
  xp2pInfo: 'XP2Pk3fS3onCsgGaQJCinTCtfw==%2.4.46',
  isMjpgDevice: false,
  p2pMode: 'ipc' as const,
  sceneType: 'live' as const,
  liveStreamDomain: '',
  initCommand: '',
  useChannelIds: [0],
  options: {
    liveQuality: 'high',
    playerRTC: true,
    playerMuted: false,
    playerLog: true,
    voiceType: 'Pusher',
    intercomType: 'voice',
    supportPTZ: true,
    supportCustomCommand: true,
  },
};

// 录制配置
const recordFlvOptions = {
  maxFileSize: 100 * 1024 * 1024,
  needAutoStartNextIfFull: false,
  needSaveToAlbum: true,
  needKeepFile: wx.getAccountInfoSync().miniProgram.envVersion === 'develop',
  showLog: true,
};


Page({
  data: {
    deviceInfo: null as any,
    xp2pInfo: '',
    useChannelIds: [] as number[],
    options: {} as any,
    isPlaySuccess: false,
    isMuted: false,
    isRecording: false,
    voiceState: 'VoiceIdle',
    ptzCmd: '',
    inputCommand: 'action=inner_define&channel=0&cmd=get_device_st&type=voice',
    onlyp2pMap: {
      flv: isDevTool,
      mjpg: isDevTool,
    },
  },

  userData: {
    deviceId: '',
    xp2pManager: null as any,
    pageId: 'camera-view-page',
    player: null as any,
    voiceComponent: null as any,
  },

  onLoad() {
    this.userData.xp2pManager = getXp2pManager();
    this.userData.xp2pManager.checkReset();
    this.onStartPlayer({ detail: hardcodedDevice });
  },

  onReady() {
    this.userData.player = this.selectComponent('#p2p-live-player-0');
    this.userData.voiceComponent = this.selectComponent('#iot-p2p-voice');
  },

  onUnload() {
    if (this.userData.deviceId) {
      console.log('页面卸载，停止P2P服务:', this.userData.deviceId);
      this.userData.xp2pManager.stopP2PService(this.userData.deviceId, this.userData.pageId);
    }
    this.userData.xp2pManager.checkReset();
  },

  onStartPlayer({ detail }: { detail: any }) {
    console.log('开始处理播放请求:', detail);
    this.userData.deviceId = detail.deviceId;

    this.userData.xp2pManager.startP2PService({
      p2pMode: detail.p2pMode,
      deviceInfo: {
        deviceId: detail.deviceId,
        productId: detail.productId,
        deviceName: detail.deviceName,
        isMjpgDevice: detail.isMjpgDevice,
      },
      xp2pInfo: detail.xp2pInfo,
      caller: this.userData.pageId,
    }).catch((err: any) => {
      console.error('启动P2P服务失败:', err);
    });

    this.setData({
      deviceInfo: detail,
      xp2pInfo: detail.xp2pInfo,
      useChannelIds: detail.useChannelIds,
      options: detail.options,
      isMuted: detail.options.playerMuted,
    });
  },

  onPlayStateChange({ detail }: { detail: any }) {
    if (detail.type === 'playsuccess') {
      this.setData({ isPlaySuccess: true });
    } else if (detail.type === 'playstop' || detail.type === 'playend' || detail.type === 'playerror') {
      this.setData({ isPlaySuccess: false });
    }
  },

  onRecordStateChange({ detail }: { detail: { record: boolean } }) {
    console.log('录像状态变化:', detail);
    this.setData({ isRecording: detail.record });
  },

  // ================== 核心修改：优化错误提示 ==================
  onRecordFileStateChange({ detail }: { detail: any }) {
    console.log('录像文件状态:', detail.state, detail);
    switch (detail.state) {
      case 'SaveSuccess':
        wx.showToast({ title: '录像已保存到相册', icon: 'success' });
        break;
      case 'Error':
        // 捕获特定错误并提供友好提示
        if (detail.errType === 'saveError' && detail.errMsg.includes('invalid video')) {
           wx.showModal({
            title: '保存失败',
            content: '视频录制成功，但保存到相册失败。\n原因：设备视频编码为H.265(HEVC)，系统相册不支持此格式。\n建议：请将设备的视频编码设置为H.264。',
            showCancel: false,
          });
        } else {
           wx.showModal({
            title: '录像出错',
            content: `${detail.errType}: ${detail.errMsg || ''}`,
            showCancel: false,
          });
        }
        break;
    }
  },
  // =========================================================

  onVoiceStateChange({ detail }: { detail: { voiceState: string } }) {
    console.log('对讲状态变化:', detail);
    this.setData({ voiceState: detail.voiceState });
  },

  onVoiceError({ detail }: { detail: any }) {
    console.error('对讲错误:', detail);
    wx.showToast({ title: detail.errMsg || '对讲发生错误', icon: 'none' });
    this.setData({ voiceState: 'VoiceIdle' });
  },

  toggleMute() {
    this.setData({ isMuted: !this.data.isMuted });
  },

  takeSnapshot() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '视频播放成功后才能拍照', icon: 'none' });
      return;
    }
    this.userData.player?.snapshotAndSave();
  },

  toggleRecording() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '视频播放成功后才能录像', icon: 'none' });
      return;
    }
    if (this.data.isRecording) {
      this.userData.player?.stopRecordFlv();
    } else {
      this.userData.player?.startRecordFlv(recordFlvOptions);
    }
  },

  toggleVoice() {
    if (!this.data.isPlaySuccess) {
      wx.showToast({ title: '视频播放成功后才能对讲', icon: 'none' });
      return;
    }

    if (this.data.voiceState === 'VoiceIdle') {
      console.log('开始对讲');
      this.userData.voiceComponent?.startVoice();
    } else {
      console.log('停止对讲');
      this.userData.voiceComponent?.stopVoice();
    }
  },

  controlPTZ(e: WechatMiniprogram.TouchEvent) {
    const cmd = e.currentTarget.dataset.cmd as string;
    if (!cmd || !this.userData.deviceId) return;

    this.setData({ ptzCmd: cmd });
    this.userData.xp2pManager.sendPTZCommand(this.userData.deviceId, { ptzCmd: cmd })
      .catch((err: any) => console.error(`发送PTZ指令 ${cmd} 失败:`, err));
  },

  releasePTZBtn() {
    this.setData({ ptzCmd: '' });
    setTimeout(() => {
      this.userData.xp2pManager.sendPTZCommand(this.userData.deviceId, { ptzCmd: 'ptz_release_pre' })
        .catch((err: any) => console.error('发送PTZ释放指令失败:', err));
    }, 200);
  },

  onInputCommand(e: WechatMiniprogram.Input) {
    this.setData({
      inputCommand: e.detail.value,
    });
  },

  sendCommand() {
    if (!this.data.inputCommand || !this.userData.deviceId) return;

    this.userData.xp2pManager.sendCommand(this.userData.deviceId, this.data.inputCommand)
      .then((res: any) => {
        wx.showModal({ title: '信令成功', content: JSON.stringify(res), showCancel: false });
      })
      .catch((err: any) => {
        wx.showModal({ title: '信令失败', content: err.errMsg, showCancel: false });
      });
  },
});
```

### 文件路径: `src\pages\devcieShare\devcieShare.wxml`

```wxml
<view class="container main-width mt-4">
  <view class="bg-white rounded shadow">
    <view class="form-item flex items-center p-4 border-b border-gray-100">
      <text class="w-24 text-gray-700">用户手机号</text>
      <input class="flex-1" type="number" placeholder="请输入对方的手机号" bindinput="handleInput" data-field="phone" value="{{phone}}" />
    </view>

    <view class="form-item flex items-center p-4">
      <text class="w-24 text-gray-700">角色名称</text>
      <input class="flex-1" type="text" placeholder="示例：爸爸" bindinput="handleInput" data-field="roleName" value="{{roleName}}" />
    </view>
  </view>

  <view class="mt-8">
    <button class="confirm-btn bg-yellow-600 text-white rounded py-3" bind:tap="confirmBtn">确定</button>
  </view>
</view>
```

### 文件路径: `src\pages\Devices\Devices.json`

```json
{
  "navigationStyle": "custom",
  "usingComponents": {}
}
```

### 文件路径: `src\pages\Devices\Devices.scss`

```scss
/* pages/mine/Devices/Devices.scss */
.title_panel {
  background-image: url('http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/ic_cp_sbfx.png');
  background-position: center;
  background-size: 100%;
  background-repeat: no-repeat;
  width: 100%;
  height: 210px; // 420rpx
  color: #333;
}

.device-card {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 5px 8px 0 rgba(206, 211, 217, 0.50);
  margin-top: 20px;
  overflow: hidden; // 配合 border-left
}

.state_online {
  background-image: linear-gradient(45deg, #52CC72, #A4D962);
}

.state_offline {
  background-color: #D4D4D9;
}

.btn_colStyle {
  background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.6), rgba(240, 242, 245, 0.60));
  text-align: center;
  padding: 8px 16px;
  border: 0.5px solid rgba(206, 206, 214, 0.40);
  border-radius: 10px;
  color: #9E9D99;
  font-weight: 500;
}

.btn-confirm {
  background-color: #F2EAC2;
  border: 1px solid #BDA01E;
  color: #BDA01E;
}
```

### 文件路径: `src\pages\Devices\Devices.ts`

```ts
// pages/mine/Devices/Devices.ts
// @ts-nocheck
const app = getApp();

Page({
  data: {
    deviceList: [] as any[],
    count: 0,
    title: '',

    memberShow: false,
    memberList: [] as any[],

    qrcode_show: false,
    codeUrl: '',

    chooseDevice: {} as any, // 暂存待操作的设备
    chooseMember: {} as any, // 暂存待操作的成员
  },

  onLoad() {
    // 从全局变量获取设备列表
    const allDeviceList = app.globalData.allDeviceList || [];
    this.setData({
      deviceList: allDeviceList,
      count: allDeviceList.length,
      title: `${app.globalData.userInfo.nickname || '我'}的家`,
    });
  },

  // --- 设备操作 ---
  delDevice(e: WechatMiniprogram.BaseEvent) {
    this.setData({ chooseDevice: e.currentTarget.dataset.item });
    wx.showModal({
      title: '提示',
      content: '您确定要删除设备吗？',
      confirmColor: '#BDA01E',
      success: (res) => {
        if (res.confirm) {
          this.con_delDevice();
        }
      },
    });
  },

  async con_delDevice() {
    // 实际项目中应替换为 wx.request
    // const res = await that.$u.iotApi.delDevice({ id: this.data.chooseDevice.id });
    console.log(`正在删除设备: ${this.data.chooseDevice.id}`);
    const res = { data: true }; // 模拟成功

    if (res.data) {
      wx.showToast({ title: '解绑成功' });
      const newList = this.data.deviceList.filter(item => item.id !== this.data.chooseDevice.id);
      this.setData({
        deviceList: newList,
        count: newList.length
      });
      app.globalData.allDeviceList = newList; // 更新全局数据
    } else {
      wx.showToast({ title: '解绑失败，请联系管理员', icon: 'none' });
    }
  },

  shareDevice(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    if (item.userRelation !== 1) {
      wx.showToast({ title: '您没有权限', icon: 'none' });
      return;
    }
    const params = `bed_id=${item.productBedId}&camera_id=${item.productCameraId || -1}&userid=${item.userid}`;
    wx.navigateTo({
      url: `/pages/mine/Devices/devcieShare?${params}`
    });
  },

  // --- 二维码操作 ---
  qrcode_event(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    if (item.userRelation !== 1) {
      wx.showToast({ title: '您没有权限', icon: 'none' });
      return;
    }
    const info = {
      bed_id: item.productBedId,
      camera_id: item.productCameraId || -1,
      userid: item.userid
    };
    const qrUrl = 'https://api.pwmqr.com/qrcode/create/?url=' + encodeURIComponent(JSON.stringify(info));
    this.setData({
      codeUrl: qrUrl,
      qrcode_show: true,
    });
  },

  hideQrcodePopup() {
    this.setData({ qrcode_show: false });
  },

  saveImage() {
    wx.downloadFile({
      url: this.data.codeUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '保存成功' });
            },
            fail: () => {
              wx.showToast({ title: '保存失败', icon: 'none' });
            }
          });
        }
      },
      fail: () => {
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  },

  // --- 成员管理 ---
  async getItem(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    if (item.userRelation !== 1) {
      wx.showToast({ title: '您没有权限', icon: 'none' });
      return;
    }
    await this.getRelationShip(item.productBedId);
    this.setData({ memberShow: true });
  },

  hideMemberPopup() {
    this.setData({ memberShow: false });
  },

  async getRelationShip(productBedId: string) {
    // 实际项目中应替换为 wx.request
    // const res = await that.$u.iotApi.getRelationShip({ product_bed_id: productBedId });
    // 模拟数据
    const mockMemberList = [
        {id: 1, nickName: '爸爸', relationname: '管理员', productBedId},
        {id: 2, nickName: '妈妈', relationname: '成员', productBedId}
    ];
    this.setData({ memberList: mockMemberList });
  },

  deleteMember(e: WechatMiniprogram.BaseEvent) {
      this.setData({ chooseMember: e.currentTarget.dataset.item });
      wx.showModal({
        title: '提示',
        content: '您确定要删除成员吗？',
        confirmColor: '#BDA01E',
        success: (res) => {
          if (res.confirm) {
            this.delItem();
          }
        },
      });
  },

  async delItem() {
    console.log(`正在删除成员: ${this.data.chooseMember.id}`);
    // const res = await that.$u.iotApi.delShip({ id: this.data.chooseMember.id });
    await this.getRelationShip(this.data.chooseMember.productBedId); // 刷新成员列表
    wx.showToast({title: '删除成功'});
  }
});
```

### 文件路径: `src\pages\Devices\Devices.wxml`

```wxml
<view>
  <view class="title_panel">
    <view class="pt-12 px-6">
      <view class="text-3xl font-bold">{{title}}</view>
      <view class="mt-2 text-gray-600 font-semibold">共{{count}}个设备</view>
    </view>
  </view>

  <view class="px-6 -mt-24 pb-10">
    <block wx:for="{{deviceList}}" wx:key="id">
      <view class="device-card">
        <view class="flex p-4" style="border-left: 10px solid {{item.isconnected ? '#A4D962' : '#f1f1f1'}};">
          <view class="flex-shrink-0">
            <image src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/img_nbt.png" style="height: 110px;" mode="heightFix"></image>
          </view>
          <view class="flex-1 ml-4 flex flex-col justify-between">
            <view class="flex justify-between items-start">
              <view>
                <view class="font-bold text-lg">{{item.productName}}</view>
                <view class="mt-2">
                  <text class="px-3 py-1 text-xs text-white rounded {{item.isconnected ? 'state_online' : 'state_offline'}}">{{item.isconnected ? '在线' : '离线'}}</text>
                </view>
              </view>
              <view class="flex items-center">
                <image src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/ic_cp_ewm.png" class="w-8 h-8" bind:tap="qrcode_event" data-item="{{item}}"></image>
                <image src="../../assets/images/close_icon.png" class="w-5 h-5 ml-4" bind:tap="delDevice" data-item="{{item}}"></image>
              </view>
            </view>
            <view class="flex justify-between text-center mt-5 text-sm">
              <view class="btn_colStyle" bind:tap="shareDevice" data-item="{{item}}">设备分享</view>
              <view class="btn_colStyle" bind:tap="getItem" data-item="{{item}}">成员管理</view>
            </view>
          </view>
        </view>
      </view>
    </block>
  </view>

  <view wx:if="{{memberShow}}" class="fixed inset-0 bg-black bg-opacity-50 z-40" bind:tap="hideMemberPopup">
    <view class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6" catch:tap>
      <view class="text-center font-bold text-lg">成员管理</view>
      <scroll-view scroll-y="true" class="max-h-64 mt-4">
        <block wx:for="{{memberList}}" wx:key="id">
          <view class="bg-gray-100 rounded-lg p-3 flex items-center justify-between mb-3">
            <view class="flex items-center">
              <image class="w-10 h-10 rounded-full" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/avatar.png"></image>
              <text class="font-bold mx-3">{{item.nickName}}</text>
              <text class="text-gray-500 text-sm">{{item.relationname}}</text>
            </view>
            <image src="../../assets/images/trash_icon.png" class="w-6 h-6" bind:tap="deleteMember" data-item="{{item}}"></image>
          </view>
        </block>
      </scroll-view>
      <view class="flex justify-between text-center mt-6">
        <button class="flex-1 mx-2 bg-white border border-gray-300 text-gray-500" bind:tap="hideMemberPopup">取消</button>
        <button class="flex-1 mx-2 btn-confirm" bind:tap="hideMemberPopup">确认</button>
      </view>
    </view>
  </view>

  <view wx:if="{{qrcode_show}}" class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center" bind:tap="hideQrcodePopup">
    <view class="bg-white rounded-2xl w-11/12 py-6" catch:tap>
      <view class="text-center text-lg">子账号可扫码添加</view>
      <image class="w-64 h-64 mx-auto my-4" src="{{codeUrl}}"></image>
      <view class="text-center">
        <view class="w-14 h-14 bg-purple-500 rounded-full inline-flex items-center justify-center" bind:tap="saveImage">
          <image src="../../assets/images/download_icon.png" class="w-8 h-8"></image>
        </view>
        <view class="text-sm mt-2">下载到本地</view>
      </view>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\index\index.json`

```json
{
  "navigationStyle": "custom",
  "usingComponents": {}
}
```

### 文件路径: `src\pages\index\index.scss`

```scss
page {
  --td-navbar-bg-color: transparent
}

.swiper_content {
  height: 410px; // 820rpx
  width: 100%;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  margin-top: -100px;
}

.menu_content {
  @apply -mt-12 w-full;
  z-index: 9;
  backdrop-filter: blur(3px);

  .menu_item {
    @apply absolute w-11/12 mx-auto left-0 right-0;
  }
}

.btn {
  @apply bg-white rounded shadow;
  box-shadow: 0 5px 8px 0 rgba(206, 211, 217, 0.70);
}

.connect_device {
  @apply rounded-xl border-2 border-white font-bold text-yellow-700 border-solid;
}

// 透明遮罩层
.nav-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 99; // 层级低于菜单，高于页面内容
}

// 弹出菜单容器
.nav-popup {
  @apply absolute bg-white rounded-lg shadow-md;
  // --td-navbar-height 是 TDesign Navbar 的高度变量，可以确保菜单正好在导航栏下方
  // 如果定位不准，可以手动调整为胶囊按钮的高度，例如 top: 100rpx;
  top: 150rpx;
  left: 16rpx;
  z-index: 100; // 最高层级
  width: 280rpx; // 菜单宽度
  padding: 8rpx;
}

// 菜单项
.nav-popup-item {
  @apply flex items-center p-3 rounded-md;
  &:active {
    background-color: #f0f0f0;
  }
}
```

### 文件路径: `src\pages\index\index.ts`

```ts
import { bedDeviceApi } from '../../utils/api';

const app = getApp();

Page({
  data: {
    error_show: false,
    errmsg: '',
    camera_show: false,
    camera_net: false,
    deviceList: [] as any[],
    open_Show: false,
    active_model: {} as any,
    menu_item_list: [
      {
        active_icon: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_nbt_sel.png',
        active_normol: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_nbt_nor.png',
        current: 0,
        name: '尿布台',
        isLight: false,
        power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
        power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
        cmd: 'AA0103010100',
        img: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_nbt.png'
      },
      {
        active_icon: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_sc_sel.png',
        active_normol: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_sc_nor.png',
        current: 1,
        name: '睡床',
        isLight: false,
        power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
        power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
        cmd: 'AA0103010200',
        img: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_sc.png'
      },
      {
        active_icon: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yxc_sel.png",
        active_normol: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yxc_nor.png",
        current: 2,
        name: '游戏床',
        isLight: false,
        power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
        power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
        cmd: 'AA0103010300',
        img: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_ysc.png'
      }
    ],
    light_info: {
      active_icon: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yd_sel.png",
      active_normol: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yd_nor.png",
      name: '夜灯',
      power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
      power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
      cmd: 'AA0103020111', //夜灯开
      cmd2: 'AA0103020100', //夜灯关
    },
    deviceCurrent: 0,
    blue_show: false,
    modal_show: false,
    bluetoothInited: false,
    bluetoothSearched: false,
    connected: false,
    connect_blue_deviceInfo: null as any,
    modal_content: '',
    popupShow: false,
    backgroundImage: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/swiper/img_cp_yd.png',
    deviceCurrentChange: false,
    noticeShow: false,
    noticeInfo: {} as any,
    navPopupShow: false,
  },

  onLoad() {
    this.checkNotice();
  },

  onShow() {
    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }
      this.getDeviceList();
  },

  onIconTap() {
    this.setData({
      navPopupShow: !this.data.navPopupShow
    });
  },

  hideNavPopup() {
    this.setData({
      navPopupShow: false
    });
  },

  show_popu() {
    this.setData({ popupShow: true });
  },

  hide_popu() {
    this.setData({ popupShow: false });
  },

  deviceChange(e: WechatMiniprogram.BaseEvent) {
    const newIndex = e.currentTarget.dataset.index;
    this.setData({
      deviceCurrent: newIndex,
      deviceCurrentChange: true,
      bluetoothInited: false,
      bluetoothSearched: false,
      connected: false,
    });
    wx.closeBluetoothAdapter({});
    this.connectDevice_event();
  },

 pages_to(e: WechatMiniprogram.BaseEvent) {
    const url = e.currentTarget.dataset.url;
    if (url === 'camera') {
      // 1. 确保设备列表不为空
      if (this.data.deviceList.length === 0) {
        wx.showToast({ title: '没有可操作的设备', icon: 'none' });
        return;
      }

      // 2. 获取当前选中的设备信息
      const currentDevice = this.data.deviceList[this.data.deviceCurrent];
      if (!currentDevice) {
        wx.showToast({ title: '无法获取当前设备信息', icon: 'none' });
        return;
      }

      // 3. 判断 cameraId 是否存在且有效（不为 0 或 null）
      if (currentDevice.cameraId) {
        // 如果存在，跳转到摄像头展示页
        console.log(`摄像头存在，ID: ${currentDevice.cameraId}。跳转到 show 页面。`);
        wx.navigateTo({
          url: `/pages/camera/show/show?id=${currentDevice.cameraId}`
        });
      } else {
        // 如果不存在，跳转到设备搜索页
        console.log(`摄像头不存在。跳转到 afterSearch 页面，并传递床的ID: ${currentDevice.id}`);
        wx.navigateTo({
          url: `/pages/afterSearch/afterSearch?id=${currentDevice.id}`
        });
      }

      // 处理完 camera 的逻辑后，直接返回，不再执行后续通用逻辑
      return;
    }
    this.hideNavPopup();
    this.hide_popu();

    wx.navigateTo({ url });
  },

  onScan() {
    this.hideNavPopup();
    this.setData({ popupShow: false });
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        console.log(res.result);
        // Handle scanned QR code logic
      },
      fail: () => {
        this.uToast('扫码失败');
      }
    });
  },

  modal_show_event(e: WechatMiniprogram.BaseEvent) {
    const item = e.currentTarget.dataset.item;
    let content_msg = '';
    if (this.data.deviceList[this.data.deviceCurrent].isconnected) {
      content_msg = `确定要打开${item.name}吗？`; // Simplified

      wx.showModal({
        title: '提示',
        content: content_msg,
        success: (res) => {
          if (res.confirm) {
            this.setData({ active_model: item });
            this.blue_write();
          }
        }
      });
    } else {
      this.uToast("设备未连接");
    }
  },


  async getDeviceList() {
    try {
      const res = await bedDeviceApi.getBedList();
      if (res.data && res.data.code === 0) {
        const list = res.data.data.list || [];
        const formattedList = list.map((item: any) => ({
          ...item,
          productName: item.bedName,
          bedname: item.bedName,
          isconnected: false,
          bedCmd: -1,
          islight: false
        }));

        this.setData({ deviceList: formattedList });
        app.globalData.allDeviceList = formattedList;

        // 如果获取到设备列表，则初始化蓝牙
        if (formattedList.length > 0) {
          this.pageInitBule();
        }
      } else {
        this.uToast(res.data.msg || '获取设备列表失败');
        this.setData({ deviceList: [] });
      }
    } catch (error: any) {
      console.error('getDeviceList error:', error);
      this.uToast(error.message || '网络错误，请稍后再试');
      this.setData({ deviceList: [] });
    }
  },

  async connectDevice_event() {
    await this.getDeviceList();

  },

  uToast(title: string) {
    wx.showToast({ title, icon: 'none' });
  },

  pageInitBule() {
    this.openBluetoothAdapter();
  },

  openBluetoothAdapter() {
    wx.openBluetoothAdapter({
      success: (e) => {
        this.setData({ bluetoothInited: true });
        this.onBLEConnectionStateChange();
        this.getBluetoothAdapterState();
      },
      fail: (e) => {
        this.setData({ bluetoothInited: false });
        this.initTypes(e.errCode);
      },
    });
  },

  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        if (res.available) {
          this.startBluetoothDevicesDiscovery();
        }
      }
    });
  },

  startBluetoothDevicesDiscovery() {
    if (this.data.bluetoothSearched) return;
    this.setData({ bluetoothSearched: true });
    wx.startBluetoothDevicesDiscovery({
      success: (e) => {
        this.onBluetoothDeviceFound();
      },
      fail: (e) => {
        this.setData({ bluetoothSearched: false });
      }
    });
  },

  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound(() => {
      this.getBluetoothDevices();
    });
  },

  getBluetoothDevices() {
    const that = this;
    wx.getBluetoothDevices({
      success: (res) => {
        const currentDeviceName = that.data.deviceList[that.data.deviceCurrent].bedname;
        const foundDevice = res.devices.find(d => d.name && d.name.includes(currentDeviceName));
        if (foundDevice) {
          that.createBLEConnection(foundDevice);
        }
      }
    });
  },

  createBLEConnection(device: any) {
    const that = this;
    wx.createBLEConnection({
      deviceId: device.deviceId,
      success: () => {
        that.stopBluetoothDevicesDiscovery();
        that.setData({ connected: true });
        that.getBLEDeviceServices(device);
      },
    });
  },

  getBLEDeviceServices(device: any) {
    const that = this;
    wx.getBLEDeviceServices({
      deviceId: device.deviceId,
      success: (res) => {
      }
    });
  },

  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery({});
  },

  onBLEConnectionStateChange() {
    const that = this;
    wx.onBLEConnectionStateChange((res) => {
      const isConnected = res.connected;
      that.setData({
        [`deviceList[${that.data.deviceCurrent}].isconnected`]: isConnected
      });
      if (!isConnected) {
        that.setData({
          [`deviceList[${that.data.deviceCurrent}].bedCmd`]: -1,
          [`deviceList[${that.data.deviceCurrent}].islight`]: false,
        });
      }
    });
  },

  blue_write() {
    const buffer = this.getBluetoothInstruct(this.data.active_model.cmd);
    wx.writeBLECharacteristicValue({
      deviceId: this.data.connect_blue_deviceInfo.deviceId,
      serviceId: this.data.connect_blue_deviceInfo.serviceId,
      characteristicId: this.data.connect_blue_deviceInfo.characteristicId,
      value: buffer,
      success: (res) => {
        console.log('Write success');
      }
    });
  },

  getBluetoothInstruct(hexStr: string) {
    const typedArray = new Uint8Array(hexStr.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)));
    return typedArray.buffer;
  },

  initTypes(code: number) {
    const errorMessages: { [key: number]: string } = {
      10001: '未检测到蓝牙，请打开蓝牙重试！',
      10002: '沒有找到指定设备',
      10003: '连接失败',
    };
    const msg = errorMessages[code] || '未知蓝牙错误';
    this.uToast(msg);
  },

  async checkNotice() {
  }
});
```

### 文件路径: `src\pages\index\index.wxml`

```wxml
<t-navbar t-class-placeholder="t-navbar-placeholder" t-class-content="t-navbar-content" t-class="t-class-navbar">
  <view slot="left">
    <t-icon name="add" size="48rpx" color="#fff" bind:click="onIconTap" />
  </view>
</t-navbar>
<view wx:if="{{navPopupShow}}">
  <!-- 透明遮罩层，点击关闭菜单 -->
  <view class="nav-popup-overlay" bind:tap="hideNavPopup"></view>
  <!-- 菜单内容 -->
  <view class="nav-popup">
    <view class="nav-popup-item" bind:tap="pages_to" data-url="/pages/index/searchDevice/afterSearch">
      <image class="w-8 h-8" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/pop_icon/ic_cp_tjsb.png"></image>
      <text class="ml-3 text-sm">添加设备</text>
    </view>
    <view class="nav-popup-item" bind:tap="onScan">
      <image class="w-8 h-8" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/pop_icon/ic_cp_sys.png"></image>
      <text class="ml-3 text-sm">扫一扫</text>
    </view>
  </view>
</view>
<view>
  <view class="swiper_content" style="background-image: url({{backgroundImage}})">
    <view class="flex justify-between items-center px-8 pt-12">
      <image src="../../assets/images/plus_icon.png" class="w-6 h-6" bind:tap="show_popu"></image>
      <scroll-view scroll-x="true" class="flex-1 text-center whitespace-nowrap">
        <block wx:for="{{deviceList}}" wx:key="productBedId">
          <view class="inline-block px-4 py-2 text-lg {{deviceCurrent === index ? 'text-white font-bold' : 'text-gray-300'}}" bind:tap="deviceChange" data-index="{{index}}">
            {{item.productName}}
          </view>
        </block>
      </scroll-view>
    </view>
  </view>

  <image class="absolute w-2/5 top-32 left-4" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/tab_icon/logo.png" mode="widthFix"></image>

  <view wx:if="{{deviceList.length > 0}}" class="absolute top-28 right-4" bind:tap="connectDevice_event">
    <view class="flex items-center p-2 rounded-full {{deviceList[deviceCurrent].isconnected ? 'text-green-500' : 'text-yellow-600'}}">
      <view class="w-3 h-3 rounded-full {{deviceList[deviceCurrent].isconnected ? 'bg-green-500' : 'bg-yellow-600'}}"></view>
      <text class="ml-2 text-sm font-semibold">{{deviceList[deviceCurrent].isconnected ? '蓝牙已连接' : '立即连接'}}</text>
    </view>
  </view>

  <view wx:if="{{deviceList.length > 0}}" class="menu_content">
    <view class="menu_item">
      <view class="p-5">
        <block wx:for="{{menu_item_list}}" wx:key="current">
          <view class="btn flex items-center justify-between p-4 mb-4" bind:tap="modal_show_event" data-item="{{item}}">
            <view class="flex items-center">
              <image class="w-6 h-6" src="{{item.current === deviceList[deviceCurrent].bedCmd ? item.active_icon : item.active_normol}}"></image>
              <text class="ml-4 text-base font-semibold">{{item.name}}</text>
            </view>
            <image class="w-6 h-6" src="{{item.current === deviceList[deviceCurrent].bedCmd ? item.power_active : item.power_enabel}}"></image>
          </view>
        </block>

        <view class="btn flex items-center justify-between p-4 mb-4" bind:tap="modal_show_event" data-item="{{light_info}}">
          <view class="flex items-center">
            <image class="w-6 h-6" src="{{deviceList[deviceCurrent].islight ? light_info.active_icon : light_info.active_normol}}"></image>
            <text class="ml-4 text-base font-semibold">{{light_info.name}}</text>
          </view>
          <image class="w-6 h-6" src="{{deviceList[deviceCurrent].islight ? light_info.power_active : light_info.power_enabel}}"></image>
        </view>
      </view>

      <view class="flex justify-between text-yellow-700 text-center font-bold px-5">
        <view class="btn flex-1 py-3 mr-2" bind:tap="pages_to" data-url="/pages/index/systemSetting/systemSetting">系统功能</view>
        <view class="btn flex-1 py-3 ml-2" bind:tap="pages_to" data-url="camera">摄像头</view>
      </view>
    </view>
  </view>

  <view wx:else class="text-center mt-10">
    <view class="flex justify-around items-center p-4 text-gray-700 text-sm">
      <view>
        <view class="font-bold">24小时看护</view>
        <view class="text-xs text-gray-500 mt-2">监护安全</view>
      </view>
      <view class="text-gray-300">|</view>
      <view>
        <view class="font-bold">智能电动升降</view>
        <view class="text-xs text-gray-500 mt-2">解放双手</view>
      </view>
      <view class="text-gray-300">|</view>
      <view>
        <view class="font-bold">AI育儿管家</view>
        <view class="text-xs text-gray-500 mt-2">科学育儿</view>
      </view>
    </view>

    <view class="main-width mt-10">
      <view class="connect_device py-4" bind:tap="pages_to" data-url="/pages/afterSearch/afterSearch">添加设备</view>
      <view class="connect_device py-4 mt-8" bind:tap="onScan">扫一扫</view>
    </view>
  </view>

  <view wx:if="{{popupShow}}" class="fixed inset-0 bg-black bg-opacity-50 z-50" bind:tap="hide_popu">
    <view class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg w-64 p-2 text-gray-800" catch:tap>
      <view class="flex items-center p-3" bind:tap="pages_to" data-url="/pages/index/searchDevice/afterSearch">
        <image class="w-8 h-8" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/pop_icon/ic_cp_tjsb.png"></image>
        <text class="ml-3">添加设备</text>
      </view>
      <view class="flex items-center p-3" bind:tap="pages_to" data-url="/pages/mine/Devices/Devices">
        <image class="w-8 h-8" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/pop_icon/ic_cp_fx.png"></image>
        <text class="ml-3">设备分享</text>
      </view>
      <view class="flex items-center p-3" bind:tap="onScan">
        <image class="w-8 h-8" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/pop_icon/ic_cp_sys.png"></image>
        <text class="ml-3">扫一扫</text>
      </view>
    </view>
  </view>

  <view wx:if="{{open_Show}}" class="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50">
    <view class="font-bold text-xl text-center p-6">{{active_model.name}}</view>
    <view class="p-4">
      <image src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/gif/product.gif" mode="widthFix" class="w-full"></image>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\inputDevice\inputDevice.json`

```json
{
  "navigationBarTitleText": "手动添加设备",
  "usingComponents": {},
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff"
}
```

### 文件路径: `src\pages\inputDevice\inputDevice.scss`

```scss
/* pages/index/addDevice/inputDevice/inputDevice.scss */

page {
  background-color: #F5F5F7;
}

.footer {
  // 使用 tailwindcss 的 shadow-md 替代
  // box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}
```

### 文件路径: `src\pages\inputDevice\inputDevice.ts`

```ts
// pages/index/addDevice/inputDevice/inputDevice.ts

// 获取小程序全局实例
const app = getApp();

Page({
  data: {
    deviceName: '',
    sn: '',
    blueName: '',
    mac: '',
    isAdding: false, // 防止重复点击
  },

  /**
   * 生命周期函数--监听页面加载
   * 获取从上个页面传来的参数
   */
  onLoad(options: { sn: string; name: string; mac: string }) {
    this.setData({
      sn: options.sn || '',
      blueName: options.name || '',
      mac: options.mac || '',
    });
  },

  /**
   * 监听输入框内容变化
   */
  onDeviceNameInput(event: WechatMiniprogram.Input) {
      this.setData({
          deviceName: event.detail.value
      });
  },

  /**
   * 确认添加设备
   */
  async confirmBtn() {
    if (this.data.isAdding) {
      return; // 如果正在添加，则不执行任何操作
    }

    if (!this.data.deviceName.trim()) {
      wx.showToast({
        title: '请输入设备别名',
        icon: 'none',
      });
      return;
    }

    this.setData({ isAdding: true });
    wx.showLoading({
      title: '设备添加中',
      mask: true,
    });

    // 模拟API调用，请替换为您的真实API请求
    wx.request({
      url: 'YOUR_API_ENDPOINT/addbed', // 替换为您的API地址
      method: 'POST',
      data: {
        userid: app.globalData.userInfo.userid,
        productSN: this.data.sn,
        deviceName: this.data.deviceName,
        name: this.data.blueName,
        mac: this.data.mac,
      },
      success: (res) => {
        // 假设API返回成功
        if (res.statusCode === 200) {
          app.globalData.allDeviceList = []; // 清空全局设备列表缓存
          wx.showToast({
            title: '添加成功',
            icon: 'success',
          });

          // 2秒后跳转到首页
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/index/index',
            });
          }, 2000);

        } else {
          // 处理API错误
          wx.showToast({
            title: '添加失败，请重试',
            icon: 'none',
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none',
        });
      },
      complete: () => {
        wx.hideLoading();
        this.setData({ isAdding: false });
      },
    });
  },
});
```

### 文件路径: `src\pages\inputDevice\inputDevice.wxml`

```wxml
<view class="container main-width mt-4">
    <view class="bg-white rounded-lg p-4 flex items-center">
      <text class="text-gray-700">设备名称:</text>
      <input
        class="flex-1 ml-4"
        placeholder="请输入设备别名"
        model:value="{{deviceName}}"
        bindinput="onDeviceNameInput"
      />
    </view>


    <button
      class="w-full bg-yellow-600 text-white py-3 rounded mt-4"
      bind:tap="confirmBtn"
      disabled="{{isAdding}}"
    >
      {{isAdding ? '添加中...' : '添加'}}
    </button>

</view>
```

### 文件路径: `src\pages\login\login.json`

```json
{
  "navigationStyle": "custom",
  "enablePullDownRefresh": false,
  "disableScroll": true
}
```

### 文件路径: `src\pages\login\login.scss`

```scss
/* pages/login/login.scss */
page {
  height: 100%;
}

.main-container {
  width: 100%;
  height: 100%;
  background-image: linear-gradient(#F2EAC2, #FFFFFF 30%);
}

.login-btn {
  background-color: #BDA01E;
  color: white;
  border-radius: 8px; /* 使用 tailwind 的 rounded-lg 也可以 */

  &::after {
    border: none;
  }
}
```

### 文件路径: `src\pages\login\login.ts`

```ts
const app = getApp();

Page({
  data: {
    checked: false,
    loginInfo: null as any, // 用于存储后端返回的 sessionKey 等信息
  },

  onLoad() {
    this.getSessionInfo();
  },

  /**
   * 步骤一：获取 code，并从后端换取 sessionKey, openid 等信息
   */
  getSessionInfo() {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('wx.login code:', res.code);
          // TODO: 替换为您的后端API请求
          // const response = await yourApi.minilogin({ code: res.code, relogin: true });
          // this.setData({ loginInfo: response.data });

          // --- 模拟API返回 ---
          console.log("正在模拟从后端获取 sessionKey 和 openid...");
          setTimeout(() => {
            this.setData({
              loginInfo: {
                sessionKey: 'mock_session_key_12345',
                openid: 'mock_openid_67890',
                unionid: 'mock_unionid_abcde'
              }
            });
            console.log("模拟 sessionKey 获取成功!");
          }, 500);
          // --- 模拟结束 ---

        } else {
          console.error('wx.login 失败！' + res.errMsg);
        }
      }
    });
  },

  /**
   * 未勾选协议时点击登录的提示
   */
  checkLogin() {
    wx.showToast({
      title: '请阅读并勾选用户协议',
      icon: 'none'
    });
  },

  /**
   * 步骤二：用户授权手机号后的回调
   */
  login(e: WechatMiniprogram.ButtonGetPhoneNumber) {
    if (e.detail.errMsg && e.detail.errMsg.includes("ok")) {
      console.log('用户同意授权手机号');
      // TODO: 替换为您的后端API请求，以解密手机号并完成登录/注册
      // const res = await yourApi.miniRegedit({
      //   sessionKey: this.data.loginInfo.sessionKey,
      //   encryptedData: e.detail.encryptedData,
      //   iv: e.detail.iv,
      //   openid: this.data.loginInfo.openid,
      //   unionid: this.data.loginInfo.unionid
      // });
      // if (res.code == 200) {
      //   app.globalData.userInfo = res.data;
      //   app.globalData.isLogin = true;
      //   ...
      // }

      // --- 模拟API调用和成功登录 ---
      console.log("正在模拟后端验证并登录...");
      wx.showLoading({ title: '登录中...' });
      setTimeout(() => {
        wx.hideLoading();
        app.globalData.userInfo = { nickname: '微信用户', avatar: '' }; // 模拟用户信息
        app.globalData.isLogin = true;

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500,
          complete: () => {
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index'
              });
            }, 1500);
          }
        });
      }, 1000);
      // --- 模拟结束 ---

    } else {
      console.log('用户拒绝授权手机号');
      wx.showToast({
        title: '您已取消授权',
        icon: 'none'
      });
    }
  },

  /**
   * 稍后登录（返回上一页）
   */
  loginBack() {
    wx.navigateBack();
  },

  /**
   * 切换复选框状态
   */
  toggleCheck() {
    this.setData({
      checked: !this.data.checked,
    });
  },

  /**
   * 跳转到协议/政策页面
   */
  goToPage(e: WechatMiniprogram.BaseEvent) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
    }
  }
});
```

### 文件路径: `src\pages\login\login.wxml`

```wxml
<view class="main-container">
  <view class="h-3/5 flex items-center justify-center">
    <view>
      <image class="w-96" src="https://braha.oss-cn-beijing.aliyuncs.com/app_info/images/logo_main.png" mode="widthFix"></image>
      <view class="text-center mt-4 text-yellow-700">科技因“爱”而生 智能因“你”而来</view>
    </view>
  </view>

  <view class="h-2/5 px-16">
    <button wx:if="{{!checked}}" class="login-btn" bind:tap="checkLogin">立即登录</button>
    <button wx:else class="login-btn" open-type="getPhoneNumber" bind:getphonenumber="login">立即登录</button>

    <view class="text-center text-lg text-gray-500 mt-12" bind:tap="loginBack">
      <text>稍后登录</text>
    </view>

    <view class="flex justify-center items-center mt-8" bind:tap="toggleCheck">
      <image class="w-5 h-5 mr-2" src="{{checked ? '../../assets/images/checkbox_on.png' : '../../assets/images/checkbox_off.png'}}"></image>
      <view class="text-xs">
        <text>我已阅读并同意</text>
        <text class="text-yellow-700" catch:tap="goToPage" data-url="/pages/mine/settting/UserAgreement">《用户协议》</text>
        <text>和</text>
        <text class="text-yellow-700" catch:tap="goToPage" data-url="/pages/mine/settting/PrivacyPolicy">《隐私政策》</text>
      </view>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\memo\memo.json`

```json
{
  "navigationBarTitleText": "产品",
  "usingComponents": {},
  "navigationBarBackgroundColor": "#fff",
  "navigationBarTextStyle": "black"
}
```

### 文件路径: `src\pages\memo\memo.scss`

```scss

```

### 文件路径: `src\pages\memo\memo.ts`

```ts
// pages/memo/memo.ts

// 定义Banner和Product的数据结构
interface BannerItem {
  id: number;
  bannerImg: string;
}

interface ProductItem {
  id: number;
  productImg: string;
  productName: string;
  memo: string; // 用于跳转详情页的参数
}

Page({
  data: {
    bannerList: [] as BannerItem[],
    productList: [] as ProductItem[],
  },

  onLoad() {
    this.getBanner();
    this.getProduct();
  },
  onShow() {
    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }
  },
  /**
   * 获取轮播图数据
   * 这里应替换为您项目的实际API请求
   */
  getBanner() {
    // 模拟API返回
    const mockBanners: BannerItem[] = [
      { id: 1, bannerImg: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/swiper/img_cp_sc.png' },
      { id: 2, bannerImg: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/swiper/img_cp_nbt.png' }
    ];
    this.setData({ bannerList: mockBanners });

    /*
    // 实际的 wx.request 调用示例
    wx.request({
      url: 'YOUR_API_ENDPOINT/getBanner',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ bannerList: res.data.data });
        }
      }
    });
    */
  },

  /**
   * 获取产品列表数据
   * 这里应替换为您项目的实际API请求
   */
  getProduct() {
    // 模拟API返回
    const mockProducts: ProductItem[] = [
        { id: 1, productName: '智能床', productImg: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_nbt.png', memo: 'bed_memo_1' },
        { id: 2, productName: '智能摄像头', productImg: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_nbt.png', memo: 'camera_memo_1' }
    ];
    this.setData({ productList: mockProducts });
    /*
    // 实际的 wx.request 调用示例
    wx.request({
      url: 'YOUR_API_ENDPOINT/getProductMemo',
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ productList: res.data.data });
        }
      }
    });
    */
  },

  /**
   * 跳转到产品详情页
   */
  page_to(event: WechatMiniprogram.BaseEvent) {
    const memo = event.currentTarget.dataset.memo;
    if (memo) {
      wx.navigateTo({
        url: `/pages/memo/bed_detail?current=${encodeURIComponent(memo)}`
      });
    } else {
      wx.showToast({
        title: '产品信息错误',
        icon: 'none'
      });
    }
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '产品介绍',
      path: '/pages/memo/memo'
    };
  }
});
```

### 文件路径: `src\pages\memo\memo.wxml`

```wxml
<view class="container">
  <swiper class="w-full h-72" indicator-dots="{{true}}" autoplay="{{true}}" interval="{{5000}}" duration="{{500}}">
    <block wx:for="{{bannerList}}" wx:key="id">
      <swiper-item>
        <image src="{{item.bannerImg}}" class="w-full h-full" mode="aspectFill" />
      </swiper-item>
    </block>
  </swiper>

  <view class="main-width mt-4">
    <image class="w-full rounded-lg" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/memo/buy_detail.jpg" mode="widthFix"></image>
  </view>

  <view class="main-width mt-4">
    <view class="flex flex-wrap justify-between">
      <block wx:for="{{productList}}" wx:key="id">
        <view class="w-1/2 text-center mb-4 {{index % 2 === 0 ? 'pr-2' : 'pl-2'}}" bind:tap="page_to" data-memo="{{item.memo}}">
          <image class="w-full rounded-lg bg-white" src="{{item.productImg}}" mode="widthFix"></image>
          <text class="mt-2 block">{{item.productName}}</text>
        </view>
      </block>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\mine\mine.json`

```json
{
  "navigationStyle": "custom",
  "usingComponents": {}
}
```

### 文件路径: `src\pages\mine\mine.scss`

```scss
page {
  background-color: #F5F5F7;
}

.header-bg {
  background-image: linear-gradient(90deg, rgba(235, 210, 69, 0.3), rgba(224, 152, 19, 0.5));
}

// 为菜单项添加点击效果
.border-b {
  &:last-child {
    border-bottom: none;
  }
  &:active {
    background-color: #f9f9f9;
  }
}
.t-cell-group--card {
  margin: 0 !important;
}
```

### 文件路径: `src\pages\mine\mine.ts`

```ts
// pages/mine/mine.ts

// 假设 App 的 globalData 结构
interface IAppOption {
  globalData: {
    userInfo?: any;
    isLogin?: boolean;
  }
}

const app = getApp<IAppOption>();

Page({
  data: {
    avatarUrl: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/avatar.png',
    userInfo: null as any,
  },

  onShow() {

    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }

    // 页面显示时，从全局数据更新用户信息
    const userInfo = app.globalData.userInfo;
    this.setData({
      userInfo: userInfo,
      avatarUrl: userInfo?.avatar || 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/mine/avatar.png'
    });
  },

  /**
   * 检查登录状态并跳转
   * 如果已登录，跳转到用户信息页；否则，触发登录流程
   */
  logincheck() {
    if (app.globalData.isLogin) {
      wx.navigateTo({ url: '/pages/mine/userInfo/userInfo' });
    } else {
      // 调用全局登录处理函数
      // loginManager();
      console.log("需要触发登录流程");
      wx.navigateTo({ url: '/pages/login/login' }); // 假设跳转到登录页
    }
  },

  /**
   * 通用页面跳转
   */
  page_to(event: WechatMiniprogram.BaseEvent) {
    const url = event.currentTarget.dataset.url;
    if (!url) return;

    if (app.globalData.isLogin) {
      wx.navigateTo({ url });
    } else {
      // loginManager();
      console.log("需要触发登录流程");
      wx.navigateTo({ url: '/pages/login/login' }); // 假设跳转到登录页
    }
  },

  /**
   * 跳转到编辑用户信息页面
   */
  set_user() {
    wx.navigateTo({ url: '/pages/mine/userInfo/userInfo' });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '个人中心',
      path: '/pages/mine/mine'
    };
  }
});
```

### 文件路径: `src\pages\mine\mine.wxml`

```wxml
<view class="container">
  <view class="header-bg pt-12 pb-20 px-6">
    <view class="flex items-center mt-12">
      <image class="w-20 h-20 rounded-full border-2 border-white" src="{{avatarUrl}}" bind:tap="logincheck"></image>

      <view wx:if="{{!userInfo.nickname}}" class="ml-4">
        <text class="text-xl font-bold">未登录</text>
      </view>

      <view wx:else class="flex flex-1 items-center justify-between ml-4" bind:tap="set_user">
        <view>
          <view class="text-xl font-bold">{{userInfo.nickname}}</view>
          <view class="text-sm text-gray-700 mt-1">{{userInfo.phone}}</view>
        </view>
        <image src="../../assets/images/edit_icon.png" class="w-6 h-6"></image>
      </view>
    </view>
  </view>

  <view class="main-width -mt-10" bind:tap="page_to" data-url="/pages/baby/baby">
    <image class="w-full" src="../../assets/images/img_wd_banner.png" mode="widthFix"></image>
  </view>

<view class="main-width mt-3">
<t-cell-group theme="card">
  <t-cell title="我的设备" leftIcon="{{ {name:'service',color:'#ebb53b'} }}" hover arrow />
  <t-cell title="软件设置" leftIcon="{{ {name:'internet',color:'#ebb53b'} }}" hover arrow />
  <t-cell title="意见反馈" leftIcon="{{ {name:'lock-on',color:'#ebb53b'} }}" hover arrow />
  <t-cell title="关于我们" leftIcon="{{ {name:'lock-on',color:'#ebb53b'} }}" hover arrow />
</t-cell-group>
</view>
</view>
```

### 文件路径: `src\pages\msg\msg.json`

```json
{
  "navigationStyle": "custom",
  "usingComponents": {
    "t-navbar": "tdesign-miniprogram/navbar/navbar"
  }
}
```

### 文件路径: `src\pages\msg\msg.scss`

```scss
page {
  background-color: #F5F5F7;
  height: 100%;

}

.container {
  height: 100%;
}
.t-navbar__center {
  width: 260px !important;
  left: 16px !important;
  text-align: left !important;
}

// 确保 t-navbar 的占位符有背景色，并且内容区域宽度正确
.t-navbar-placeholder {
  background-color: #ffffff;
  width: 100%;
}

// 移除 t-tabs 默认的一些边距或边框，使其更好地融入 navbar
.t-tabs {
  .t-tabs__nav-item {
    padding: 0 40rpx; // 调整 tab 间距
  }
}
```

### 文件路径: `src\pages\msg\msg.ts`

```ts
// pages/msg/msg.ts

Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabList: [
      { name: '全部' },
      { name: '系统消息' },
      { name: '故障消息' },
    ],
    current: 0, // 当前激活的 tab 索引
  },

  /**
   * 切换 Tab
   */
  changeTab(event: WechatMiniprogram.BaseEvent) {
    const index = event.currentTarget.dataset.index;
    if (this.data.current !== index) {
      this.setData({
        current: index,
      });
      // 在这里可以添加获取不同类型消息的逻辑
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 页面加载时可以获取初始消息列表
  },
  onShow() {
    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }
  },
  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '我的消息',
      path: '/pages/msg/msg'
    };
  }
});
```

### 文件路径: `src\pages\msg\msg.wxml`

```wxml
<view class="container">
  <t-navbar>
    <view slot="title" class="w-full flex justify-center">
      <view class="flex">
        <block wx:for="{{tabList}}" wx:key="index">
          <view class="py-3 text-center mr-6 text-sm" bind:tap="changeTab" data-index="{{index}}">
            <text class="{{current === index ? 'text-yellow-600 font-bold' : 'text-gray-600'}}">{{item.name}}</text>
            <view class="h-1 mt-1 {{current === index ? 'bg-yellow-600 rounded-full' : 'bg-transparent'}} transition-all"></view>
          </view>
        </block>
      </view>
    </view>
  </t-navbar>

  <view class="content">
    <view class="empty-message flex flex-col items-center justify-center pt-48">
<t-empty icon="{{ {name:'error-circle', size:'98rpx'} }}" description="暂无消息" />
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\newDevice\newDevice.json`

```json
{
  "navigationBarTitleText": "添加摄像头",
  "usingComponents": {},
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff"
}
```

### 文件路径: `src\pages\newDevice\newDevice.scss`

```scss
/* pages/index/addDevice/newDevice.scss */

page {
  background-color: #F5F5F7;
}
```

### 文件路径: `src\pages\newDevice\newDevice.ts`

```ts
// pages/index/addDevice/newDevice.ts

// 获取全局 app 实例
const app = getApp();

Page({
  data: {
    productId: '',
    deviceIotName: '',
    bed_id: -1, // 关联的床ID
  },

  onLoad(options: { bed_id?: string }) {
    if (options.bed_id) {
      this.setData({
        bed_id: parseInt(options.bed_id, 10),
      });
    }
  },

  /**
   * 监听产品ID输入
   */
  onProductIdInput(event: WechatMiniprogram.Input) {
    this.setData({
      productId: event.detail.value,
    });
  },

  /**
   * 监听设备ID输入
   */
  onDeviceIdInput(event: WechatMiniprogram.Input) {
    this.setData({
      deviceIotName: event.detail.value,
    });
  },

  /**
   * 扫码识别
   */
  scanCode() {
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        try {
          const result = JSON.parse(res.result);
          if (result.ProductId && result.DeviceName) {
            this.setData({
              productId: result.ProductId,
              deviceIotName: result.DeviceName,
            });
          } else {
            this.showToast('二维码格式不正确');
          }
        } catch (error) {
          this.showToast('无法解析二维码');
        }
      },
      fail: () => {
        this.showToast('扫码失败');
      }
    });
  },

  /**
   * 确认添加按钮
   */
  confirmBtn() {
    if (!this.data.productId || !this.data.deviceIotName) {
      this.showToast('请输入完整的设备信息！');
      return;
    }

    // 实际项目中应替换为真实的 API 请求
    this.addCameraDevice();
  },

  /**
   * 添加摄像头设备 (API 请求)
   */
  addCameraDevice() {
    const that = this;
    const params = {
      productName: this.data.productId,
      productDeviceName: this.data.deviceIotName,
      userid: app.globalData.userInfo.userid,
      product_bed_id: this.data.bed_id,
    };

    // wx.request({
    //   url: 'YOUR_API_ENDPOINT/addCamera',
    //   method: 'POST',
    //   data: params,
    //   success(res) {
    //     if (res.data.success) { // 假设接口返回 { success: true, ... }
    //       app.globalData.allDeviceList = []; // 清空全局设备列表缓存
    //       that.checkDeviceStatus();
    //     } else {
    //       that.showToast(res.data.msg || '添加失败');
    //     }
    //   },
    //   fail() {
    //     that.showToast('请求失败');
    //   }
    // });

    // --- 以下为模拟成功逻辑 ---
    app.globalData.allDeviceList = [];
    this.checkDeviceStatus();
  },

  /**
   * 检查设备状态 (模拟)
   */
  checkDeviceStatus() {
    // 假设设备未配网，所以 result.data 为 0
    const deviceIsOnline = false;

    if (deviceIsOnline) {
      this.showToast('添加成功', () => {
        wx.switchTab({ url: '/pages/index/index' });
      });
    } else {
      // 显示配网提示
      wx.showModal({
        title: '提示',
        content: '添加成功, 是否立即配网？',
        confirmColor: '#BDA01E',
        success: (res) => {
          if (res.confirm) {
            this.navigateToNetworkConfig();
          } else if (res.cancel) {
            wx.switchTab({ url: '/pages/index/index' });
          }
        }
      });
    }
  },

  /**
   * 跳转到配网页面
   */
  navigateToNetworkConfig() {
    const { productId, deviceIotName } = this.data;
    wx.navigateTo({
      url: `/pages/index/cameraPlay/addCamera?productId=${productId}&deviceName=${deviceIotName}`
    });
  },

  /**
   * 封装 wx.showToast
   */
  showToast(title: string, callback?: () => void) {
      wx.showToast({
          title,
          icon: 'none',
          duration: 2000,
          complete: callback
      });
  }
});
```

### 文件路径: `src\pages\newDevice\newDevice.wxml`

```wxml
<view class="main-width mt-4">
  <view class="bg-white p-4 rounded-lg shadow-sm">
    <view class="flex justify-between items-center pb-4 border-b border-gray-100">
      <text class="text-yellow-600 font-bold">设备信息</text>
      <view class="flex items-center text-yellow-600" bind:tap="scanCode">
        <image class="w-5 h-5 mr-1" src="../../../assets/images/scan_icon.png"></image>
        <text>扫码识别</text>
      </view>
    </view>

    <view class="mt-6">
      <view class="flex items-center border-b border-gray-100 py-3">
        <text class="w-24 text-gray-700">产品ID:</text>
        <input class="flex-1" placeholder="请输入设备产品ID" value="{{productId}}" bindinput="onProductIdInput" />
      </view>
      <view class="flex items-center py-3 mt-4">
        <text class="w-24 text-gray-700">设备ID:</text>
        <input class="flex-1" placeholder="请输入设备ID" value="{{deviceIotName}}" bindinput="onDeviceIdInput" />
      </view>
    </view>
  </view>

  <view class="fixed bottom-12 left-0 right-0 px-4">
    <button class="bg-yellow-600 text-white w-full py-3 rounded-lg shadow-lg" bind:tap="confirmBtn">添加</button>
  </view>
</view>
```

### 文件路径: `src\pages\regedit\regedit.json`

```json
{
  "navigationBarTitleText": "",
  "navigationBarBackgroundColor": "#FFFFFF",
  "backgroundColor": "#FFFFFF"
}
```

### 文件路径: `src\pages\regedit\regedit.scss`

```scss
/* pages/login/regedit.scss */
page {
  background-color: #FFFFFF;
}

.view_bottom {
  position: fixed;
  width: 100%;
  left: 0;
  bottom: 0;
  padding-bottom: 60px; /* 适配 iPhone X 等机型 */
  padding-top: 20px;
  background-color: white;
}
```

### 文件路径: `src\pages\regedit\regedit.ts`

```ts
// pages/login/regedit.ts
// @ts-nocheck

const app = getApp();
let countdownInterval: any = null; // 用于存储倒计时定时器

Page({
  data: {
    phone: '',
    phone_code: '',
    openid: '',
    unionid: '',

    getcodeTxt: '获取验证码',
    issend: false,
    seconds: 60,

    codeFromServer: '', // 用于存储从服务器获取的验证码
    userInfo: null, // 用户信息
    checked: false,

    isButtonDisabled: true, // 控制“同意并继续”按钮的禁用状态
  },

  onLoad(options: any) {
    this.setData({
      openid: options.openid,
      unionid: options.unionid,
    });
  },

  onUnload() {
    // 页面卸载时清除定时器
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  },

  // --- 输入处理 ---
  onPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ phone: e.detail.value });
    this.checkButtonStatus();
  },

  onCodeInput(e: WechatMiniprogram.Input) {
    this.setData({ phone_code: e.detail.value });
    this.checkButtonStatus();
  },

  onCheckboxChange(e: WechatMiniprogram.CheckboxGroupChange) {
    this.setData({ checked: e.detail.value.length > 0 });
    this.checkButtonStatus();
  },

  // 检查是否可以启用主按钮
  checkButtonStatus() {
    const { phone, phone_code, checked } = this.data;
    const disabled = !(phone.length > 0 && phone_code.length > 0 && checked);
    this.setData({ isButtonDisabled: disabled });
  },

  // --- 核心逻辑 ---
  getCode() {
    if (!this.data.checked) {
      wx.showToast({ title: '请同意用户协议', icon: 'none' });
      return;
    }

    // 简单的手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    // --- 模拟API: 发送验证码 ---
    // this.$u.iotApi.sendCode(...)
    wx.showLoading({ title: '发送中...' });
    // 以下为模拟请求
    setTimeout(() => {
      wx.hideLoading();
      // 模拟成功
      const mockCode = "123456"; // 假设服务器返回的验证码
      this.setData({ codeFromServer: mockCode });
      wx.showToast({ title: `验证码已发送(模拟:${mockCode})`, icon: 'none' });
      this.startCountdown();

      // // 模拟手机号已注册的情况
      // wx.showModal({ ... });

    }, 1000);
  },

  regeditphone() {
    if (this.data.phone_code !== this.data.codeFromServer) {
      wx.showToast({ title: '验证码错误', icon: 'error' });
      return;
    }

    // --- 模拟API: 注册/登录 ---
    // this.$u.iotApi.register(...)
    wx.showLoading({ title: '登录中...' });
    setTimeout(() => {
        wx.hideLoading();
        // 模拟登录成功
        const mockUserInfo = { userId: '123', nickname: '微信用户' };
        app.globalData.userInfo = mockUserInfo;
        app.globalData.isLogin = true;
        wx.setStorageSync("userInfo", mockUserInfo);

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.switchTab({ url: "/pages/index/index" });
        }, 1500);

    }, 1000);
  },

  // --- 辅助函数 ---
  startCountdown() {
    this.setData({ issend: true });
    let { seconds } = this.data;

    countdownInterval = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(countdownInterval);
        this.setData({
          getcodeTxt: '再次获取',
          seconds: 60,
          issend: false,
        });
      } else {
        this.setData({
          getcodeTxt: `重新获取(${seconds}s)`,
          seconds: seconds,
        });
      }
    }, 1000);
  },

  // --- 页面跳转 ---
  goToUserAgreement() {
    wx.navigateTo({ url: '/pages/mine/settting/UserAgreement' });
  },

  goToPrivacyPolicy() {
    wx.navigateTo({ url: '/pages/mine/settting/PrivacyPolicy' });
  },
});
```

### 文件路径: `src\pages\regedit\regedit.wxml`

```wxml
<!-- pages/login/regedit.wxml -->
<view class="bg-white min-h-screen p-6">
  <!-- 标题 -->
  <view class="pt-10 pb-16 px-4">
    <view class="font-bold text-2xl">
      <view>与微信</view>
      <view>绑定手机号</view>
    </view>
  </view>

  <!-- 输入框 -->
  <view class="px-4 pt-10">
    <!-- 手机号输入 -->
    <view class="border-b py-2">
      <input type="number" class="w-full h-10" placeholder="在此输入手机号" placeholder-class="text-gray-400" bindinput="onPhoneInput" value="{{phone}}" />
    </view>

    <!-- 验证码输入 -->
    <view class="border-b py-2 flex items-center mt-4">
      <input type="number" class="flex-1 h-10" placeholder="请填写验证码" placeholder-class="text-gray-400" bindinput="onCodeInput" value="{{phone_code}}" />
      <button
        class="text-sm rounded-full px-4 py-1 {{issend ? 'bg-gray-400 text-white' : 'bg-yellow-600 text-white'}}"
        disabled="{{issend}}"
        bind:tap="getCode">
        {{getcodeTxt}}
      </button>
    </view>
  </view>

  <!-- 同意协议 -->
  <view class="flex justify-center items-center mt-6 px-4">
    <checkbox-group bindchange="onCheckboxChange">
       <checkbox value="true" checked="{{checked}}" color="#BDA01E" class="transform scale-75"></checkbox>
    </checkbox-group>
    <view class="text-xs ml-1">
      <text>我已阅读并同意</text>
      <text class="text-yellow-600" bind:tap="goToUserAgreement">《用户协议》</text>
      <text>和</text>
      <text class="text-yellow-600" bind:tap="goToPrivacyPolicy">《隐私政策》</text>
    </view>
  </view>

  <!-- 底部固定区域 -->
  <view class="view_bottom text-center">
    <view class="text-gray-500 text-sm">上述手机号仅用于登录验证</view>
    <view class="mt-6">
      <button
        class="w-4/5 rounded-full py-3 {{isButtonDisabled ? 'bg-yellow-300' : 'bg-yellow-600'}} text-white"
        disabled="{{isButtonDisabled}}"
        bind:tap="regeditphone">
        同意并继续
      </button>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\systemSetting\systemSetting.json`

```json
{
  "navigationBarTitleText": "系统功能",
  "enablePullDownRefresh": false,
  "usingComponents": {},
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff"
}
```

### 文件路径: `src\pages\systemSetting\systemSetting.scss`

```scss
page {
  background-color: #f5f5f7;
}
```

### 文件路径: `src\pages\systemSetting\systemSetting.ts`

```ts
Page({
  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 跳转到视频播放页面
   * @param event 点击事件对象
   */
  setVideo(event: WechatMiniprogram.BaseEvent) {
    // 从 data-type 属性中获取传递的参数
    const videoType = event.currentTarget.dataset.type;

    if (videoType) {
      wx.navigateTo({
        url: `/pages/video_set/video_set?title=${videoType}`
      });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 页面加载时可以执行的逻辑
  },
});
```

### 文件路径: `src\pages\systemSetting\systemSetting.wxml`

```wxml
<view class="container mt-4">
  <view class="bg-white">
    <view class="flex items-center p-3 border-b" bind:tap="setVideo" data-type="1">
      <image class="w-10 h-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/systemsetting/ic_cp_xtgn_cpsm.png"></image>
      <text class="ml-4 text-base">产品说明</text>
    </view>

    <view class="flex items-center p-3 border-b" bind:tap="setVideo" data-type="2">
      <image class="w-10 h-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/systemsetting/ic_cp_xtgn_cpsysm.png"></image>
      <text class="ml-4 text-base">产品使用视频</text>
    </view>

    <view class="flex items-center p-3 border-b" bind:tap="setVideo" data-type="3">
      <image class="w-10 h-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/systemsetting/ic_cp_xtgn_czsp.png"></image>
      <text class="ml-4 text-base">安装视频</text>
    </view>

    <view class="flex items-center p-3 border-b" bind:tap="setVideo" data-type="4">
      <image class="w-10 h-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/systemsetting/ic_cp_xtgn_cpsysm.png"></image>
      <text class="ml-4 text-base">复位视频</text>
    </view>

    <view class="flex items-center p-3" bind:tap="setVideo" data-type="5">
      <image class="w-10 h-10" src="http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/systemsetting/ic_cp_xtgn_cpsm.png"></image>
      <text class="ml-4 text-base">拆件视频</text>
    </view>
  </view>
</view>
```

### 文件路径: `src\pages\userInfo\userInfo.json`

```json
{
  "navigationBarTitleText": "编辑个人资料",
  "usingComponents": {},
  "navigationBarTextStyle": "black",
  "navigationBarBackgroundColor": "#ffffff"
}
```

### 文件路径: `src\pages\userInfo\userInfo.scss`

```scss
/* pages/mine/userInfo/userInfo.scss */

page {
  background-color: #f5f5f7;
}

.btn_style {
  background-color: #F2EAC2;
  border: solid 1px rgba(189, 160, 30, 0.3);
  color: #BDA01E;

  // 按钮按下的效果
  &:active {
    background-color: #F2EAC2;
  }
}
```

### 文件路径: `src\pages\userInfo\userInfo.ts`

```ts
// pages/mine/userInfo/userInfo.ts
// @ts-nocheck

// 获取 App 实例
const app = getApp();

interface UserInfo {
  nickname: string;
  phone: string;
  memo: string;
  avatar: string | null;
}

Page({
  data: {
    userInfo: null as UserInfo | null,
    imgUrl: '../../assets/images/avatar_default.png', // 默认头像路径
  },

  onLoad() {
    // 从全局数据加载用户信息
    const globalUserInfo = app.globalData.userInfo;
    if (globalUserInfo) {
      this.setData({
        userInfo: { ...globalUserInfo }, // 使用副本以避免直接修改全局数据
        imgUrl: globalUserInfo.avatar || this.data.imgUrl,
      });
    }
  },

  /**
   * 更新昵称输入
   */
  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({
      'userInfo.nickname': e.detail.value,
    });
  },

  /**
   * 更新简介输入
   */
  onMemoInput(e: WechatMiniprogram.Input) {
    this.setData({
      'userInfo.memo': e.detail.value,
    });
  },

  /**
   * 选择图片作为头像
   */
  chooseImage() {
    wx.chooseImage({
      sourceType: ['album'],
      sizeType: ['compressed'],
      count: 1,
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        // 将图片转换为 Base64 并立即上传
        this.convertImageToBase64(tempFilePath).then((base64) => {
          this.setData({
            'userInfo.avatar': base64,
            imgUrl: `data:image/jpeg;base64,${base64}`,
          });
          // 选择头像后自动触发保存
          this.confirm_save();
        });
      },
    });
  },

  /**
   * 将图片文件路径转换为 Base64 字符串
   */
  convertImageToBase64(imagePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileSystemManager = wx.getFileSystemManager();
      fileSystemManager.readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data as string);
        },
        fail: (err) => {
          console.error('图片转Base64失败:', err);
          reject(err);
        },
      });
    });
  },

  /**
   * 确认保存用户信息
   */
  async confirm_save() {
    if (!this.data.userInfo) return;

    // 模拟调用 API 更新用户信息
    console.log('正在保存用户信息:', this.data.userInfo);

    // 假设 API 调用成功
    // const res = await yourApi.updateUser(this.data.userInfo);

    // 更新全局数据和本地存储
    app.globalData.userInfo = { ...this.data.userInfo };
    wx.setStorageSync("userInfo", this.data.userInfo);

    wx.showToast({
      title: '修改成功',
      icon: 'success',
    });
  },
});
```

### 文件路径: `src\pages\userInfo\userInfo.wxml`

```wxml
<view class="container">
  <view class="bg-white main-width mt-4">
    <view class="flex items-center justify-between p-4 border-b" bind:tap="chooseImage">
      <text class="text-base">用户头像</text>
      <image class="w-16 h-16 rounded-full" src="{{imgUrl}}"></image>
    </view>

    <view class="flex items-center p-4 border-b">
      <text class="text-base w-28">用户昵称</text>
      <input class="flex-1 text-right" placeholder-class="text-gray-400" placeholder="请输入昵称" value="{{userInfo.nickname}}" bindinput="onNicknameInput" />
    </view>

    <view class="flex items-center p-4 border-b">
      <text class="text-base">绑定手机号</text>
      <text class="flex-1 text-right text-gray-500">{{userInfo.phone}}</text>
    </view>

    <view class="flex items-center p-4">
      <text class="text-base w-28">简介</text>
      <input class="flex-1 text-right" placeholder-class="text-gray-400" placeholder="请输入简介" value="{{userInfo.memo}}" bindinput="onMemoInput" />
    </view>
  </view>

  <view class="p-5 mt-8">
    <button class="btn_style" bind:tap="confirm_save">确定</button>
  </view>
</view>
```

### 文件路径: `src\pages\video_set\video_set.json`

```json
{
  "navigationStyle": "custom",
  "usingComponents": {}
}
```

### 文件路径: `src\pages\video_set\video_set.scss`

```scss
/* pages/index/systemSetting/video_set.scss */

page {
  background-color: #ffffff;
}

.custom-navbar {
  // 适配小程序胶囊按钮
  padding-top: var(--status-bar-height);
  height: calc(44px + var(--status-bar-height));
  line-height: 44px;
  position: relative;
}
```

### 文件路径: `src\pages\video_set\video_set.ts`

```ts
// pages/index/systemSetting/video_set.ts

Page({
  data: {
    title: '',
    videoUrl: '',
    current: -1,
    imageList: [] as number[], // 用于图片列表循环
  },

  onLoad(options: any) {
    // 将从 options 获取的字符串参数转换为数字
    const currentOption = parseInt(options.title, 10);
    this.setData({
      current: currentOption,
    });

    // 如果是产品说明，则生成一个图片序号数组
    if (currentOption === 1) {
      const images: number[] = [];
      for (let i = 1; i <= 36; i++) {
        images.push(i);
      }
      this.setData({ imageList: images });
    }

    // 初始化 video 上下文
    wx.createVideoContext("myVideo", this);

    this.setVideo();
  },

  /**
   * 视频播放出错回调
   */
  videoErrorCallback(e: any) {
    console.error('video error:', e.detail.errMsg);
  },

  /**
   * 根据页面参数设置标题和视频URL
   */
  setVideo() {
    let newTitle = '';
    let newVideoUrl = '';

    switch (this.data.current) {
      case 1:
        newTitle = '产品说明';
        break;
      case 2:
        newTitle = '说明视频';
        newVideoUrl = 'https://braha.oss-cn-beijing.aliyuncs.com/app/video/shiyongshipin.mp4';
        break;
      case 3:
        newTitle = '安装视频';
        newVideoUrl = 'https://braha.oss-cn-beijing.aliyuncs.com/app/video/setupvideo.mp4';
        break;
      case 4:
        newTitle = '复位视频';
        newVideoUrl = 'https://braha.oss-cn-beijing.aliyuncs.com/app/video/fuweishipin.mp4';
        break;
      case 5:
        newTitle = '拆件视频';
        newVideoUrl = 'https://braha.oss-cn-beijing.aliyuncs.com/app/video/chaijianshipin.mp4';
        break;
    }

    this.setData({
      title: newTitle,
      videoUrl: newVideoUrl
    });
  },

  /**
   * 返回上一页
   */
  navigateBack() {
    wx.navigateBack();
  }
});
```

### 文件路径: `src\pages\video_set\video_set.wxml`

```wxml
<view>
  <view class="custom-navbar sticky top-0 bg-white z-50 flex items-center justify-center shadow-sm">
    <view class="absolute left-4" bind:tap="navigateBack">
      <image src="../../assets/images/back_icon.png" class="w-6 h-6"></image>
    </view>
    <text class="font-bold text-lg">{{title}}</text>
  </view>

  <view wx:if="{{current != 1}}">
    <video
      id="myVideo"
      src="{{videoUrl}}"
      autoplay="{{true}}"
      class="w-full h-56"
      binderror="videoErrorCallback"
    ></video>
  </view>

  <view wx:else>
    <block wx:for="{{imageList}}" wx:key="*this">
      <image
        src="https://braha.oss-cn-beijing.aliyuncs.com/app/video/product_descrice/descrice/{{item}}.png"
        class="w-full"
        mode="widthFix"
      ></image>
    </block>
  </view>
</view>
```

### 文件路径: `src\components\iot-player-controls\iot-player-controls.json`

```json
{
  "component": true,
  "usingComponents": {}
}
```

### 文件路径: `src\components\iot-player-controls\iot-player-controls.scss`

```scss

```

### 文件路径: `src\components\iot-player-controls\iot-player-controls.ts`

```ts
Component({
  behaviors: ['wx://component-export'],
  properties: {
    showIcons: Object,
    iconSize: { type: Number, value: 25 },
    quality: String,
    muted: Boolean,
    orientation: String,
    rotate: Number,
    fill: Boolean,
    fullScreen: Boolean,
    record: Boolean,
  },
  methods: {
    clickIcon({ currentTarget: { dataset } }) {
      this.triggerEvent('clickicon', { name: dataset.name });
    },
  },
});
```

### 文件路径: `src\components\iot-player-controls\iot-player-controls.wxml`

```wxml
<view class="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-30 text-white flex items-center justify-between">
  <!-- Left Slot -->
  <view class="flex items-center space-x-4">
    <slot></slot>
  </view>

  <!-- Right Icons -->
  <view class="flex items-center space-x-4">
    <view wx:if="{{showIcons.muted}}" class="w-8 h-8 flex items-center justify-center" data-name="muted" bind:tap="clickIcon">
      <image class="w-6 h-6" src="{{muted ? './images/volume-off.svg' : './images/volume-up.svg'}}"/>
    </view>
    <view wx:if="{{showIcons.orientation}}" class="w-8 h-8 flex items-center justify-center font-bold" data-name="orientation" bind:tap="clickIcon">
      {{orientation === 'horizontal' ? 'H' : 'V'}}
    </view>
    <view wx:if="{{showIcons.fill}}" class="w-8 h-8 flex items-center justify-center font-bold text-xs" data-name="fill" bind:tap="clickIcon">
      {{fill ? 'FILL' : 'FIT'}}
    </view>
    <view wx:if="{{showIcons.snapshot}}" class="w-8 h-8 flex items-center justify-center" data-name="snapshot" bind:tap="clickIcon">
       <image class="w-6 h-6" src="./images/camera.svg"/>
    </view>
    <view wx:if="{{showIcons.fullScreen}}" class="w-8 h-8 flex items-center justify-center" data-name="fullScreen" bind:tap="clickIcon">
      <image class="w-6 h-6" src="{{fullScreen ? './images/fullscreen-exit.svg' : './images/fullscreen-enter.svg'}}"/>
    </view>
  </view>
</view>
```

### 文件路径: `src\components\Navbar\Navbar.json`

```json
{
  "$schema": "https://vite.icebreaker.top/component.json",
  "component": true,
  // 组件需要设置成 "apply-shared" 才能使用 app.wxss 里的全局样式
  "styleIsolation": "apply-shared",
  "usingComponents": {}
}
```

### 文件路径: `src\components\Navbar\Navbar.scss`

```scss

```

### 文件路径: `src\components\Navbar\Navbar.ts`

```ts
Component({

})
```

### 文件路径: `src\components\Navbar\Navbar.wxml`

```wxml

```

### 文件路径: `src\components\p2p-live-player\p2p-live-player.json`

```json
{
  "component": true,
  "usingComponents": {
    "iot-p2p-player-with-mjpg": "plugin://xp2p/iot-p2p-player-with-mjpg",
    "iot-player-controls": "../iot-player-controls/iot-player-controls"
  }
}
```

### 文件路径: `src\components\p2p-live-player\p2p-live-player.scss`

```scss

```

### 文件路径: `src\components\p2p-live-player\p2p-live-player.ts`

```ts
const app = getApp();
const console = app.logger || console;

Component({
  behaviors: ['wx://component-export'],
  options: {
    styleIsolation: 'apply-shared',
    multipleSlots: true,
  },
  properties: {
    compClass: String,
    deviceInfo: Object,
    xp2pInfo: String,
    streamQuality: String,
    // ... 其他属性保持不变
    liveStreamDomain: String,
    needCheckStream: Boolean,
    sceneType: String,
    streamChannel: Number,
    mode: String,
    soundMode: String,
    muted: Boolean,
    acceptPlayerEvents: Object,
    onlyp2pMap: Object,
    showLog: Boolean,
  },
  data: {
    playerId: 'iot-p2p-player',
    isPlaySuccess: false,
    fullScreen: false,
    record: false,
    orientation: 'vertical',
    fill: false,
    // 将清晰度列表和映射关系放入组件内部
    qualityList: [
      { value: 'standard', text: '标清' },
      { value: 'high', text: '高清' },
      { value: 'super', text: '超清' },
    ],
    qualityMap: {
      standard: '标清',
      high: '高清',
      super: '超清',
    },
    // 将内部清晰度状态与属性分开，方便控制
    innerStreamQuality: '',
  },
  lifetimes: {
    attached() {
      // 初始化时，将外部传入的清晰度赋值给内部状态
      this.setData({
        innerStreamQuality: this.properties.streamQuality,
      });
    },
    ready() {
      // @ts-ignore
      this.player = this.selectComponent(`#${this.data.playerId}`);
    },
  },
  export() {
    return {
      isPlaySuccess: () => this.data.isPlaySuccess,
      snapshotAndSave: () => this.snapshotAndSave(),
      startRecordFlv: (options: any) => this.startRecordFlv(options),
      stopRecordFlv: () => this.stopRecordFlv(),
      requestFullScreen: (options: any) => this.player?.requestFullScreen(options),
      exitFullScreen: () => this.player?.exitFullScreen(),
    };
  },
  methods: {
    onPlayStateEvent({ type, detail }: { type: string; detail: any }) {
      if (type === 'playsuccess') {
        this.setData({ isPlaySuccess: true });
      } else if (type === 'playstop' || type === 'playend' || type === 'playerror') {
        this.setData({ isPlaySuccess: false });
      }
      this.triggerEvent('playstatechagne', { type, detail });
    },

    onPlayError({ type, detail }: { type: string; detail: any }) {
      this.setData({ isPlaySuccess: false });
      wx.showModal({
        content: `${detail.errMsg || '播放失败'}`,
        showCancel: false,
      });
      this.triggerEvent('playstatechagne', { type, detail });
    },

    onFullScreenChange({ type, detail }: { type: string; detail: any }) {
      this.setData({ fullScreen: detail.fullScreen });
      this.triggerEvent(type, detail);
    },

    onNetStatus({ type, detail }: { type: string; detail: any }) {
      if (detail?.info?.code === 2106 && !this.data.isPlaySuccess) {
        this.setData({ isPlaySuccess: true });
        this.triggerEvent('playstatechagne', { type: 'playsuccess', detail: { msg: 'Stream data received' } });
      }
      this.triggerEvent(type, detail);
    },

    onRecordStateChange({ detail }: { detail: any }) {
      this.setData({ record: detail.record });
      this.triggerEvent('recordstatechange', detail);
    },

    onRecordFileStateChange({ detail }: { detail: any }) {
      this.triggerEvent('recordfilestatechange', detail);
    },

    // ================== 新增功能方法 ==================

    // 切换清晰度
    handleChangeQuality() {
        if (!this.data.isPlaySuccess) return;
        const itemList = this.data.qualityList.map(item => item.text);
        wx.showActionSheet({
            itemList,
            success: (res) => {
                const selectedQuality = this.data.qualityList[res.tapIndex];
                if (selectedQuality.value !== this.data.innerStreamQuality) {
                    console.log('切换清晰度到:', selectedQuality.value);
                    this.setData({ innerStreamQuality: selectedQuality.value });
                    // 注意：插件的 `iot-p2p-player-with-mjpg` 组件会自动监听 streamQuality 属性的变化并重新拉流
                }
            }
        });
    },

    // 切换全屏
    handleToggleFullScreen() {
      // @ts-ignore
      this.data.fullScreen ? this.player.exitFullScreen() : this.player.requestFullScreen({ direction: 90 });
    },

    // 启动画中画
    handlePictureInPicture() {
      if (!this.data.isPlaySuccess) return;
      // @ts-ignore
      this.player.requestPictureInPicture({
        success:() => console.log('进入画中画成功'),
        fail:(err:any) => console.error('进入画中画失败', err)
      })
    },

    // ================== 原有方法 ==================

    snapshotAndSave() {
      // @ts-ignore
      if (this.player) this.player.snapshotAndSave();
    },
    startRecordFlv(options: any) {
      // @ts-ignore
      if (this.player) this.player.startRecordFlv(options);
    },
    stopRecordFlv() {
      // @ts-ignore
      if (this.player) this.player.stopRecordFlv();
    },
  },
});
```

### 文件路径: `src\components\p2p-live-player\p2p-live-player.wxml`

```wxml
<view class="relative w-full h-full">
  <iot-p2p-player-with-mjpg
    id="{{playerId}}"
    class="{{compClass}}"
    deviceInfo="{{deviceInfo}}"
    xp2pInfo="{{xp2pInfo}}"
    liveStreamDomain="{{liveStreamDomain}}"
    needCheckStream="{{needCheckStream}}"
    sceneType="{{sceneType}}"
    streamChannel="{{streamChannel}}"
    streamQuality="{{innerStreamQuality}}"
    mode="{{mode}}"
    soundMode="{{soundMode}}"
    muted="{{muted}}"
    orientation="{{orientation}}"
    fill="{{fill}}"
    acceptPlayerEvents="{{acceptPlayerEvents}}"
    showLog="{{showLog}}"
    onlyp2pMap="{{onlyp2pMap}}"
    picture-in-picture-mode="{{['push', 'pop']}}"
    bind:playsuccess="onPlayStateEvent"
    bind:playstop="onPlayStateEvent"
    bind:playend="onPlayStateEvent"
    bind:playerror="onPlayError"
    bind:fullscreenchange="onFullScreenChange"
    bind:netstatus="onNetStatus"
    bind:recordstatechange="onRecordStateChange"
    bind:recordfilestatechange="onRecordFileStateChange">
    <view slot="flvInner">
      <cover-view class="absolute bottom-4 right-4 z-10 flex flex-col items-end space-y-2">
        <cover-view class="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-md" bind:tap="handleChangeQuality">
          {{qualityMap[innerStreamQuality] || '清晰度'}}
        </cover-view>
        <cover-view class="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-md" bind:tap="handleToggleFullScreen">
          {{fullScreen ? '退出全屏' : '全屏'}}
        </cover-view>
        <cover-view class="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-md" bind:tap="handlePictureInPicture">
          画中画
        </cover-view>
      </cover-view>
    </view>
  </iot-p2p-player-with-mjpg>
</view>
```

### 文件路径: `src\lib\cameraService.ts`

```ts
import { getXp2pManager } from './xp2pManager';

interface ActiveDevice {
  deviceId: string;
  xp2pManager: any; // 声明为 any 类型以简化，实际应为 IXp2pManager
}

class CameraService {
  private activeDevice: ActiveDevice | null = null;

  /**
   * 当进入摄像头实时监控页面并成功连接后，调用此方法进行注册
   * @param deviceId - 当前活动设备的 deviceId
   */
  public setActiveDevice(deviceId: string) {
    this.activeDevice = {
      deviceId,
      xp2pManager: getXp2pManager(),
    };
    console.log('[CameraService] A-ctive device set:', this.activeDevice.deviceId);
  }

  /**
   * 清除当前活动的设备信息，在退出监控页面时调用
   */
  public clearActiveDevice() {
    console.log('[CameraService] Active device cleared.');
    this.activeDevice = null;
  }

  /**
   * 获取当前活动的设备ID
   * @returns 当前设备ID或 null
   */
  public getActiveDeviceId(): string | null {
    return this.activeDevice ? this.activeDevice.deviceId : null;
  }

  /**
   * 全局发送指令的方法
   * 所有设置页面都应调用此方法来控制设备
   * @param cmd - 纯指令部分，例如 "UYTKZ,UP,1"
   * @returns Promise<any>
   */
  public sendCommand(cmd: string): Promise<any> {
    if (!this.activeDevice || !this.activeDevice.xp2pManager) {
      console.error('[CameraService] Error: No active device to send command to.');
      wx.showToast({ title: '设备未连接', icon: 'none' });
      return Promise.reject(new Error('No active device'));
    }

    // 统一添加 ",MYBABY" 后缀和腾讯云IoT P2P插件所需的前缀
    const commandString = `action=user_define&cmd=${cmd},MYBABY`;

    console.log('[CameraService] Sending command:', commandString);

    return this.activeDevice.xp2pManager.sendCommand(this.activeDevice.deviceId, commandString);
  }
}

// 导出单例
const cameraService = new CameraService();
export default cameraService;
```

### 文件路径: `src\lib\logger.ts`

```ts
import { toDateTimeMsString } from '../utils/util';

// 简化的日志记录器，仅输出到控制台
export class Logger {
  log(...data: any[]) {
    console.log(this.formatMessage('[LOG]', ...data));
  }

  info(...data: any[]) {
    console.info(this.formatMessage('[INFO]', ...data));
  }

  warn(...data: any[]) {
    console.warn(this.formatMessage('[WARN]', ...data));
  }

  error(...data: any[]) {
    console.error(this.formatMessage('[ERROR]', ...data));
  }

  private formatItem(v: any): string {
    const type = typeof v;
    if (type === 'string') {
      return v;
    }
    if (type === 'object' && v instanceof Error) {
      return v.stack || v.message;
    }
    try {
        return JSON.stringify(v, null, 2);
    } catch {
        return '[Circular Object]';
    }
  }

  private formatMessage(level: string, ...data: any[]): string {
      const time = toDateTimeMsString(new Date());
      const messageParts = data.map(v => this.formatItem(v));
      return `${time} ${level} ${messageParts.join(' ')}`;
  }
}
```

### 文件路径: `src\lib\xp2pManager.ts`

```ts
import { getUserId } from '../utils/util';

let xp2pManager = null;

export const getXp2pManager = () => {
  if (!xp2pManager) {
    const xp2pPlugin = requirePlugin('xp2p');
    const iotExports = xp2pPlugin.iot;
    const app = getApp();

    iotExports?.setUserId?.(getUserId() || 'demo');

    if (app.pluginLogger && wx.getAccountInfoSync().miniProgram.envVersion === 'develop') {
      iotExports?.setPluginLogger?.(app.pluginLogger);
    }
// 检查插件和基础库版本是否支持 setTcpFirst
    if (xp2pPlugin.p2p && typeof xp2pPlugin.p2p.setTcpFirst === 'function') {
        console.log('P2P插件支持TCP模式，设置为优先使用TCP。');
        xp2pPlugin.p2p.setTcpFirst(true);
    } else {
        console.warn('当前P2P插件版本不支持 setTcpFirst，将使用默认UDP模式。');
    }
    xp2pManager = iotExports.getXp2pManager();
    app.xp2pManager = xp2pManager; // 将实例挂载到全局

    app.logger?.log('xp2pManager Initialized', {
      P2PPlayerVersion: xp2pManager.P2PPlayerVersion,
      XP2PVersion: xp2pManager.XP2PVersion,
      uuid: xp2pManager.uuid,
    });
  }
  return xp2pManager;
};
```

### 文件路径: `src\video\exportForPlayerPlugin.js`

```js
module.exports = {
  wx,
};
```

