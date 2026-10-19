// import express from "express"
// import dotenv from "dotenv"
// dotenv.config()

// import {  GoogleGenAI } from "@google/genai";
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
// import { ChatGroq } from "@langchain/groq"


// const port = process.env.PORT || 5000
// const app = express()

// const ai = new GoogleGenAI({
//     apiKey:process.env.GEMINI_API_KEY
// });

// app.use(express.json());
// // this is by default function from docs
// // const main=async()=>{
// // const response = await ai.models.generateContent({
// //     model:"gemini-3.8-flash",
// //     contents:"what is ai"
// // }) 
// // console.log(response.text)
// // }
// // main()

// //Streaming response
// // const main=async()=>{
// // const stream = await ai.interactions.create({
// //   model: "gemini-3.8-flash",
// //   input: "Explain how AI works",
// //   stream: true,
// // });

// // for await (const event of stream) {
// //   console.log(event);
// // }
// // }
// // main()


// // project
// // app.post("/chat",async(req,res)=>{
// // const {prompt}=req.body

// // const response= await ai.models.generateContent({
// //     model:"gemini-3.5-flash-lite",
// //     contents:prompt
// // })
// // return res.json(response.text)
// // })


// // langchain 

// app.post("/chat",async(req,res)=>{
//     const {prompt}= req.body
//     const llm = new ChatGroq({
//         model:"openai/gpt-oss-120b",
//         temperature:0,
//         maxTokens:undefined
//     })

//     const result = await llm.invoke([{
//         role:"system",
//         content:"you are jarvis and my assistant"
//     },
//     {
//         role:"human",
//         content:prompt
//     }
//     ])
//     return res.json({reply: result.text})
// })

// app.listen(port,(req,res)=>{
//     console.log(`Server is running at ${port}`)
// })