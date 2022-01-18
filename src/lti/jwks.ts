import jwkToPem from 'jwk-to-pem';
import axios from "axios";

export default class JwkFetch {
  private jwksUrl: string;

  constructor(url: string) {
    this.jwksUrl = url;
  }

  get keyFn() {
    return this.getKey.bind(this) as (header: any, cb: (err: Error, pem: string) => void) => Promise<void>;
  }

  private getKey(header: any, cb: (err: Error | null, pem: string | null) => void) {
    return this.fetchKeys().then(data => {
      return this.responseToPem(header.kid, data);
    }).then((pem) => {
      cb(null, pem);
    }).catch(error => {
      cb(error, null);
    });
  }

  private async fetchKeys() {
    const response = await axios.get(this.jwksUrl);
    return response.data as { keys?: any[] };
  }

  private responseToPem(kid: string, data: { keys?: any[] }) {
    const keys = data.keys;
    if (!keys) throw new Error('Invalid JWKS response');
    const key = keys.find(k => k.kid === kid);
    if (!key) throw new Error('Unable to find key ' + kid);
    return jwkToPem(key) as string;
  }
}