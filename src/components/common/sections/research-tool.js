'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import BrowserSimulator from '../BrowserSimulator';

// 添加任务状态常量
const TASK_STATUS = {
  PENDING: 'init',
  RUNNING: 'processing',
  COMPLETED: 'finished',
  FAILED: 'failed'
};

// 添加任务类型常量
const TASK_TYPES = {
  COMPETITOR_SEARCH: 'COMPETITOR_SEARCH',
  COMPETITOR_SCORING: 'COMPETITOR_SCORING',
  PRODUCT_COMPARISON: 'PRODUCT_COMPARISON',
  CODE_ANALYSIS: 'CODE_ANALYSIS'
};

// 添加轮询间隔常量
const POLLING_INTERVALS = {
  TASK_STATUS: 3000,    // 3秒
  TASK_DETAILS: 5000,   // 5秒
  SOURCES: 10000        // 10秒
};

// 任务管理器类
class TaskManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.tasks = new Map();
    this.activePolling = new Set();
    this.onTaskUpdate = null;
    this.onDetailsUpdate = null;
    this.onSourcesUpdate = null;
    this.onMessageUpdate = null;
    this.websiteId = null;
    this.hasInitialMessage = false;
    this.hasCompletionMessage = false;
    this.hasXavierCompletionMessage = false;  // 添加 Xavier 完成消息的标志
    this.hasFailureMessage = false;  // 添加失败消息标志
    this.lastProcessedState = null;  // 添加状态追踪
    this.hasXavierStartMessage = false;  // 新增
    this.hasYoussefStartMessage = false; // 新增
    this.pollingInterval = null;
    this.detailPollingInterval = null;
    this.lastDetailCount = 0;  // 用于追踪detail数量变化
    this.currentPage = 1;
    this.pageSize = 300;
    this.sourcesPollingInterval = null;  // 添加 sources 轮询间隔
    this.lastSourceCount = 0;  // 用于追踪 sources 数量变化
    this.onBrowserUpdate = null;
    this.onLoadingUpdate = null;
    this.onMessageSendingUpdate = null;
    this.hasCompetitorSelection = false;
    this.allPollingIntervals = new Set();
    this.currentTaskType = null;
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.contentPrepFlag = false; // 新增内容准备标志
  }

  // 初始化新的研究任务流程
  async initializeResearch(websiteId, hasInitialMessage = false) {
    this.websiteId = websiteId;
    this.clearAllTasks();
    
    // 如果已经有初始消息，就不要再添加新消息
    this.hasInitialMessage = hasInitialMessage;
    
    // 开始轮询所有任务状态
    this.startPolling();
    this.startDetailPolling();
    this.startSourcePolling();  // 添加 sources 轮询
  }

  // 检查是否所有任务都完成
  areAllTasksCompleted(plannings) {
    return plannings.every(planning => planning.status === 'finished');
  }

  // 修改轮询方法以处理所有任务
  startPolling() {
    // 移除条件检查，强制重启轮询
    console.log('Force restarting polling...');
    
    const pollTaskStatus = async () => {
      try {
        console.log('Polling task status...');
        const response = await this.apiClient.getAlternativeStatus(this.websiteId);
        console.log('Poll response:', response);

        const plannings = response?.data || [];
        
        // 创建当前状态快照（包含所有任务状态）
        const currentState = plannings.map(p => `${p.planningName}:${p.status}`).join('|');
        
        // 检查是否所有任务都失败或完成
        const allTasksFinished = plannings.every(p => 
          p.status === 'finished' || p.status === 'failed'
        ) && plannings.some(p => p.status === 'finished');

        // 如果所有任务都完成或失败，则停止轮询
        if (allTasksFinished) {
          console.log('All tasks finished or failed, clearing polling');
          this.clearAllTasks();
          return;
        }

        // 如果状态没有变化且不是所有任务都完成，继续轮询
        if (this.lastProcessedState === currentState) {
          console.log('No state change, continuing polling');
          return;
        }
        
        this.lastProcessedState = currentState;

        // 检查任务失败
        const failedTask = plannings.find(p => p.status === 'failed');
        if (failedTask) {
          this.handleTaskFailure(failedTask);
          return;
        }

        // 检查所有任务是否完成
        const allCompleted = this.areAllTasksCompleted(plannings);
        if (allCompleted) {
          await this.handleAllTasksCompleted();
          return;
        }

        // 更新各阶段状态
        await this.updateTaskStages(plannings);

        // 更新任务状态
        this.updateTasksStatus(plannings);

      } catch (error) {
        console.error('Error polling task status:', error);
        await this.handlePollingError(error);
      }
    };

    // 清除现有间隔（如果有）
    if (this.allPollingIntervals.size > 0) {
      this.allPollingIntervals.forEach(interval => clearInterval(interval));
      this.allPollingIntervals.clear();
    }

    const interval = setInterval(pollTaskStatus, 3000);
    this.allPollingIntervals.add(interval);
    this.activePolling.add('ALL_TASKS');
    
    // 立即执行第一次轮询
    console.log('Executing initial poll for new phase...');
    pollTaskStatus();
  }

  // 处理任务失败的情况
  handleTaskFailure(failedTask) {
    if (!this.hasFailureMessage) {
      this.hasFailureMessage = true;
      this.clearAllTasks();
      
      const failureMessage = this.getFailureMessage(failedTask.planningName, failedTask.errorMsg);
      this.onMessageUpdate?.(prevMessages => {
        const updatedMessages = prevMessages.map(msg => ({
          ...msg,
          isThinking: false
        }));
        return [...updatedMessages, failureMessage];
      });
    }
  }

  // 处理所有任务完成的情况
  async handleAllTasksCompleted() {
    if (!this.hasCompletionMessage) {
      this.hasCompletionMessage = true;
      
      try {
        const resultResponse = await this.apiClient.getAlternativeResult(this.websiteId);
        const competitors = this.parseCompetitors(resultResponse?.data);
        
        this.updateCompletionMessages(competitors);
        this.updateBrowserState(competitors);
      } catch (error) {
        console.error('Failed to get final results:', error);
        this.handleCompletionError();
      }

      this.clearAllTasks();
    }
  }

  // 更新任务阶段状态
  async updateTaskStages(plannings) {
    console.log('Current plannings status:', plannings.map(p => ({
      name: p.planningName,
      status: p.status
    })));

    const competitorSearch = plannings.find(p => p.planningName === TASK_TYPES.COMPETITOR_SEARCH);
    const competitorScoring = plannings.find(p => p.planningName === TASK_TYPES.COMPETITOR_SCORING);
    const productComparison = plannings.find(p => p.planningName === TASK_TYPES.PRODUCT_COMPARISON);

    console.log('Task stages:', {
      search: competitorSearch?.status,
      scoring: competitorScoring?.status,
      comparison: productComparison?.status
    });

    // 检查第一阶段完成和第二阶段开始
    if (competitorSearch?.status === 'finished' && 
        competitorScoring?.status === 'processing' && 
        !this.hasXavierStartMessage) {
      console.log('Transitioning from search to scoring phase');
      this.hasXavierStartMessage = true;
      await this.updateXavierStartMessage();
    }

    // 检查第二阶段完成和第三阶段开始
    if (competitorScoring?.status === 'finished' && 
        productComparison?.status === 'processing' && 
        !this.hasYoussefStartMessage) {
      console.log('Transitioning from scoring to content phase');
      this.hasYoussefStartMessage = true;

      this.messageQueue.push(
        {
          type: 'agent',
          agentId: 1, // Joey
          content: '✅ Final selection confirmed',
          isThinking: false
        },
        {
          type: 'agent',
          agentId: 1,
          content: '⏳ Starting final scoring process...',
          isThinking: true
        },
        {
          type: 'agent',
          agentId: 2, // Youssef
          content: '🔄 Receiving analysis data...',
          isThinking: true
        }
      );
    }

    // 处理竞品选择逻辑
    if (competitorSearch?.status === 'finished' && !this.hasCompetitorSelection) {
      console.log('Competitor search finished, hasCompetitorSelection:', this.hasCompetitorSelection);
      this.hasCompetitorSelection = true;
      
      try {
        const competitors = this.parseCompetitors(competitorSearch.data);
        console.log('Parsed competitors:', competitors);
        
        // 添加新消息而不是修改现有消息
        this.onMessageUpdate?.(prev => {
          console.log('Current messages:', prev);
          // 检查是否已经存在选择消息
          const hasSelectionMessage = prev.some(msg => 
            msg.content.includes('I\'ve identified the main competitors') && 
            msg.options
          );

          console.log('Has selection message:', hasSelectionMessage);
          
          if (hasSelectionMessage) {
            console.log('Selection message already exists, skipping...');
            return prev;
          }

          // 先关闭前一条消息的加载状态
          const updated = prev.map(msg => {
            if (msg.isThinking && msg.content.includes('searching for your top competitors')) {
              return { ...msg, isThinking: false };
            }
            return msg;
          });
          
          // 添加新的选项消息
          return [...updated, {
            type: 'agent',
            agentId: 1, // 保持Joey的头像
            content: '✨ Great! I\'ve identified the main competitors. Please select up to 3 to analyze:',
            options: competitors.map((c, i) => ({
              label: `${i + 1}. ${c.replace('www.', '')}`,
              value: c
            })),
            maxSelections: 3,
            isThinking: false
          }];
        });
        
      } catch (error) {
        console.error('Error processing competitors:', error);
      }
      return;
    }

    // 当进入评分阶段时更新消息状态
    if (competitorScoring?.status === 'processing') {
      this.onMessageUpdate?.(prev => {
        return prev.map(msg => {
          // 关闭Joey的初始消息加载状态
          if (msg.content.includes('Initializing competitor scoring') && msg.agentId === 1) {
            return { ...msg, isThinking: false };
          }
          return msg;
        }).concat({
          type: 'agent',
          agentId: 1, // Joey负责评分分析
          content: '📊 Now conducting in-depth scoring analysis of selected competitors...',
          isThinking: true
        });
      });
    }

    // 当评分完成时更新状态
    if (competitorScoring?.status === 'finished') {
      this.onMessageUpdate?.(prev => prev.map(msg => {
        if (msg.content.includes('conducting in-depth scoring analysis') && msg.agentId === 1) {
          return { ...msg, isThinking: false };
        }
        return msg;
      }));
    }

    // 当进入内容准备阶段
    if (competitorScoring?.status === 'finished' && !this.contentPrepFlag) {
      this.contentPrepFlag = true;
      
      this.messageQueue.push(
        {
          type: 'agent',
          agentId: 2, // Youssef
          content: '🔍 Comparing key features between selected competitors...',
          isThinking: true
        },
        {
          type: 'agent',
          agentId: 2,
          content: '📚 Analyzing technical specifications...',
          isThinking: true
        },
        {
          type: 'agent',
          agentId: 2,
          content: '📝 Starting markdown content creation...',
          isThinking: true
        }
      );
    }

    // 当进入内容生成阶段
    if (productComparison?.status === 'processing') {
      this.messageQueue.push({
        type: 'agent',
        agentId: 2,
        content: '✍️ Drafting comparative analysis document...',
        isThinking: true
      });
    }

    if (competitorScoring?.status === 'finished' && 
        productComparison?.status === 'processing') {
      this.messageQueue.push(
        {
          type: 'agent',
          agentId: 1,
          content: '📋 Scoring summary: Completed all evaluations',
          isThinking: false
        },
        {
          type: 'agent',
          agentId: 1,
          content: '⇢ Transferring to content team',
          isThinking: false
        },
        {
          type: 'agent',
          agentId: 2, // Youssef
          content: '🔄 Starting content creation process in markdown...',
          isThinking: true
        }
      );
    }

    // Xavier只在内容完成后触发
    if (productComparison?.status === 'finished' && 
        !this.hasXavierStartMessage) {
      this.messageQueue.push({
        type: 'agent',
        agentId: 3, // Xavier
        content: '💻 Starting page development...',
        isThinking: true
      });
    }

    // 当进入开发阶段时
    if (productComparison?.status === 'finished') {
      this.messageQueue.push(
        {
          type: 'agent',
          agentId: 2, // Youssef
          content: '📄 Finalizing content package...',
          isThinking: false
        },
        {
          type: 'agent',
          agentId: 3, // Xavier
          content: '💻 Analyzing technical requirements...', // 代码分析转移给Xavier
          isThinking: true
        }
      );
    }
  }

  // 更新任务状态
  updateTasksStatus(plannings) {
    plannings.forEach(planning => {
      const taskType = planning.planningName;
      const newStatus = this.mapApiStatus(planning.status);
      
      this.tasks.set(taskType, {
        id: planning.planningId,
        type: taskType,
        status: newStatus,
        result: null,
        details: [],
        sources: []
      });
    });
  }

  // 添加获取下一个任务的辅助方法
  getNextTask(currentTaskType, plannings) {
    const taskOrder = [
      TASK_TYPES.COMPETITOR_SEARCH,
      TASK_TYPES.COMPETITOR_SCORING,
      TASK_TYPES.PRODUCT_COMPARISON
    ];
    
    const currentIndex = taskOrder.indexOf(currentTaskType);
    if (currentIndex < taskOrder.length - 1) {
      const nextTaskType = taskOrder[currentIndex + 1];
      return plannings.find(p => p.planningName === nextTaskType);
    }
    return null;
  }

  // 添加 API 状态映射方法
  mapApiStatus(apiStatus) {
    switch (apiStatus) {
      case 'init':
        return TASK_STATUS.PENDING;
      case 'processing':
        return TASK_STATUS.RUNNING;
      case 'finished':
        return TASK_STATUS.COMPLETED;
      case 'failed':
        return TASK_STATUS.FAILED;
      default:
        return TASK_STATUS.PENDING;
    }
  }

  // 清理所有任务
  clearAllTasks() {
    console.log('Clearing all tasks...');
    
    // 清除轮询间隔
    this.allPollingIntervals.forEach(interval => {
      console.log('Clearing interval:', interval);
      clearInterval(interval);
    });
    this.allPollingIntervals.clear();
    this.activePolling.clear();
    
    // 只有在所有任务完成或失败时才重置这些状态
    const allTasksFinished = Array.from(this.tasks.values()).every(task => 
      task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.FAILED
    );

    if (allTasksFinished) {
      this.hasCompletionMessage = false;
      this.hasXavierStartMessage = false;
      this.hasYoussefStartMessage = false;
      this.hasFailureMessage = false;
      this.lastProcessedState = null;
    }
    
    if (this.detailPollingInterval) {
      clearInterval(this.detailPollingInterval);
      this.detailPollingInterval = null;
    }
    
    this.lastDetailCount = 0;
    this.currentPage = 1;
    
    if (this.sourcesPollingInterval) {
      clearInterval(this.sourcesPollingInterval);
      this.sourcesPollingInterval = null;
    }
    
    this.lastSourceCount = 0;
    this.messageQueue = [];
    this.isProcessingQueue = false;
  }

  // 获取所有任务的状态
  getAllTasksStatus() {
    const status = {};
    this.tasks.forEach((task, type) => {
      status[type] = {
        status: task.status,
        result: task.result
      };
    });
    return status;
  }

  // 获取任务消息
  getTaskMessage(taskType, status) {
    switch (taskType) {
      case TASK_TYPES.COMPETITOR_SEARCH:
        return status === TASK_STATUS.RUNNING 
          ? { 
              type: 'agent',
              agentId: 1, // Joey
              content: '🔍 Analyzing market landscape and identifying key competitors...',
              isThinking: true
            }
          : status === TASK_STATUS.COMPLETED
            ? {
                type: 'agent',
                agentId: 1,
                content: '✅ Competitor list finalized. Starting scoring analysis...',
                isThinking: false
              }
            : null;

      case TASK_TYPES.COMPETITOR_SCORING:
        return status === TASK_STATUS.RUNNING
          ? {
              type: 'agent',
              agentId: 1, // Joey handles scoring
              content: '📊 Evaluating competitor strengths/weaknesses and market positions...',
              isThinking: true
            }
          : status === TASK_STATUS.COMPLETED
            ? {
                type: 'agent',
                agentId: 1,
                content: '📈 Scoring complete. Transferring to Youssef for content creation.',
                isThinking: false
              }
            : null;

      case TASK_TYPES.PRODUCT_COMPARISON:
        return status === TASK_STATUS.RUNNING
          ? {
              type: 'agent',
              agentId: 2, // Youssef
              content: '📝 Drafting comparative content in markdown...',
              isThinking: true
            }
          : status === TASK_STATUS.COMPLETED
            ? {
                type: 'agent',
                agentId: 2,
                content: '✅ Content draft ready for development.',
                isThinking: false
              }
            : null;

      case TASK_TYPES.CODE_ANALYSIS:  // 移除该case或重定向给Xavier
        return null; // 禁用代码分析任务类型

      default:
        return null;
    }
  }

  // 添加获取失败消息的方法
  getFailureMessage(taskType, errorMsg) {
    // Clear all polling tasks
    this.clearAllTasks();

    // Reset loading and message sending states via callback
    if (this.onLoadingUpdate) {
      this.onLoadingUpdate(false);
    }
    if (this.onMessageSendingUpdate) {
      this.onMessageSendingUpdate(false);
    }

    switch (taskType) {
      case TASK_TYPES.COMPETITOR_SEARCH:
        return {
          type: 'agent',
          agentId: 1, // Joey
          content: `I apologize, but I encountered an issue while searching for competitors. This might be due to:
• Invalid or inaccessible website
• Limited market data availability
• Technical difficulties

Would you please verify the URL and try again? Alternatively, you can try with a different website.`,
          isThinking: false
        };

      case TASK_TYPES.COMPETITOR_SCORING:
        return {
          type: 'agent',
          agentId: 2, // Xavier
          content: `I encountered a problem while analyzing the competitors. This could be because:
• Insufficient competitor data
• Unable to access competitor information
• Technical analysis limitations

Let's start over with a new search. Please provide the website URL again.`,
          isThinking: false
        };

      case TASK_TYPES.PRODUCT_COMPARISON:
        return {
          type: 'agent',
          agentId: 3, // Youssef
          content: `I ran into difficulties while comparing the products. This might be due to:
• Complex product structures
• Limited feature information
• Data processing issues

Please try the analysis again with the website URL.`,
          isThinking: false
        };

      default:
        return {
          type: 'agent',
          agentId: 1,
          content: 'An unexpected error occurred. Please try again with the website URL.',
          isThinking: false
        };
    }
  }

  // 添加detail轮询方法
  startDetailPolling() {
    if (this.activePolling.has('DETAILS')) return;

    const pollDetails = async () => {
      try {
        const response = await this.apiClient.getAlternativeDetail(
          this.websiteId,
          {
            planningId: this.planningId,
            page: 1,
            limit: 300
          }
        );

        console.log('API Response:', response);

        // 确保正确获取数据
        const details = response?.data || [];
        const hasNewData = details.length > 0;

        console.log('Parsed details:', details);

        if (Array.isArray(details)) {
          if (hasNewData) {
            if (this.onDetailsUpdate) {
              this.onDetailsUpdate(details, hasNewData);
            }
          } else {
            if (this.onDetailsUpdate) {
              this.onDetailsUpdate(details, false);
            }
          }
        }
      } catch (error) {
        console.error('Error polling details:', error);
      }
    };

    const interval = setInterval(pollDetails, 8000);
    this.allPollingIntervals.add(interval);
    this.activePolling.add('DETAILS');
    pollDetails(); // Execute immediately for first time
  }

  // 在任务完成或失败时停止detail轮询
  stopDetailPolling() {
    if (this.detailPollingInterval) {
      clearInterval(this.detailPollingInterval);
      this.detailPollingInterval = null;
    }
  }

  // 添加 sources 轮询方法
  startSourcePolling() {
    if (this.activePolling.has('SOURCES')) return;

    const pollSources = async () => {
      try {
        const response = await this.apiClient.getAlternativeSources(this.websiteId);
        
        console.log('Sources API Response:', response);

        // 确保正确获取数据
        const sources = response?.data || [];
        const hasNewData = sources.length > this.lastSourceCount;
        this.lastSourceCount = sources.length;

        if (Array.isArray(sources)) {
          if (this.onSourcesUpdate) {
            this.onSourcesUpdate(sources, hasNewData);
          }
        }
      } catch (error) {
        console.error('Error polling sources:', error);
      }
    };

    const interval = setInterval(pollSources, 10000);
    this.allPollingIntervals.add(interval);
    this.activePolling.add('SOURCES');
    pollSources(); // 立即执行第一次
  }

  // 在 TaskManager 类中添加获取当前活动 agent 的辅助方法
  getActiveAgent(taskType) {
    switch (taskType) {
      case TASK_TYPES.COMPETITOR_SEARCH:
        return 1; // Joey
      case TASK_TYPES.COMPETITOR_SCORING:
        return 1; // Joey
      case TASK_TYPES.PRODUCT_COMPARISON:
        return 2; // Youssef
      default:
        return 1; // 默认使用 Joey
    }
  }

  // 修改错误处理消息
  getRetryMessage(taskType) {
    const messages = {
      [TASK_TYPES.COMPETITOR_SEARCH]: "🔄 I've encountered a small hiccup in the competitor search. Don't worry - I'm automatically retrying the analysis. Please hold on for a moment...",
      [TASK_TYPES.COMPETITOR_SCORING]: "🔄 The scoring analysis hit a brief snag. I'm automatically restarting the process. Just a moment while I recalibrate...",
      [TASK_TYPES.PRODUCT_COMPARISON]: "🔄 There was a slight interruption in the comparison process. I'm automatically resuming the analysis. Please wait while I reconnect..."
    };
    return messages[taskType] || "🔄 A brief interruption occurred. I'm automatically retrying the process. Please wait a moment...";
  }

  // Add callback setters for loading and message sending states
  setLoadingUpdateCallback(callback) {
    this.onLoadingUpdate = callback;
  }

  setMessageSendingUpdateCallback(callback) {
    this.onMessageSendingUpdate = callback;
  }

  pausePolling() {
    // 停止所有类型的轮询
    this.allPollingIntervals.forEach(interval => clearInterval(interval));
    this.allPollingIntervals.clear();
    this.activePolling.clear();
  }

  parseCompetitors(data) {
    try {
      const rawData = typeof data === 'string' ? JSON.parse(data) : data;
      return rawData.slice(0, 10); // 限制最多显示10个
    } catch (e) {
      return [];
    }
  }

  showCompetitorOptions(competitors) {
    const selectionMessage = {
      type: 'agent',
      agentId: 1,
      content: '✨ Great! I\'ve identified the main competitors. Please select up to 3 to analyze:',
      options: competitors.map((c, i) => ({
        label: `${i + 1}. ${c.replace('www.', '')}`,
        value: c
      })),
      maxSelections: 3, // 添加最大选择数量限制
      isThinking: false
    };

    this.onMessageUpdate?.(prev => [...prev, selectionMessage]);
  }

  async continueAnalysis(selected) {
    // 修改这里：仅清理消息队列，不清理轮询
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.currentTaskType = TASK_TYPES.COMPETITOR_SCORING;
    const scoringAgent = this.getActiveAgent(this.currentTaskType);

    try {
      this.onMessageSendingUpdate?.(true);
      
      const response = await this.apiClient.generateAlternative(
        this.websiteId,
        selected
      );

      if (!response || response.code !== 200 || !response.data?.websiteId) {
        throw new Error(response?.message || 'Invalid server response');
      }

      // 更新为新的websiteId
      this.websiteId = response.data.websiteId;

      // 成功后再构建消息队列
      this.messageQueue = [
        {
          type: 'agent',
          agentId: 1, // Joey确认选择
          content: '✅ Final selection confirmed',
          isThinking: false
        },
        {
          type: 'agent',
          agentId: 1,
          content: '⏳ Starting final scoring process...',
          isThinking: true
        }
      ];

      // 修改这里：不再重置轮询状态
      this.hasCompetitorSelection = false;
      this.hasCompletionMessage = false;
      this.hasFailureMessage = false;

      // 确保轮询持续运行
      if (this.allPollingIntervals.size === 0) {
        this.startPolling();
        this.startDetailPolling();
        this.startSourcePolling();
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      this.messageQueue = [];
      this.onMessageUpdate?.(prev => [
        ...prev.filter(msg => 
          !msg.content.includes('Xavier is now analyzing') &&
          !msg.content.includes('Transferring analysis')
        ),
        {
          type: 'agent',
          agentId: 1,
          content: `⚠️ Failed to start analysis: ${error.message}`,
          isThinking: false
        }
      ]);
    } finally {
      this.onMessageSendingUpdate?.(false);
      if (!this.isProcessingQueue) {
        this.processMessageQueue();
      }
    }
  }

  // 添加获取agent名称的辅助方法
  getAgentName(agentId) {
    const agents = {
      1: 'Joey',
      2: 'Youssef',
      3: 'Xavier'
    };
    return agents[agentId] || 'Joey';
  }

  async processMessageQueue() {
    if (this.isProcessingQueue || !this.onMessageUpdate) return;
    
    this.isProcessingQueue = true;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      
      // 使用 Promise 来确保消息按顺序显示
      await new Promise(resolve => {
        this.onMessageUpdate(prev => {
          // 检查是否已存在相同消息
          const messageExists = prev.some(m => 
            m.content === message.content && 
            m.agentId === message.agentId
          );
          
          if (messageExists) {
            return prev;
          }

          // 更新前一条消息的状态
          const updatedMessages = prev.map(msg => {
            if (msg.isThinking) {
              return { ...msg, isThinking: false };
            }
            return msg;
          });

          return [...updatedMessages, message];
        });
        
        // 添加小延迟使消息显示更自然
        setTimeout(resolve, 800);
      });
    }
    
    this.isProcessingQueue = false;
  }

  // 添加 Xavier 开始消息的方法
  async updateXavierStartMessage() {
    this.messageQueue.push({
      type: 'agent',
      agentId: 3, // Xavier
      content: '💻 Converting markdown to webpage...',
      isThinking: true
    });
  }

  // 添加 Youssef 开始消息的方法
  async updateYoussefStartMessage() {
    if (this.hasYoussefStartMessage) return; // 防止重复

    this.messageQueue.push(
      {
        type: 'agent',
        agentId: 3, // Youssef
        content: '🔄 Starting product comparison analysis...',
        isThinking: true
      },
      {
        type: 'agent',
        agentId: 2, // Xavier
        content: '✅ Scoring analysis complete! Handing over to Youssef for final comparison...',
        isThinking: false
      }
    );

    await this.processMessageQueue();
  }

  // 添加错误处理方法
  async handlePollingError(error) {
    console.error('Polling error occurred:', error);
    
    // 清理所有进行中的任务
    this.clearAllTasks();
    
    // 如果已经有错误消息，不再添加
    if (this.hasFailureMessage) return;
    this.hasFailureMessage = true;

    // 更新所有现有消息的状态
    this.onMessageUpdate?.(prev => {
      // 先关闭所有思考状态
      const updatedMessages = prev.map(msg => ({
        ...msg,
        isThinking: false
      }));

      // 添加错误消息
      return [...updatedMessages, {
        type: 'agent',
        agentId: 1, // 使用 Joey 发送错误消息
        content: '❌ I encountered an error while processing your request. Please try again.',
        isThinking: false
      }];
    });

    // 重置 UI 状态
    if (this.onLoadingUpdate) {
      this.onLoadingUpdate(false);
    }
    if (this.onMessageSendingUpdate) {
      this.onMessageSendingUpdate(false);
    }
  }
}

