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
