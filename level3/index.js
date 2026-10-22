import express from "express"
import dotenv from "dotenv"
dotenv.config()
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import {createAgent, tool} from "langchain"
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MongoClient } from "mongodb"
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb"
import { ChatGroq } from "@langchain/groq"
import z from "zod";
import {randomUUID} from "node:crypto"
import { MessagesAnnotation, messagesDeltaReducer ,StateGraph,MemorySaver,StateSchema,interrupt,Command } from "@langchain/langgraph";


const port = process.env.PORT || 5000
const app = express()


app.use(express.json());

/** Short-term memory stored locally */
// const checkpointer = new  MemorySaver()


/**Short-term memory in database here in MongoDb */
const client = new MongoClient(process.env.MONGODB_URI)
const checkpointer = new MongoDBSaver({ client })

 const customState=new StateSchema({
    prompt:z.string(),
    approvalRequires:z.boolean(),
    aiResponse:z.string(),
    approved:z.boolean(),
    result:z.string()
})

const model=new ChatGroq({
     model: "openai/gpt-oss-120b"
})

const agent=async (state)=>{
   const result=await model.invoke([
    {
        role:"system",
        content:` You are a helpful assistant.

        If the user is greeting or asking a normal question,
        respond normally and set approvalRequires to false.

        If the request requires a sensitive external action,
        such as sending an email or deleting a file,
        set approvalRequires to true.

        Return JSON with:
        {
          "response": "your response",
          "approvalRequires": true or false
        }`
    },
    {
        role:"user",
        content:state.prompt
    }

   ])

const parsed=JSON.parse(result.content)

return {
    aiResponse:parsed.response,
    approvalRequires:parsed.approvalRequires
}


}

const approvalNode=async (state) => {
    const answer=interrupt({
        message:"Do you approve this action?",
        prompt:state.prompt,
        aiResponse:state.aiResponse
    })

    return{
        approved:String(answer).trim().toLowerCase()==="yes"
    }

}

const actionNode=async (state) => {
    if(state.approved){
        return {
            result:`action approved `
        }
    }

    return {
        result:"action reject by human"
    }
}

const shouldContinue=async (state) => {
    if(state.approvalRequires){
        return "approval"
    }

    return "__end__"
}

const graph=new StateGraph(customState)
.addNode("agent",agent)
.addNode("approval",approvalNode)
.addNode("action",actionNode)
.addEdge("__start__","agent")
.addConditionalEdges("agent",shouldContinue)
.addEdge("approval","action")
.addEdge("action","__end__")
.compile({checkpointer})


app.post("/chat",async (req,res)=>{
   const {prompt}=req.body
   const threadId=randomUUID()
   
   const result=await graph.invoke(
    {
     prompt
    },
    {
       configurable:{thread_id:threadId} 
    }
   )
  
   return res.json({
     threadId,
     result:result.result,
     ai:result.aiResponse
   })
})


app.post("/chat/resume",async (req,res)=>{
   const {threadId,answer}=req.body
   
   
   const result=await graph.invoke(
     new Command({
        resume:String(answer)
     })
     ,
     
       {
       configurable:{thread_id:threadId} 
    }  
     
   )
  
   return res.json({
     threadId,
     result:result.result
   })
})





app.listen(port, () => {
    console.log("server started at ", port)
})