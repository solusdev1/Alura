import { routes } from "../routes.js"
export function  routeHeandler(request, response) {
    const route = routes.find((route ) => 
        { return route.method === request.method && route.Path === request.url
        })
    if(route){
        return route.controller(request, response)
    }
return response.writeHead(404).end("Rota Não Encontrada" )
}