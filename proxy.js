import { NextResponse } from 'next/server'
import { NextURL } from 'next/dist/server/web/next-url';

 
// 1->define route group
// 2->get current path
// get token 
// case 1->user is not logged in trying to access private route
// care 2-> user id logged in trying to access login, signup



const privateRoutes = ["/waiterDashboard", "/managerDashboard", "/customerDashboard", "/kot"];
const publicRoute=["/login","/"];
export function proxy(req) {
  const currentPath=req.nextUrl.pathname;
  console.log("currenpath:",currentPath);

  const token= req.cookies.get("accessToken")?.value;
  if(privateRoutes.some(route=>currentPath.startsWith(route))){
    if(!token){
        const loginUrl=new URL("/login",req.url);
        return NextResponse.redirect(loginUrl);
    }
  }

  if(publicRoute.includes(currentPath) && token && currentPath!=="/"){
   const fallbackUrl = new URL("/", req.url);
    return NextResponse.redirect(fallbackUrl);
  }
  return NextResponse.next();

}
 
export const config = {
  matcher: '/((?!api|_next/static|_next/image|.*\\.png$).*)',
} 