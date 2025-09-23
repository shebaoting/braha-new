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
