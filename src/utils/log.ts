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
