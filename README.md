# Mini Framework Backend Node.js &#x1F680;

Este tutorial te guiará a través del proceso de creación de un mini framework backend en Node.js inspirado en Express. Aprenderás cómo implementar un servidor básico con manejo de rutas, middlewares y respuestas HTTP.

## Introducción

El objetivo de este proyecto es construir un framework backend ligero que permita manejar rutas, middlewares y respuestas HTTP de manera sencilla. Utilizaremos el módulo `http` de Node.js para crear el servidor y gestionar las solicitudes con un enfoque similar al de Express.

De momento, el framework es capaz de manejar peticiones GET y POST, y ofrece métodos de respuesta básicos como `status`, `send`, y `redirect`. A medida que avances, verás cómo se implementan y conectan las diferentes funcionalidades para construir un framework funcional.

## Funcionamiento del Framework

Nuestro framework tiene varias funcionalidades principales:

1. [**Manejo de Rutas**](#Manejo-de-Rutas): Permite definir rutas para manejar solicitudes GET y POST.
2. [**Middlewares**](#Middlewares): Ofrece soporte para middlewares que procesan las solicitudes antes de que lleguen a las rutas.
3. [**Respuestas HTTP**](#Respuestas-HTTP): Facilita el envío de respuestas HTTP y redirecciones.
4. [**Funciones de Utilería**](#Funciones-de-Utilería): Funciones auxiliares que ayudan a resolver y gestionar rutas y parámetros.

A continuación, detallamos la implementación de cada parte del framework.


### Módulo `http`

```javascript
import http from 'http'
```

# Manejo de Rutas

### get(path, ...callbacks)
Registra una ruta para manejar solicitudes GET.
```javascript
// agrega una ruta GET a la lista de rutas.
function get(path, ...callbacks){
    this.routes.push({ method: 'GET', path, callbacks })
}
```
- **Parámetros**:  
`path`: Ruta para manejar las solicitudes.  
`callbacks`: Funciones de middleware a ejecutar cuando se accede a esta ruta.

### post(path, ...callbacks)
Registra una ruta para manejar solicitudes POST.
Similar a `get`, pero para solicitudes POST.
```javascript
// agrega una ruta POST a la lista de rutas.
function post(path, ...callbacks){
    this.routes.push({ method: 'POST', path, callbacks })
}
```
- **Parámetros**:  
`path`: Ruta para manejar las solicitudes.  
`callbacks`: Funciones de middleware a ejecutar cuando se accede a esta ruta.

 ### resolveRoute(currentRoute, routes)
 Esta función compara la solicitud actual con las rutas registradas y devuelve una lista de coincidencias.
```javascript
// resuelve la ruta actual comparando la URL y los parámetros con las rutas registradas.
function resolveRoute(currentRoute, routes){
    // parsea la URL actual.
    const url = new URL(currentRoute.url)
    // divide la ruta actual en segmentos.
    const pathCurrent = url.pathname.split('/')
    // obtiene los parámetros de consulta (query params).
    const query = getQueryParams(url)    

    return routes
        // filtra las rutas que coinciden con el método HTTP.
        .filter(route=>route.method === currentRoute.method)
        .map(route => {
            // divide la ruta registrada en segmentos.
            const pathRoute = route.path.split('/')        
            // obtiene parámetros de la ruta (path params).
            const params = getPathParams(pathRoute, pathCurrent)
            // busca coincidencias entre la ruta actual y la registrada.
            const match = generatePathMatch(pathRoute, pathCurrent)
            // verificar si la ruta actual coincide con la registrada.
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
        // filtra las rutas que no coinciden.   
        .filter(Boolean)
}
```
- **Parámetros**:  
`currentRoute`: Objeto que contiene la información de la solicitud actual.  
`routes`: Array de rutas registradas.
- **Retorno**: Lista de rutas coincidentes con parámetros y consultas.

# Middlewares

### use(callback)
Esta función añade un middleware a la lista de middlewares.
```javascript
// función para registrar un middleware.
function use(callback){
    this.middlewares.append(callback)
}
```
- **Parámetros**:  
`callback`: Función de middleware que se ejecutará en cada solicitud.

### json(req, res, next)
Middleware que analiza el cuerpo de la solicitud como JSON si el Content-Type es application/json.
```javascript
// middleware para recuperar el body de las solicitudes y parsear JSON o string.
function json(req, res, next){
    let body = ''
    // lee y guarda los chucks del stream de la solicitud.
    req.on('data', chunk => {
        body += chunk
    })
    req.on('end', () => {
        // si el Content-Type es JSON, parsear el cuerpo.
        if (req.headers['content-type'] === 'application/json') {
            req.body = JSON.parse(body)
        } else {
            // devuelve el body como string.
            req.body = body
        }
        next()
    })
}
```
- **Parámetros**:  
`req`: Objeto de solicitud.  
`res`: Objeto de respuesta.  
`next`: Función que llama al siguiente middleware en la cadena.

### executeMiddlewares(node, req, res)
Esta es una función recursiva que se encarga de ejecutar todos los middlewares en la lista.
```javascript
// función para ejecutar los middlewares recursivamente.
function executeMiddlewares(node, req, res){
    // si no hay más nodo hace un retorno.
    if(!node) return
    // ejecutar el middleware actual y pasa al siguiente.
    node.data(req, res, function (){
        executeMiddlewares(node.next, req, res)
    })
}
``` 
- **Recursividad**: La función toma el nodo actual y lo ejecuta. Cuando el middleware actual ha terminado su trabajo (llamando a next()), la función se llama nuevamente con el siguiente nodo en la lista.  

- **Parámetros**:  
`node`: Nodo actual en la lista de middlewares. Cada nodo contiene un middleware y un enlace al siguiente nodo.    
`req`: Objeto de solicitud. Representa la solicitud HTTP del cliente.  
`res`: Objeto de respuesta. Se utiliza para enviar una respuesta al cliente.
Esta estructura permite que los middlewares se ejecuten en el orden en que fueron añadidos a la lista, permitiendo una cadena de procesamiento de solicitudes flexible y extensible.

### LinkedList y Node

#### LinkedList
LinkedList es una estructura de datos que almacena elementos en una serie de nodos.
```javascript
// implementación de una lista enlazada para manejar middlewares.
function LinkedList(){
    this.head = null
    // agrega un nuevo nodo a la lista.
    this.append = function (middleware){
        const node = new Node(middleware)
        // si la lista está vacía, asigna el nodo como head.
        if (!this.head) {
            this.head = node
            return
        }      
        // si no, recorrer la lista hasta el final y añade el nuevo nodo.
        let current = this.head
        while (current.next) {
          current = current.next
        }
        current.next = node
    }
    // obtiene el último nodo de la lista.
    this.getLast = function(){
        let current = this.head
        while (current.next) {
          current = current.next
        }
        return current
    }
}
```

- **Cómo Funciona**: La lista mantiene una referencia al primer nodo `head`. Para añadir un nuevo nodo, se busca el último nodo de la lista y se establece su enlace al nuevo nodo, extendiendo así la lista. Esto permite la adición de nodos en tiempo constante, sin necesidad de reestructurar la lista existente.

#### Node
Node representa un elemento individual en la lista enlazada.
```javascript
// definición de un nodo en la lista enlazada.
function Node(data){
    // datos que contiene el nodo.
    this.data = data
    // apunta al siguiente nodo en la lista.
    this.next = null
}
```

- **Cómo Funciona**: Cada nodo tiene dos partes:  
`data`: El middleware o función que queremos ejecutar.  
`next`: Un enlace al siguiente nodo en la lista. Si no hay más nodos, este enlace es null.  

En resumen, LinkedList permite gestionar una colección de elementos donde cada elemento (nodo) está vinculado al siguiente, facilitando la inserción eficiente de nuevos elementos al final de la lista sin necesidad de reconfigurar los nodos existentes.

# Respuestas HTTP

### status(status)
```javascript
// función para establecer el estado de la respuesta HTTP.
function status(status){
    this.setStatusHeaders = function (header){
        return this.writeHead(status, header)
    }
    return this
}
```
- **Descripción**: Establece el código de estado HTTP para la respuesta.
- **Parámetros**:  
`status`: Código de estado HTTP.
- **Retorno**: this para encadenar.

### send(body)
```javascript
// función para enviar una respuesta HTTP.
function send(body) {
    // por defecto, la respuesta es texto plano.
    let contentType = 'text/plain'
    let responseBody = body
    // si el "body" es un objeto, lo convierte en JSON.
    if (typeof body === 'object') {
        contentType = 'application/json'
        responseBody = JSON.stringify(body)
    }
     // escribe los headers de la respuesta.
    if (this.setStatusHeaders) {
        this.setStatusHeaders({ 'Content-Type': contentType })
    } else {
        this.writeHead(200, { 'Content-Type': contentType })
    }
    // escribe el cuerpo de la respuesta y finaliza la solicitud.
    this.write(responseBody)
    this.end()
}
```
- **Descripción**: Envía el cuerpo de la respuesta al cliente.
- **Parámetros**:  
`body`: Cuerpo de la respuesta que puede ser un objeto o una cadena.
- **Retorno**: Ninguno.

### redirect(...args)
Redirige a una URL especificada con un código de estado opcional.
```javascript
// función para redirigir la solicitud a otra URL.
function redirect(...args){
    // por defecto, redirigir con el estado 302.
    let status = 302
    let url
    //verifica si recibe uno o dos argumentos.
    if (args.length === 1) {
        ([ url ] = args)
    } else if (args.length === 2) {
        ([ status, url ] = args)
    }

    if (!url) {
        throw new Error('URL must be provided')
    }
    // escribe el encabezado de redirección y finalizar la solicitud.
    this.writeHead(status, { 'Location': url })
    this.end()
}
```

- **Parámetros**:  
`args`: Código de estado (opcional) y URL a redirigir.
- **Retorno**: Ninguno.

### listen(port, callback)
Inicia el servidor HTTP en el puerto especificado.
```javascript
// función que inicia el servidor en un puerto específico.
function listen(port, callback){
    // obtiene el último nodo de la lista de middlewares.
    const node = this.middlewares.getLast()
    const server = http.createServer((req, res)=>{
        // añade métodos auxiliares a la respuesta.
        res.status = status.bind(res)
        res.send = send.bind(res)
        res.redirect = redirect.bind(res)
        // construye la ruta actual.
        const protocol = req.socket.encrypted ? 'https' : 'http'
        const currentRoute = {
            method: req.method,
            path: req.url,
            url: `${protocol}://${req.headers.host + req.url}`
        }
        // resuelve la ruta actual con las rutas registradas.
        const [ route ] = resolveRoute(currentRoute, this.routes)

        if(route){
            const { params, query, callbacks=[] } = route   
            const routeMiddlewares = new LinkedList()
            // añade los parámetros a la solicitud.
            req.params = params
            req.query = query
            // añade controladores de la ruta a una nueva lista enlazada.
            callbacks.forEach(callback=>{
                routeMiddlewares.append(callback)
            })
            // conecta el último middleware con los middlewares de la ruta.
            node.next = routeMiddlewares.head
            // ejecuta la cadena de middlewares.
            executeMiddlewares(this.middlewares.head, req, res)            
        }else{
            // si no se encuentra la ruta, devuelve 404.
            res.status(404).send('404 not found')
        }   
    })
    server.listen(port, callback)
}
```

- **Parámetros**:  
`port`: Puerto en el que el servidor escuchará.
`callback`: Función que se ejecuta cuando el servidor empieza a escuchar.

### express()
Constructor principal del framework que inicializa rutas y middlewares.
```javascript
// constructor de la aplicación.
function express(){
    // Array de rutas registradas.
    this.routes = []
    // lista enlazada de middlewares.
    this.middlewares = new LinkedList()
    // método para agregar middlewares.
    this.use = use.bind(this)
    // método para registrar rutas GET.
    this.get = get.bind(this)
    // método para registrar rutas POST.
    this.post = post.bind(this)
    // método para iniciar el servidor.
    this.listen = listen.bind(this)
}
```
- **Propiedades y Métodos**:  
`routes`: Array para almacenar rutas.  
`middlewares`: Lista enlazada para almacenar middlewares.  
`use(callback)`: Añade un middleware.  
`get(path, ...callbacks)`: Registra una ruta GET.  
`post(path, ...callbacks)`: Registra una ruta POST.  
`listen(port, callback)`: Inicia el servidor HTTP.  

# Funciones de Utilería

### isEqual(val1, val2)
Compara dos valores para verificar si son iguales.
```javascript
// comparar si dos valores son iguales.
function isEqual(val1, val2){
    return JSON.stringify(val1) === JSON.stringify(val2)
}
```
- **Parámetros**:   
`val1`: Primer valor.  
`val2`: Segundo valor.
- **Retorno**: true si los valores son iguales, false en caso contrario.

### getQueryParams(url)
Extrae parámetros de consulta de una URL.
```javascript
// extraer parámetros de consulta de la URL (query params).
function getQueryParams(url){
    const params = {}
    for (const [k, v] of url.searchParams.entries()) {
        params[k] = v
    }
    return params
}
```
- **Parámetros**:   
`url`: URL de la cual extraer parámetros.
- **Retorno**: Objeto con los parámetros de consulta.

### getPathParams(pathRoute, pathCurrent)
Extrae parámetros de ruta de la ruta actual comparada con la ruta registrada.
```javascript
// obtiene los parámetros dinámicos de la ruta (path params).
function getPathParams(pathRoute, pathCurrent) {
    const params = {}
    pathRoute.forEach((path, index) => {
        // si el segmento de la ruta es dinámico.
        if (path.startsWith(':')) {
            const param = path.replace(":", "")
            params[param] = pathCurrent[index]
        }
    })
    return params
}
```
- **Parámetros**:   
`pathRoute`: Ruta registrada.  
`pathCurrent`: Ruta actual.
- **Retorno**: Objeto con los parámetros de ruta.

### generatePathMatch(pathRoute, pathCurrent)
Genera una ruta de coincidencia con los parámetros extraídos.
```javascript
// generar la ruta que coincida con la actua.
function generatePathMatch(pathRoute, pathCurrent) {
    return pathRoute.map((path, index) => {
        // reemplazar parámetros dinámicos con valores actuales.
        if (path.startsWith(':')) {
            return pathCurrent[index]
        }
        return path
    })
}
```
- **Parámetros**:   
`pathRoute`: Ruta registrada.  
`pathCurrent`: Ruta actual.
- **Retorno**: Ruta con parámetros sustituidos.

### Exportaciones
```javascript
// exportar el constructor de la aplicación y el middleware json.
export default () => new express
export { json }

```
`default`: Exporta una función que crea una nueva instancia del framework express.
`json`: Exporta la función json para el análisis del cuerpo JSON.