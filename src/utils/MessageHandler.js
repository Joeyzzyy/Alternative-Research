class MessageHandler {
  constructor(setMessages) {
    this.setMessages = setMessages;
    this.pendingOperations = [];
    this.isProcessing = false;
  }

  // 处理待处理的操作
  async processPendingOperations() {
    if (this.isProcessing || this.pendingOperations.length === 0) return;

    this.isProcessing = true;
    const operation = this.pendingOperations[0];

    try {
      await operation();
    } catch (error) {
      console.error('Error processing message operation:', error);
    } finally {
      this.pendingOperations.shift();
      this.isProcessing = false;
      this.processPendingOperations();
    }
  }

  // 添加用户消息
  addUserMessage(content) {
    const operation = async () => {
      this.setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'user',
        content,
        source: 'user'
      }]);
    };
    this.pendingOperations.push(operation);
    this.processPendingOperations();
  }

  // 添加代理思考消息
  addAgentThinkingMessage() {
    const messageId = Date.now();
    const operation = async () => {
      this.setMessages(prev => [...prev, {
        id: messageId,
        type: 'agent',
        content: '',
        isThinking: true,
        source: 'agent'
      }]);
    };
    this.pendingOperations.push(operation);
    this.processPendingOperations();
    return messageId;
  }

  // 更新代理消息（将思考消息替换为最终回复）
  updateAgentMessage(content, messageId) {
    const operation = async () => {
      this.setMessages(prev => {
        const updatedMessages = [...prev];
        for (let i = updatedMessages.length - 1; i >= 0; i--) {
          if (updatedMessages[i].id === messageId) {
            updatedMessages[i] = {
              ...updatedMessages[i],
              content,
              isThinking: false
            };
            break;
          }
        }
        return updatedMessages;
      });
    };
    this.pendingOperations.push(operation);
    this.processPendingOperations();
  }

  // 添加系统消息
  addSystemMessage(content) {
    const operation = async () => {
      this.setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content,
        isThinking: false,
        source: 'system'
      }]);
    };
    this.pendingOperations.push(operation);
    this.processPendingOperations();
  }

  // 处理错误消息
  handleErrorMessage(error, messageId) {
    this.updateAgentMessage(`⚠️ Failed to get response: ${error.message}`, messageId);
  }
}

export default MessageHandler; 