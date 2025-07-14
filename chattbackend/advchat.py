
# from flask import Flask, request, jsonify, Response
# from flask_cors import CORS
# import ollama
# import re
# app = Flask(__name__)
# CORS(app)


# def format_response(text):
#     # print("""Automatically converts key phrases into Markdown headings.""")
#     lines = text.split("\n")
#     formatted_lines = []
#     for line in lines:
# # Agar koi point `1. ` ya `6. ` jaise start ho raha hai, usko heading bnarha hoo
#         if re.match(r'^\d+\.\s+', line):
# # Convert to Heading h2
#             formatted_lines.append(f"## {line}")  
#         else:
#             formatted_lines.append(line)
    
#     return "\n".join(formatted_lines)

# #here streaming text
# def stream_chat_response(user_query):
#     response = ollama.chat(model='mistral', messages=[{"role": "user", "content": user_query}], stream=True)
#     for chunk in response:
#         if "message" in chunk and "content" in chunk["message"]:
#             formatted_text = format_response(chunk["message"]["content"])
#             yield formatted_text


# #here api get query    
# @app.route('/chat', methods=['GET'])
# def chat():
#     user_query = request.args.get('query', '')
#     print(user_query,'========')

#     if not user_query:
#         return jsonify({"error": "Query is required"}), 400

#     return Response(stream_chat_response(user_query), content_type='text/plain')

# if __name__ == '__main__':
#     app.run(debug=True,host="0.0.0.0", port=5050)




from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import ollama
import re

app = Flask(__name__)
CORS(app)

ollama.pull('tinyllama')

def format_response(text):
    lines = text.split("\n")
    formatted_lines = []
    for line in lines:
        if re.match(r'^\d+\.\s+', line):
            formatted_lines.append(f"## {line}")
        else:
            formatted_lines.append(line)
    return "\n".join(formatted_lines)

def stream_chat_response(user_query):
    response = ollama.chat(model='tinyllama', messages=[{"role": "user", "content": user_query}], stream=True)
    for chunk in response:
        if "message" in chunk and "content" in chunk["message"]:
            formatted_text = format_response(chunk["message"]["content"])
            yield formatted_text

@app.route('/chat', methods=['GET'])
def chat():
    user_query = request.args.get('query', '')
    
    if not user_query:
        return jsonify({"error": "Query is required"}), 400

    return Response(
        stream_chat_response(user_query),
        content_type='text/plain',
        status=200,
        headers={
            'Transfer-Encoding': 'chunked',
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }
    )

@app.route('/')
def home():
    return "Hello, World!"

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5051)