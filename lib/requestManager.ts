// lib/requestManager.ts
// Global request manager to prevent duplicate API calls

interface RequestState {
  isLoading: boolean;
  lastRequest: number;
  data: any;
  error: any;
}

class RequestManager {
  private requests = new Map<string, RequestState>();
  private readonly COOLDOWN_PERIOD = 1000; // 1 second cooldown between requests

  async executeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes default TTL
  ): Promise<T> {
    const now = Date.now();
    const request = this.requests.get(key);

    // If request is already in progress, wait for it
    if (request?.isLoading) {
      console.log(`[RequestManager] Request ${key} already in progress, waiting...`);
      return this.waitForRequest(key, requestFn);
    }

    // If request was made recently, return cached data
    if (request && now - request.lastRequest < this.COOLDOWN_PERIOD) {
      console.log(`[RequestManager] Request ${key} in cooldown (${now - request.lastRequest}ms ago), returning cached data`);
      return request.data;
    }

    // If we have valid cached data, return it
    if (request?.data && now - request.lastRequest < ttl) {
      console.log(`[RequestManager] Request ${key} returning cached data (${Math.round((now - request.lastRequest) / 1000)}s old)`);
      return request.data;
    }

    // Execute new request
    console.log(`[RequestManager] Executing new request for ${key} (container: ${process.env.HOSTNAME || 'unknown'})`);
    this.requests.set(key, {
      isLoading: true,
      lastRequest: now,
      data: null,
      error: null
    });

    try {
      const data = await requestFn();
      this.requests.set(key, {
        isLoading: false,
        lastRequest: now,
        data,
        error: null
      });
      console.log(`[RequestManager] Request ${key} completed successfully`);
      return data;
    } catch (error) {
      console.error(`[RequestManager] Request ${key} failed:`, error);
      this.requests.set(key, {
        isLoading: false,
        lastRequest: now,
        data: request?.data || null,
        error
      });
      throw error;
    }
  }

  private async waitForRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const checkRequest = () => {
        const request = this.requests.get(key);
        if (!request?.isLoading) {
          if (request?.error) {
            reject(request.error);
          } else {
            resolve(request?.data);
          }
          return;
        }
        setTimeout(checkRequest, 100);
      };
      checkRequest();
    });
  }

  clear(key?: string) {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }

  getRequestState(key: string) {
    return this.requests.get(key);
  }
}

export const requestManager = new RequestManager();
