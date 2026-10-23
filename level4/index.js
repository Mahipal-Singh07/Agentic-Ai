import express from "express"
import dotenv from "dotenv"
dotenv.config()
import { ChatGoogle } from "@langchain/google";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { TaskType } from "@google/generative-ai";
import { ChatGroq } from "@langchain/groq"
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import fs from "fs"
import z from "zod";


const port = process.env.PORT || 5000
const app = express()


app.use(express.json());


const model = new ChatGroq({
    model:"openai/gpt-oss-120b"
})

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001", // 768 dimensions

});

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  collectionName: "nodejsDocumentation",
  apiKey:process.env.QDRANT_API_KEY
});


const upload=async ()=>{
     const pdfPath = "./knowledge.pdf"
    const buffer = fs.readFileSync(pdfPath)
    const pdfResult = new PDFParse({ data: buffer })
    const result = await pdfResult.getText()
    const text = result.text
    const spilitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    })
    const docs = await spilitter.createDocuments([text])
    await vectorStore.addDocuments(docs)
}



app.listen(port, () => {
    console.log("server started at ", port)
})