# 使用说明

## 快速开始

1. 直接在浏览器中打开 `index.html` 即可开始游戏
2. 选择关卡开始冒险

## 模型管理使用指南

### 添加新模型

#### 步骤1：放置模型文件
将你的3D模型文件放入对应的目录：
- 角色模型 → `assets/models/characters/`
- 道具模型 → `assets/models/items/`
- 环境模型 → `assets/models/environments/`

#### 步骤2：注册模型加载器（如果需要新格式）
在 `src/main.js` 的 `init()` 方法中：

```javascript
// 引入加载器
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// 在 init() 方法中注册
this.modelManager.initialize({
    gltf: new GLTFLoader(),
    fbx: new FBXLoader()
});
```

#### 步骤3：注册模型
在 `src/main.js` 的 `init()` 方法中注册你的模型：

```javascript
// 注册角色模型
this.modelManager.registerModel(
    'my_character',  // 模型ID（唯一标识）
    'assets/models/characters/my_character.gltf',  // 模型路径
    'gltf',  // 模型格式
    'character'  // 模型分类
);

// 注册道具模型
this.modelManager.registerModel(
    'custom_potion',
    'assets/models/items/custom_potion.gltf',
    'gltf',
    'item'
);
```

#### 步骤4：使用模型
在需要的地方加载并使用模型：

```javascript
// 加载模型
const model = await this.modelManager.getModel('my_character');
scene.add(model);
```

### 替换现有模型

使用 `replaceModel()` 方法可以轻松替换模型：

```javascript
// 替换角色模型
await this.modelManager.replaceModel(
    'character_default',  // 要替换的模型ID
    'assets/models/characters/new_character.gltf',  // 新模型路径
    'gltf'  // 新模型格式
);

// 替换后需要重新加载
const newModel = await this.modelManager.getModel('character_default');
```

### 预加载模型（优化性能）

在游戏开始前预加载常用模型：

```javascript
// 预加载多个模型
await this.modelManager.preloadModels([
    'character_default',
    'speed_potion',
    'jump_potion'
]);
```

## 添加新关卡

### 步骤1：添加关卡配置
在 `src/config/LevelConfig.js` 中添加新关卡：

```javascript
7: {
    name: '新关卡',
    icon: '🌟',
    description: '关卡描述...',
    sceneType: 'new_level',
    backgroundColor: 0xffffff,
    groundColor: 0x808080
}
```

### 步骤2：创建场景元素
在 `src/core/SceneManager.js` 中添加场景创建方法：

```javascript
createNewLevelElements() {
    // 创建场景元素
    // 添加可碰撞物体
    // ...
}
```

### 步骤3：注册场景创建器
在 `createLevelElements()` 方法中添加：

```javascript
const sceneCreators = {
    // ... 其他场景
    new_level: () => this.createNewLevelElements()
};
```

## 添加新道具

### 步骤1：添加道具配置
在 `src/config/GameConfig.js` 中添加道具效果配置：

```javascript
itemEffects: {
    // ... 现有道具
    newPotion: {
        multiplier: 2,
        duration: 5000
    }
}
```

### 步骤2：扩展Item类
在 `src/game/Item.js` 的 `use()` 方法中添加新道具逻辑：

```javascript
if (this.name === '新药水') {
    return {
        type: 'custom',
        multiplier: GameConfig.itemEffects.newPotion.multiplier,
        duration: GameConfig.itemEffects.newPotion.duration
    };
}
```

### 步骤3：在Character类中应用效果
在 `src/game/Character.js` 的 `applyEffect()` 方法中添加效果处理：

```javascript
else if (effect.type === 'custom') {
    // 处理自定义效果
}
```

## 模块扩展指南

### 添加新模块

1. 在对应的目录下创建新文件
2. 使用ES6模块导出（export）
3. 在主文件中导入并使用（import）

### 模块间通信

模块之间通过接口交互，避免直接依赖：

```javascript
// 好的做法：通过参数传递
class MyModule {
    constructor(dependency) {
        this.dependency = dependency;
    }
}

// 避免：直接访问全局变量
class BadModule {
    useGlobal() {
        window.someGlobalVariable; // 不推荐
    }
}
```

## 常见问题

### Q: 如何调试模型加载问题？
A: 打开浏览器控制台，查看错误信息。确保：
- 模型路径正确
- 模型格式已注册加载器
- 模型文件存在且可访问

### Q: 模型加载很慢怎么办？
A: 
1. 使用模型压缩工具优化模型大小
2. 使用预加载功能提前加载模型
3. 考虑使用GLTF格式（最优化）

### Q: 如何添加新的模型平台？
A: 
1. 引入对应的Three.js加载器
2. 在 `ModelManager.initialize()` 中注册
3. 使用对应的格式标识符注册模型

### Q: 模块之间如何避免循环依赖？
A: 
- 使用依赖注入
- 通过事件系统通信
- 使用中介者模式

## 性能优化建议

1. **模型优化**
   - 减少多边形数量
   - 压缩纹理
   - 使用LOD（细节层次）

2. **代码优化**
   - 使用对象池复用对象
   - 避免在循环中创建新对象
   - 合理使用缓存

3. **加载优化**
   - 预加载常用资源
   - 使用异步加载
   - 实现加载进度显示


