import { supabase } from '@/integrations/supabase/client';

export interface TransactionLog {
  id?: string;
  user_id: string;
  event_type: 'payment_initiated' | 'payment_success' | 'payment_failed' | 'subscription_updated' | 'verification_started' | 'verification_completed' | 'error_occurred';
  event_data: Record<string, any>;
  timestamp: Date;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  error_details?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

export interface LogContext {
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

class TransactionLogger {
  private static instance: TransactionLogger;
  private sessionId: string;
  private context: LogContext;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.context = this.getClientContext();
  }

  public static getInstance(): TransactionLogger {
    if (!TransactionLogger.instance) {
      TransactionLogger.instance = new TransactionLogger();
    }
    return TransactionLogger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientContext(): LogContext {
    return {
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      // IP address would be determined server-side
      additionalData: {
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        referrer: typeof document !== 'undefined' ? document.referrer : 'Unknown',
        timestamp: new Date().toISOString()
      }
    };
  }

  private async saveToDatabase(log: TransactionLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('transaction_logs')
        .insert({
          user_id: log.user_id,
          event_type: log.event_type,
          event_data: log.event_data,
          timestamp: log.timestamp.toISOString(),
          session_id: log.session_id,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          error_details: log.error_details
        });

      if (error) {
        console.error('Failed to save transaction log:', error);
        // Fallback to local storage for critical logs
        this.saveToLocalStorage(log);
      }
    } catch (error) {
      console.error('Database logging failed:', error);
      this.saveToLocalStorage(log);
    }
  }

  private saveToLocalStorage(log: TransactionLog): void {
    try {
      const logs = this.getLocalLogs();
      logs.push({
        ...log,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      
      // Keep only last 100 logs in localStorage
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('transaction_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private getLocalLogs(): TransactionLog[] {
    try {
      const logs = localStorage.getItem('transaction_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  public async log(
    userId: string,
    eventType: TransactionLog['event_type'],
    eventData: Record<string, any>,
    errorDetails?: TransactionLog['error_details']
  ): Promise<void> {
    const log: TransactionLog = {
      user_id: userId,
      event_type: eventType,
      event_data: {
        ...eventData,
        ...this.context.additionalData
      },
      timestamp: new Date(),
      session_id: this.context.sessionId,
      user_agent: this.context.userAgent,
      error_details: errorDetails
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Transaction Log: ${eventType}`);
      console.log('User ID:', userId);
      console.log('Event Data:', eventData);
      console.log('Timestamp:', log.timestamp);
      if (errorDetails) {
        console.error('Error Details:', errorDetails);
      }
      console.groupEnd();
    }

    // Save to database
    await this.saveToDatabase(log);
  }

  public async logPaymentInitiated(
    userId: string,
    paymentData: {
      planId: string;
      amount: number;
      currency: string;
      paymentMethod: string;
    }
  ): Promise<void> {
    await this.log(userId, 'payment_initiated', {
      plan_id: paymentData.planId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.paymentMethod,
      session_id: this.sessionId
    });
  }

  public async logPaymentSuccess(
    userId: string,
    paymentData: {
      paymentId: string;
      planId: string;
      amount: number;
      transactionId?: string;
    }
  ): Promise<void> {
    await this.log(userId, 'payment_success', {
      payment_id: paymentData.paymentId,
      plan_id: paymentData.planId,
      amount: paymentData.amount,
      transaction_id: paymentData.transactionId,
      session_id: this.sessionId
    });
  }

  public async logPaymentFailed(
    userId: string,
    paymentData: {
      paymentId?: string;
      planId: string;
      amount: number;
      reason: string;
    },
    errorDetails: TransactionLog['error_details']
  ): Promise<void> {
    await this.log(userId, 'payment_failed', {
      payment_id: paymentData.paymentId,
      plan_id: paymentData.planId,
      amount: paymentData.amount,
      failure_reason: paymentData.reason,
      session_id: this.sessionId
    }, errorDetails);
  }

  public async logSubscriptionUpdated(
    userId: string,
    subscriptionData: {
      subscriptionId: string;
      planId: string;
      status: string;
      startDate: Date;
      endDate: Date;
    }
  ): Promise<void> {
    await this.log(userId, 'subscription_updated', {
      subscription_id: subscriptionData.subscriptionId,
      plan_id: subscriptionData.planId,
      status: subscriptionData.status,
      start_date: subscriptionData.startDate.toISOString(),
      end_date: subscriptionData.endDate.toISOString(),
      session_id: this.sessionId
    });
  }

  public async logVerificationStarted(
    userId: string,
    verificationData: {
      paymentId: string;
      method: 'webhook' | 'polling' | 'manual';
    }
  ): Promise<void> {
    await this.log(userId, 'verification_started', {
      payment_id: verificationData.paymentId,
      verification_method: verificationData.method,
      session_id: this.sessionId
    });
  }

  public async logVerificationCompleted(
    userId: string,
    verificationData: {
      paymentId: string;
      success: boolean;
      duration: number;
      method: 'webhook' | 'polling' | 'manual';
    }
  ): Promise<void> {
    await this.log(userId, 'verification_completed', {
      payment_id: verificationData.paymentId,
      success: verificationData.success,
      duration_ms: verificationData.duration,
      verification_method: verificationData.method,
      session_id: this.sessionId
    });
  }

  public async logError(
    userId: string,
    errorData: {
      context: string;
      action: string;
      errorType: string;
    },
    errorDetails: TransactionLog['error_details']
  ): Promise<void> {
    await this.log(userId, 'error_occurred', {
      context: errorData.context,
      action: errorData.action,
      error_type: errorData.errorType,
      session_id: this.sessionId
    }, errorDetails);
  }

  public async getLogsForUser(
    userId: string,
    limit: number = 50,
    eventType?: TransactionLog['event_type']
  ): Promise<TransactionLog[]> {
    try {
      let query = supabase
        .from('transaction_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch transaction logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching transaction logs:', error);
      return [];
    }
  }

  public async getLogsForSession(sessionId: string): Promise<TransactionLog[]> {
    try {
      const { data, error } = await supabase
        .from('transaction_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Failed to fetch session logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching session logs:', error);
      return [];
    }
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public async syncLocalLogs(): Promise<void> {
    const localLogs = this.getLocalLogs();
    
    for (const log of localLogs) {
      if (log.id?.startsWith('local_')) {
        try {
          await this.saveToDatabase(log);
        } catch (error) {
          console.error('Failed to sync local log:', error);
        }
      }
    }

    // Clear synced logs
    localStorage.removeItem('transaction_logs');
  }

  public exportLogs(userId: string, format: 'json' | 'csv' = 'json'): void {
    this.getLogsForUser(userId, 1000).then(logs => {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        const headers = ['Timestamp', 'Event Type', 'Event Data', 'Error Details'];
        const rows = logs.map(log => [
          log.timestamp.toString(),
          log.event_type,
          JSON.stringify(log.event_data),
          log.error_details ? JSON.stringify(log.error_details) : ''
        ]);
        
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        filename = `transaction_logs_${userId}_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(logs, null, 2);
        filename = `transaction_logs_${userId}_${Date.now()}.json`;
        mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

export const transactionLogger = TransactionLogger.getInstance();