class DeviceManager {
  static LOCAL_STORAGE_KEY = 'alternativelyDeviceInfo';
  
  // 设备信息结构
  static deviceInfoStructure = {
    platform: null,    // 操作系统平台
    os: null,         // 操作系统名称
    isMobile: null,   // 是否移动设备
    screen: {         // 屏幕信息
      width: null,
      height: null,
      availWidth: null,
      availHeight: null,
      colorDepth: null,
      pixelRatio: null,
    },
    hardware: {       // 硬件信息
      cores: null,
      memory: null,
    },
    timezone: null,   // 时区
    language: null,   // 语言
    deviceId: null,   // 设备ID
  };

  // 获取操作系统信息
  static getOS() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // 检查是否移动设备
  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 生成设备ID
  static generateDeviceId(info) {
    try {
      const keyFeatures = {
        platform: info.platform,
        screen: `${info.screen.width}x${info.screen.height}`,
        cores: info.hardware.cores,
        timezone: info.timezone
      };
      return btoa(JSON.stringify(keyFeatures))
        .replace(/[/+=]/g, '')
        .substring(0, 32);
    } catch (error) {
      console.error('Error generating device ID:', error);
      return null;
    }
  }

  // 收集设备信息
  static collectDeviceInfo() {
    try {
      const info = {
        platform: navigator.platform,
        os: this.getOS(),
        isMobile: this.isMobileDevice(),
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio,
        },
        hardware: {
          cores: navigator.hardwareConcurrency || 'unknown',
          memory: navigator.deviceMemory || 'unknown',
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
      };

      info.deviceId = this.generateDeviceId(info);
      return info;
    } catch (error) {
      console.error('Error collecting device info:', error);
      return null;
    }
  }

  // 保存设备信息到localStorage
  static saveToStorage(info) {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(info));
      return true;
    } catch (error) {
      console.error('Error saving device info:', error);
      return false;
    }
  }

  // 从localStorage获取设备信息
  static getFromStorage() {
    try {
      const saved = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error getting device info from storage:', error);
      return null;
    }
  }

  // 获取或创建设备信息
  static getDeviceInfo() {
    let deviceInfo = this.getFromStorage();
    
    if (!deviceInfo) {
      deviceInfo = this.collectDeviceInfo();
      if (deviceInfo) {
        this.saveToStorage(deviceInfo);
      }
    }
    
    return deviceInfo;
  }

  // 清除设备信息
  static clear() {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing device info:', error);
      return false;
    }
  }
}

export default DeviceManager; 