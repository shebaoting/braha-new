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
  baseUrl: 'http://121.89.86.254:8888',
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
  @apply bg-white rounded-xl shadow-lg;
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
        current: 0, name: '尿布台', isLight: false,
        power_active: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_sel.png',
        power_enabel: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_power_nor.png',
        cmd: 'AA0103010100',
        img: 'http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/index/img_tc_nbt.png'
      },
    ],
    light_info: {
      active_icon: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yd_sel.png",
      active_normol: "http://braha.oss-cn-beijing.aliyuncs.com/app_info/images/home/menu_icon/ic_yd_nor.png",
      name: '夜灯',
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
    navPopupShow: false, // 控制导航栏下方弹出菜单的显示
  },

  onLoad() {
    this.checkNotice();
  },

  onShow() {
    if (this.getTabBar() && this.getTabBar().init) {
      this.getTabBar().init()
    }
    if (app.globalData.isLogin) {
      this.getDeviceList();
    } else {
      wx.login({
        success: (res) => {
          // call your login API with res.code
        },
      });
    }
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


  // --- UI Event Handlers ---
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
    // 点击菜单项后，先关闭菜单再跳转
    this.hideNavPopup();
    this.hide_popu(); // 同时关闭另一个popup

    if (url === 'camera') {
      // Handle camera logic
      console.log('Camera button clicked');
    } else {
      wx.navigateTo({ url });
    }
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


  // --- API and Business Logic ---
  async getDeviceList() {
    const mockList = [
      { productName: '婴儿床 A', isconnected: false, bedCmd: -1, islight: false },
      { productName: '婴儿床 B', isconnected: false, bedCmd: -1, islight: false },
    ];
    this.setData({ deviceList: mockList });
    app.globalData.allDeviceList = mockList;
    this.pageInitBule();
  },

  connectDevice_event() {
    this.getDeviceList().then(() => {
      this.openBluetoothAdapter();
    });
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
              <image class="w-12 h-12" src="{{item.current === deviceList[deviceCurrent].bedCmd ? item.active_icon : item.active_normol}}"></image>
              <text class="ml-4 text-lg font-semibold">{{item.name}}</text>
            </view>
            <image class="w-10 h-10" src="{{item.current === deviceList[deviceCurrent].bedCmd ? item.power_active : item.power_enabel}}"></image>
          </view>
        </block>

        <view class="btn flex items-center justify-between p-4 mb-4" bind:tap="modal_show_event" data-item="{{light_info}}">
          <view class="flex items-center">
            <image class="w-12 h-12" src="{{deviceList[deviceCurrent].islight ? light_info.active_icon : light_info.active_normol}}"></image>
            <text class="ml-4 text-lg font-semibold">{{light_info.name}}</text>
          </view>
          <image class="w-10 h-10" src="{{deviceList[deviceCurrent].islight ? light_info.power_active : light_info.power_enabel}}"></image>
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

