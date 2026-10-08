import {loadPage,robotsHeader} from './_catalogue';
import {errorResponse,json} from './_shared';
export const handler=async(event:any)=>{
 if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed.'});
 try{const input=String(event.queryStringParameters?.url||'/');if(!input.startsWith('/')||input.startsWith('//'))return json(400,{error:'Invalid path.'});return json(200,await loadPage(input));}catch(e){return errorResponse(e);}
};
