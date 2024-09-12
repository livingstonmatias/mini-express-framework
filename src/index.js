import express, { json } from "./framework.js"
import jwt from "jsonwebtoken"

const secretKey = 'shhhhh'
const data = []

const app = express()

app.use(json)

app.get('/',(req, res)=>{
    res.status(200).send('Hello Express!')
})

app.post('/login', (req, res)=>{
    const token = jwt.sign({ foo: 'bar' }, secretKey)
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

function authMiddleware(req, res, next) {
    try {
        let token = req.headers['authorization']
        if (!token) throw { error: 'Unauthorized' }
        
        token = token.split(' ').slice(1).toString()
        jwt.verify(token, secretKey ,(error)=>{
            if(error){
                throw { error: 'Unauthorized' }
            }        
            next()
        })
    } catch (error) {
        res.status(401).send(error)
    }
}

app.listen(3000, ()=>{
    console.log('the server is running on port: ', `http://localhost:${3000}`)
})