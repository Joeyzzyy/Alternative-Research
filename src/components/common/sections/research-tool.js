'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import BrowserSimulator from '../BrowserSimulator';

// Constants
const TASK_STATUS = {
  PENDING: 'init',
  RUNNING: 'processing',
  COMPLETED: 'finished',
  FAILED: 'failed'
};

const TASK_TYPES = {
  COMPETITOR_SEARCH: 'COMPETITOR_SEARCH',
  COMPETITOR_SCORING: 'COMPETITOR_SCORING',
  PRODUCT_COMPARISON: 'PRODUCT_COMPARISON',
  STYLE_APPLICATION: 'PRODUCT_CHANGE_STYLE'
};

const POLLING_INTERVALS = {
  TASK_STATUS: 3000,
  TASK_DETAILS: 5000,
  SOURCES: 10000
};

const AGENTS = [
  {
    id: 1,
    name: 'Joey.Z',
    avatar: '/images/zy.jpg',
    role: 'Competitive Analyst',
    description: 'Specializes in competitor discovery and scoring analysis. Responsible for market research and competitor evaluation.'
  },
  {
    id: 2,
    name: 'Youssef',
    avatar: '/images/youssef.jpg',
    role: 'Content Strategist',
    description: 'Focuses on comparative content creation. Responsible for writing SEO-optimized alternative page content in markdown format.'
  },
  {
    id: 3,
    name: 'Xavier.S',
    avatar: '/images/hy.jpg',
    role: 'Full-stack Developer',
    description: 'Handles page implementation. Responsible for converting markdown content into production-ready web pages.'
  }
];

