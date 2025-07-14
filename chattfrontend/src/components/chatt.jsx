// import React, { useState } from "react";
// import axios from "axios";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// function App() {
//   const [query, setQuery] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const handleSend = async () => {
//     if (!query.trim()) return;

//     const newMessages = [...messages, { text: query, sender: "user" }];
//     setMessages(newMessages);
//     setQuery("");
//     setLoading(true);

//     try {
//       const res = await axios.get(`http://localhost:5000/chat?query=${query}`);
//       const responseText = res.data.response;

//       const isCode = responseText.includes("```");

//       setMessages([
//         ...newMessages,
//         {
//           text: responseText,
//           sender: "bot",
//           isCode,
//         },
//       ]);
//     } catch (error) {
//       setMessages([
//         ...newMessages,
//         { text: "Error fetching response.", sender: "bot" },
//       ]);
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
//       <div className="w-full relative max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-[750px]">
//         <img src="/fourbrcikLogo.png" alt="Fourbrick Logo" className="h-10 absolute w-21" />
//         <div className="flex items-center justify-center mb-4">
//           <h1 className="text-2xl font-bold w-fit text-center">Mini ChatGPT</h1>
//         </div>

//         <div className="flex flex-col space-y-2 overflow-y-auto h-[600px] p-4 bg-gray-700 rounded-lg">
//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               className={`p-1 rounded-lg max-w-[100%] ${
//                 msg.sender === "user" ? "bg-blue-500 self-end" : "bg-gray-600 self-start"
//               }`}
//             >
//               {msg.isCode ? (

//                 <SyntaxHighlighter language="java" style={vscDarkPlus}>
//                   {msg.text.replace(/```[a-z]*|```/g, "").trim()}
//                 </SyntaxHighlighter>
//               ) : (

//                 <p className="bg-white text-black p-3 rounded-lg whitespace-pre-wrap">{msg.text}</p>
//               )}
//             </div>
//           ))}
//           {loading && <p className="text-gray-400 italic text-center">Typing...</p>}
//         </div>

//         <div className="flex mt-4">
//           <input
//             type="text"
//             placeholder="Type a message..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             onKeyPress={(e) => e.key === "Enter" && handleSend()}
//             className="flex-1 p-3 rounded-lg bg-gray-700 text-white focus:outline-none"
//           />
//           <button
//             onClick={handleSend}
//             className="ml-2 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700"
//           >
//             Send
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Supports GitHub-flavored markdown
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatMessage = (text) => {
    return text
      .split("\n")
      .map((line) => {
        const parts = line.split(":");
        if (parts.length > 1) {
          return `## ${parts[0]}:\n${parts.slice(1).join(":")}`;
        }
        return line;
      })
      .join("\n");
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const newMessages = [...messages, { text: query, sender: "user" }];
    setMessages(newMessages);
    setQuery("");
    setLoading(true);
// 34.60.94.125
    try {
      const response = await fetch(`http://127.0.0.1:5051/chat?query=${encodeURIComponent(query)}`);
      const reader = response.body.getReader();
      let botMessage = "";
      // let isCode = false;
      const decoder = new TextDecoder();


      // const processStream = async () => {
      //   while (true) {
      //     const { done, value } = await reader.read();
      //     if (done) break;
      //     const chunk = new TextDecoder("utf-8").decode(value);
      //     botMessage += chunk;

      //     isCode = botMessage.includes("```");

      //     setMessages((prevMessages) => [
      //       ...newMessages,
      //       { text: formatMessage(botMessage), sender: "bot", isCode },
      //     ]);
      //   }
      // };
      const processStream = async () => {
        while (true) {
           const { done, value } = await reader.read();
           if (done) break;
           botMessage += decoder.decode(value, { stream: true });

           // Update the state with the streamed message.
           setMessages((prevMessages) => [
              ...newMessages,
              { text: formatMessage(botMessage), sender: "bot" },
           ]);
        }
     };

      await processStream();
    } catch (error) {
      setMessages([
        ...newMessages,
        { text: "Error fetching response.", sender: "bot" },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <div className="w-full relative max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-[750px]">
        <img
          src="/fourbrcikLogo.png"
          alt="Fourbrick Logo"
          className="h-10 absolute w-21"
        />
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-2xl font-bold w-fit text-center">Mini ChatGPT</h1>
        </div>

        <div className="flex flex-col space-y-2 overflow-y-auto h-[600px] p-4 bg-gray-700 rounded-lg">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-1 rounded-lg max-w-[100%] ${
                msg.sender === "user"
                  ? "bg-blue-500 self-end"
                  : "bg-gray-600 self-start"
              }`}
            >
              {msg.isCode ? (
                <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
                  {msg.text.replace(/```[a-z]*|```/g, "").trim()}
                </SyntaxHighlighter>
              ) : (
                <div className="bg-white text-black p-3 rounded-lg whitespace-pre-wrap">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-2xl font-bold mt-2 mb-2"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-xl font-bold mt-2 mb-2"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-lg font-semibold mt-2 mb-2"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="text-sm mt-1 mb-1" {...props} />
                      ),
                      code: ({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }) => (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language="javascript"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <p className="text-gray-400 italic text-center">Typing...</p>
          )}
        </div>

        <div className="flex mt-4">
          <input
            type="text"
            placeholder="Type a message..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 p-3 rounded-lg bg-gray-700 text-white focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="ml-2 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

