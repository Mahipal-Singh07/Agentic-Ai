import express from "express"
import dotenv from "dotenv"
dotenv.config()
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import {createAgent} from "langchain"


const port = process.env.PORT || 5000
const app = express()


app.use(express.json());

// ai-agent = llm + tools

const tool = new TavilySearch({
   maxResults: 5,
  topic: "general",
})

const model = new ChatGoogle({
    model: "gemini-3.8-flash",
    apiKey: process.env.GEMINI_API_KEY
})
app.post("/chat",async(req,res)=>{
    const {prompt} = req.body
    const agent = new createAgent({
        model,
        tools:[tool]
    })

    const result = agent.invoke({
        messages:[
            {
                role:"user",
                content:prompt
            }
        ]
    })
    console.log(result)
    // return res.json(result.messages[result.messages.length-1].content)
})

app.listen(port,(req,res)=>{
    console.log(`Server is running at ${port}`)
})