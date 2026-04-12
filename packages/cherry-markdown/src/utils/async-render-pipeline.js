/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Logger from '@/Logger';

/**
 * @typedef {Object} RenderTask
 * @property {string} containerId 容器元素的 DOM id
 * @property {(container: Element) => void} execute 执行渲染的闭包，已捕获所有必要数据
 * @property {number} priority 优先级，数值越小越先执行，默认 100
 * @property {string} [instanceId] Cherry 实例 ID，用于多实例隔离
 */

/** 全局递增计数器，用于生成唯一容器 ID */
let _idCounter = 0;

/**
 * 生成唯一容器 ID（递增计数器 + 随机后缀，同毫秒内也不会冲突）
 * @param {string} prefix ID 前缀，如 'chart'、'echarts-cb'、'mermaid'
 * @returns {string} 形如 `chart-1-a3b2c1` 的唯一 ID
 */
export function generateContainerId(prefix = 'async') {
  return `${prefix}-${++_idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 使用 DOM API 安全地构建错误提示元素（textContent 赋值，天然防 XSS）
 * @param {string} message 错误消息
 * @returns {HTMLElement}
 */
export function createErrorElement(message) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'text-align:center;color:#ff4d4f;padding:20px;';

  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size:16px;';
  titleEl.textContent = 'Render Error';

  const msgEl = document.createElement('div');
  msgEl.style.cssText = 'font-size:12px;opacity:0.7;margin-top:4px;';
  msgEl.textContent = message;

  wrapper.appendChild(titleEl);
  wrapper.appendChild(msgEl);
  return wrapper;
}

/**
 * 异步渲染管线（两阶段：enqueue → flush）
 *
 * 插件在 render() 阶段将渲染闭包 enqueue()，返回占位 HTML；
 * Previewer.afterUpdate() 在 rAF 中调用 flush()，按优先级依次执行。
 * 多 Cherry 实例通过 instanceId 隔离，互不干扰。
 */
export default class AsyncRenderPipeline {
  /** @type {RenderTask[]} */
  queue = [];

  /**
   * 将渲染任务推入队列
   * @param {RenderTask} task
   */
  enqueue(task) {
    this.queue.push({
      containerId: task.containerId,
      execute: task.execute,
      priority: task.priority ?? 100,
      instanceId: task.instanceId,
    });
  }

  /**
   * 按优先级执行所有排队的渲染任务
   * @param {Element} root 预览区根容器
   * @param {{ instanceId?: string }} [options]
   */
  flush(root, options = {}) {
    if (!root || !root.isConnected || this.queue.length === 0) return;

    const { instanceId } = options;

    // 按 instanceId 提取当前实例的任务，其余任务留在队列等待各自的 flush。
    // 未携带 instanceId 的任务只在无 instanceId 的全局 flush 中消费。
    let tasks;
    if (instanceId) {
      tasks = [];
      const remaining = [];
      for (const task of this.queue) {
        if (task.instanceId === instanceId) {
          tasks.push(task);
        } else {
          remaining.push(task);
        }
      }
      this.queue = remaining;
    } else {
      tasks = this.queue.splice(0);
    }

    if (tasks.length === 0) return;

    tasks.sort((a, b) => a.priority - b.priority);

    for (const task of tasks) {
      const escapedId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(task.containerId) : task.containerId;
      const container = root.querySelector(`#${escapedId}`);
      if (!container) continue;

      try {
        task.execute(container);
      } catch (error) {
        Logger.warn(`[AsyncRenderPipeline] Render failed for #${task.containerId}:`, error);
        container.innerHTML = '';
        container.appendChild(createErrorElement(error.message));
      }
    }
  }

  /**
   * 清空指定实例的待执行队列，或清空全部
   * @param {string} [instanceId]
   */
  reset(instanceId) {
    if (instanceId) {
      this.queue = this.queue.filter((task) => task.instanceId !== instanceId);
    } else {
      this.queue.length = 0;
    }
  }
}
