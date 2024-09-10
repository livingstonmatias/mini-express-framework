import express, { json } from "./framework.js"
import jwt from "jsonwebtoken"

const data = []

const app = express()

app.use(json)

app.post('/login', (req, res)=>{
    const token = jwt.sign({ foo: 'bar' }, 'shhhhh')
    res.status(200).send({ token })
})

// auth routes.
app.get('/todos', authMiddleware, (req, res)=>{
    res.status(200).send({ data })
})

app.post('/todos', authMiddleware, (req, res)=>{
    const body = req.body
    const item = {
        ...body,
        id: data.length + 1
    }
    data.push(item)
    res.status(200).send({ data: item })
})

app.listen(3000, ()=>{
    console.log('listen init in port: ', 3000)
})

function authMiddleware(req, res, next) {
    let token = req.headers['authorization']
    if (!token) res.status(401).send({ error: 'Unauthorized' })
    token = token.split(' ').slice(1).toString()
    jwt.verify(token,'shhhhh',(error)=>{
        if(error){
            res.status(401).send({ error: 'Unauthorized' })
        }        
        next()
    })
}
