export declare const createConnection: (partialOptions?: any) => Promise<any>;
export declare const createConnectionAndResetData: (partialOptions?: any) => Promise<any>;
export declare const useCleanDatabase: (partialOptions: any, invoke: (connection: any) => Promise<void>) => Promise<void>;
