import { Authorizer } from './interfaces'

class Csrf implements Authorizer {
  public authorize(request: Function): Promise<any> {
    let csrfToken = window.document.head.querySelector("[name=csrf-token]")

    return csrfToken ? request(['X-CSRF-TOKEN', csrfToken.getAttribute('content')]) : null
    
  }
}

function csrf(): Csrf {
  return new Csrf()
}

export default csrf
