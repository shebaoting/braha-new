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
