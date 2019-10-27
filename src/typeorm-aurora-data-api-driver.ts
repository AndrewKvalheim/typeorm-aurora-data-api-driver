// @ts-ignore
import createDataApiClient from 'data-api-client'
import { transformQueryAndParameters } from './transform.utils'

export default class DataApiDriver {
  // Workaround for aws/aws-sdk-js#2914
  private static async withRetry<T>(run: () => Promise<T>, ttl: number = 3): Promise<T> {
    try {
      return await run()
    } catch (error) {
      if (
        error.code === 'BadRequestException' &&
        typeof error.retryDelay === 'number' &&
        typeof error.message === 'string' &&
        error.message.startsWith('Communications link failure')
      ) {
        if (ttl === 0) {
          console.log('DB cluster is paused. Retry limit reached.')
          throw error
        }

        console.log(`DB cluster is paused. Retrying in ${error.retryDelay.toFixed(1)}s…`)
        await new Promise(resolve => setTimeout(resolve, error.retryDelay * 1000))

        return DataApiDriver.withRetry(run, ttl - 1)
      }

      throw error
    }
  }

  private readonly client: any
  private transactionId?: string

  constructor(
    private readonly region: string,
    private readonly secretArn: string,
    private readonly resourceArn: string,
    private readonly database: string,
    private readonly loggerFn: (query: string, parameters?: any[]) => void = () => undefined,
  ) {
    this.region = region
    this.secretArn = secretArn
    this.resourceArn = resourceArn
    this.database = database
    this.loggerFn = loggerFn
    this.client = createDataApiClient({
      secretArn,
      resourceArn,
      database,
      options: {
        region,
      },
    })
  }

  public async query(query: string, parameters?: any[]): Promise<any> {
    const transformedQueryData = transformQueryAndParameters(query, parameters)

    this.loggerFn(transformedQueryData.queryString, transformedQueryData.parameters)

    const result = await DataApiDriver.withRetry(
      () =>
        this.client.query({
          sql: transformedQueryData.queryString,
          parameters: transformedQueryData.parameters,
          transactionId: this.transactionId,
        }) as Promise<any>
    )

    return result.records || result
  }

  public async startTransaction(): Promise<void> {
    const { transactionId } = await DataApiDriver.withRetry(
      () => this.client.beginTransaction() as Promise<any>
    )
    this.transactionId = transactionId
  }

  public async commitTransaction(): Promise<void> {
    await DataApiDriver.withRetry(
      () => this.client.commitTransaction({ transactionId: this.transactionId }) as Promise<any>
    )
    this.transactionId = undefined
  }

  public async rollbackTransaction(): Promise<void> {
    await DataApiDriver.withRetry(
      () => this.client.rollbackTransaction({ transactionId: this.transactionId }) as Promise<any>
    )
    this.transactionId = undefined
  }
}
