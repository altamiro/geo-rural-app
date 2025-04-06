// Novo arquivo: src/services/dependency.service.js
class DependencyService {
  constructor() {
    this.dependencies = {
      arcgis: false,
      vue: false,
      elementUI: false
    };
    this.listeners = [];
  }

  setDependencyLoaded(name, status = true) {
    this.dependencies[name] = status;
    this.notifyListeners();
  }

  isDependencyLoaded(name) {
    return this.dependencies[name];
  }

  addReadyListener(callback) {
    this.listeners.push(callback);
    // Verificar imediatamente se já está tudo pronto
    this.notifyListeners();
  }

  notifyListeners() {
    const allReady = Object.values(this.dependencies).every(status => status === true);
    if (allReady) {
      this.listeners.forEach(callback => callback());
    }
  }
}

export default new DependencyService();
