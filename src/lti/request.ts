import crypto from 'crypto';
import { stringify } from 'querystring';
import jwt from 'jsonwebtoken';
import JwkFetch from './jwks';
import { promisify } from 'util';
import { Request } from 'express';

declare module 'express-session' {
  interface SessionData {
    oidc_state?: string;
  }
}

const ISSUERS = [{
  iss: 'https://canvas.instructure.com',
  oidc_redirect: 'https://canvas.instructure.com/api/lti/authorize_redirect',
  jwks_url: 'https://canvas.instructure.com/api/lti/security/jwks'
}];

export default class LtiRequest {

  private request: Request;

  constructor(request: Request) {
    this.request = request;
  }

  getOidcRedirect() {
    const body = this.request.body;
    const required = ['target_link_uri', 'client_id', 'login_hint', 'lti_message_hint', 'iss']
    if (!required.every(key => key in body)) {
      throw new Error('Missing OIDC launch params');
    }
    const issuer = this.getIss(body.iss);
    if (!issuer) {
      throw new Error('Invalid issuer');
    }

    //  https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html
    const params = {
      scope: 'openid',
      response_type: 'id_token',
      redirect_uri: body.target_link_uri,
      client_id: body.client_id,
      login_hint: body.login_hint,
      lti_message_hint: body.lti_message_hint,
      state: this.randomString(),
      nonce: this.randomString(),
      response_mode: 'form_post',
      prompt: 'none',
    };
    this.request.session.oidc_state = params.state; // set this state string to validate later
    return issuer.oidc_redirect + '?' + stringify(params);
  }

  async launch() {
    const body = this.request.body;
    if (!body.id_token || !body.state) {
      throw new Error('Invalid request.');
    }
    if (this.request.session.oidc_state !== body.state) {
      throw new Error('Invalid state.');
    }
    const token = jwt.decode(body.id_token) as any;
    const iss = this.getIss(token.iss);
    if (!iss) {
      throw new Error('Invalid issuer');
    }

    try {
      const jwksFetch = new JwkFetch(iss.jwks_url);
      const claims = await promisify(jwt.verify as any)(body.id_token, jwksFetch.keyFn, {});
      return claims;
    } catch (error) {
      console.log(error);
      throw new Error('Invalid JWT: ' + error.message);
    }
  }

  private randomString() {
    return crypto.randomBytes(20).toString('hex');
  }

  private getIss(iss: string) {
    return ISSUERS.find(v => v.iss === iss);
  }

}
