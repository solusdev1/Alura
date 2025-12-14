import { routes } from "../routes.js"
export function  routeHeandler(request, response) {
    const route = routes.find((route ) => 
        { return route.method === request.method && route.Path.test(request.url)}
    )
    if(route){
        const routeParams = request.url.match(route.Path)
        console.log(routeParams.groups)
        return route.controller(request, response)
    }
return response.writeHead(404).end("Rota Não Encontrada" )
}