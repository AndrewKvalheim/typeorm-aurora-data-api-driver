export default class DataApiDriver {
    private readonly region;
    private readonly secretArn;
    private readonly resourceArn;
    private readonly database;
    private readonly loggerFn;
    private static withRetry;
    private readonly client;
    private transactionId?;
    constructor(region: string, secretArn: string, resourceArn: string, database: string, loggerFn?: (query: string, parameters?: any[]) => void);
    query(query: string, parameters?: any[]): Promise<any>;
    startTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
}
