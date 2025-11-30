/**
 * 模型加载器
 * 支持多种模型格式和平台
 */
export class ModelLoader {
    constructor(loader = null) {
        // 默认使用Three.js的GLTFLoader，但可以替换为其他加载器
        this.loader = loader;
        this.loaders = new Map(); // 存储不同类型的加载器
    }

    /**
     * 注册模型加载器
     * @param {string} type - 模型类型 (gltf, fbx, obj等)
     * @param {Object} loader - 加载器实例
     */
    registerLoader(type, loader) {
        this.loaders.set(type, loader);
    }

    /**
     * 加载模型
     * @param {string} path - 模型路径
     * @param {string} type - 模型类型 (gltf, fbx, obj等)
     * @returns {Promise<THREE.Object3D>}
     */
    async loadModel(path, type = 'gltf') {
        return new Promise((resolve, reject) => {
            const loader = this.loaders.get(type);

            if (!loader) {
                reject(new Error(`未找到类型为 ${type} 的加载器`));
                return;
            }

            loader.load(
                path,
                (gltf) => {
                    // GLTFLoader 返回的是 GLTF 对象，需要提取 scene 属性
                    // 如果是 GLTF 对象，提取 scene；否则直接使用
                    const model = gltf.scene || gltf;
                    resolve(model);
                },
                (progress) => {
                    // 可以在这里添加加载进度回调
                    if (progress.total > 0) {
                        console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
                    }
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }

    /**
     * 批量加载模型
     * @param {Array<{path: string, type: string}>} models - 模型配置数组
     * @returns {Promise<Array>}
     */
    async loadModels(models) {
        const promises = models.map(model =>
            this.loadModel(model.path, model.type || 'gltf')
        );
        return Promise.all(promises);
    }
}