const ResearchTool = () => {
  // 确保在组件顶层调用hooks
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedCompetitors, setSelectedCompetitors] = useState([]);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [workflowStage, setWorkflowStage] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isMessageSending, setIsMessageSending] = useState(false);
  // 添加Deep Research模式状态
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  // 添加credits状态
  const [credits, setCredits] = useState(100);
  // 修改credits弹窗显示状态
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false);
  
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  // 添加初始消息的状态控制
  const [initialMessagesShown, setInitialMessagesShown] = useState(0);
  
  // 修改初始消息数组，只保留两条消息
  const initialMessages = [
    { 
      type: 'agent', 
      agentId: 1,
      content: '👋 Welcome to Alternatively! I\'m Joey, your dedicated Research Specialist, ready to help you discover and analyze SaaS alternatives.'
    },
    {
      type: 'agent',
      agentId: 1,
      content: '🔍 Enter a product domain (e.g., websitelm.com) and I\'ll find the best alternatives instantly.\n\n✨ I\'ll generate SEO-friendly Alternative Pages for your instant preview!\n\n💡 Pro tip: Enable Deep Research mode for more in-depth analysis! Let\'s begin! 🚀'
    }
  ];
  
  // 添加 tabs 状态
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  // 修改 rightPanelTab 的初始状态
  const [rightPanelTab, setRightPanelTab] = useState('details'); // 默认选中 details

  // 添加浏览器显示状态
  const [showBrowser, setShowBrowser] = useState(false);

  // 添加新的状态
  const [customerId, setCustomerId] = useState(null);

  // Add websiteId state
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);

  // 添加detail相关状态
  const [detailsData, setDetailsData] = useState([]);
  const [totalDetails, setTotalDetails] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(300);

  // 将 expandedNodes 状态移到组件顶层
  const [expandedNodes, setExpandedNodes] = useState({});

  // 添加 sources 状态
  const [sourcesData, setSourcesData] = useState([]);

  // 在组件的最开始部分添加引导弹窗的渲染逻辑
  // const renderGuideModal = () => ( ... );

  // 在组件加载时检查登录状态
  useEffect(() => {
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    const token = localStorage.getItem('alternativelyAccessToken');
    if (storedCustomerId && token) {
      setCustomerId(storedCustomerId);
    }
  }, []);

  // 处理新消息,更新tabs
  const handleNewMessage = (message) => {
    if (message.details && message.details.length > 0) {
      const newTabs = message.details.map((detail, index) => ({
        id: detail.id || `tab-${index}`,
        title: detail.title || `Page ${index + 1}`,
        url: detail.url,
        active: index === 0,
        created_at: detail.created_at
      }));
      setTabs(newTabs);
      setActiveTabId(newTabs[0].id);
    }
  };

  // 处理标签页切换
  const handleTabChange = (tabId) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
    setActiveTabId(tabId);
  };

  // 修改域名验证函数，使其更严格
  const validateDomain = (domain) => {
    // 移除 http:// 或 https:// 前缀
    const cleanDomain = domain.replace(/^https?:\/\//i, '');
    // 移除末尾的斜杠
    const trimmedDomain = cleanDomain.replace(/\/+$/, '');
    
    // 验证域名格式：
    // - 允许字母、数字、连字符
    // - 必须包含至少一个点
    // - 顶级域名至少2个字符
    // - 不允许连续的点或连字符
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(trimmedDomain);
  };

  const handleUserInput = (e) => {
    // 新增选择处理
    if (userInput?.type === 'competitor_select') {
      handleCompetitorSelect(userInput.values);
      return;
    }
    
    // 阻止任何可能的默认行为
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const newMessages = [...messages, { type: 'user', content: userInput }];
    setMessages(newMessages);
    
    // Process the input as domain
    const cleanDomain = userInput.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    setDomain(cleanDomain);
    
    // Clear input field
    setUserInput('');
    
    // 设置消息发送状态为true
    setIsMessageSending(true);
    
    // Validate domain and start analysis
    if (!validateDomain(cleanDomain)) {
      setTimeout(() => {
        setMessages([...newMessages, { 
          type: 'agent', 
          agentId: 1,
          content: `I notice that "${cleanDomain}" doesn't seem to be a valid domain name. Here's what I'm looking for:

• A proper domain name (e.g., "example.com", "my-site.co.uk")
• No special characters (except hyphens between words)
• Must include a valid top-level domain (.com, .org, etc.)

Could you please provide a valid domain name? For example: "websitelm.com"`,
          isThinking: false
        }]);
        setIsMessageSending(false);
      }, 500);
      return;
    }
    
    // 延迟0.5秒后开始分析过程，显得更真实
    setTimeout(() => {
      startAnalysis(cleanDomain);
    }, 500);
  };
  
  // 修改竞品选择处理逻辑
  const handleCompetitorSelect = (selected) => {
    if (selected.length > 3) {
      messageApi.error('Maximum 3 competitors can be selected');
      return;
    }
    if (selected.length === 3) {
      messageApi.info('You have reached the maximum selection (3 competitors)');
    }
    setSelectedCompetitors(selected);
  };

  // 添加确认处理方法
  const handleConfirmSelection = async () => {
    // 清除旧消息
    setMessages(prev => prev.filter(msg => 
      !msg.content.includes('Xavier is now analyzing') &&
      !msg.content.includes('Transferring analysis')
    ));
    
    if (selectedCompetitors.length === 0) {
      messageApi.error('Please select at least 1 competitor');
      return;
    }

    setMessages(prev => [
      ...prev,
      { 
        type: 'user', 
        content: `Selected: ${selectedCompetitors.map(c => c.replace('www.', '')).join(', ')}` 
      },
      {
        type: 'agent',
        agentId: 1,
        content: '✅ Great choices! Now transferring to Youssef for content analysis...',
        isThinking: true
      }
    ]);

    taskManager.continueAnalysis(selectedCompetitors);
    setSelectedCompetitors([]); // 清空选中状态
  };

  const [taskManager] = useState(() => new TaskManager(apiClient));

  useEffect(() => {
    // 设置任务更新回调
    taskManager.onTaskUpdate = (taskType, task) => {
      // 当任务类型变化时自动更新消息
      if (taskType !== taskManager.currentTaskType) {
        const newAgent = taskManager.getActiveAgent(taskType);
        setMessages(prev => [...prev, {
          type: 'agent',
          agentId: newAgent,
          content: `${taskManager.getAgentName(newAgent)} is now leading the analysis...`,
          isThinking: true
        }]);
      }
      // 更新工作流程状态
      setWorkflowStage(task.status);
      // 根据任务类型和状态更新UI
      updateUIForTask(taskType, task);
    };

    taskManager.onDetailsUpdate = (details, hasNewData) => {
      setDetailsData(details);
      
      // 如果有新数据且不在 details tab，自动切换
      if (hasNewData && rightPanelTab !== 'details') {
        setRightPanelTab('details');
      }
    };

    taskManager.onSourcesUpdate = (sources, hasNewData) => {
      setSourcesData(sources);
      
      // 如果有新数据且不在 sources tab，自动切换
      if (hasNewData && rightPanelTab !== 'sources') {
        setRightPanelTab('sources');
      }
    };

    // 修改消息更新回调
    taskManager.onMessageUpdate = (messageUpdater) => {
      if (typeof messageUpdater === 'function') {
        setMessages(messageUpdater);
      } else {
        setMessages(prev => [...prev, messageUpdater]);
      }
    };

    // 初始化 TaskManager 时添加浏览器更新回调
    taskManager.onBrowserUpdate = ({ show, tabs }) => {
      setShowBrowser(show);
      setTabs(tabs);
    };

    // 添加 callbacks during initialization
    taskManager.setLoadingUpdateCallback(setLoading);
    taskManager.setMessageSendingUpdateCallback(setIsMessageSending);

    return () => {
      taskManager.clearAllTasks();
    };
  }, []);

  // Modify startAnalysis function
  const startAnalysis = async (cleanDomain) => {
    // 检查登录状态
    const token = localStorage.getItem('alternativelyAccessToken');
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    
    if (!token || !storedCustomerId) {
      setMessages(prev => [...prev, {
        type: 'agent',
        agentId: 1,
        content: '⚠️ Please login to access this feature. Your session may have expired.',
        isThinking: false
      }]);
      
      localStorage.removeItem('alternativelyAccessToken');
      localStorage.removeItem('alternativelyCustomerId');
      return;
    }

    setLoading(true);
    setWorkflowStage('collecting');
    setWorkflowProgress(0);

    try {
      // 添加初始消息（带loading状态）
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1,
        content: '🔍 I\'m now searching for your top competitors. This involves analyzing market data and identifying companies with similar offerings...',
        isThinking: true
      }]);

      // 修改为调用 searchCompetitor 而不是 generateAlternative
      const response = await apiClient.searchCompetitor(
        cleanDomain,
        deepResearchMode
      );

      if (response?.code === 200 && response?.data?.websiteId) {
        setCurrentWebsiteId(response.data.websiteId);
        taskManager.initializeResearch(response.data.websiteId, true);
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      console.error('Failed to start research:', error);
      setMessages(prev => [...prev, {
        type: 'agent',
        agentId: 1,
        content: '❌ I apologize, but I encountered an error while starting the analysis. Please try again later.',
        isThinking: false
      }]);
      setLoading(false);
      setWorkflowStage(null);
    }
  };

  // Add status polling function
  const startPollingStatus = (websiteId) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await apiClient.getAlternativeStatus(websiteId);
        
        // Update UI based on status
        if (statusResponse?.data?.status === 'COMPLETED') {
          clearInterval(pollInterval);
          handleResearchResults(statusResponse.data, domain);
        } else if (statusResponse?.data?.status === 'FAILED') {
          clearInterval(pollInterval);
          messageApi.error('Analysis failed, please try again later');
          setLoading(false);
          setWorkflowStage(null);
        }
        // Continue polling if status is PENDING or RUNNING
        
      } catch (error) {
        console.error('Failed to get status:', error);
        clearInterval(pollInterval);
        messageApi.error('Failed to get analysis status');
        setLoading(false);
        setWorkflowStage(null);
      }
    }, 3000); // Poll every 3 seconds

    // Return cleanup function
    return () => clearInterval(pollInterval);
  };

  // Modify handleResearchResults function to handle new data structure
  const handleResearchResults = (data, cleanDomain) => {
    setWorkflowStage('completed');
    setWorkflowProgress(100);
    setLoading(false);
    
    // 更新消息，移除思考状态
    setMessages(prev => {
      const updatedMessages = [...prev];
      if (updatedMessages.length > 0) {
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage.isThinking) {
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            isThinking: false
          };
        }
      }
      return updatedMessages;
    });
    
    // 添加数据验证
    const competitors = Array.isArray(data?.result) 
      ? data.result.filter(url => url !== null && url !== undefined)
      : [];
      
    // 添加结果消息
    setTimeout(() => {
      const message = competitors.length > 0 
        ? `🎉 Great news! I've found some excellent alternatives! Here are the main competitors to ${cleanDomain}:

${competitors.slice(0, 5).map((url, index) => `${index + 1}. ${url}`).join('\n')}

I've loaded these websites in the browser panel for you to explore. Would you like to know more specific details about any of them?`
        : `I apologize, but I couldn't find any valid alternatives for ${cleanDomain} at this moment. Would you like to try with a different domain?`;

      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1,
        content: message,
        isThinking: false
      }]);
      
      // 只在有竞争对手时更新浏览器标签
      if (competitors.length > 0) {
        const newTabs = competitors.slice(0, 5).map((url, index) => ({
          id: index + 1,
          title: new URL(url).hostname.replace('www.', ''),
          url: url,
          active: index === 0
        }));
        
        setTabs(newTabs);
      }
      
      setIsMessageSending(false);
    }, 500);

    // 在任务完成时停止detail轮询
    taskManager.stopDetailPolling();
  };
  
  const formatUrl = (input) => {
    let cleanDomain = input.trim();
    if (cleanDomain.startsWith('http://')) {
      cleanDomain = cleanDomain.substring(7);
    } else if (cleanDomain.startsWith('https://')) {
      cleanDomain = cleanDomain.substring(8);
    }
    return `https://${cleanDomain}`;
  };

  const renderChatMessage = (message, index) => {
    if (message.options) {
      const agent = agents.find(a => a.id === message.agentId) || agents[0];
      return (
        <div key={index} className="flex justify-start mb-8">
          <div className="flex max-w-[80%] flex-row group">
            <div className="flex-shrink-0 mr-4">
              <div className="relative">
                <Avatar 
                  size={40}
                  src={agent.avatar}
                  className="border-2 border-transparent group-hover:border-blue-400/50 transition-colors duration-300"
                />
                {message.isThinking && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-6 left-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-blue-300">{agent.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                    {agent.role}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-2xl text-sm bg-gradient-to-br from-gray-800/95 to-gray-900/95 
                            text-gray-100 shadow-xl backdrop-blur-sm border border-white/10 
                            hover:border-blue-500/30 transition-all duration-300
                            rounded-tl-none transform hover:-translate-y-0.5">
                <div className="relative z-10">
                  {message.content}
                  
                  <div className="text-xs text-gray-400 mt-2">(Max 3 selections)</div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {message.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const currentCount = selectedCompetitors.length;
                          const isSelected = selectedCompetitors.includes(opt.value);
                          
                          if (!isSelected && currentCount >= 3) {
                            messageApi.error('Maximum 3 competitors can be selected');
                            return;
                          }
                          
                          const newSelected = isSelected 
                            ? selectedCompetitors.filter(c => c !== opt.value)
                            : [...selectedCompetitors, opt.value];
                          
                          handleCompetitorSelect(newSelected);
                        }}
                        className={`p-2 rounded text-left transition-colors ${
                          selectedCompetitors.includes(opt.value)
                            ? 'bg-blue-600/30 border border-blue-400/50'
                            : 'bg-gray-700/50 hover:bg-gray-600/50'
                        }`}
                      >
                        <div className="text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-400 truncate">{opt.value}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirmSelection}
                  disabled={selectedCompetitors.length === 0}
                  className={`mt-4 w-full py-2 rounded-lg transition-colors ${
                    selectedCompetitors.length > 0
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-gray-700 cursor-not-allowed'
                  }`}
                >
                  {selectedCompetitors.length > 0 
                    ? `Confirm ${selectedCompetitors.length} Selection(s)`
                    : 'Select Competitors to Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (message.type !== 'user') {
      const agent = agents.find(a => a.id === message.agentId) || agents[0];
      return (
        <div key={index} className="flex justify-start mb-8" style={{animation: 'fadeIn 0.5s ease-out forwards'}}>
          <div className="flex max-w-[80%] flex-row group">
            <div className="flex-shrink-0 mr-4" style={{animation: 'bounceIn 0.6s ease-out forwards'}}>
              <div className="relative">
                <Avatar 
                  size={40}
                  src={agent.avatar}
                  className="border-2 border-transparent group-hover:border-blue-400/50 transition-colors duration-300"
                />
                {message.isThinking && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-6 left-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-blue-300">{agent.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                    {agent.role}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-2xl text-sm bg-gradient-to-br from-gray-800/95 to-gray-900/95 
                            text-gray-100 shadow-xl backdrop-blur-sm border border-white/10 
                            hover:border-blue-500/30 transition-all duration-300
                            rounded-tl-none transform hover:-translate-y-0.5">
                <div className="relative z-10">
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {message.isThinking && (
                  <div className="flex space-x-1.5 mt-3 items-center">
                    <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
              <div className="absolute -left-1 top-0 w-2 h-2 bg-gradient-to-br from-gray-800 to-gray-900 transform rotate-45"></div>
            </div>
          </div>
        </div>
      );
    }
    
    // 用户消息样式
    return (
      <div 
        key={index} 
        className="flex justify-end mb-8"
        style={{animation: 'fadeIn 0.5s ease-out forwards'}}
      >
        <div className="flex max-w-[80%] flex-row-reverse group">
          <div className="flex-shrink-0 ml-4">
            <div className="relative" style={{animation: 'bounceIn 0.6s ease-out forwards'}}>
              <Avatar 
                size={40}
                icon={<UserOutlined />} 
                className="bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-transparent
                         group-hover:border-blue-300/50 transition-colors duration-300"
              />
            </div>
          </div>
          <div className="relative">
            <div className="p-4 rounded-2xl text-sm bg-gradient-to-br from-blue-500 to-blue-600 
                          text-white shadow-xl backdrop-blur-sm
                          hover:shadow-blue-500/20 transition-all duration-300
                          rounded-tr-none transform hover:-translate-y-0.5">
              <div className="relative z-10">
                {message.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="absolute -right-1 top-0 w-2 h-2 bg-blue-500 transform rotate-45"></div>
          </div>
        </div>
      </div>
    );
  };
  
  // 调整agents顺序并修正职责描述
  const agents = [
    {
      id: 1,
      name: 'Joey.Z',
      avatar: '/images/zy.jpg',
      role: 'Competitive Analyst',
      description: 'Specializes in competitor discovery and scoring analysis. Responsible for market research and competitor evaluation.'
    },
    {
      id: 2,  // 调整为第二位
      name: 'Youssef',
      avatar: '/images/youssef.jpg',
      role: 'Content Strategist',
      description: 'Focuses on comparative content creation. Responsible for writing SEO-optimized alternative page content in markdown format.'
    },
    {
      id: 3,  // 调整为第三位
      name: 'Xavier.S',
      avatar: '/images/hy.jpg',
      role: 'Full-stack Developer',
      description: 'Handles page implementation. Responsible for converting markdown content into production-ready web pages.'
    }
  ];

  // 渲染 agents 卡片
  const renderAgents = () => (
    <div className="space-y-3">
      {agents.map(agent => (
        <div key={agent.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-purple-100">{agent.name}</h4>
              <p className="text-xs text-purple-300">{agent.role}</p>
            </div>
          </div>
          <p className="text-xs text-purple-200 leading-relaxed">{agent.description}</p>
        </div>
      ))}
    </div>
  );

  // 修改 renderSources 函数,使用真实数据结构
  const renderSources = () => (
    <div className="space-y-2">
      {sourcesData.length === 0 ? (
        <div className="text-gray-500 text-center py-4 text-xs">
          No sources available yet
        </div>
      ) : (
        sourcesData.map((source, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <a 
                href={source.sourceURL}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-purple-100 hover:text-purple-300 transition-colors truncate flex-1"
              >
                {source.sourceURL}
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // 修改 useEffect，防止任何自动滚动
  useEffect(() => {
    // 完全禁用自动滚动到底部的行为
    // 只在聊天区域内部滚动，不影响整个页面
    if (chatEndRef.current && messages.length > 1) {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);

  // 修改初始化加载效果
  useEffect(() => {
    // 模拟初始化加载
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // 添加新的 useEffect 来处理引导弹窗关闭后的欢迎消息
  useEffect(() => {
    // 当引导弹窗被关闭时
    if (!initialMessagesShown) {
      // 开始显示初始消息时，设置消息发送状态为true
      setIsMessageSending(true);
      // 开始逐步显示初始消息
      showInitialMessagesSequentially();
    }
  }, []);

  // 修改逐步显示初始消息的函数
  const showInitialMessagesSequentially = () => {
    // 设置第一条消息
    setMessages([initialMessages[0]]);
    setInitialMessagesShown(1);
    
    // 设置第二条消息
    setTimeout(() => {
      setMessages(prev => [...prev, initialMessages[1]]);
      setInitialMessagesShown(2);
      setIsMessageSending(false);
    }, 1000);
  };

  // 添加新的动画样式
  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes slideInRight {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideInLeft {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideDown {
      from { max-height: 0; opacity: 0; }
      to { max-height: 500px; opacity: 1; }
    }

    @keyframes slideUp {
      from { max-height: 500px; opacity: 1; }
      to { max-height: 0; opacity: 0; }
    }
  `;

  // 如果正在初始化加载，显示加载界面
  if (initialLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 
                    flex items-center justify-center" style={{ paddingTop: "80px" }}>
        <div className="text-center">
          <img 
            src="/images/alternatively-logo.png" 
            alt="Alternatively" 
            className="w-16 h-16 mx-auto mb-4 animate-pulse" 
          />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Alternatively</h2>
          <p className="text-gray-300">Preparing your research environment...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 切换Deep Research模式
  const toggleDeepResearchMode = () => {
    setDeepResearchMode(!deepResearchMode);
    
    // 当用户切换模式时，添加相应的代理消息提示
    if (!deepResearchMode) {
      // 如果当前是关闭状态，切换到开启状态
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1, // 使用Joey来解释深度研究模式
        content: '🔬 Deep Research mode activated! I\'ll now perform a more comprehensive analysis, exploring additional data sources and providing more detailed insights. This may take a bit longer, but the results will be much more thorough.',
        isThinking: false
      }]);
    } else {
      // 如果当前是开启状态，切换到关闭状态
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1,
        content: '📊 Standard Research mode activated. I\'ll focus on providing quick, essential insights about alternatives. This is perfect for getting a rapid overview of your options.',
        isThinking: false
      }]);
    }
  };

  // 修改分页处理函数
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 更新TaskManager中的当前页
    if (taskManager) {
      taskManager.currentPage = page;
      // 立即触发一次数据获取
      taskManager.pollDetails();
    }
  };

  // 修改 renderDetails 函数
  const renderDetails = (details) => {
    if (!details || details.length === 0) {
      return (
        <div className="text-gray-500 text-center py-4 text-xs">
          No details available
        </div>
      );
    }

    return (
      <div className="p-3 space-y-2">
        {details.map((detail, index) => {
          const { data, event, created_at } = detail;
          const { title, status, outputs } = data || {};
          
          return (
            <div 
              key={index} 
              className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 
                        hover:border-gray-600/50 transition-all duration-300"
            >
              <div className="text-[11px] text-gray-300 font-medium">{title || event}</div>
              {status && (
                <div className={`text-[10px] mt-1.5 ${
                  status === "succeeded" ? "text-green-500" : 
                  status === "failed" ? "text-red-500" : 
                  "text-gray-400"
                }`}>
                  {status}
                </div>
              )}
              {outputs && (
                <div className="text-[10px] text-gray-400 mt-1.5 break-words leading-relaxed">
                  {typeof outputs === 'string' ? outputs : JSON.stringify(outputs)}
                </div>
              )}
              <div className="text-[9px] text-gray-500 mt-1.5">
                {new Date(created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ConfigProvider wave={{ disabled: true }}>
      {contextHolder}
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 
                    text-white flex items-center justify-center p-4 relative overflow-hidden" 
           style={{ paddingTop: "80px" }}>
        <style>{animationStyles}</style>
        
        <div className="absolute inset-0" style={{ paddingTop: "80px" }}>
          <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
          {/* 左侧对话栏 */}
          <div className={`${showBrowser ? 'w-1/5' : 'w-4/5'} transition-all duration-300 ease-in-out 
                           bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl flex flex-col h-full`}>
            <div className="h-10 px-4 border-b border-gray-300/20 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center">
                <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-5 h-5 mr-1.5" />
                <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
              </div>
              
              {/* 修改Credits图标和弹窗 */}
              <div className="relative">
                <div 
                  className="flex items-center cursor-pointer text-gray-300 hover:text-white transition-colors"
                  onClick={() => setShowCreditsTooltip(!showCreditsTooltip)}
                >
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
                    <span className="text-xs font-medium">💎</span>
                  </div>
                </div>
                
                {showCreditsTooltip && (
                  <div 
                    className="absolute right-0 top-8 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50 text-xs"
                    style={{animation: 'fadeIn 0.2s ease-out forwards'}}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-purple-300">Account Balance</span>
                      <button 
                        onClick={() => setShowCreditsTooltip(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold text-lg">{credits} Credits</span>
                    </div>
                    
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
                        style={{width: `${Math.min(100, (credits/200)*100)}%`}}
                      ></div>
                    </div>
                    
                    <p className="mb-3 text-gray-300">Each research consumes 10-20 Credits</p>
                    
                    <button className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-white text-xs transition-colors">
                      Recharge Credits
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* 聊天消息容器 - 进一步增加顶部内边距 */}
            <div className="flex-1 overflow-y-auto pt-12 px-4 pb-4 chat-messages-container">
              {initialLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  {messages.map((message, index) => renderChatMessage(message, index))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
            
            {/* 修改输入区域的样式和位置 */}
            <div className="p-4 border-t border-gray-300/20 flex-shrink-0">
              <div className="max-w-[600px] mx-auto">
                <form onSubmit={handleUserInput} className="relative">
                  <Input
                    ref={inputRef}
                    placeholder={deepResearchMode 
                      ? "Enter website for comprehensive analysis..." 
                      : "Enter your product URL (e.g., websitelm.com)"}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={loading || isMessageSending}
                    className="bg-white/10 border border-gray-300/30 rounded-xl text-sm"
                    style={{ 
                      color: 'black', 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      height: '48px',
                      paddingLeft: '16px',
                      transition: 'all 0.3s ease'
                    }}
                    prefix={
                      <SearchOutlined 
                        style={{ 
                          color: 'rgba(0, 0, 0, 0.45)',
                          fontSize: '16px'
                        }} 
                      />
                    }
                  />
                </form>

                <div className="flex items-center justify-between mt-3 px-1">
                  <div className="flex items-center space-x-4">
                    {/* Deep 开关移到这里 */}
                    <button 
                      type="button"
                      className={`flex items-center px-2 py-1 rounded-full text-xs transition-all duration-200 
                        ${loading || isMessageSending 
                          ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' 
                          : deepResearchMode
                            ? 'bg-purple-500 text-white hover:bg-purple-600' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      onClick={() => {
                        if (!loading && !isMessageSending) {
                          toggleDeepResearchMode();
                        }
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full mr-1.5 transition-colors ${
                        deepResearchMode ? 'bg-white' : 'bg-gray-500'
                      }`}></span>
                      Deep
                    </button>

                    {/* 模式说明文本 */}
                    <span className="text-xs text-purple-300/80">
                      {deepResearchMode ? (
                        <span className="flex items-center">
                          <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-1.5 animate-pulse"></span>
                          Comprehensive analysis mode
                        </span>
                      ) : (
                        "Quick search mode"
                      )}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400">
                    Press Enter ↵ to search
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 中间浏览器区域 */}
          <div className={`${showBrowser ? 'w-3/5' : 'hidden'} transition-all duration-300 ease-in-out 
                           bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl flex flex-col h-full relative`}>
            {/* 直接渲染 BrowserSimulator，移除外层的 tab 栏 */}
            <BrowserSimulator 
              url={tabs.find(tab => tab.active)?.url}
              tabs={tabs}
              onTabChange={handleTabChange}
            />
          </div>
          
          {/* 右侧分析结果栏 */}
          <div className="w-1/5 bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl 
                          flex flex-col h-full relative">
            {/* 将 Show 按钮和 Agent 头像放在顶部 */}
            <div className="border-b border-gray-300/20">
              <div className="flex items-center p-3">
                {!showBrowser && (
                  <button
                    onClick={() => setShowBrowser(true)}
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg transition-colors mr-2"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                
                {/* 修改 Agent 头像和状态气泡的渲染部分 */}
                <div className="flex items-center space-x-6">
                  {agents.map(agent => (
                    <div key={agent.id} className="relative group">
                      <Tooltip title={`${agent.name} - ${agent.role}`}>
                        <div className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                          messages[messages.length - 1]?.agentId === agent.id && messages[messages.length - 1]?.isThinking
                            ? 'border-blue-500 scale-110'
                            : 'border-transparent hover:border-gray-400'
                        }`}>
                          <img 
                            src={agent.avatar} 
                            alt={agent.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Tooltip>
                      
                      {/* 重新设计的状态气泡 */}
                      {messages[messages.length - 1]?.agentId === agent.id && 
                       messages[messages.length - 1]?.isThinking && (
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                          <div className="px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-500 
                                        rounded-full shadow-lg border border-blue-400/20
                                        text-[9px] text-white font-medium tracking-tight
                                        flex items-center gap-1.5 backdrop-blur-sm">
                            <span className="flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            {agent.role === 'Competitive Analyst' && 'Analyzing Market'}
                            {agent.role === 'Full-stack Developer' && 'Coding For Final Pages'}
                            {agent.role === 'Content Strategist' && 'Writing Content'}
                          </div>
                          {/* 添加小三角形指示器 */}
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 
                                        border-l-4 border-r-4 border-b-4 
                                        border-l-transparent border-r-transparent border-b-blue-600"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tab 切换按钮 */}
              <div className="flex">
                <button
                  onClick={() => setRightPanelTab('details')}
                  className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors
                    ${rightPanelTab === 'details'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-300 hover:text-gray-200'
                    }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setRightPanelTab('sources')}
                  className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors
                    ${rightPanelTab === 'sources'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-300 hover:text-gray-200'
                    }`}
                >
                  Sources
                </button>
              </div>
            </div>
            
            {/* Tab 内容区域 */}
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'details' && (
                <>
                  {renderDetails(detailsData)}
                </>
              )}
              
              {rightPanelTab === 'sources' && (
                <div className="p-3">
                  {renderSources()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ResearchTool; 
