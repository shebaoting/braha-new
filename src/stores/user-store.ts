// src/stores/user-store.ts
import { Store } from 'westore'
import User from '../models/user'
import { userAccountApi } from './../utils/api'

class UserStore extends Store {
  _initPromise: Promise<void> | null = null

  constructor() {
    super()
    this.data = new User({})
  }

  async init(forceFetch = false): Promise<void> {
    console.log(`UserStore init called. forceFetch: ${forceFetch}`)

    if (this._initPromise) {
      console.log('UserStore init: Initialization already in progress, returning existing promise.')
      return this._initPromise
    }

    // [!code focus]
    if (!forceFetch && this.data.userInfo?.ID) {
      console.log('UserStore init: User info already loaded and forceFetch is false, skipping fetch.')
      return Promise.resolve()
    }

    const fetchPromise = (async () => {
      console.log('UserStore init: Starting new fetch process...')
      try {
        const userInfoRes = await userAccountApi.getMiniprogramUserInfo()

        // [!code block]
        // [!code focus]
        // --- 核心调试日志 ---
        // 1. 打印从 request.ts 收到的最原始的数据结构
        console.log('[调试日志 1] UserStore 从 API 收到的原始响应: ', JSON.stringify(userInfoRes, null, 2));

        // 2. 打印出将要用于判断的各个部分
        console.log('[调试日志 2] 判断条件 A (userInfoRes.data?.code):', userInfoRes.data?.code);
        console.log('[调试日志 3] 判断条件 B (userInfoRes.data?.data?.user):', userInfoRes.data?.data?.user);
        // [!code focus]
        // [!code block]


        if (userInfoRes.data?.code === 0 && userInfoRes.data?.data?.user) {
          console.log('[调试日志 4] 条件判断成功，准备设置用户信息。');
          this.data.setUserInfo(userInfoRes.data.data.user)
          console.log('UserStore init: User info fetched and set successfully.')
        } else {
          // [!code focus]
          console.error('[调试日志 5] 条件判断失败！未能进入设置用户信息的逻辑。请检查日志2和日志3。');
          console.warn(
            'UserStore init: Failed to fetch user info from API, status not success:',
            userInfoRes.data?.msg || 'Unknown API error',
            userInfoRes,
          )
          this.data.setUserInfo(null)
        }

      } catch (e: any) {
        // [!code focus]
        console.error('!!!!!!!!!! [调试日志 6] AN ERROR WAS CAUGHT in user-store init !!!!!!!!!!!', e);
        console.error(
          'UserStore init: Failed to fetch user info (network or server error):',
          e,
        )
        this.data.setUserInfo(null)
      } finally {
        this.update()
        this._initPromise = null
        console.log(
          'UserStore init: Fetch process finished, _initPromise cleared.',
        )
      }
    })()

    this._initPromise = fetchPromise
    return fetchPromise
  }

  updateUserInfo(userInfo: any) {
    this.data.setUserInfo(userInfo)
    this.update()
  }

  update() {
    super.update()
  }
}

export default new UserStore()