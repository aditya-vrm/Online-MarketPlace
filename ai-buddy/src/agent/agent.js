const { StateGraph, MessagesAnnotation } = require("@langchain/langgraph")
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai")
const { ToolMessage } = require("@langchain/core/messages")
const tools = require("../agent/tool")    


const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.5,
})


const graph = new StateGraph(MessagesAnnotation)
    .addNode("tools", async (state, config) => {

        const lastMessage = state.messages[ state.messages.length - 1 ]

        const toolsCall = lastMessage.tool_calls

        const toolCallResults = await Promise.all(toolsCall.map(async (call) => {

            const tool = tools[ call.name ]
            if (!tool) {
                throw new Error(`Tool ${call.name} not found`)
            }
            const toolInput = call.args

            console.log("Invoking tool:", call.name, "with input:", call)

            const toolResult = await tool.func({ ...toolInput, token: config.metadata.token })
            console.log("Tool result:", call.name, toolResult)

            return new ToolMessage({
                content: toolResult,
                name: call.name,
                tool_call_id: call.id,
            })

        }))

        state.messages.push(...toolCallResults)

        return state
    })
    .addNode("chat", async (state, config) => {
        const response = await model.invoke(state.messages, { tools: [
            tools['search-product'],
            tools['add-product-to-cart']
        ] })


        state.messages.push(response)

        return state

    })
    .addEdge("__start__", "chat")
    .addConditionalEdges("chat", async (state) => {

        const lastMessage = state.messages[ state.messages.length - 1 ]

        if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            return "tools"
        } else {
            return "__end__"
        }

    })
    .addEdge("tools", "chat")



const agent = graph.compile()


module.exports = agent






