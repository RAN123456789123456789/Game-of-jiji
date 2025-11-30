# 模型资源目录

此目录用于存放游戏中的3D模型资源。

## 目录结构

```
models/
├── characters/     # 角色模型
├── items/         # 道具模型
└── environments/  # 环境模型
```

## 模型格式支持

游戏支持多种3D模型格式，包括：
- GLTF/GLB (推荐)
- FBX
- OBJ
- 其他Three.js支持的格式

## 如何添加模型

1. 将模型文件放入对应的目录（characters/items/environments）
2. 在 `src/main.js` 中注册模型：

```javascript
// 注册角色模型
game.modelManager.registerModel(
    'character_default',  // 模型ID
    'assets/models/characters/character.gltf',  // 模型路径
    'gltf',  // 模型类型
    'character'  // 模型分类
);

// 注册道具模型
game.modelManager.registerModel(
    'speed_potion',
    'assets/models/items/speed_potion.gltf',
    'gltf',
    'item'
);
```

## 如何替换模型

使用 `ModelManager.replaceModel()` 方法：

```javascript
// 替换角色模型
await game.modelManager.replaceModel(
    'character_default',
    'assets/models/characters/new_character.gltf',
    'gltf'
);
```

## 模型加载器注册

如果需要使用其他格式的模型，需要先注册对应的加载器：

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

game.modelManager.initialize({
    gltf: new GLTFLoader(),
    fbx: new FBXLoader()
});
```

## 注意事项

- 模型文件路径相对于项目根目录
- 确保模型文件大小合理，避免影响加载性能
- 建议使用GLTF格式，因为它是最优化的Web 3D格式


