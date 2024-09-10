import http from 'http'

//------------ route ------------

function get(path, ...callbacks){
    this.routes.push({ method: 'GET', path, callbacks })
}

function post(path, ...callbacks){
    this.routes.push({ method: 'POST', path, callbacks })
}

function resolveRoute(currentRoute, routes){
    const url = new URL(currentRoute.url)
    const pathCurrent = url.pathname.split('/')
    const query = getQueryParams(url)    

    return routes
        .filter(route=>route.method === currentRoute.method)
        .map(route => {
            const pathRoute = route.path.split('/')        
            const params = getPathParams(pathRoute, pathCurrent)
            const match = generatePathMatch(pathRoute, pathCurrent)

            if(isEqual(pathCurrent, match)){
                return {
                    ...route,
                    path: match,
                    params,
                    query
                }
            }
            return null
        })
        .filter(Boolean)
}

//------------ middleware ------------

function use(callback){
    this.middlewares.append(callback)
}

function json(req, res, next){
    let body = ''
    req.on('data', chunk => {
        body += chunk
    })
    req.on('end', () => {
        if (req.headers['content-type'] === 'application/json') {
            req.body = JSON.parse(body)
        } else {
            req.body = body
        }
        next()
    })
}

function executeMiddlewares(node, req, res){
    if(!node) return

    node.data(req, res, function (){
        executeMiddlewares(node.next, req, res)
    })
}

function LinkedList(){
    this.head = null
    this.append = function (middleware){
        const node = new Node(middleware)
        
        if (!this.head) {
            this.head = node
            return
        }      
        
        let current = this.head
        while (current.next) {
          current = current.next
        }
        current.next = node
    }
}

function Node(data){
    this.data = data
    this.next = null
}

//------------ core ------------

function status(status){
    this.setStatusHeaders = function (header){
        return this.writeHead(status, header)
    }
    return this
}

function send(body) {
    let contentType = 'text/plain'
    let responseBody = body

    if (typeof body === 'object') {
        contentType = 'application/json'
        responseBody = JSON.stringify(body)
    }

    if (this.setStatusHeaders) {
        this.setStatusHeaders({ 'Content-Type': contentType })
    } else {
        this.writeHead(200, { 'Content-Type': contentType })
    }

    this.write(responseBody)
    this.end()
}

function redirect(...args){
    let status = 302
    let url

    if (args.length === 1) {
        ([ url ] = args)
    } else if (args.length === 2) {
        ([ status, url ] = args)
    }

    if (!url) {
        throw new Error('URL must be provided')
    }

    this.writeHead(status, { 'Location': url })
    this.end()
}

function listen(port, callback){
    const server = http.createServer((req, res)=>{
        res.status = status.bind(res)
        res.send = send.bind(res)
        res.redirect = redirect.bind(res)

        const protocol = req.socket.encrypted ? 'https' : 'http'
        const currentRoute = {
            method: req.method,
            path: req.url,
            url: `${protocol}://${req.headers.host + req.url}`
        }
        const [ route ] = resolveRoute(currentRoute, this.routes)

        if(route){
            const { params, query, callbacks=[] } = route   

            req.params = params
            req.query = query

            callbacks.forEach(callback=>{
                this.middlewares.append(callback)
            })
            executeMiddlewares(this.middlewares.head, req, res)
            this.middlewares.head = null
        }else{
            res.status(404).send('404 not found')
        }   
    })
    server.listen(port, callback)
}

function express(){
    this.routes = []
    this.middlewares = new LinkedList()
    this.use = use.bind(this)
    this.get = get.bind(this)
    this.post = post.bind(this)
    this.listen = listen.bind(this)
}

//------------ utils ------------

function isEqual(val1, val2){
    return JSON.stringify(val1) === JSON.stringify(val2)
}

function getQueryParams(url){
    const params = {}
    for (const [k, v] of url.searchParams.entries()) {
        params[k] = v
    }
    return params
}

function getPathParams(pathRoute, pathCurrent) {
    const params = {}
    pathRoute.forEach((path, index) => {
        if (path.startsWith(':')) {
            const param = path.replace(":", "")
            params[param] = pathCurrent[index]
        }
    })
    return params
}

function generatePathMatch(pathRoute, pathCurrent) {
    return pathRoute.map((path, index) => {
        if (path.startsWith(':')) {
            return pathCurrent[index]
        }
        return path
    })
}

export default ()=> new express
export {
    json
}