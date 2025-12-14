import {parseRouthPath} from "./util/parseRouthPath.js"
export const routes = [
    {
        method: "GET",
        Path: "/products", 
        controller: (request,  response) => {
            return response.end("lista de produtos")
        },

    },
    {

        method: "POST",
        Path: "/products", 
        controller: (request,  response) => {
            return response.writeHead(201).end(JSON.stringify(request.body))
        },
    },
        {

        method: "DELETE",
        Path: "/products/:id", 
        controller: (request,  response) => {
            return response.writeHead(201).end("Produto deletado com sucesso")
        },
    }
].map(route => {
    ...route,
    Path: parseRouthPath(route.Path),
})