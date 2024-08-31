const Bull = require('bull');
const { Logger } = require('./logger');

/**
 * Queue Manager for handling background jobs
 */
class QueueManager {
  constructor(options = {}) {
    this.options = {
      redis: {
        host: options.redis?.host || process.env.REDIS_HOST || 'localhost',
        port: options.redis?.port || process.env.REDIS_PORT || 6379,
        password: options.redis?.password || process.env.REDIS_PASSWORD,
        db: options.redis?.db || 1, // Use different DB than cache
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...options.defaultJobOptions,
      },
      ...options,
    };

    this.queues = new Map();
    this.processors = new Map();
    
    this.init();
  }

  init() {
    // Initialize default queues
    this.createQueue('carbon-verification', {
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    this.createQueue('email-notifications', {
      defaultJobOptions: {
        attempts: 3,
        delay: 1000,
      },
    });

    this.createQueue('blockchain-sync', {
      defaultJobOptions: {
        attempts: 10,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    });

    this.createQueue('data-processing', {
      defaultJobOptions: {
        attempts: 3,
        backoff: 'fixed',
      },
    });

    this.createQueue('file-upload', {
      defaultJobOptions: {
        attempts: 2,
        timeout: 300000, // 5 minutes
      },
    });

    Logger.info('Queue manager initialized with default queues');
  }

  createQueue(name, options = {}) {
    if (this.queues.has(name)) {
      Logger.warn(`Queue ${name} already exists`);
      return this.queues.get(name);
    }

    const queueOptions = {
      redis: this.options.redis,
      defaultJobOptions: {
        ...this.options.defaultJobOptions,
        ...options.defaultJobOptions,
      },
      ...options,
    };

    const queue = new Bull(name, queueOptions);

    // Add event listeners
    queue.on('error', (error) => {
      Logger.error(`Queue ${name} error:`, { error: error.message, queue: name });
    });

    queue.on('waiting', (jobId) => {
      Logger.debug(`Job ${jobId} waiting in queue ${name}`);
    });

    queue.on('active', (job, jobPromise) => {
      Logger.info(`Job ${job.id} started in queue ${name}`, {
        jobId: job.id,
        queue: name,
        data: job.data,
      });
    });

    queue.on('completed', (job, result) => {
      Logger.info(`Job ${job.id} completed in queue ${name}`, {
        jobId: job.id,
        queue: name,
        duration: Date.now() - job.processedOn,
        result: typeof result === 'object' ? JSON.stringify(result) : result,
      });
    });

    queue.on('failed', (job, error) => {
      Logger.error(`Job ${job.id} failed in queue ${name}:`, {
        jobId: job.id,
        queue: name,
        error: error.message,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });
    });

    queue.on('stalled', (job) => {
      Logger.warn(`Job ${job.id} stalled in queue ${name}`, {
        jobId: job.id,
        queue: name,
      });
    });

    this.queues.set(name, queue);
    Logger.info(`Created queue: ${name}`);

    return queue;
  }

  getQueue(name) {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue ${name} not found`);
    }
    return queue;
  }

  async addJob(queueName, jobName, data, options = {}) {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.add(jobName, data, options);
      
      Logger.info(`Job added to queue ${queueName}:`, {
        jobId: job.id,
        jobName,
        queue: queueName,
        data,
        options,
      });

      return job;
    } catch (error) {
      Logger.error(`Failed to add job to queue ${queueName}:`, {
        jobName,
        error: error.message,
        data,
      });
      throw error;
    }
  }

  addProcessor(queueName, jobName, processor, concurrency = 1) {
    try {
      const queue = this.getQueue(queueName);
      
      const processorKey = `${queueName}:${jobName}`;
      if (this.processors.has(processorKey)) {
        Logger.warn(`Processor for ${processorKey} already exists`);
        return;
      }

      const wrappedProcessor = async (job) => {
        const startTime = Date.now();
        
        try {
          Logger.info(`Processing job ${job.id} (${jobName}) in queue ${queueName}`);
          const result = await processor(job);
          
          const duration = Date.now() - startTime;
          Logger.info(`Job ${job.id} processed successfully`, {
            jobId: job.id,
            jobName,
            queue: queueName,
            duration,
          });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          Logger.error(`Job ${job.id} processing failed:`, {
            jobId: job.id,
            jobName,
            queue: queueName,
            duration,
            error: error.message,
            stack: error.stack,
          });
          throw error;
        }
      };

      queue.process(jobName, concurrency, wrappedProcessor);
      this.processors.set(processorKey, { processor: wrappedProcessor, concurrency });
      
      Logger.info(`Added processor for ${jobName} in queue ${queueName}`, {
        concurrency,
      });
    } catch (error) {
      Logger.error(`Failed to add processor for ${queueName}:${jobName}:`, {
        error: error.message,
      });
      throw error;
    }
  }

  // Job management methods
  async getJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    return await queue.getJob(jobId);
  }

  async getJobs(queueName, types = ['waiting', 'active', 'completed', 'failed'], start = 0, end = 100) {
    const queue = this.getQueue(queueName);
    return await queue.getJobs(types, start, end);
  }

  async getJobCounts(queueName) {
    const queue = this.getQueue(queueName);
    return await queue.getJobCounts();
  }

  async removeJob(queueName, jobId) {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      Logger.info(`Removed job ${jobId} from queue ${queueName}`);
      return true;
    }
    return false;
  }

  async retryJob(queueName, jobId) {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      Logger.info(`Retried job ${jobId} in queue ${queueName}`);
      return true;
    }
    return false;
  }

  async pauseQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.pause();
    Logger.info(`Paused queue ${queueName}`);
  }

  async resumeQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.resume();
    Logger.info(`Resumed queue ${queueName}`);
  }

  async cleanQueue(queueName, grace = 0, limit = 100, type = 'completed') {
    const queue = this.getQueue(queueName);
    const jobs = await queue.clean(grace, limit, type);
    Logger.info(`Cleaned ${jobs.length} ${type} jobs from queue ${queueName}`);
    return jobs;
  }

  async emptyQueue(queueName) {
    const queue = this.getQueue(queueName);
    await queue.empty();
    Logger.info(`Emptied queue ${queueName}`);
  }

  // Queue statistics
  async getQueueStats(queueName) {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      name: queueName,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      },
      jobs: {
        waiting: waiting.map(job => ({ id: job.id, data: job.data })),
        active: active.map(job => ({ id: job.id, data: job.data })),
        failed: failed.slice(0, 10).map(job => ({ 
          id: job.id, 
          data: job.data, 
          error: job.failedReason 
        })),
      },
    };
  }

  async getAllStats() {
    const stats = {};
    
    for (const queueName of this.queues.keys()) {
      try {
        stats[queueName] = await this.getQueueStats(queueName);
      } catch (error) {
        Logger.error(`Failed to get stats for queue ${queueName}:`, {
          error: error.message,
        });
        stats[queueName] = { error: error.message };
      }
    }

    return stats;
  }

  // Graceful shutdown
  async close() {
    Logger.info('Closing queue manager...');
    
    const closePromises = [];
    for (const [name, queue] of this.queues) {
      closePromises.push(
        queue.close().then(() => {
          Logger.info(`Closed queue: ${name}`);
        }).catch((error) => {
          Logger.error(`Error closing queue ${name}:`, { error: error.message });
        })
      );
    }

    await Promise.allSettled(closePromises);
    
    this.queues.clear();
    this.processors.clear();
    
    Logger.info('Queue manager closed');
  }
}

// Default processors for common job types
const defaultProcessors = {
  async carbonVerification(job) {
    const { carbonCreditId, verificationData } = job.data;
    
    Logger.info('Processing carbon verification:', { carbonCreditId });
    
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Here you would implement actual verification logic
    // - Validate carbon credit data
    // - Check against standards
    // - Update verification status
    
    return {
      carbonCreditId,
      verified: true,
      verificationScore: 95,
      timestamp: new Date().toISOString(),
    };
  },

  async emailNotification(job) {
    const { to, subject, template, data } = job.data;
    
    Logger.info('Sending email notification:', { to, subject });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Here you would implement actual email sending logic
    // - Render template with data
    // - Send via email service (SendGrid, AWS SES, etc.)
    
    return {
      messageId: `msg_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
  },

  async blockchainSync(job) {
    const { contractAddress, fromBlock, toBlock } = job.data;
    
    Logger.info('Syncing blockchain data:', { contractAddress, fromBlock, toBlock });
    
    // Simulate blockchain sync
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Here you would implement actual blockchain sync logic
    // - Fetch events from blockchain
    // - Update database with new data
    // - Handle reorgs
    
    return {
      contractAddress,
      syncedBlocks: toBlock - fromBlock + 1,
      eventsProcessed: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
    };
  },

  async dataProcessing(job) {
    const { type, data } = job.data;
    
    Logger.info('Processing data:', { type });
    
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Here you would implement actual data processing logic
    // - Transform data
    // - Validate data
    // - Store processed results
    
    return {
      type,
      processedRecords: Array.isArray(data) ? data.length : 1,
      timestamp: new Date().toISOString(),
    };
  },

  async fileUpload(job) {
    const { fileName, fileSize, uploadUrl } = job.data;
    
    Logger.info('Processing file upload:', { fileName, fileSize });
    
    // Simulate file upload processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would implement actual file upload logic
    // - Upload to storage service (AWS S3, IPFS, etc.)
    // - Generate thumbnails/previews
    // - Update database
    
    return {
      fileName,
      fileSize,
      uploadedUrl: `https://storage.example.com/${fileName}`,
      timestamp: new Date().toISOString(),
    };
  },
};

// Singleton instance
let queueInstance = null;

const createQueueManager = (options) => {
  if (!queueInstance) {
    queueInstance = new QueueManager(options);
    
    // Register default processors
    queueInstance.addProcessor('carbon-verification', 'verify', defaultProcessors.carbonVerification);
    queueInstance.addProcessor('email-notifications', 'send', defaultProcessors.emailNotification);
    queueInstance.addProcessor('blockchain-sync', 'sync', defaultProcessors.blockchainSync);
    queueInstance.addProcessor('data-processing', 'process', defaultProcessors.dataProcessing);
    queueInstance.addProcessor('file-upload', 'upload', defaultProcessors.fileUpload);
  }
  return queueInstance;
};

const getQueueManager = () => {
  if (!queueInstance) {
    queueInstance = createQueueManager();
  }
  return queueInstance;
};

module.exports = {
  QueueManager,
  createQueueManager,
  getQueueManager,
  defaultProcessors,
  queue: getQueueManager(), // Default instance
};
