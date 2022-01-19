# LTI 1.3 Launch Demo
Jared Wenerd    
jgw5017@psu.edu    
Penn State University   
Teaching & Learning with Technology, Data Empowered Learning Team  

---

The following is example code used for a recent project writen in TypeScript that uses LTI 1.3 launch coming from Canvas. 
The example includes: 
1. check to make sure cookies are enabled
2. OIDC login / authentication request to the LMS
3. authenticating the response from the LMS (LTI Launch)
4. display of data coming from LMS  

## To run 

```
npm install
npm run dev
```

_note: This code makes use of a self-signed https certificate so can utilize iframe in LMS display when on local development.  You may need to tell your OS to trust this self-signed certificate to work.  See lines 10-17 of server.ts file_


## LMS Configuration
oidc_initiation_url: `https://localhost:3000/lti/oidc`   
target_link_uri: `https://localhost:3000/lti`   
