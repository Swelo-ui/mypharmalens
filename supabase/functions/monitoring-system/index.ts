// @ts-ignore
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-ignore
import "https://deno.land/x/xhr@0.1.0/mod.ts";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemHealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
  error?: string;
}

interface MonitoringEvent {
  id: string;
  timestamp: string;
  eventType: 'error' | 'warning' | 'info' | 'success';
  service: string;
  message: string;
  details?: any;
  userId?: string;
  sessionId?: string;
}

interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
  errorRate: number;
  lastUpdated: string;
}

// Helper function to create response
function createResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Check health of individual services
async function checkServiceHealth(serviceName: string, endpoint: string): Promise<SystemHealthCheck> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ healthCheck: true }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        service: serviceName,
        status: responseTime > 5000 ? 'degraded' : 'healthy',
        responseTime,
        lastChecked: new Date().toISOString()
      };
    } else {
      return {
        service: serviceName,
        status: 'down',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      service: serviceName,
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error.message || 'Service unreachable'
    };
  }
}

// Log monitoring events
async function logEvent(event: Omit<MonitoringEvent, 'id' | 'timestamp'>): Promise<void> {
  try {
    const monitoringEvent: MonitoringEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };

    // In a production environment, you would store this in a database
    // For now, we'll just log to console with structured format
    console.log(`[MONITORING] ${monitoringEvent.eventType.toUpperCase()}: ${monitoringEvent.service} - ${monitoringEvent.message}`, {
      id: monitoringEvent.id,
      timestamp: monitoringEvent.timestamp,
      details: monitoringEvent.details,
      userId: monitoringEvent.userId,
      sessionId: monitoringEvent.sessionId
    });

    // You could also send to external monitoring services like:
    // - Sentry
    // - DataDog
    // - New Relic
    // - Custom webhook endpoints

  } catch (error) {
    console.error('Failed to log monitoring event:', error);
  }
}

// Get system metrics
async function getSystemMetrics(): Promise<SystemMetrics> {
  // In a production environment, these would come from a database
  // For now, we'll return mock data that would be calculated from actual usage
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    totalRequests: 1250,
    successfulRequests: 1180,
    failedRequests: 70,
    averageResponseTime: 2340, // milliseconds
    uptime: 99.2, // percentage
    errorRate: 5.6, // percentage
    lastUpdated: now.toISOString()
  };
}

// Perform comprehensive health check
async function performHealthCheck(): Promise<{ overall: string; services: SystemHealthCheck[]; metrics: SystemMetrics }> {
  const baseUrl = Deno.env.get('SUPABASE_URL');
  
  const services = [
    { name: 'enhanced-text-extraction', endpoint: `${baseUrl}/functions/v1/enhanced-text-extraction` },
    { name: 'enhanced-drug-identify', endpoint: `${baseUrl}/functions/v1/enhanced-drug-identify` },
    { name: 'drugs-com-api', endpoint: `${baseUrl}/functions/v1/drugs-com-api` },
    { name: 'identify-drug', endpoint: `${baseUrl}/functions/v1/identify-drug` }
  ];

  const healthChecks = await Promise.all(
    services.map(service => checkServiceHealth(service.name, service.endpoint))
  );

  // Determine overall system health
  const downServices = healthChecks.filter(check => check.status === 'down').length;
  const degradedServices = healthChecks.filter(check => check.status === 'degraded').length;
  
  let overallStatus = 'healthy';
  if (downServices > 0) {
    overallStatus = downServices >= services.length / 2 ? 'critical' : 'degraded';
  } else if (degradedServices > 0) {
    overallStatus = 'degraded';
  }

  const metrics = await getSystemMetrics();

  // Log health check results
  await logEvent({
    eventType: overallStatus === 'healthy' ? 'info' : 'warning',
    service: 'monitoring-system',
    message: `System health check completed: ${overallStatus}`,
    details: {
      totalServices: services.length,
      healthyServices: healthChecks.filter(check => check.status === 'healthy').length,
      degradedServices,
      downServices,
      metrics
    }
  });

  return {
    overall: overallStatus,
    services: healthChecks,
    metrics
  };
}

// Alert system for critical issues
async function sendAlert(alertType: 'critical' | 'warning', message: string, details?: any): Promise<void> {
  try {
    // In production, you would integrate with:
    // - Email services (SendGrid, AWS SES)
    // - SMS services (Twilio)
    // - Slack/Discord webhooks
    // - PagerDuty or similar incident management
    
    console.log(`[ALERT] ${alertType.toUpperCase()}: ${message}`, details);
    
    await logEvent({
      eventType: alertType === 'critical' ? 'error' : 'warning',
      service: 'alert-system',
      message: `Alert sent: ${message}`,
      details
    });

  } catch (error) {
    console.error('Failed to send alert:', error);
  }
}

// Main serve function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'health-check':
        const healthStatus = await performHealthCheck();
        
        // Send alerts if system is degraded or critical
        if (healthStatus.overall === 'critical') {
          await sendAlert('critical', 'System is in critical state', healthStatus);
        } else if (healthStatus.overall === 'degraded') {
          await sendAlert('warning', 'System performance is degraded', healthStatus);
        }
        
        return createResponse({
          success: true,
          data: healthStatus
        });

      case 'log-event':
        if (!data || !data.eventType || !data.service || !data.message) {
          return createResponse({
            success: false,
            error: 'Missing required fields: eventType, service, message'
          }, 400);
        }

        await logEvent(data);
        
        return createResponse({
          success: true,
          message: 'Event logged successfully'
        });

      case 'get-metrics':
        const metrics = await getSystemMetrics();
        
        return createResponse({
          success: true,
          data: metrics
        });

      case 'send-alert':
        if (!data || !data.alertType || !data.message) {
          return createResponse({
            success: false,
            error: 'Missing required fields: alertType, message'
          }, 400);
        }

        await sendAlert(data.alertType, data.message, data.details);
        
        return createResponse({
          success: true,
          message: 'Alert sent successfully'
        });

      case 'check-service':
        if (!data || !data.serviceName || !data.endpoint) {
          return createResponse({
            success: false,
            error: 'Missing required fields: serviceName, endpoint'
          }, 400);
        }

        const serviceHealth = await checkServiceHealth(data.serviceName, data.endpoint);
        
        return createResponse({
          success: true,
          data: serviceHealth
        });

      default:
        return createResponse({
          success: false,
          error: 'Invalid action. Supported actions: health-check, log-event, get-metrics, send-alert, check-service'
        }, 400);
    }

  } catch (error) {
    console.error('Monitoring system error:', error);
    
    // Log the error
    await logEvent({
      eventType: 'error',
      service: 'monitoring-system',
      message: 'Monitoring system internal error',
      details: {
        error: error.message,
        stack: error.stack
      }
    });

    return createResponse({
      success: false,
      error: 'Internal monitoring system error',
      details: error.message
    }, 500);
  }
});