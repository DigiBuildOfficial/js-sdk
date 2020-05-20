import 'isomorphic-fetch'
import _hostname from './hostname'

interface RefreshProps {
  id: string,
  secret: string,
  uri: string,
  token: string,
  refresh: string
}

function refresh({ id, secret, uri, token, refresh }: RefreshProps, hostname = _hostname) {
  return fetch(
      `${hostname}/oauth/token?grant_type=refresh_token&$client_id=${id}&client_secret=${secret}&redirect_uri=${uri}&refresh_token=${refresh}`,
      { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
    )
    .then(res => res.json())
}

export default refresh
