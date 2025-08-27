declare let redisClient: any;
export declare const redisUtils: {
    set(key: string, value: string, expiresIn?: number): Promise<boolean>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    incr(key: string): Promise<number | null>;
    hset(key: string, field: string, value: string): Promise<boolean>;
    hget(key: string, field: string): Promise<string | null>;
    hgetall(key: string): Promise<Record<string, string> | null>;
    lpush(key: string, ...values: string[]): Promise<number | null>;
    rpop(key: string): Promise<string | null>;
    keys(pattern: string): Promise<string[]>;
    clearPattern(pattern: string): Promise<boolean>;
};
export declare const cache: (ttl?: number) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export { redisClient };
export default redisUtils;
