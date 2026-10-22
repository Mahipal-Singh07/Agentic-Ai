import express from "express"
import dotenv from "dotenv"
dotenv.config()
import { ChatGoogle } from "@langchain/google";
import { TavilySearch } from "@langchain/tavily";
import {createAgent, tool} from "langchain"
import { ToolNode } from "@langchain/langgraph/prebuilt";
import z from "zod";
import { MessagesAnnotation, StateGraph,MemorySaver } from "@langchain/langgraph";


const port = process.env.PORT || 5000
const app = express()


app.use(express.json());

const checkpointer = new  MemorySaver()
// ai-agent = llm + tools

// Built-in tool
const tool1 = new TavilySearch({
   maxResults: 5,
  topic: "general",
})

// custom tool
const tool2= tool(
    ({a,b})=>{
       return `addition of ${a} & ${b} is 7`
    },{
        name:"addition_tool",
        description:"You MUST call this tool whenever the user asks to add two numbers.",
        schema:z.object({
            a:z.number(),
            b:z.number()
        })
    }
)

const tool3 = tool(
    
        ({email,content})=>{
                return `email sent to ${email} with content is ${content}`
        },
        {
            name:"sent_mail",
            description:"use this tool to send mail",
            schema:z.object({
                email:z.string().describe("sender mail"),
                content:z.string().describe("send mail with content")
            })
        }
    
)

// with langchain 

// const model = new ChatGoogle({
//     model: "gemini-3.5-flash-lite",
//     apiKey: process.env.GEMINI_API_KEY 
// })
// app.post("/chat",async(req,res)=>{
//     const {prompt} = req.body
//     const agent = createAgent({
//         model,
//         tools:[tool1,tool2,tool3],
//         systemPrompt:"use tools for external knowledge , do not use your knowledge"
//     })

//     const result = await agent.invoke({
//         messages:[
//             {
//                 role:"user",
//                 content:prompt
//             }
//         ]
//     })
//     console.log(result.messages)
//     return res.json(result.messages[result.messages.length-1].content)
// })


// with langGraph

const tools = [tool1,tool2,tool3]

const model = new ChatGoogle({
   model: "gemini-3.5-flash-lite",
     apiKey: process.env.GEMINI_API_KEY 
}).bindTools(tools)

const toolNode = new ToolNode(tools)

const agent = async (state)=>{
const result = await model.invoke(
    state.messages
)

return {
    messages:[result]
}
}

// state=[
//     humanMessage:"",
//     AiMessage:"",
//     toolMessage:"",
//     AiMessages:""
// ]

const shouldContinue= async (state)=>{
    if(state.messages[state.messages.length-1].tool_calls.length>0){
        return "tool_node"
    }else{
        return "__end__"
    }
}

const graph = new StateGraph(MessagesAnnotation)
.addNode("agent_node", agent )
.addNode("tool_node",toolNode)
.addEdge("__start__","agent_node")
.addConditionalEdges("agent_node",shouldContinue)
.addEdge("tool_node","agent_node")
.compile({checkpointer})

app.post("/chat",async(req,res)=>{
    const {prompt}= req.body

    const result = await graph.invoke({
        messages:[
            {
            role:"user",
            content:prompt
            }
        ]
    },
{
    configurable:{thread_id:"1"}
})

    console.log(result.messages)
    return res.json(result.messages[result.messages.length-1].content)
})

app.listen(port,(req,res)=>{
    console.log(`Server is running at ${port}`)
})