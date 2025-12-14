export function parseRouthPath(path){
   const routParametersRegex = /:([a-zA-Z]+)/g

   const withParams = path.replaceAll(routParametersRegex,"(?<$1>[a-zA-Z0-9-_]+)")

    const pathRegex = new RegExp(withParams)

    

    return pathRegex
}