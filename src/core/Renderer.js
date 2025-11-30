/**
 * 渲染器管理
 */
export class Renderer {
    constructor(container) {
        this.container = container;
        this.renderer = null;
        this.init();
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    /**
     * 渲染场景
     * @param {THREE.Scene} scene 
     * @param {THREE.Camera} camera 
     */
    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    /**
     * 更新尺寸
     */
    updateSize() {
        if (this.renderer && this.container) {
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        }
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.renderer) {
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
            this.renderer = null;
        }
    }

    /**
     * 获取DOM元素
     */
    getDomElement() {
        return this.renderer ? this.renderer.domElement : null;
    }
}


