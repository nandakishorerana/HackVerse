export declare const config: {
    readonly nodeEnv: "development" | "production" | "test";
    readonly port: number;
    readonly apiVersion: string;
    readonly mongodb: {
        readonly uri: string;
        readonly testUri: string;
    };
    readonly redis: {
        readonly url: string;
    };
    readonly jwt: {
        readonly secret: string;
        readonly expiresIn: string;
        readonly refreshSecret: string;
        readonly refreshExpiresIn: string;
    };
    readonly email: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly pass: string;
        readonly from: string;
        readonly fromName: string;
    };
    readonly twilio: {
        readonly accountSid: string;
        readonly authToken: string;
        readonly phoneNumber: string;
    };
    readonly razorpay: {
        readonly keyId: string;
        readonly keySecret: string;
    };
    readonly stripe: {
        readonly publishableKey: string;
        readonly secretKey: string;
        readonly webhookSecret: string;
    };
    readonly cloudinary: {
        readonly cloudName: string;
        readonly apiKey: string;
        readonly apiSecret: string;
    };
    readonly frontendUrl: string;
    readonly admin: {
        readonly email: string;
        readonly phone: string;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly logging: {
        readonly level: string;
        readonly file: string;
    };
    readonly googleMaps: {
        readonly apiKey: string;
    };
    readonly firebase: {
        readonly serverKey: string;
        readonly projectId: string;
    };
};
export default config;
