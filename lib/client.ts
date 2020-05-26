import 'isomorphic-fetch'
import { stringify } from 'qs'
import S from 'string'
// import * as when from 'ramda/src/when'
// import * as not from 'ramda/src/not'
// import * as isNil from 'ramda/src/isNil'
// import * as compose from 'ramda/src/compose'
// import * as ifElse from 'ramda/src/ifElse'
// import * as concat from 'ramda/src/concat'
// import * as is from 'ramda/src/is'
import { when, not, isNil, compose, ifElse, concat, is } from "ramda"; // Splitting up imports introduces type errors. Will fix later.
import { Authorizer } from './interfaces'
import hostname from './hostname'


export interface EndpointConfig {
  base: string;
  action?: string;
  params?: any;
  qs?: any;
}

type Endpoint = EndpointConfig | string

export interface ClientConfig {
  authorize(request: Function): Promise<any>
}

interface SDKResponse {
  body: any;
  response: any;
  request: any;
}

//@ts-ignore - Getting an "expression is not callable" error. Weird, will fix later.
const notNil = compose(
  not,
  isNil
)

const baseRequest = (defaults: RequestInit): Function => (url: string, config: RequestInit): Function => {
  const headers = new Headers()
  headers.append('Accept', 'application/json')
  headers.append('Content-Type', 'application/json')

  let opts: RequestInit = { mode: 'cors', credentials: 'include', headers, ...defaults,  ...config }

  return function authorizedRequest([authKey, authValue]: Array<string>): Promise<SDKResponse> {
    if (opts.headers instanceof Headers) {
      opts.headers.set(authKey, authValue)
    } else {
      if (opts.headers) {
        // @ts-ignore Index signature. Will fix later.
        opts.headers[authKey] = authValue
      } 
    }

    const request = fetch(url, opts)

    return request
      .then((response) => {
        return response
          .json()
          .then((body) => new Promise((res, rej) => {
            const sdkResp = {body, request, response}

            response.ok ? res(sdkResp) : rej(sdkResp)
          }))
      })
  }
}

export class Client {
  private readonly host: string;
  private authorize: any;
  private request: Function;

  constructor(authorizer: Authorizer, config: RequestInit = {}, host: string = hostname) {
    this.authorize = authorizer.authorize
    this.host = host
    this.request = baseRequest(config)
  }

  public get = (endpoint: Endpoint): Promise<any> =>
    this.authorize(this.request(this.url(endpoint), { method: 'GET' }))

  public post = (endpoint: Endpoint, payload: any): Promise<any> =>
    this.authorize(this.request(this.url(endpoint), { method: 'POST' , body: JSON.stringify(payload)}))

  public patch = (endpoint: Endpoint, payload: any): Promise<any> =>
    this.authorize(this.request(this.url(endpoint), { method: 'PATCH', body: JSON.stringify(payload)}))

  public destroy = (endpoint: Endpoint, payload?: any): Promise<any> =>
    this.authorize(this.request(this.url(endpoint), { method: 'DELETE', body: JSON.stringify(payload)}))

    
  private url = (endpoint: Endpoint): string => ifElse(
    
    is(String),
    
    concat(this.host),
    this.urlConfig
  )(endpoint)
    

  private urlConfig = ({ base, action, params = {}, qs }: EndpointConfig): string => compose(
    
    when(
      () => notNil(qs),
      (finalUrl: string) => `${finalUrl}?${stringify(qs, { arrayFormat: 'brackets' })}`
    ),
    
    when(
      () => notNil(action),
      (resourceUrl: string) => `${resourceUrl}/${action}`
    ),
    when(
      () => notNil(params.id),
      (collectionUrl: string) => `${collectionUrl}/${params.id}`
    ),
    (hostname: string) => `${hostname}${S(base).template(params, '{', '}').s}`
  )(this.host)
}

function client(authorizer: Authorizer, defaults: RequestInit = {}, host: string = hostname): Client {
  return new Client(authorizer, defaults, host)
}

export default client
