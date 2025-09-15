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