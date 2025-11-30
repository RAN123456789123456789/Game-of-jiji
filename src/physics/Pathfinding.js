/**
 * 寻路系统
 * 使用A*算法实现最短路径寻路，避开障碍物
 */
import { CollisionDetector } from './CollisionDetector.js';
import { GameConfig } from '../config/GameConfig.js';

export class Pathfinding {
    constructor(collisionDetector) {
        this.collisionDetector = collisionDetector;
        this.gridSize = 0.5; // 网格大小（越小越精确，但计算量越大）
        this.maxSearchDistance = 50; // 最大搜索距离
    }

    /**
     * 将世界坐标转换为网格坐标
     * @param {THREE.Vector3} worldPos 世界坐标
     * @returns {Object} {x, z} 网格坐标
     */
    worldToGrid(worldPos) {
        return {
            x: Math.floor(worldPos.x / this.gridSize),
            z: Math.floor(worldPos.z / this.gridSize)
        };
    }

    /**
     * 将网格坐标转换为世界坐标
     * @param {number} gridX 网格X坐标
     * @param {number} gridZ 网格Z坐标
     * @returns {THREE.Vector3} 世界坐标
     */
    gridToWorld(gridX, gridZ) {
        return new THREE.Vector3(
            gridX * this.gridSize + this.gridSize / 2,
            1.5, // 角色高度
            gridZ * this.gridSize + this.gridSize / 2
        );
    }

    /**
     * 检查网格位置是否可行走
     * @param {number} gridX 网格X坐标
     * @param {number} gridZ 网格Z坐标
     * @returns {boolean}
     */
    isWalkable(gridX, gridZ) {
        const worldPos = this.gridToWorld(gridX, gridZ);
        return this.collisionDetector.isValidPosition(worldPos, GameConfig.character.playerRadius);
    }

    /**
     * 获取邻居节点
     * @param {Object} node 当前节点 {x, z}
     * @returns {Array} 邻居节点数组
     */
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, z: -1 },  // 上
            { x: 1, z: 0 },   // 右
            { x: 0, z: 1 },   // 下
            { x: -1, z: 0 },  // 左
            { x: 1, z: -1 },  // 右上
            { x: 1, z: 1 },   // 右下
            { x: -1, z: 1 },  // 左下
            { x: -1, z: -1 }  // 左上
        ];

        for (const dir of directions) {
            const neighbor = {
                x: node.x + dir.x,
                z: node.z + dir.z
            };
            if (this.isWalkable(neighbor.x, neighbor.z)) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    /**
     * 计算启发式距离（曼哈顿距离）
     * @param {Object} a 节点A {x, z}
     * @param {Object} b 节点B {x, z}
     * @returns {number}
     */
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
    }

    /**
     * 使用A*算法寻路
     * @param {THREE.Vector3} start 起始位置
     * @param {THREE.Vector3} end 目标位置
     * @returns {Array<THREE.Vector3>} 路径点数组，如果找不到路径返回空数组
     */
    findPath(start, end) {
        const startGrid = this.worldToGrid(start);
        const endGrid = this.worldToGrid(end);

        // 检查起点和终点是否可行走
        if (!this.isWalkable(startGrid.x, startGrid.z)) {
            console.warn('起点不可行走');
            return [];
        }
        if (!this.isWalkable(endGrid.x, endGrid.z)) {
            // 如果终点不可行走，尝试找最近的可行走点
            const nearest = this.findNearestWalkable(endGrid.x, endGrid.z);
            if (!nearest) {
                console.warn('终点不可行走且找不到可行走点');
                return [];
            }
            endGrid.x = nearest.x;
            endGrid.z = nearest.z;
        }

        // 如果起点和终点相同，直接返回
        if (startGrid.x === endGrid.x && startGrid.z === endGrid.z) {
            return [end];
        }

        // A*算法
        const openSet = [startGrid];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${startGrid.x},${startGrid.z}`;
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startGrid, endGrid));

        while (openSet.length > 0) {
            // 找到fScore最小的节点
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                const currentKey = `${openSet[currentIndex].x},${openSet[currentIndex].z}`;
                const iKey = `${openSet[i].x},${openSet[i].z}`;
                const currentF = fScore.get(currentKey) || Infinity;
                const iF = fScore.get(iKey) || Infinity;
                if (iF < currentF) {
                    currentIndex = i;
                }
            }

            const current = openSet.splice(currentIndex, 1)[0];
            const currentKey = `${current.x},${current.z}`;
            closedSet.add(currentKey);

            // 检查是否到达目标
            if (current.x === endGrid.x && current.z === endGrid.z) {
                // 重构路径
                const path = [];
                let node = current;
                while (node) {
                    path.unshift(this.gridToWorld(node.x, node.z));
                    const nodeKey = `${node.x},${node.z}`;
                    node = cameFrom.get(nodeKey);
                }
                return path;
            }

            // 检查搜索距离
            const distance = this.heuristic(startGrid, current);
            if (distance > this.maxSearchDistance / this.gridSize) {
                continue; // 超出搜索范围，跳过
            }

            // 检查所有邻居
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.z}`;
                if (closedSet.has(neighborKey)) {
                    continue;
                }

                // 计算移动成本（对角线移动成本更高）
                const isDiagonal = Math.abs(neighbor.x - current.x) === 1 && Math.abs(neighbor.z - current.z) === 1;
                const moveCost = isDiagonal ? 1.414 : 1;
                const tentativeGScore = (gScore.get(currentKey) || Infinity) + moveCost;

                if (!openSet.some(n => n.x === neighbor.x && n.z === neighbor.z)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }

                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, endGrid));
            }
        }

        // 找不到路径
        return [];
    }

    /**
     * 找到最近的可行走点
     * @param {number} gridX 网格X坐标
     * @param {number} gridZ 网格Z坐标
     * @param {number} maxRadius 最大搜索半径（网格单位）
     * @returns {Object|null} {x, z} 或 null
     */
    findNearestWalkable(gridX, gridZ, maxRadius = 10) {
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (Math.abs(dx) === radius || Math.abs(dz) === radius) {
                        const x = gridX + dx;
                        const z = gridZ + dz;
                        if (this.isWalkable(x, z)) {
                            return { x, z };
                        }
                    }
                }
            }
        }
        return null;
    }
}


