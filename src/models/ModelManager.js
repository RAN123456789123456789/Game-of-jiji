/**
 * 模型管理器
 * 统一管理所有模型资源，支持模型替换和缓存
 */
import { ModelLoader } from './ModelLoader.js';

export class ModelManager {
    constructor() {
        this.loader = new ModelLoader();
        this.cache = new Map(); // 模型缓存
        this.modelRegistry = new Map(); // 模型注册表
    }

    /**
     * 初始化模型管理器
     * @param {Object} loaders - 加载器配置 {type: loaderInstance}
     */
    initialize(loaders) {
        for (const [type, loader] of Object.entries(loaders)) {
            this.loader.registerLoader(type, loader);
        }
    }

    /**
     * 注册模型
     * @param {string} id - 模型ID
     * @param {string} path - 模型路径
     * @param {string} type - 模型类型
     * @param {string} category - 模型分类 (character, item, environment)
     */
    registerModel(id, path, type = 'gltf', category = 'environment') {
        this.modelRegistry.set(id, {
            id,
            path,
            type,
            category,
            loaded: false,
            object: null
        });
    }

    /**
     * 获取模型
     * @param {string} id - 模型ID
     * @returns {Promise<THREE.Object3D>}
     */
    async getModel(id) {
        // 检查缓存
        if (this.cache.has(id)) {
            const cachedModel = this.cache.get(id);
            // THREE.Object3D 应该有 clone 方法
            return cachedModel.clone();
        }

        // 检查注册表
        const modelInfo = this.modelRegistry.get(id);
        if (!modelInfo) {
            throw new Error(`模型 ${id} 未注册`);
        }

        // 加载模型
        try {
            const model = await this.loader.loadModel(modelInfo.path, modelInfo.type);

            // 确保模型是 THREE.Object3D 类型
            if (!model || !model.isObject3D) {
                throw new Error(`加载的模型 ${id} 不是有效的 THREE.Object3D 对象`);
            }

            // 缓存模型
            this.cache.set(id, model);
            modelInfo.loaded = true;
            modelInfo.object = model;

            // 克隆模型（THREE.Object3D 有 clone 方法）
            return model.clone();
        } catch (error) {
            console.error(`加载模型 ${id} 失败:`, error);
            throw error;
        }
    }

    /**
     * 替换模型
     * @param {string} id - 模型ID
     * @param {string} newPath - 新模型路径
     * @param {string} type - 模型类型
     */
    async replaceModel(id, newPath, type = 'gltf') {
        const modelInfo = this.modelRegistry.get(id);
        if (!modelInfo) {
            throw new Error(`模型 ${id} 未注册`);
        }

        // 清除缓存
        this.cache.delete(id);

        // 更新注册信息
        modelInfo.path = newPath;
        modelInfo.type = type;
        modelInfo.loaded = false;
        modelInfo.object = null;
    }

    /**
     * 预加载模型
     * @param {Array<string>} ids - 模型ID数组
     */
    async preloadModels(ids) {
        const promises = ids.map(id => this.getModel(id));
        await Promise.all(promises);
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 获取所有已注册的模型
     * @returns {Array}
     */
    getRegisteredModels() {
        return Array.from(this.modelRegistry.values());
    }
}