/**
 * Task Manager Class
 * Handles all task-related operations and state management
 */
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
    
    // State flags
    this.hasInitialMessage = false;
    this.hasCompletionMessage = false;
    this.hasXavierCompletionMessage = false;
    this.hasFailureMessage = false;
    this.hasXavierStartMessage = false;
    this.hasYoussefStartMessage = false;
    this.hasCompetitorSelection = false;
    this.contentPrepFlag = false;
    
    // Polling state
    this.lastProcessedState = null;
    this.pollingInterval = null;
    this.detailPollingInterval = null;
    this.sourcesPollingInterval = null;
    this.allPollingIntervals = new Set();
    
    // Pagination
    this.currentPage = 1;
    this.pageSize = 300;
    this.lastDetailCount = 0;
    this.lastSourceCount = 0;
    
    // Callbacks
    this.onBrowserUpdate = null;
    this.onLoadingUpdate = null;
    this.onMessageSendingUpdate = null;
    
    // Task state
    this.currentTaskType = null;
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.onTaskCompleted = null;

    // 新增样式任务状态
    this.hasStyleTask = false;
    this.styleTaskCompleted = false;
    this.isStyleTaskActive = false;
    this.stylePollInterval = null;
  }

  /**
   * Initialize a new research task
   * @param {string} websiteId - The website ID to research
   * @param {boolean} hasInitialMessage - Whether initial message has already been shown
   */
  async initializeResearch(websiteId, hasInitialMessage = false) {
    this.websiteId = websiteId;
    this.clearAllTasks();
    
    this.hasInitialMessage = hasInitialMessage;
    
    this.startPolling();
    this.startDetailPolling();
    this.startSourcePolling();
  }

  /**
   * Check if all tasks are completed
   * @param {Array} plannings - Array of planning objects
   * @returns {boolean} Whether all tasks are completed
   */
  areAllTasksCompleted(plannings) {
    return plannings.every(planning => planning.status === 'finished');
  }

  /**
   * Start polling for task status updates
   */
  startPolling() {
    console.log('Force restarting polling...');
    
    const pollTaskStatus = async () => {
      try {
        console.log('Polling task status...');
        const response = await this.apiClient.getAlternativeStatus(this.websiteId);
        console.log('Poll response:', response);

        const plannings = response?.data || [];
        
        // Create a snapshot of current state
        const currentState = plannings.map(p => `${p.planningName}:${p.status}`).join('|');
        
        // Check if all tasks are complete or failed
        const allTasksFinished = plannings.every(p => 
          ['finished', 'failed'].includes(p.status)
        ) && plannings.some(p => p.status === 'finished');

        // 增加调试日志
        console.log('All tasks finished check:', {
          allFinished: plannings.every(p => ['finished', 'failed'].includes(p.status)),
          hasSuccess: plannings.some(p => p.status === 'finished'),
          allTasksFinished
        });

        if (allTasksFinished) {
          console.log('All tasks finished or failed, clearing polling');
          await this.handleAllTasksCompleted();
          this.clearAllTasks();
          return;
        }

        // Skip if no state change and not all tasks are complete
        if (this.lastProcessedState === currentState) {
          console.log('No state change, continuing polling');
          return;
        }
        
        this.lastProcessedState = currentState;

        // Check for failed tasks
        const failedTask = plannings.find(p => p.status === 'failed');
        if (failedTask) {
          this.handleTaskFailure(failedTask);
          return;
        }

        // Check if all tasks completed
        const allCompleted = this.areAllTasksCompleted(plannings);
        if (allCompleted) {
          await this.handleAllTasksCompleted();
          return;
        }

        // Update task stages and status
        await this.updateTaskStages(plannings);
        this.updateTasksStatus(plannings);

      } catch (error) {
        console.error('Error polling task status:', error);
        await this.handlePollingError(error);
      }
    };

    // Clear existing intervals
    if (this.allPollingIntervals.size > 0) {
      this.allPollingIntervals.forEach(interval => clearInterval(interval));
      this.allPollingIntervals.clear();
    }

    const interval = setInterval(pollTaskStatus, POLLING_INTERVALS.TASK_STATUS);
    this.allPollingIntervals.add(interval);
    this.activePolling.add('ALL_TASKS');
    
    // Execute first poll immediately
    pollTaskStatus();
  }

  /**
   * Handle task failure
   * @param {Object} failedTask - The failed task object
   */
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

  /**
   * Handle completion of all tasks
   */
  async handleAllTasksCompleted() {
    if (!this.hasCompletionMessage) {
      this.hasCompletionMessage = true;
      
      // 新增关键修复：重置加载状态
      this.onLoadingUpdate?.(false);
      this.onMessageSendingUpdate?.(false);

      // 修改这里：仅关闭加载状态，不移除特定内容
      this.onMessageUpdate?.(prevMessages => {
        return prevMessages.map(msg => ({
          ...msg,
          isThinking: false  // 关闭所有加载状态
        }));
      });

      try {
        const resultResponse = await this.apiClient.getAlternativeResult(this.websiteId);
        if (this.onBrowserUpdate) {
          this.onBrowserUpdate({ 
            show: true,
            data: resultResponse.data
          });
        }

        // 修改这里：添加保留历史消息的逻辑
        this.onMessageUpdate?.(prev => {
          const hasCompletionMessage = prev.some(msg => 
            msg.content.includes('Alternative Page generation complete')
          );
          
          return hasCompletionMessage ? prev : [
            ...prev,
            {
              type: 'agent',
              agentId: 2,
              content: '🎉 Alternative Page generation complete!\n\n**Customization Options:**\nWe notice you might want to adjust the color scheme. Feel free to tell us your style preferences in English!\n\nExamples:\n- "Modern gradient theme with purple and cyan"\n- "Clean white background with navy accents"\n- "Dark mode with neon cyberpunk colors"',
              isThinking: false
            }
          ];
        });

      } catch (error) {
        console.error('Failed to get final results:', error);
      }

      this.messageQueue = [];
      this.clearAllTasks();
      this.onTaskCompleted?.();
    }
  }

  /**
   * Update task stages based on planning status
   * @param {Array} plannings - Array of planning objects
   */
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

    // Search to Scoring transition
    if (competitorSearch?.status === 'finished' && 
        competitorScoring?.status === 'processing' && 
        !this.hasXavierStartMessage) {
      console.log('Transitioning from search to scoring phase');
      this.hasXavierStartMessage = true;
      await this.updateXavierStartMessage();
    }

    // Scoring to Comparison transition
    if (competitorScoring?.status === 'finished' && 
        (productComparison?.status === 'processing' || productComparison?.status === 'init')) {
      this.hasYoussefStartMessage = true;

      // 添加任务初始化逻辑
      if (productComparison?.status === 'init') {
          this.tasks.set(TASK_TYPES.PRODUCT_COMPARISON, {
              id: productComparison.planningId,
              type: TASK_TYPES.PRODUCT_COMPARISON,
              status: TASK_STATUS.PENDING,
              result: null,
              details: [],
              sources: []
          });
      }

      this.messageQueue.push(
        {
          type: 'agent',
          agentId: 2, // Youssef
          content: '🔄 Starting content analysis...',
          isThinking: true
        },
        {
          type: 'agent',
          agentId: 2,
          content: '📝 Preparing comparative content...',
          isThinking: true
        }
      );
    }

    // Competitor selection logic
    if (competitorSearch?.status === 'finished' && !this.hasCompetitorSelection) {
      console.log('Competitor search finished');
      this.hasCompetitorSelection = true;
      
      try {
        const competitors = this.parseCompetitors(competitorSearch);
        console.log('Processed competitors:', competitors);

        this.onMessageUpdate?.(prev => {
          const hasSelectionMessage = prev.some(msg => msg.options);
          if (hasSelectionMessage) return prev;

          const updated = prev.map(msg => {
            if (msg.isThinking && msg.content.includes('searching for your top competitors')) {
              return { ...msg, isThinking: false };
            }
            return msg;
          });
          
          return [...updated, {
            type: 'agent',
            agentId: 1,
            content: '✨ Great! I\'ve identified the main competitors. Please select up to 3 to analyze:',
            options: competitors.slice(0, 20)
              .map((c, i) => ({
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

    if (productComparison?.status === 'finished') {
      // 清理Youssef的进行中消息
      this.messageQueue = this.messageQueue.filter(msg => 
        !msg.content.includes('Preparing comparative content') &&
        !msg.content.includes('Starting content analysis')
      );
      
      // 如果还没显示完成消息，添加过渡消息
      if (!this.hasCompletionMessage) {
        this.messageQueue.push({
          type: 'agent',
          agentId: 2,
          content: '✨ Finalizing content polish...',
          isThinking: true
        });
      }
    }

    // Force task type update when scoring completes
    const scoringTask = plannings.find(p => 
      p.planningName === TASK_TYPES.COMPETITOR_SCORING && 
      p.status === 'finished'
    );
    
    if (scoringTask && this.currentTaskType !== TASK_TYPES.PRODUCT_COMPARISON) {
      console.log('Forcing task transition after scoring completion');
      this.currentTaskType = TASK_TYPES.PRODUCT_COMPARISON;
      this.messageQueue.push({
        type: 'agent',
        agentId: 2,
        content: '🔧 Starting final content generation...',
        isThinking: true
      });
    }
  }

  /**
   * Update the status of all tasks
   * @param {Array} plannings - Array of planning objects
   */
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

  /**
   * Get the next task in sequence
   * @param {string} currentTaskType - Current task type
   * @param {Array} plannings - Array of planning objects
   * @returns {Object|null} The next task or null if no next task
   */
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

  /**
   * Map API status to internal status
   * @param {string} apiStatus - Status from API
   * @returns {string} Internal status
   */
  mapApiStatus(apiStatus) {
    switch (apiStatus) {
      case 'init': return TASK_STATUS.PENDING;
      case 'processing': return TASK_STATUS.RUNNING;
      case 'finished': return TASK_STATUS.COMPLETED;
      case 'failed': return TASK_STATUS.FAILED;
      default: return TASK_STATUS.PENDING;
    }
  }

  /**
   * Clear all tasks and reset state
   */
  clearAllTasks() {
    console.log('Clearing all tasks...');
    
    // Clear polling intervals
    this.allPollingIntervals.forEach(interval => {
      console.log('Clearing interval:', interval);
      clearInterval(interval);
    });
    this.allPollingIntervals.clear();
    this.activePolling.clear();
    
    // Only reset these states if all tasks are finished
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

  /**
   * Get status of all tasks
   * @returns {Object} Status of all tasks
   */
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

  /**
   * Get message for a task based on type and status
   * @param {string} taskType - Task type
   * @param {string} status - Task status
   * @returns {Object|null} Message object or null
   */
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
              agentId: 1, 
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

      default:
        return null;
    }
  }

  /**
   * Get failure message based on task type
   * @param {string} taskType - Task type
   * @param {string} errorMsg - Error message
   * @returns {Object} Failure message
   */
  getFailureMessage(taskType, errorMsg) {
    // Clear all polling tasks
    this.clearAllTasks();

    // Reset loading states
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

  /**
   * Start polling for details
   */
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
        const details = response?.data || [];
        const hasNewData = details.length > 0;

        console.log('Parsed details:', details);

        if (Array.isArray(details)) {
          if (this.onDetailsUpdate) {
            this.onDetailsUpdate(details, hasNewData);
          }
        }
      } catch (error) {
        console.error('Error polling details:', error);
      }
    };

    const interval = setInterval(pollDetails, POLLING_INTERVALS.TASK_DETAILS);
    this.allPollingIntervals.add(interval);
    this.activePolling.add('DETAILS');
    pollDetails(); // Execute immediately
  }

  /**
   * Stop polling for details
   */
  stopDetailPolling() {
    if (this.detailPollingInterval) {
      clearInterval(this.detailPollingInterval);
      this.detailPollingInterval = null;
    }
  }

  /**
   * Start polling for sources
   */
  startSourcePolling() {
    if (this.activePolling.has('SOURCES')) return;

    const pollSources = async () => {
      try {
        const response = await this.apiClient.getAlternativeSources(this.websiteId);
        
        console.log('Sources API Response:', response);
        const sources = response?.data || [];
        const hasNewData = sources.length > this.lastSourceCount;
        this.lastSourceCount = sources.length;

        if (Array.isArray(sources) && this.onSourcesUpdate) {
          this.onSourcesUpdate(sources, hasNewData);
        }
      } catch (error) {
        console.error('Error polling sources:', error);
      }
    };

    const interval = setInterval(pollSources, POLLING_INTERVALS.SOURCES);
    this.allPollingIntervals.add(interval);
    this.activePolling.add('SOURCES');
    pollSources(); // Execute immediately
  }

  /**
   * Get the active agent ID for a task type
   * @param {string} taskType - Task type
   * @returns {number} Agent ID
   */
  getActiveAgent(taskType) {
    switch (taskType) {
      case TASK_TYPES.COMPETITOR_SEARCH:
      case TASK_TYPES.COMPETITOR_SCORING: 
        return 1; // Joey
      case TASK_TYPES.PRODUCT_COMPARISON:
      case TASK_TYPES.STYLE_APPLICATION:
        return 2; // Youssef
      default:
        return 1;
    }
  }

  /**
   * Get retry message based on task type
   * @param {string} taskType - Task type
   * @returns {string} Retry message
   */
  getRetryMessage(taskType) {
    const messages = {
      [TASK_TYPES.COMPETITOR_SEARCH]: "🔄 I've encountered a small hiccup in the competitor search. Don't worry - I'm automatically retrying the analysis. Please hold on for a moment...",
      [TASK_TYPES.COMPETITOR_SCORING]: "🔄 The scoring analysis hit a brief snag. I'm automatically restarting the process. Just a moment while I recalibrate...",
      [TASK_TYPES.PRODUCT_COMPARISON]: "🔄 There was a slight interruption in the comparison process. I'm automatically resuming the analysis. Please wait while I reconnect..."
    };
    return messages[taskType] || "🔄 A brief interruption occurred. I'm automatically retrying the process. Please wait a moment...";
  }

  /**
   * Set loading update callback
   * @param {Function} callback - Loading update callback
   */
  setLoadingUpdateCallback(callback) {
    this.onLoadingUpdate = callback;
  }

  /**
   * Set message sending update callback
   * @param {Function} callback - Message sending update callback
   */
  setMessageSendingUpdateCallback(callback) {
    this.onMessageSendingUpdate = callback;
  }

  /**
   * Pause all polling
   */
  pausePolling() {
    this.allPollingIntervals.forEach(interval => clearInterval(interval));
    this.allPollingIntervals.clear();
    this.activePolling.clear();
  }

  /**
   * Parse competitors from planning data
   * @param {Object} planningData - Planning data
   * @returns {Array} Array of competitors
   */
  parseCompetitors(planningData) {
    try {
      const rawData = planningData?.data || '[]';
      console.log('Raw competitor data:', rawData);

      // Handle double-encoded JSON
      const decodedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      console.log('First parse:', decodedData);

      // Handle possible second encoding
      const finalData = typeof decodedData === 'string' ? JSON.parse(decodedData) : decodedData;
      console.log('Final competitors:', finalData);

      // Clean and format data
      return finalData
        .filter(item => typeof item === 'string' && item.length > 0)
        .map(domain => domain.replace(/^https?:\/\/(www\.)?/i, ''))
        .slice(0, 20);

    } catch (e) {
      console.error('Competitor parsing error:', e);
      return [];
    }
  }

  /**
   * Show competitor options
   * @param {Array} competitors - List of competitors
   */
  showCompetitorOptions(competitors) {
    const selectionMessage = {
      type: 'agent',
      agentId: 1,
      content: '✨ Great! I\'ve identified the main competitors. Please select up to 3 to analyze:',
      options: competitors.map((c, i) => ({
        label: `${i + 1}. ${c.replace('www.', '')}`,
        value: c
      })),
      maxSelections: 3,
      isThinking: false
    };

    this.onMessageUpdate?.(prev => [...prev, selectionMessage]);
  }

  /**
   * Continue analysis with selected competitors
   * @param {Array} selected - Selected competitors
   */
  async continueAnalysis(selected) {
    // Only clear message queue, not polling
    this.messageQueue = [];
    this.isProcessingQueue = false;
    this.currentTaskType = TASK_TYPES.COMPETITOR_SCORING;

    try {
      this.onMessageSendingUpdate?.(true);
      
      const response = await this.apiClient.generateAlternative(this.websiteId, selected);

      if (!response || response.code !== 200 || !response.data?.websiteId) {
        throw new Error(response?.message || 'Invalid server response');
      }

      // Update website ID
      this.websiteId = response.data.websiteId;

      // Build message queue
      this.messageQueue = [
        {
          type: 'agent',
          agentId: 1,
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

      // Reset selection flags
      this.hasCompetitorSelection = false;
      this.hasCompletionMessage = false;
      this.hasFailureMessage = false;

      // Ensure polling continues
      if (this.allPollingIntervals.size === 0) {
        this.startPolling();
        this.startDetailPolling();
        this.startSourcePolling();
      }

      // Force transition to next stage
      this.currentTaskType = TASK_TYPES.PRODUCT_COMPARISON;
      
      // Add explicit agent handoff message
      this.messageQueue.push({
        type: 'agent',
        agentId: 2, // Youssef
        content: '🚀 Transitioning to content creation...',
        isThinking: true
      });

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

  /**
   * Get agent name by ID
   * @param {number} agentId - Agent ID
   * @returns {string} Agent name
   */
  getAgentName(agentId) {
    const agents = {
      1: 'Joey',
      2: 'Youssef',
      3: 'Xavier'
    };
    return agents[agentId] || 'Joey';
  }

  /**
   * Process message queue sequentially
   */
  async processMessageQueue() {
    // Add task type validation
    const currentAgent = this.getActiveAgent(this.currentTaskType);
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      
      // Ensure message uses current agent
      const validatedMessage = {
        ...message,
        agentId: currentAgent
      };
      
      // Use Promise to ensure sequential display
      await new Promise(resolve => {
        this.onMessageUpdate(prev => {
          // Check for duplicate messages
          const messageExists = prev.some(m => 
            m.content === validatedMessage.content && 
            m.agentId === validatedMessage.agentId
          );
          
          if (messageExists) {
            return prev;
          }

          // Update previous message status
          const updatedMessages = prev.map(msg => {
            if (msg.isThinking) {
              return { ...msg, isThinking: false };
            }
            return msg;
          });

          return [...updatedMessages, validatedMessage];
        });
        
        // Small delay for natural appearance
        setTimeout(resolve, 800);
      });
    }
  }

  /**
   * Update Xavier start message
   */
  async updateXavierStartMessage() {
    this.messageQueue.push({
      type: 'agent',
      agentId: 3, // Xavier
      content: '💻 Converting markdown to webpage...',
      isThinking: true
    });
  }

  /**
   * Handle polling errors
   * @param {Error} error - Error object
   */
  async handlePollingError(error) {
    console.error('Polling error occurred:', error);
    
    // Clear all tasks
    this.clearAllTasks();
    
    // Avoid duplicate error messages
    if (this.hasFailureMessage) return;
    this.hasFailureMessage = true;

    // Update all existing messages
    this.onMessageUpdate?.(prev => {
      // Remove thinking states
      const updatedMessages = prev.map(msg => ({
        ...msg,
        isThinking: false
      }));

      // Add error message
      return [...updatedMessages, {
        type: 'agent',
        agentId: 1,
        content: '❌ I encountered an error while processing your request. Please try again.',
        isThinking: false
      }];
    });

    // Reset UI states
    if (this.onLoadingUpdate) {
      this.onLoadingUpdate(false);
    }
    if (this.onMessageSendingUpdate) {
      this.onMessageSendingUpdate(false);
    }
  }

  /**
   * 启动样式任务轮询
   */
  startStylePolling() {
    if (this.stylePollInterval) return;

    console.log('[Style] Starting style task monitoring...');
    this.isStyleTaskActive = true;
    
    const pollStyleStatus = async () => {
      try {
        const response = await this.apiClient.getAlternativeStatus(this.websiteId);
        const plannings = response?.data || [];
        
        const styleTask = plannings.find(p => 
          p.planningName === TASK_TYPES.STYLE_APPLICATION
        );

        if (styleTask) {
          console.log('[Style] Task status:', styleTask.status);
          if (styleTask.status === 'finished') {
            console.log('[Style] Detected completed style task');
            await this.handleStyleCompletion();
            this.stopStylePolling();
          }
        }
      } catch (error) {
        console.error('[Style] Polling error:', error);
        this.stopStylePolling();
      }
    };

    this.stylePollInterval = setInterval(pollStyleStatus, 3000);
    pollStyleStatus();
  }

  /**
   * 清理样式任务轮询
   */
  stopStylePolling() {
    if (this.stylePollInterval) {
      clearInterval(this.stylePollInterval);
      this.stylePollInterval = null;
      this.isStyleTaskActive = false;
      console.log('[Style] Terminated style task monitoring');
    }
  }

  /**
   * 处理样式任务完成
   */
  async handleStyleCompletion() {
    console.log('[Style] Processing completed task...');
    try {
      const startTime = Date.now();
      const result = await this.apiClient.getAlternativeResult(this.websiteId);
      console.log(`[Style] Result fetched in ${Date.now() - startTime}ms`);

      if (result.data) {
        console.log('[Style] Updating browser preview');
        this.onBrowserUpdate?.({
          show: true,
          data: result.data,
          timestamp: Date.now()
        });
      }

      this.onMessageUpdate?.(prev => {
        // Preserve all existing messages
        const updatedMessages = prev.map(msg => {
          // Only update thinking states
          if (msg.isThinking) {
            return { ...msg, isThinking: false };
          }
          return msg;
        });

        // Add completion message without removing history
        return [
          ...updatedMessages,
          {
            type: 'agent',
            agentId: 2,
            content: '✨ Style modifications applied successfully',
            isThinking: false
          }
        ];
      });

    } catch (error) {
      console.error('[Style] Result fetch failed:', error);
      this.onMessageUpdate?.(prev => [
        ...prev,
        {
          type: 'agent',
          agentId: 2,
          content: '⚠️ Failed to refresh preview. Please try again.',
          isThinking: false
        }
      ]);
    }
  }
}

/**
 * ResearchTool Component
 */
const ResearchTool = () => {
  // 所有hooks必须无条件地在组件顶部调用
  const [isTaskCompleted, setIsTaskCompleted] = useState(false); // 确保这个状态在最顶部
  
  // 其他状态声明
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
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [initialMessagesShown, setInitialMessagesShown] = useState(0);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState('details');
  const [showBrowser, setShowBrowser] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const [detailsData, setDetailsData] = useState([]);
  const [totalDetails, setTotalDetails] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(300);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [sourcesData, setSourcesData] = useState([]);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [currentTaskType, setCurrentTaskType] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isStyleOperationActive, setStyleOperationActive] = useState(false);
  
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  
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

  // 初始化taskManager必须放在所有hooks之后
  const [taskManager] = useState(() => new TaskManager(apiClient));

  // 所有useEffect必须按固定顺序声明
  useEffect(() => {
    taskManager.onTaskCompleted = () => setIsTaskCompleted(true);
  }, []); // 空依赖数组确保只运行一次

  // Modify task type to agent ID mapping
  const AGENT_TASK_MAP = {
    [TASK_TYPES.COMPETITOR_SEARCH]: 1,
    [TASK_TYPES.COMPETITOR_SCORING]: 1,
    [TASK_TYPES.PRODUCT_COMPARISON]: 2,
    [TASK_TYPES.STYLE_APPLICATION]: 3
  };

  /**
   * Handle tab change
   * @param {string} tabId - Tab ID
   */
  const handleTabChange = (tabId) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
    setActiveTabId(tabId);
  };

  /**
   * Validate domain format
   * @param {string} domain - Domain to validate
   * @returns {boolean} Whether domain is valid
   */
  const validateDomain = (domain) => {
    // Remove http:// or https:// prefix
    const cleanDomain = domain.replace(/^https?:\/\//i, '');
    // Remove trailing slashes
    const trimmedDomain = cleanDomain.replace(/\/+$/, '');
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(trimmedDomain);
  };

  /**
   * Handle user input submission
   * @param {Event} e - Form event
   */
  const handleUserInput = async (e) => {
    // 统一处理事件对象
    if (e && e.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
    }

    // 任务完成后的聊天模式
    if (isTaskCompleted) {
        try {
            setIsMessageSending(true);
            const newMessages = [...messages, { type: 'user', content: userInput }];
            setMessages(newMessages);
            setUserInput('');

            const response = await apiClient.chatWithAI(
                userInput,
                currentWebsiteId
            );

            if (response?.code === 200 && response.data?.answer) {
                const answer = response.data.answer;
                
                if (answer.endsWith('[END]')) {
                    const styleDescription = answer.replace(/\[END\]$/i, '').trim();
                    
                    setMessages(prev => [
                        ...prev,
                        {
                            type: 'agent',
                            agentId: 2,
                            content: '🎨 Applying style changes...',
                            isThinking: true
                        }
                    ]);

                    try {
                        await apiClient.changeStyle(styleDescription, currentWebsiteId);
                        
                        // 启动独立样式任务轮询
                        taskManager.hasStyleTask = true;
                        taskManager.startStylePolling();
                        
                    } catch (error) {
                        setMessages(prev => [
                            ...prev.filter(msg => !msg.isThinking),
                            {
                                type: 'agent',
                                agentId: 2,
                                content: `⚠️ Failed to apply style: ${error.message}`,
                                isThinking: false
                            }
                        ]);
                    }
                } else {
                    setMessages(prev => [
                        ...prev,
                        {
                            type: 'agent',
                            agentId: 2,
                            content: answer,
                            isThinking: false
                        }
                    ]);
                }
            }
        } catch (error) {
            setMessages(prev => [
                ...prev,
                {
                    type: 'agent',
                    agentId: 2,
                    content: `⚠️ Failed to get response: ${error.message}`,
                    isThinking: false
                }
            ]);
        } finally {
            setIsMessageSending(false);
        }
        return;
    }

    // 原有处理逻辑（仅在任务未完成时执行）
    if (userInput?.type === 'competitor_select') {
      handleCompetitorSelect(userInput.values);
      return;
    }
    
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const newMessages = [...messages, { type: 'user', content: userInput }];
    setMessages(newMessages);
    
    // Process input as domain
    const cleanDomain = userInput.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    setDomain(cleanDomain);
    
    // Clear input field
    setUserInput('');
    
    // Set message sending state
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
    
    // Delay analysis to appear more natural
    setTimeout(() => {
      startAnalysis(cleanDomain);
    }, 500);
  };
  
  /**
   * Handle competitor selection
   * @param {Array} selected - Selected competitors
   */
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

  /**
   * Handle confirmation of competitor selection
   */
  const handleConfirmSelection = async () => {
    // Clear old messages
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
    setSelectedCompetitors([]); // Clear selection state
  };

  // Initialize task manager callbacks
  useEffect(() => {
    taskManager.onTaskUpdate = (taskType, task) => {
      setCurrentTaskType(taskType);
      
      // 新增完成状态检测
      if (task.status === 'finished') {
        const allFinished = taskManager.getTasks().every(t => t.status === 'finished');
        if (allFinished) {
          setMessages(prev => [...prev, {
            type: 'agent',
            agentId: 1,
            content: '✅ All tasks completed! Ready for your next request.',
            isThinking: false
          }]);
          setCurrentTaskType(null);
        }
      }

      // 设置当前agent
      const agentMap = {
        [TASK_TYPES.COMPETITOR_SEARCH]: 1,
        [TASK_TYPES.COMPETITOR_SCORING]: 1,
        [TASK_TYPES.PRODUCT_COMPARISON]: 2,
        [TASK_TYPES.STYLE_APPLICATION]: 3
      };
      setActiveAgentId(agentMap[taskType] || null);
      // Update message when task type changes
      if (taskType !== taskManager.currentTaskType) {
        const newAgent = taskManager.getActiveAgent(taskType);
        setMessages(prev => [...prev, {
          type: 'agent',
          agentId: newAgent,
          content: `${taskManager.getAgentName(newAgent)} is now leading the analysis...`,
          isThinking: true
        }]);
      }
      // Update workflow state
      setWorkflowStage(task.status);
    };

    taskManager.onDetailsUpdate = (details, hasNewData) => {
      setDetailsData(details);
      
      // Switch to details tab if new data arrives
      if (hasNewData && rightPanelTab !== 'details') {
        setRightPanelTab('details');
      }
    };

    taskManager.onSourcesUpdate = (sources, hasNewData) => {
      setSourcesData(sources);
      
      // Switch to sources tab if new data arrives
      if (hasNewData && rightPanelTab !== 'sources') {
        setRightPanelTab('sources');
      }
    };

    taskManager.onMessageUpdate = (messageUpdater) => {
      if (typeof messageUpdater === 'function') {
        setMessages(messageUpdater);
      } else {
        setMessages(prev => [...prev, messageUpdater]);
      }
    };

    taskManager.onBrowserUpdate = (state) => {
      setShowBrowser(state.show);
      
      const generatedTabs = [];
      Object.entries(state.data || {}).forEach(([styleType, ids]) => {
        if (Array.isArray(ids)) {
          ids.forEach((id, index) => {
            if (id && typeof id === 'string') {
              generatedTabs.push({
                id: `${styleType}-${index}`,
                title: `${styleType.replace('style', 'Style ')} #${index + 1}`,
                url: `https://preview.websitelm.site/en/${id}`,
                active: generatedTabs.length === 0
              });
            }
          });
        }
      });

      console.log('Processed tabs:', generatedTabs);
      console.log('Raw browser data:', state.data);

      setTabs(generatedTabs);
      setActiveTabId(generatedTabs[0]?.id || null);
    };

    taskManager.setLoadingUpdateCallback(setLoading);
    taskManager.setMessageSendingUpdateCallback(setIsMessageSending);

    // 添加消息监听
    const handleMessage = (event) => {
      if (event.data === 'closeBrowser') {
        setShowBrowser(false)
      }
    }
    window.addEventListener('message', handleMessage)

    return () => {
      // 清理监听
      window.removeEventListener('message', handleMessage)
      taskManager.clearAllTasks();
    };
  }, []);

  /**
   * Start research analysis
   * @param {string} cleanDomain - Cleaned domain
   */
  const startAnalysis = async (cleanDomain) => {
    // Check login status
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
      // Add initial message (with loading state)
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1,
        content: '🔍 I\'m now searching for your top competitors. This involves analyzing market data and identifying companies with similar offerings...',
        isThinking: true
      }]);

      // Call searchCompetitor API
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

  /**
   * Render chat message
   * @param {Object} message - Message object
   * @param {number} index - Message index
   * @returns {JSX.Element} Rendered message
   */
  const renderChatMessage = (message, index) => {
    if (message.options) {
      const agent = AGENTS.find(a => a.id === message.agentId) || AGENTS[0];
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
                  <div className="grid grid-cols-3 gap-2 mt-3">
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
      const agent = AGENTS.find(a => a.id === message.agentId) || AGENTS[0];
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
    
    // User message style
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

  /**
   * Render agent cards
   */
  const renderAgents = () => (
    <div className="space-y-3">
      {AGENTS.map(agent => (
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

  /**
   * Render sources list
   */
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

  // Auto-scroll chat when messages update
  useEffect(() => {
    if (chatEndRef.current && messages.length > 1) {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Initialize loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Show initial welcome messages
  useEffect(() => {
    if (!initialMessagesShown) {
      setIsMessageSending(true);
      showInitialMessagesSequentially();
    }
  }, []);

  // Check login status
  useEffect(() => {
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    const token = localStorage.getItem('alternativelyAccessToken');
    if (storedCustomerId && token) {
      setCustomerId(storedCustomerId);
    }
  }, []);

  /**
   * Show initial messages sequentially
   */
  const showInitialMessagesSequentially = () => {
    setMessages([initialMessages[0]]);
    setInitialMessagesShown(1);
    
    setTimeout(() => {
      setMessages(prev => [...prev, initialMessages[1]]);
      setInitialMessagesShown(2);
      setIsMessageSending(false);
    }, 1000);
  };

  /**
   * Toggle deep research mode
   */
  const toggleDeepResearchMode = () => {
    setDeepResearchMode(!deepResearchMode);
    
    if (!deepResearchMode) {
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1,
        content: '🔬 Deep Research mode activated! I\'ll now perform a more comprehensive analysis, exploring additional data sources and providing more detailed insights. This may take a bit longer, but the results will be much more thorough.',
        isThinking: false
      }]);
    } else {
      setMessages(prev => [...prev, { 
        type: 'agent',
        agentId: 1,
        content: '📊 Standard Research mode activated. I\'ll focus on providing quick, essential insights about alternatives. This is perfect for getting a rapid overview of your options.',
        isThinking: false
      }]);
    }
  };

  /**
   * Handle page change
   * @param {number} page - New page number
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (taskManager) {
      taskManager.currentPage = page;
      taskManager.pollDetails();
    }
  };

  /**
   * Render details
   * @param {Array} details - Details data
   */
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
              className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
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

  // CSS Animation styles
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

  // Show loading screen while initializing
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

  // Add task description method
  const getActiveTaskDescription = () => {
    if (!currentTaskType) return '🔄 Ready for new tasks';
    
    return {
      [TASK_TYPES.COMPETITOR_SEARCH]: '🔍 Searching competitors...',
      [TASK_TYPES.COMPETITOR_SCORING]: '📊 Scoring competitors...',
      [TASK_TYPES.PRODUCT_COMPARISON]: '📝 Generating comparison...',
      [TASK_TYPES.STYLE_APPLICATION]: '🎨 Applying style...'
    }[currentTaskType] || 'Processing request...';
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
        
        {/* Chat container */}
        <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
          {/* Left panel - Chat */}
          <div className={`${showBrowser ? 'hidden' : 'flex-1'} relative flex flex-col`}>
            {/* Open Browser button */}
            <div className="absolute top-3 right-4 z-50 flex gap-2">
              <button
                onClick={() => setShowBrowser(true)}
                className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full 
                         backdrop-blur-sm transition-all flex items-center gap-1.5 border border-purple-500/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 4l-4 4 4 4"/>
                </svg>
                Open Browser
              </button>
            </div>

            {/* Header */}
            <div className="h-10 px-4 border-b border-gray-300/20 flex-shrink-0">
              <div className="flex items-center">
                <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-5 h-5 mr-1.5" />
                <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
              </div>
            </div>

            {/* Messages container */}
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

            {/* Input area */}
            <div className="p-4 border-t border-gray-300/20 flex-shrink-0">
              <div className="max-w-[600px] mx-auto">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder={deepResearchMode 
                      ? "Enter website for comprehensive analysis..." 
                      : "Enter your product URL (e.g., websitelm.com)"}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={loading || isMessageSending || isStyleOperationActive}
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
                    onPressEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (userInput.trim()) {
                        handleUserInput(e);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                  <div className="flex items-center space-x-4">
                    {/* Deep research toggle */}
                    <button 
                      type="button"
                      className={`flex items-center px-2 py-1 rounded-full text-xs transition-all duration-200 
                        ${loading || isMessageSending || isStyleOperationActive 
                          ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' 
                          : deepResearchMode
                            ? 'bg-purple-500 text-white hover:bg-purple-600' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      onClick={() => {
                        if (!loading && !isMessageSending && !isStyleOperationActive) {
                          toggleDeepResearchMode();
                        }
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full mr-1.5 transition-colors ${
                        deepResearchMode ? 'bg-white' : 'bg-gray-500'
                      }`}></span>
                      Deep
                    </button>

                    {/* Mode description */}
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
          
          {/* Middle panel - Browser */}
          <div className={`${showBrowser ? 'flex-1' : 'hidden'} relative flex flex-col`}>
            {/* Keep existing Back to Chat button */}
            <div className="absolute top-3 right-4 z-50 flex gap-2">
              <button
                onClick={() => setShowBrowser(false)}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-full 
                         backdrop-blur-sm transition-all flex items-center gap-1.5 border border-blue-500/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v0M3 10l6 6m-6-6l6-6"/>
                </svg>
                Back to Chat
              </button>
            </div>
            <BrowserSimulator 
              tabs={tabs}
              activeTab={activeTabId}
              onTabChange={handleTabChange}
              style={{ height: '600px' }}
            />
          </div>
          
          {/* Right panel - Analysis */}
          <div className="w-1/5 bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl 
                          flex flex-col h-full relative">
            {/* 面板头部保持不变 */}
            <div className="border-b border-gray-300/20 p-3">
              <div className="flex justify-between">
                <button 
                  onClick={() => setRightPanelTab('details')} 
                  className={`text-sm ${
                    rightPanelTab === 'details' 
                      ? 'text-blue-400 font-medium' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Details
                </button>
                <button 
                  onClick={() => setRightPanelTab('sources')} 
                  className={`text-sm ${
                    rightPanelTab === 'sources' 
                      ? 'text-blue-400 font-medium' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Sources
                </button>
              </div>
            </div>
            
            {/* 内容区域保持不变 */}
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'details' && renderDetails(detailsData)}
              {rightPanelTab === 'sources' && renderSources()}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ResearchTool;