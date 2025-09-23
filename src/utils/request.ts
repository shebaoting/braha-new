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
