const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateAIResponse = async (messages) => {
  const completion = await groq.chat.completions.create({
    messages,
    model: process.env.GROQ_MODEL,
    temperature: 0.4,
    max_tokens: 2048
  });
  return completion.choices[0]?.message?.content || "";
};

module.exports = { generateAIResponse };
