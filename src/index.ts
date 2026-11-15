import { createAgent } from './agent.js'

let userInput = "一句话简单介绍一下你自己";

console.log("> User: ", userInput);

const agent = createAgent();
const answer = await agent.chat(userInput);
console.log("> Agent: ", answer);

