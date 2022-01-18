import { Router, Request, Response } from 'express';
import LtiRequest from './request';

export class LtiController {
  public router: Router = Router();

  constructor() {
    this.router.post('/', this.launch);
    this.router.post('/oidc', this.oidc);
    this.router.get('/cookie-check/start.html', this.serveCookieCheck('start'));
    this.router.get('/cookie-check/complete.html', this.serveCookieCheck('complete'));
  }

  // first step of lti13 launch is the odic init
  private oidc = async (req: Request, res: Response) => {
    if (req.body._step !== '2') {
      // first render the lti cookie check JS and display error if cookies disabled
      // render form to post back again and do oidc redirect
      return res.render('oidc', { formData: { _step: '2', ...req.body } });
    }

    try {
      const ltiRequest = new LtiRequest(req);
      res.redirect(ltiRequest.getOidcRedirect());
    } catch (error) {
      res.status(400).send('Invalid request.');
    }

  };

  private async launch(req: Request, res: Response) {
    try {
      const ltiRequest = new LtiRequest(req);
      const claims = await ltiRequest.launch();
      console.log(claims);
      return res.render('launch', { claims });
    } catch (error) {
      res.status(400).send(error.message);
    }
  }

  private serveCookieCheck(path: string) {
    return function (req: Request, res: Response) {
      res.render(`cookie-check/${path}`);
    }
  }
}
